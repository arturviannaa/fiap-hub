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
    val online: Int = 0,
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
    val reacoes: List<Reacao> = emptyList(),
)

@Serializable
data class Reacao(val emoji: String, val n: Int = 0, val eu: Boolean = false)

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
data class RespMe(val usuario: Usuario, val total: Int = 0, val stats: Stats = Stats(), val streak: Int = 0)

// ---- perfil de outra pessoa ----------------------------------------------

@Serializable
data class PerfilUsuario(
    val id: Int,
    val nome: String,
    val email: String = "",
    val bio: String = "",
    val papeis: List<String> = listOf("aluno"),
    val foto: String? = null,
    val criado_em: String = "",
    val visto_em: String = "",
    val aulas: Int = 0,
    val notas: Int = 0,
    val arquivos: Int = 0,
    val total: Int = 0,
    val ehVoce: Boolean = false,
    val souAdmin: Boolean = false,
)

@Serializable
data class RespAdmin(val ok: Boolean = false, val papeis: List<String> = emptyList(), val nome: String = "", val erro: String? = null)

// ---- grupos ---------------------------------------------------------------

@Serializable
data class PessoaLite(val id: Int, val nome: String, val foto: String? = null)

@Serializable
data class RespGrupos(val grupos: List<Grupo> = emptyList(), val turma: List<PessoaLite> = emptyList())

@Serializable
data class RespCriarGrupo(val ok: Boolean = false, val grupoId: Int = 0, val canal: String = "", val erro: String? = null)

// ---- notificações ---------------------------------------------------------

@Serializable
data class Notificacao(
    val tipo: String,
    val titulo: String,
    val texto: String = "",
    val quando: String = "",
    val canal: String? = null,
    val slug: String? = null,
)

@Serializable
data class RespNotif(val notificacoes: List<Notificacao> = emptyList(), val naoLidas: Int = 0)

@Serializable
data class NovoGrupo(val nome: String, val descricao: String, val membros: List<Int>)

// ---- anotações / materiais ------------------------------------------------

@Serializable
data class NotaApp(
    val id: Int,
    val titulo: String = "",
    val corpo: String = "",
    val publica: Boolean = false,
    val aula_slug: String? = null,
    val usuario_id: Int,
    val atualizado_em: String = "",
    val autor: String = "",
    val autor_foto: String? = null,
)

@Serializable
data class RespNotas(val notas: List<NotaApp> = emptyList(), val euId: Int = 0)

@Serializable
data class NovaNota(val corpo: String, val titulo: String = "", val publica: Boolean = false, val disciplina: String = "python")

@Serializable
data class NotaEditada(val id: Int, val corpo: String, val titulo: String = "", val publica: Boolean = false)

@Serializable
data class MaterialApp(
    val id: Int,
    val nome: String,
    val descricao: String = "",
    val tamanho: Long = 0,
    val publico: Boolean = true,
    val aula_slug: String? = null,
    val usuario_id: Int,
    val downloads: Int = 0,
    val criado_em: String = "",
    val autor: String = "",
)

@Serializable
data class RespMateriais(val materiais: List<MaterialApp> = emptyList(), val euId: Int = 0)

@Serializable
data class DisciplinaApp(
    val slug: String,
    val nome: String,
    val curto: String = "",
    val professor: String = "",
    val icone: String = "",
    val cor: String = "#ED145B",
    val totalAulas: Int = 0,
)

@Serializable
data class RespDisciplinas(val disciplinas: List<DisciplinaApp> = emptyList())
