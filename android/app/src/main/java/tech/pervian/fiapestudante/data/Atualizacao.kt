package tech.pervian.fiapestudante.data

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File

@Serializable
data class VersaoApp(
    val versionCode: Int = 0,
    val versionName: String = "",
    val apkUrl: String = "",
    val obrigatorio: Boolean = false,
    val novidades: List<String> = emptyList(),
)

// Auto-update de app sideloaded (fora da Play Store): o servidor publica a APK
// e um version.json; o app compara com o próprio versionCode e avisa.
object Atualizacao {
    private val json = Json { ignoreUnknownKeys = true }
    private val http = OkHttpClient()

    suspend fun checar(): VersaoApp? = withContext(Dispatchers.IO) {
        runCatching {
            val req = Request.Builder().url("$BASE_URL/app/version.json").build()
            http.newCall(req).execute().use { r ->
                if (!r.isSuccessful) return@use null
                json.decodeFromString<VersaoApp>(r.body?.string() ?: "")
            }
        }.getOrNull()
    }

    // Baixa a APK e dispara o instalador do sistema. O usuário confirma a
    // instalação (fluxo padrão de "apps de fontes desconhecidas").
    fun baixarEInstalar(ctx: Context, apkUrl: String) {
        val destino = File(ctx.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "FIAP-Estudante.apk")
        if (destino.exists()) destino.delete()

        val dm = ctx.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val pedido = DownloadManager.Request(Uri.parse(apkUrl))
            .setTitle("FIAP Community")
            .setDescription("Baixando atualização…")
            .setDestinationInExternalFilesDir(ctx, Environment.DIRECTORY_DOWNLOADS, "FIAP-Estudante.apk")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        val id = dm.enqueue(pedido)

        val receiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context, i: Intent) {
                if (i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1) != id) return
                c.unregisterReceiver(this)
                instalar(c, destino)
            }
        }
        val filtro = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
            ctx.registerReceiver(receiver, filtro, Context.RECEIVER_EXPORTED)
        else
            ctx.registerReceiver(receiver, filtro)
    }

    private fun instalar(ctx: Context, apk: File) {
        val uri = FileProvider.getUriForFile(ctx, "${ctx.packageName}.fileprovider", apk)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        ctx.startActivity(intent)
    }
}
