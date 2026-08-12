package tech.pervian.fiapestudante.data

import android.content.Context
import com.google.firebase.messaging.FirebaseMessaging
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaType

// Registra o token FCM do aparelho no servidor, amarrado ao usuário logado.
object Push {
    private val http = OkHttpClient()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    fun registrar(ctx: Context) {
        FirebaseMessaging.getInstance().token.addOnSuccessListener { enviar(ctx, it) }
    }

    fun enviar(ctx: Context, token: String) {
        val auth = ctx.getSharedPreferences("fiap", Context.MODE_PRIVATE).getString("token", null) ?: return
        val body = """{"token":"$token"}""".toRequestBody(JSON)
        val req = Request.Builder()
            .url("$BASE_URL/api/mobile/push-token")
            .header("Authorization", "Bearer $auth")
            .post(body)
            .build()
        runCatching { http.newCall(req).execute().close() }
    }
}
