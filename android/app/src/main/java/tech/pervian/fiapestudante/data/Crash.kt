package tech.pervian.fiapestudante.data

import android.app.ActivityManager
import android.app.ApplicationExitInfo
import android.content.Context
import android.os.Build
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.PrintWriter
import java.io.StringWriter

// App sideloaded nao tem Play Console: quando estoura, o stack vai pro nosso
// proprio servidor antes do processo morrer. Sem isso, crash em aparelho de
// terceiro vira adivinhacao.
object Crash {

    fun instalar(ctx: Context) {
        val anterior = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            val sw = StringWriter()
            e.printStackTrace(PrintWriter(sw))
            runCatching { mandar(ctx, "crash", sw.toString()) }
            anterior?.uncaughtException(t, e)
        }
        runCatching { mandarMortesAnteriores(ctx) }
    }

    // O sistema guarda o motivo das mortes recentes do processo (API 30+): assim
    // o primeiro start ja entrega os crashes que aconteceram ANTES desta versao.
    private fun mandarMortesAnteriores(ctx: Context) {
        if (Build.VERSION.SDK_INT < 30) return
        val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        am.getHistoricalProcessExitReasons(ctx.packageName, 0, 5)
            .filter { it.reason == ApplicationExitInfo.REASON_CRASH }
            .forEach { info ->
                val trace = runCatching { info.traceInputStream?.bufferedReader()?.readText() }.getOrNull()
                mandar(ctx, "morte-anterior", "${info.description}\n${trace ?: "(sem trace do sistema)"}")
            }
    }

    private fun mandar(ctx: Context, tipo: String, texto: String) {
        val auth = ctx.getSharedPreferences("fiap", Context.MODE_PRIVATE).getString("token", null) ?: return
        val corpo = JSONObject()
            .put("tipo", tipo)
            .put("versao", "${tech.pervian.fiapestudante.BuildConfig.VERSION_NAME} (${tech.pervian.fiapestudante.BuildConfig.VERSION_CODE})")
            .put("aparelho", "${Build.MANUFACTURER} ${Build.MODEL} / Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
            .put("stack", texto.take(8000))
            .toString()
        // O processo esta morrendo: thread propria (rede na main crasharia) e espera curta.
        val t = Thread {
            runCatching {
                OkHttpClient().newCall(
                    Request.Builder().url("$BASE_URL/api/mobile/crash")
                        .header("Authorization", "Bearer $auth")
                        .post(corpo.toRequestBody("application/json; charset=utf-8".toMediaType()))
                        .build(),
                ).execute().close()
            }
        }
        t.start()
        t.join(4000)
    }
}
