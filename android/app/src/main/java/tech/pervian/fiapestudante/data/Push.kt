package tech.pervian.fiapestudante.data

import android.content.Context
import com.google.firebase.messaging.FirebaseMessaging
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
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
        // enqueue e nao execute: o callback do token do FCM chega na main thread,
        // onde execute() estoura NetworkOnMainThreadException — que o runCatching
        // engolia em silencio, deixando o aparelho sem registrar.
        http.newCall(req).enqueue(object : Callback {
            override fun onFailure(call: Call, e: java.io.IOException) {}
            override fun onResponse(call: Call, response: Response) = response.close()
        })
    }
}
