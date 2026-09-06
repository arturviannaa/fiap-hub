package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.ui.graphics.SolidColor
import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.filled.DeleteOutline
import kotlinx.coroutines.launch
import coil.compose.AsyncImage
import coil.request.ImageRequest
import tech.pervian.fiapestudante.data.*

// Lista de conversas: é ela que fica na aba Chat. A conversa em si abre por cima,
// em tela cheia, com botão de voltar.
@Composable
fun ChatListaScreen(api: Api, sessao: Sessao, disc: String = "python", onAbrir: (String) -> Unit = {}) {
    var dados by remember { mutableStateOf<RespChat?>(null) }
    LaunchedEffect(disc) { dados = runCatching { api.chat("$disc:geral", disc) }.getOrNull() }
    val d = dados

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        item { TituloSecao("Canais da turma") }
        items(d?.canais?.size ?: 0) { i ->
            val c = d!!.canais[i]
            ItemConversa(
                sigla = "#", nome = c.nome, detalhe = c.descricao, privado = false,
            ) { onAbrir(c.slug) }
        }
        if (!d?.grupos.isNullOrEmpty()) {
            item { Spacer(Modifier.height(6.dp)); TituloSecao("Meus grupos") }
            items(d!!.grupos.size) { i ->
                val g = d.grupos[i]
                ItemConversa(
                    sigla = "", nome = g.nome,
                    detalhe = if (g.membros > 0) "${g.membros} membros" else g.descricao,
                    privado = true,
                ) { onAbrir("g:${g.id}") }
            }
        }
    }
}

@Composable
private fun TituloSecao(texto: String) {
    Text(
        texto.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold,
        color = corMuted(), modifier = Modifier.padding(start = 4.dp, top = 4.dp, bottom = 4.dp),
    )
}

@Composable
private fun ItemConversa(
    sigla: String, nome: String, detalhe: String, privado: Boolean, onClick: () -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(corPainel())
            .border(1.dp, corBorda(), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier.size(34.dp).clip(RoundedCornerShape(11.dp)).background(FiapMagenta.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) {
            if (privado) Icon(Icons.Filled.Lock, null, tint = FiapMagenta, modifier = Modifier.size(16.dp))
            else Text(sigla, color = FiapMagenta, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        Spacer(Modifier.width(11.dp))
        Column(Modifier.weight(1f)) {
            Text(nome, fontWeight = FontWeight.SemiBold, fontSize = 14.5.sp, maxLines = 1)
            if (detalhe.isNotEmpty()) {
                Text(detalhe, fontSize = 11.5.sp, color = corMuted(), maxLines = 1)
            }
        }
        Icon(Icons.Filled.ChevronRight, null, tint = corMuted(), modifier = Modifier.size(19.dp))
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ChatScreen(
    api: Api,
    sessao: Sessao,
    disc: String = "python",
    canal: String = "python:geral",
    onVoltar: () -> Unit = {},
    onAbrirPerfil: (Int) -> Unit = {},
) {
    var dados by remember { mutableStateOf<RespChat?>(null) }
    val mensagens = remember { mutableStateListOf<Mensagem>() }
    var texto by remember { mutableStateOf("") }
    val escopo = rememberCoroutineScope()
    val lista = rememberLazyListState()
    val stream = remember { ChatStream(api, sessao) }
    val ctx = LocalContext.current
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val a = lerUri(ctx, uri)
            if (a == null) Toast.makeText(ctx, "Não consegui ler o arquivo", Toast.LENGTH_SHORT).show()
            else if (a.bytes.size > 10 * 1024 * 1024) Toast.makeText(ctx, "Máximo 10 MB", Toast.LENGTH_SHORT).show()
            else {
                val legenda = texto.trim(); texto = ""
                escopo.launch {
                    val ok = runCatching { api.enviarAnexo(canal, legenda, a.nome, a.mime, a.bytes) }.getOrDefault(false)
                    if (!ok) Toast.makeText(ctx, "Falha ao enviar anexo", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    val euId = sessao.usuario?.id ?: -1
    val souAdmin = sessao.usuario?.papeis?.contains("admin") == true
    var apagar by remember { mutableStateOf<Int?>(null) }
    var acaoMsg by remember { mutableStateOf<Mensagem?>(null) }
    val haptic = LocalHapticFeedback.current

    fun reagir(id: Int, emoji: String) {
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        escopo.launch { runCatching { api.reagir(id, emoji) } }
    }

    LaunchedEffect(canal) {
        dados = try { api.chat(canal, disc) } catch (e: Exception) { null }
        mensagens.clear()
        dados?.mensagens?.let { mensagens.addAll(it) }
    }

    DisposableEffect(canal) {
        stream.conectar(canal) { ev ->
            when (ev.op) {
                "del" -> mensagens.removeAll { it.id == ev.id }
                else -> ev.msg?.let { m ->
                    val idx = mensagens.indexOfFirst { it.id == m.id }
                    if (idx >= 0) mensagens[idx] = m else mensagens.add(m)
                }
            }
        }
        onDispose { stream.fechar() }
    }

    LaunchedEffect(mensagens.size) {
        if (mensagens.isNotEmpty()) lista.animateScrollToItem(mensagens.size - 1)
    }

    fun enviar() {
        val corpo = texto.trim()
        if (corpo.isEmpty()) return
        texto = ""
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        escopo.launch { runCatching { api.enviar(canal, corpo) } }
    }

    val d = dados
    val ehGrupo = canal.startsWith("g:")
    val titulo =
        if (ehGrupo) d?.grupos?.find { "g:${it.id}" == canal }?.nome ?: "Grupo"
        else "#" + (d?.canais?.find { it.slug == canal }?.nome ?: canal.substringAfter(':'))
    val subtitulo =
        if (ehGrupo) "${d?.grupos?.find { "g:${it.id}" == canal }?.membros ?: 0} membros · privado"
        else d?.canais?.find { it.slug == canal }?.descricao ?: ""

    Column(Modifier.fillMaxSize()) {
        // Cabeçalho próprio: essa tela não usa a top bar nem a tab bar do app.
        Row(
            Modifier.fillMaxWidth().background(corPainel())
                .windowInsetsPadding(WindowInsets.statusBars)
                .padding(start = 4.dp, end = 14.dp, top = 4.dp, bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onVoltar, modifier = Modifier.size(40.dp)) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar", modifier = Modifier.size(21.dp))
            }
            Spacer(Modifier.width(4.dp))
            if (ehGrupo) {
                Icon(Icons.Filled.Lock, null, tint = FiapMagenta, modifier = Modifier.size(15.dp))
                Spacer(Modifier.width(6.dp))
            }
            Column(Modifier.weight(1f)) {
                Text(titulo, fontWeight = FontWeight.Bold, fontSize = 15.sp, maxLines = 1)
                if (subtitulo.isNotEmpty()) {
                    Text(subtitulo, fontSize = 11.sp, color = corMuted(), maxLines = 1)
                }
            }
        }
        HorizontalDivider(color = corBorda())

        LazyColumn(
            Modifier.weight(1f).fillMaxWidth(),
            state = lista,
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
        ) {
            items(mensagens.size) { i ->
                val m = mensagens[i]
                val meu = m.usuario_id == euId
                val dia = chaveDia(m.criado_em)
                val ant = mensagens.getOrNull(i - 1)
                val prox = mensagens.getOrNull(i + 1)
                val novoDia = dia.isNotEmpty() && dia != (ant?.let { chaveDia(it.criado_em) } ?: "")
                // Mensagens seguidas do mesmo autor no mesmo dia viram um bloco só:
                // avatar e nome aparecem uma vez, não a cada linha.
                val primeira = novoDia || ant == null || ant.usuario_id != m.usuario_id
                val ultima = prox == null || prox.usuario_id != m.usuario_id || chaveDia(prox.criado_em) != dia

                if (novoDia) SeparadorDia(m.criado_em)

                val corBolha = if (meu) FiapMagenta else corBolhaOutro()
                val corTexto = if (meu) Color.White else MaterialTheme.colorScheme.onSurface
                val corHora = if (meu) Color.White.copy(alpha = 0.7f) else corMuted()
                val g = 18.dp
                val p = 6.dp
                val forma =
                    if (meu) RoundedCornerShape(g, if (primeira) g else p, if (ultima) p else p, g)
                    else RoundedCornerShape(if (primeira) g else p, g, g, if (ultima) p else p)

                Column(Modifier.fillMaxWidth().padding(top = if (novoDia) 2.dp else if (primeira) 9.dp else 2.dp)) {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = if (meu) Arrangement.End else Arrangement.Start,
                    verticalAlignment = Alignment.Bottom,
                ) {
                    if (!meu) {
                        if (ultima) {
                            Box(Modifier.clickable { onAbrirPerfil(m.usuario_id) }) {
                                Avatar(m.nome, m.usuario_id, m.foto, sessao.token, 30)
                            }
                        } else {
                            Spacer(Modifier.width(30.dp))
                        }
                        Spacer(Modifier.width(8.dp))
                    }
                    Column(horizontalAlignment = if (meu) Alignment.End else Alignment.Start) {
                        // Nome fica FORA da bolha: dentro ele esticava um "oi" pra largura toda.
                        if (!meu && primeira) {
                            Row(
                                Modifier.padding(start = 4.dp, bottom = 3.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    m.nome, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = corMuted(),
                                    modifier = Modifier.clickable { onAbrirPerfil(m.usuario_id) },
                                )
                                Spacer(Modifier.width(5.dp))
                                Tags(m.papeis, mudo = true)
                            }
                        }
                        val ehImg = m.arquivo_id != null && m.arquivo_mime?.startsWith("image/") == true
                        // Imagem sem legenda vira a bolha inteira: sem moldura sobrando em volta.
                        val soImagem = ehImg && m.corpo.isEmpty()
                        Column(
                            Modifier.widthIn(max = 286.dp).clip(forma).background(corBolha)
                                .then(if (meu) Modifier else Modifier.border(1.dp, corBorda(), forma))
                                .combinedClickable(onClick = {}, onLongClick = { acaoMsg = m })
                                .padding(
                                    horizontal = if (soImagem) 3.dp else 10.dp,
                                    vertical = if (soImagem) 3.dp else 6.dp,
                                ),
                        ) {
                            if (m.arquivo_id != null) {
                                if (ehImg) {
                                    val r = ImageRequest.Builder(ctx)
                                        .data("$BASE_URL/api/mobile/arquivo/${m.arquivo_id}")
                                        .addHeader("Authorization", "Bearer ${sessao.token}").build()
                                    Box {
                                        AsyncImage(
                                            model = r, contentDescription = m.arquivo_nome,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier
                                                .then(if (soImagem) Modifier else Modifier.padding(bottom = 4.dp))
                                                .width(224.dp).height(168.dp)
                                                .clip(RoundedCornerShape(if (soImagem) 15.dp else 12.dp))
                                                .clickable { baixarAnexo(ctx, sessao.token, m.arquivo_id!!, m.arquivo_nome ?: "imagem") },
                                        )
                                        if (soImagem) {
                                            Box(
                                                Modifier.align(Alignment.BottomEnd).padding(6.dp)
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .background(Color.Black.copy(alpha = 0.45f))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp),
                                            ) {
                                                Text(hora(m.criado_em), color = Color.White, fontSize = 10.sp)
                                            }
                                        }
                                    }
                                } else {
                                    Text(
                                        "📎 ${m.arquivo_nome ?: "anexo"}",
                                        color = if (meu) Color.White else FiapMagenta, fontSize = 13.sp,
                                        modifier = Modifier.padding(bottom = 3.dp).clickable { baixarAnexo(ctx, sessao.token, m.arquivo_id!!, m.arquivo_nome ?: "anexo") },
                                    )
                                }
                            }
                            // Hora na mesma linha do texto: em mensagem curta ela senta ao lado,
                            // em texto longo desce pro canto — sem esticar a bolha.
                            if (!soImagem) {
                                Row(verticalAlignment = Alignment.Bottom) {
                                    if (m.corpo.isNotEmpty()) {
                                        Text(
                                            m.corpo, fontSize = 15.sp, lineHeight = 20.sp, color = corTexto,
                                            modifier = Modifier.weight(1f, fill = false),
                                        )
                                        Spacer(Modifier.width(8.dp))
                                    }
                                    Text(hora(m.criado_em), color = corHora, fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }
                if (m.reacoes.isNotEmpty()) {
                    Row(
                        Modifier.fillMaxWidth().padding(top = 4.dp, start = if (meu) 0.dp else 38.dp),
                        horizontalArrangement =
                            if (meu) Arrangement.spacedBy(4.dp, Alignment.End)
                            else Arrangement.spacedBy(4.dp, Alignment.Start),
                    ) {
                        m.reacoes.forEach { r -> ChipReacao(r) { reagir(m.id, r.emoji) } }
                    }
                }
                }
            }
        }

        Row(
            Modifier.fillMaxWidth().imePadding().navigationBarsPadding()
                .padding(horizontal = 8.dp, vertical = 7.dp),
            verticalAlignment = Alignment.Bottom,
        ) {
                IconButton(onClick = { picker.launch("*/*") }, modifier = Modifier.size(38.dp)) {
                    Icon(Icons.Filled.AttachFile, "Anexar", tint = corMuted(), modifier = Modifier.size(19.dp))
                }
                Spacer(Modifier.width(4.dp))
                BasicTextField(
                    value = texto,
                    onValueChange = { texto = it.take(1200) },
                    modifier = Modifier.weight(1f),
                    maxLines = 4,
                    textStyle = LocalTextStyle.current.copy(
                        fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurface,
                    ),
                    cursorBrush = SolidColor(FiapMagenta),
                    decorationBox = { interno ->
                        Box(
                            Modifier.clip(RoundedCornerShape(20.dp)).background(corBolhaOutro())
                                .border(1.dp, corBorda(), RoundedCornerShape(20.dp))
                                .padding(horizontal = 14.dp, vertical = 9.dp),
                            contentAlignment = Alignment.CenterStart,
                        ) {
                            if (texto.isEmpty()) Text("Mensagem…", fontSize = 15.sp, color = corMuted())
                            interno()
                        }
                    },
                )
                Spacer(Modifier.width(7.dp))
                IconButton(
                    onClick = { enviar() },
                    enabled = texto.isNotBlank(),
                    modifier = Modifier.size(38.dp).clip(CircleShape)
                        .background(if (texto.isBlank()) FiapMagenta.copy(alpha = 0.28f) else FiapMagenta),
            ) { Icon(Icons.AutoMirrored.Filled.Send, "Enviar", tint = Color.White, modifier = Modifier.size(18.dp)) }
        }
    }

    acaoMsg?.let { m ->
        val meu = m.usuario_id == euId
        AlertDialog(
            onDismissRequest = { acaoMsg = null },
            confirmButton = {},
            dismissButton = {
                if (meu || souAdmin) TextButton(onClick = { apagar = m.id; acaoMsg = null }) {
                    Text("Apagar", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            },
            title = { Text("Reagir") },
            text = {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    EMOJIS_REACAO.forEach { e ->
                        val jaReagiu = m.reacoes.any { it.emoji == e && it.eu }
                        Box(
                            Modifier.size(46.dp).clip(CircleShape)
                                .background(if (jaReagiu) FiapMagenta.copy(alpha = 0.18f) else MaterialTheme.colorScheme.surfaceVariant)
                                .clickable { reagir(m.id, e); acaoMsg = null },
                            contentAlignment = Alignment.Center,
                        ) { Text(e, fontSize = 22.sp) }
                    }
                }
            },
        )
    }

    apagar?.let { id ->
        AlertDialog(
            onDismissRequest = { apagar = null },
            confirmButton = {
                TextButton(onClick = {
                    escopo.launch { runCatching { api.apagarMensagem(id) } }
                    apagar = null
                }) { Text("Apagar", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold) }
            },
            dismissButton = { TextButton(onClick = { apagar = null }) { Text("Cancelar") } },
            icon = { Icon(Icons.Filled.DeleteOutline, null, tint = Color(0xFFEF4444)) },
            title = { Text("Apagar mensagem?") },
            text = { Text("Essa ação não pode ser desfeita.") },
        )
    }
}

// Mesma lista do backend (validada no /api/mobile/chat/reagir).
val EMOJIS_REACAO = listOf("👍", "❤️", "😂", "🎉", "🔥")

// Bolha de quem não sou eu: sólida com borda fina, em vez do surfaceVariant
// cinza-azulado que sujava a tela.
@Composable
private fun corBolhaOutro() =
    if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0xFF1C1D20) else Color.White

@Composable
private fun corChipInativo() =
    if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0x14FFFFFF) else Color(0x0D14101E)

@Composable
private fun ChipReacao(r: Reacao, onClick: () -> Unit) {
    Box(
        Modifier.clip(RoundedCornerShape(11.dp))
            .background(if (r.eu) FiapMagenta.copy(alpha = 0.16f) else corChipInativo())
            .then(if (r.eu) Modifier.border(1.dp, FiapMagenta.copy(alpha = 0.35f), RoundedCornerShape(11.dp)) else Modifier)
            .clickable(onClick = onClick)
            .padding(horizontal = 7.dp, vertical = 3.dp),
    ) {
        Text(
            "${r.emoji} ${r.n}", fontSize = 11.sp,
            fontWeight = if (r.eu) FontWeight.SemiBold else FontWeight.Normal,
            color = if (r.eu) FiapMagenta else corMuted(),
        )
    }
}

@Composable
private fun ChipCanal(rotulo: String, ativo: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .clip(RoundedCornerShape(18.dp))
            .background(if (ativo) FiapMagenta.copy(alpha = 0.14f) else corChipInativo())
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Text(
            rotulo,
            color = if (ativo) FiapMagenta else corMuted(),
            fontWeight = if (ativo) FontWeight.SemiBold else FontWeight.Medium,
            fontSize = 12.5.sp,
        )
    }
}

private val MESES = listOf("jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez")

// O servidor manda o instante em UTC (…Z). Converte pro fuso do celular.
private fun dataLocal(iso: String): java.time.LocalDate? =
    runCatching { java.time.Instant.parse(iso).atZone(java.time.ZoneId.systemDefault()).toLocalDate() }.getOrNull()

private fun chaveDia(iso: String): String = dataLocal(iso)?.toString() ?: iso.substringBefore('T')

private fun diaLegivel(iso: String): String {
    val d = dataLocal(iso) ?: return iso.substringBefore('T')
    return "${d.dayOfMonth} de ${MESES.getOrElse(d.monthValue - 1) { "" }}"
}

@Composable
private fun SeparadorDia(iso: String) {
    Box(Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 6.dp), contentAlignment = Alignment.Center) {
        Box(
            Modifier.clip(RoundedCornerShape(10.dp)).background(corChipInativo())
                .padding(horizontal = 10.dp, vertical = 3.dp),
        ) {
            Text(
                diaLegivel(iso), fontSize = 11.sp, fontWeight = FontWeight.Medium,
                color = corMuted(), textAlign = TextAlign.Center,
            )
        }
    }
}

fun baixarAnexo(ctx: Context, token: String?, id: Int, nome: String) {
    val dm = ctx.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    val req = DownloadManager.Request(Uri.parse("$BASE_URL/api/mobile/arquivo/$id"))
        .addRequestHeader("Authorization", "Bearer $token")
        .setTitle(nome)
        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, nome)
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
    dm.enqueue(req)
    Toast.makeText(ctx, "Baixando $nome…", Toast.LENGTH_SHORT).show()
}

fun hora(iso: String): String {
    // Instante UTC do servidor -> HH:mm no fuso local do celular.
    return runCatching {
        val z = java.time.Instant.parse(iso).atZone(java.time.ZoneId.systemDefault())
        "%02d:%02d".format(z.hour, z.minute)
    }.getOrElse {
        val t = iso.substringAfter('T', "")
        if (t.length >= 5) t.substring(0, 5) else ""
    }
}
