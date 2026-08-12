package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.background
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
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.filled.DeleteOutline
import kotlinx.coroutines.launch
import tech.pervian.fiapestudante.data.*

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ChatScreen(api: Api, sessao: Sessao, canalInicial: String = "geral", onAbrirPerfil: (Int) -> Unit = {}) {
    var canal by remember { mutableStateOf(canalInicial) }
    var dados by remember { mutableStateOf<RespChat?>(null) }
    val mensagens = remember { mutableStateListOf<Mensagem>() }
    var texto by remember { mutableStateOf("") }
    val escopo = rememberCoroutineScope()
    val lista = rememberLazyListState()
    val stream = remember { ChatStream(api, sessao) }
    val euId = sessao.usuario?.id ?: -1
    val souAdmin = sessao.usuario?.papeis?.contains("admin") == true
    var apagar by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(canal) {
        dados = try { api.chat(canal) } catch (e: Exception) { null }
        mensagens.clear()
        dados?.mensagens?.let { mensagens.addAll(it) }
    }

    DisposableEffect(canal) {
        stream.conectar(canal) { ev ->
            when (ev.op) {
                "del" -> mensagens.removeAll { it.id == ev.id }
                else -> ev.msg?.let { m -> if (mensagens.none { it.id == m.id }) mensagens.add(m) }
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
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 4.dp).combinedClickable(
                        onClick = {},
                        onLongClick = { if (meu || souAdmin) apagar = m.id },
                    ),
                ) {
                    Box(Modifier.clickable { onAbrirPerfil(m.usuario_id) }) {
                        Avatar(m.nome, m.usuario_id, m.foto, sessao.token, 34)
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                            if (meu) "Você" else m.nome,
                            fontWeight = FontWeight.SemiBold, fontSize = 13.sp,
                            modifier = Modifier.clickable { onAbrirPerfil(m.usuario_id) },
                        )
                            Spacer(Modifier.width(6.dp))
                            Tags(m.papeis, mudo = true)
                            Text(hora(m.criado_em), color = Color.Gray, fontSize = 11.sp)
                        }
                        if (m.corpo.isNotEmpty()) Text(m.corpo, fontSize = 14.sp)
                        if (m.arquivo_id != null) {
                            Text("📎 ${m.arquivo_nome ?: "anexo"}", color = FiapMagenta, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        Surface(shadowElevation = 8.dp, modifier = Modifier.imePadding().navigationBarsPadding()) {
            Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
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

fun hora(iso: String): String {
    // "2026-08-12T06:34:39.430Z" -> "06:34" (só o HH:mm, sem lib de data)
    val t = iso.substringAfter('T', "")
    return if (t.length >= 5) t.substring(0, 5) else ""
}
