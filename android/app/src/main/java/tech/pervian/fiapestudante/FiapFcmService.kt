package tech.pervian.fiapestudante

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import tech.pervian.fiapestudante.data.Push

// Recebe os pushes do FCM. Com o app fechado/em background, o sistema já mostra
// a notificação sozinho (payload "notification"); aqui tratamos o foreground e
// a renovação do token.
class FiapFcmService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        Push.enviar(applicationContext, token)
    }

    override fun onMessageReceived(msg: RemoteMessage) {
        val titulo = msg.notification?.title ?: msg.data["titulo"] ?: "FIAP Community"
        val corpo = msg.notification?.body ?: msg.data["corpo"] ?: ""
        mostrar(applicationContext, titulo, corpo)
    }

    private fun mostrar(ctx: Context, titulo: String, corpo: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val canal = NotificationChannel(CANAL_NOTIF, "Novidades", NotificationManager.IMPORTANCE_DEFAULT)
            (ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(canal)
        }
        val n = NotificationCompat.Builder(ctx, CANAL_NOTIF)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(titulo)
            .setContentText(corpo)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        runCatching { NotificationManagerCompat.from(ctx).notify(titulo.hashCode(), n) }
    }
}
