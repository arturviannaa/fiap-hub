package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.navigationBarsPadding
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ChatScreen(api: Api, sessao: Sessao, disc: String = "python", canalInicial: String = "python:geral", onAbrirPerfil: (Int) -> Unit = {}) {
    var canal by remember { mutableStateOf(canalInicial) }
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
    Column(Modifier.fillMaxSize()) {
        // seletor de canais + grupos
        Row(
            Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            d?.canais?.forEach { c -> ChipCanal("#${c.nome}", canal == c.slug) { canal = c.slug } }
            d?.grupos?.forEach { g -> ChipCanal("🔒 ${g.nome}", canal == "g:${g.id}") { canal = "g:${g.id}" } }
        }
        HorizontalDivider()

        LazyColumn(Modifier.weight(1f).fillMaxWidth(), state = lista, contentPadding = PaddingValues(12.dp)) {
            items(mensagens.size) { i ->
                val m = mensagens[i]
                val meu = m.usuario_id == euId
                val dia = chaveDia(m.criado_em)
                val diaAnterior = if (i > 0) chaveDia(mensagens[i - 1].criado_em) else ""
                if (dia != diaAnterior && dia.isNotEmpty()) SeparadorDia(m.criado_em)
                val corBolha = if (meu) FiapMagenta else MaterialTheme.colorScheme.surfaceVariant
                val corTexto = if (meu) Color.White else MaterialTheme.colorScheme.onSurface
                val forma = if (meu) RoundedCornerShape(16.dp, 16.dp, 4.dp, 16.dp)
                            else RoundedCornerShape(16.dp, 16.dp, 16.dp, 4.dp)
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 3.dp),
                    horizontalArrangement = if (meu) Arrangement.End else Arrangement.Start,
                ) {
                    if (!meu) {
                        Box(Modifier.clickable { onAbrirPerfil(m.usuario_id) }) {
                            Avatar(m.nome, m.usuario_id, m.foto, sessao.token, 32)
                        }
                        Spacer(Modifier.width(8.dp))
                    }
                    Column(horizontalAlignment = if (meu) Alignment.End else Alignment.Start) {
                    Column(
                        Modifier.widthIn(max = 300.dp).clip(forma).background(corBolha)
                            .combinedClickable(onClick = {}, onLongClick = { acaoMsg = m })
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                    ) {
                        if (!meu) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    m.nome, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = FiapMagenta,
                                    modifier = Modifier.clickable { onAbrirPerfil(m.usuario_id) },
                                )
                                Spacer(Modifier.width(6.dp))
                                Tags(m.papeis, mudo = true)
                            }
                            Spacer(Modifier.height(2.dp))
                        }
                        if (m.corpo.isNotEmpty()) Text(m.corpo, fontSize = 14.sp, color = corTexto)
                        if (m.arquivo_id != null) {
                            val ehImg = m.arquivo_mime?.startsWith("image/") == true
                            if (ehImg) {
                                val r = ImageRequest.Builder(ctx)
                                    .data("$BASE_URL/api/mobile/arquivo/${m.arquivo_id}")
                                    .addHeader("Authorization", "Bearer ${sessao.token}").build()
                                AsyncImage(
                                    model = r, contentDescription = m.arquivo_nome,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.padding(top = 4.dp).size(180.dp).clip(RoundedCornerShape(12.dp))
                                        .clickable { baixarAnexo(ctx, sessao.token, m.arquivo_id!!, m.arquivo_nome ?: "imagem") },
                                )
                            } else {
                                Text(
                                    "📎 ${m.arquivo_nome ?: "anexo"}",
                                    color = if (meu) Color.White else FiapMagenta, fontSize = 13.sp,
                                    modifier = Modifier.padding(top = 2.dp).clickable { baixarAnexo(ctx, sessao.token, m.arquivo_id!!, m.arquivo_nome ?: "anexo") },
                                )
                            }
                        }
                        Text(
                            hora(m.criado_em),
                            color = if (meu) Color.White.copy(alpha = 0.75f) else Color.Gray,
                            fontSize = 10.sp, modifier = Modifier.align(Alignment.End).padding(top = 2.dp),
                        )
                    }
                        if (m.reacoes.isNotEmpty()) {
                            Spacer(Modifier.height(3.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                m.reacoes.forEach { r -> ChipReacao(r) { reagir(m.id, r.emoji) } }
                            }
                        }
                    }
                }
            }
        }

        Surface(shadowElevation = 8.dp, modifier = Modifier.imePadding().navigationBarsPadding()) {
            Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { picker.launch("*/*") }) {
                    Icon(Icons.Filled.AttachFile, "Anexar", tint = Color.Gray)
                }
                OutlinedTextField(
                    value = texto, onValueChange = { texto = it.take(1200) },
                    placeholder = { Text("Mensagem…") },
                    modifier = Modifier.weight(1f),
                    maxLines = 4,
                )
                Spacer(Modifier.width(8.dp))
                IconButton(
                    onClick = { enviar() },
                    enabled = texto.isNotBlank(),
                    modifier = Modifier.size(48.dp).clip(CircleShape).background(if (texto.isBlank()) Color.Gray else FiapMagenta),
                ) { Icon(Icons.AutoMirrored.Filled.Send, "Enviar", tint = Color.White) }
            }
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

@Composable
private fun ChipReacao(r: Reacao, onClick: () -> Unit) {
    Box(
        Modifier.clip(RoundedCornerShape(12.dp))
            .background(if (r.eu) FiapMagenta.copy(alpha = 0.18f) else MaterialTheme.colorScheme.surfaceVariant)
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 3.dp),
    ) {
        Text("${r.emoji} ${r.n}", fontSize = 12.sp, color = if (r.eu) FiapMagenta else MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
private fun ChipCanal(rotulo: String, ativo: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (ativo) FiapMagenta.copy(alpha = 0.15f) else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Text(rotulo, color = if (ativo) FiapMagenta else Color.Gray, fontWeight = if (ativo) FontWeight.SemiBold else FontWeight.Normal, fontSize = 14.sp)
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
    Box(Modifier.fillMaxWidth().padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
        Box(
            Modifier.clip(RoundedCornerShape(12.dp)).background(MaterialTheme.colorScheme.surfaceVariant)
                .padding(horizontal = 12.dp, vertical = 4.dp),
        ) { Text(diaLegivel(iso), fontSize = 11.sp, color = Color.Gray, textAlign = TextAlign.Center) }
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
