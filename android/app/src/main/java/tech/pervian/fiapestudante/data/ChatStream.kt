package tech.pervian.fiapestudante.data

import okhttp3.Request
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json

// SSE do chat em tempo real. O OkHttp manda o Bearer no header (coisa que o
// EventSource do browser não faz) — por isso o app tem seu próprio stream.
class ChatStream(
    private val api: Api,
    private val sessao: Sessao,
) {
    private var fonte: EventSource? = null
    private val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }

    fun conectar(canal: String, onEvento: (EventoChat) -> Unit) {
        fechar()
        val req = Request.Builder()
            .url("$BASE_URL/api/mobile/chat/stream?canal=$canal")
            .header("Authorization", "Bearer ${sessao.token}")
            .header("Accept", "text/event-stream")
            .build()
        fonte = EventSources.createFactory(api.cliente).newEventSource(req, object : EventSourceListener() {
            override fun onEvent(es: EventSource, id: String?, type: String?, data: String) {
                runCatching { json.decodeFromString<EventoChat>(data) }.getOrNull()?.let(onEvento)
            }
        })
    }

    fun fechar() {
        fonte?.cancel()
        fonte = null
    }
}
