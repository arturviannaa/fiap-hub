package tech.pervian.fiapestudante.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

// Mesmo servidor do site — o app é só outro cliente do mesmo backend, então os
// dados são sempre os mesmos (nada a "sincronizar", é a mesma fonte).
const val BASE_URL = "https://fiap.pervian.tech"

private val JSON = Json { ignoreUnknownKeys = true; coerceInputValues = true }
private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()

class ApiException(val codigo: Int, val mensagem: String) : Exception(mensagem)

// Guarda o token e o usuário logado em SharedPreferences.
class Sessao(context: Context) {
    private val prefs = context.getSharedPreferences("fiap", Context.MODE_PRIVATE)

    var token: String?
        get() = prefs.getString("token", null)
        set(v) = prefs.edit().putString("token", v).apply()

    var usuarioJson: String?
        get() = prefs.getString("usuario", null)
        set(v) = prefs.edit().putString("usuario", v).apply()

    // Preferência de tema: "claro" | "escuro" | "sistema" (null = ainda não escolheu).
    var tema: String?
        get() = prefs.getString("tema", null)
        set(v) = prefs.edit().putString("tema", v).apply()

    val usuario: Usuario? get() = usuarioJson?.let { runCatching { JSON.decodeFromString<Usuario>(it) }.getOrNull() }
    val logado: Boolean get() = token != null

    fun salvar(token: String, usuario: Usuario) {
        this.token = token
        this.usuarioJson = JSON.encodeToString(Usuario.serializer(), usuario)
    }

    fun limpar() = prefs.edit().clear().apply()
}

class Api(private val sessao: Sessao) {
    val cliente: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(70, TimeUnit.SECONDS)
        .build()

    private fun req(caminho: String): Request.Builder {
        val b = Request.Builder().url(BASE_URL + caminho)
        sessao.token?.let { b.header("Authorization", "Bearer $it") }
        return b
    }

    private suspend inline fun <reified T> get(caminho: String): T = withContext(Dispatchers.IO) {
        cliente.newCall(req(caminho).get().build()).execute().use { r ->
            val corpo = r.body?.string() ?: ""
            if (!r.isSuccessful) throw ApiException(r.code, erroDe(corpo))
            JSON.decodeFromString(corpo)
        }
    }

    private suspend inline fun <reified T> post(caminho: String, corpoJson: String): T = withContext(Dispatchers.IO) {
        val body = corpoJson.toRequestBody(JSON_MEDIA)
        cliente.newCall(req(caminho).post(body).build()).execute().use { r ->
            val corpo = r.body?.string() ?: ""
            if (!r.isSuccessful) throw ApiException(r.code, erroDe(corpo))
            JSON.decodeFromString(corpo)
        }
    }

    private fun erroDe(corpo: String): String =
        runCatching { JSON.decodeFromString<Map<String, String>>(corpo)["erro"] }.getOrNull() ?: "Erro de conexão"

    suspend fun login(email: String, senha: String): RespLogin =
        post("/api/mobile/login", JSON.encodeToString(mapOf("email" to email, "senha" to senha)))

    suspend fun aulas(): RespAulas = get("/api/mobile/aulas")
    suspend fun aula(slug: String): AulaDetalhe = get("/api/mobile/aula/$slug")
    suspend fun marcarAula(slug: String, concluir: Boolean): Unit = withContext(Dispatchers.IO) {
        val body = JSON.encodeToString(mapOf("concluir" to concluir)).toRequestBody(JSON_MEDIA)
        cliente.newCall(req("/api/mobile/aula/$slug").post(body).build()).execute().close()
    }

    suspend fun chat(canal: String): RespChat = get("/api/mobile/chat?canal=$canal")
    suspend fun enviar(canal: String, corpo: String): Unit = withContext(Dispatchers.IO) {
        val body = JSON.encodeToString(mapOf("canal" to canal, "corpo" to corpo)).toRequestBody(JSON_MEDIA)
        cliente.newCall(req("/api/mobile/chat").post(body).build()).execute().use { r ->
            if (!r.isSuccessful && r.code != 429) throw ApiException(r.code, erroDe(r.body?.string() ?: ""))
        }
    }

    suspend fun turma(): RespTurma = get("/api/mobile/turma")
    suspend fun me(): RespMe = get("/api/mobile/me")

    suspend fun apagarMensagem(id: Int): Unit = withContext(Dispatchers.IO) {
        val body = JSON.encodeToString(mapOf("id" to id)).toRequestBody(JSON_MEDIA)
        cliente.newCall(req("/api/mobile/chat/apagar").post(body).build()).execute().close()
    }

    suspend fun usuario(id: Int): PerfilUsuario = get("/api/mobile/usuario/$id")

    suspend fun adminPapel(usuarioId: Int, papel: String): RespAdmin =
        post("/api/mobile/admin", JSON.encodeToString(mapOf("acao" to "papel", "usuarioId" to usuarioId.toString(), "papel" to papel)))

    suspend fun adminNome(usuarioId: Int, nome: String): RespAdmin =
        post("/api/mobile/admin", JSON.encodeToString(mapOf("acao" to "nome", "usuarioId" to usuarioId.toString(), "nome" to nome)))

    suspend fun grupos(): RespGrupos = get("/api/mobile/grupos")

    suspend fun criarGrupo(nome: String, descricao: String, membros: List<Int>): RespCriarGrupo = withContext(Dispatchers.IO) {
        val payload = JSON.encodeToString(NovoGrupo(nome, descricao, membros))
        val body = payload.toRequestBody(JSON_MEDIA)
        cliente.newCall(req("/api/mobile/grupos").post(body).build()).execute().use { r ->
            JSON.decodeFromString(r.body?.string() ?: "{}")
        }
    }

    suspend fun sairGrupo(grupoId: Int): Unit = withContext(Dispatchers.IO) {
        val body = JSON.encodeToString(mapOf("grupoId" to grupoId)).toRequestBody(JSON_MEDIA)
        cliente.newCall(req("/api/mobile/grupos/sair").post(body).build()).execute().close()
    }

    suspend fun notificacoes(): RespNotif = get("/api/mobile/notificacoes")

    suspend fun marcarNotifVisto(): Unit = withContext(Dispatchers.IO) {
        runCatching { cliente.newCall(req("/api/mobile/notificacoes/visto").post("".toRequestBody()).build()).execute().close() }
    }

    suspend fun limparNotificacoes(): Unit = withContext(Dispatchers.IO) {
        runCatching { cliente.newCall(req("/api/mobile/notificacoes/limpar").post("".toRequestBody()).build()).execute().close() }
    }

    suspend fun notas(aba: String): RespNotas = get("/api/mobile/notas?aba=$aba")
    suspend fun criarNota(corpo: String, titulo: String, publica: Boolean): Unit = withContext(Dispatchers.IO) {
        val body = JSON.encodeToString(NovaNota(corpo, titulo, publica)).toRequestBody(JSON_MEDIA)
        cliente.newCall(req("/api/mobile/notas").post(body).build()).execute().close()
    }
    suspend fun apagarNota(id: Int): Unit = withContext(Dispatchers.IO) {
        val body = JSON.encodeToString(mapOf("id" to id)).toRequestBody(JSON_MEDIA)
        cliente.newCall(req("/api/mobile/notas/apagar").post(body).build()).execute().close()
    }
    suspend fun materiais(aba: String): RespMateriais = get("/api/mobile/materiais?aba=$aba")

    suspend fun heartbeat(): Unit = withContext(Dispatchers.IO) {
        runCatching {
            cliente.newCall(req("/api/mobile/presenca").post("".toRequestBody()).build()).execute().close()
        }
    }
}
