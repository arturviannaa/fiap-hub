package tech.pervian.fiapestudante.data

import kotlinx.serialization.Serializable

@Serializable
data class Usuario(
    val id: Int,
    val email: String = "",
    val nome: String,
    val papeis: List<String> = listOf("aluno"),
    val foto: String? = null,
)

@Serializable
data class RespLogin(val token: String? = null, val usuario: Usuario? = null, val erro: String? = null)

// ---- aulas ----------------------------------------------------------------

@Serializable
data class Disciplina(val nome: String = "", val professora: String = "", val totalAulas: Int = 0)

@Serializable
data class AulaMeta(
    val slug: String,
    val titulo: String,
    val tags: List<String> = emptyList(),
    val minutos: Int = 0,
    val exemplos: Int = 0,
    val atualizadoEm: String? = null,
)

@Serializable
data class Modulo(
    val slug: String,
    val titulo: String,
    val resumo: String = "",
    val icone: String = "",
    val aulas: List<AulaMeta> = emptyList(),
)

@Serializable
data class RespAulas(
    val disciplina: Disciplina = Disciplina(),
    val concluidas: List<String> = emptyList(),
    val modulos: List<Modulo> = emptyList(),
)

@Serializable
data class Saida(
    val tipo: String,
    val texto: String? = null,
    val html: String? = null,
    val src: String? = null,
)

@Serializable
data class Bloco(
    val tipo: String,
    val html: String? = null,
    val codigo: String? = null,
    val saidas: List<Saida> = emptyList(),
)

@Serializable
data class AulaVizinha(val slug: String, val titulo: String)

@Serializable
data class AulaDetalhe(
    val slug: String,
    val titulo: String,
    val moduloTitulo: String = "",
    val tags: List<String> = emptyList(),
    val minutos: Int = 0,
    val exemplos: Int = 0,
    val concluida: Boolean = false,
    val blocos: List<Bloco> = emptyList(),
    val anterior: AulaVizinha? = null,
    val proxima: AulaVizinha? = null,
)

// ---- chat -----------------------------------------------------------------

@Serializable
data class Canal(val slug: String, val nome: String, val descricao: String = "")

@Serializable
data class Grupo(
    val id: Int,
    val nome: String,
    val descricao: String = "",
    val membros: Int = 0,
)

@Serializable
data class Mensagem(
    val id: Int,
    val canal: String = "",
    val corpo: String = "",
    val criado_em: String = "",
    val usuario_id: Int,
    val nome: String,
    val papeis: List<String> = listOf("aluno"),
    val foto: String? = null,
    val arquivo_id: Int? = null,
    val arquivo_nome: String? = null,
    val arquivo_mime: String? = null,
    val arquivo_tamanho: Long? = null,
)

@Serializable
data class RespChat(
    val canais: List<Canal> = emptyList(),
    val grupos: List<Grupo> = emptyList(),
    val mensagens: List<Mensagem> = emptyList(),
    val eu: Usuario? = null,
)

@Serializable
data class EventoChat(val op: String = "nova", val id: Int = 0, val msg: Mensagem? = null)

// ---- turma / perfil -------------------------------------------------------

@Serializable
data class Membro(
    val id: Int,
    val nome: String,
    val papeis: List<String> = listOf("aluno"),
    val foto: String? = null,
    val bio: String = "",
    val visto_em: String = "",
    val aulas: Int = 0,
)

@Serializable
data class RespTurma(val total: Int = 0, val euId: Int = 0, val membros: List<Membro> = emptyList())

@Serializable
data class Stats(val aulas: String = "0", val notas: String = "0", val arquivos: String = "0", val mensagens: String = "0")

@Serializable
data class RespMe(val usuario: Usuario, val total: Int = 0, val stats: Stats = Stats())
