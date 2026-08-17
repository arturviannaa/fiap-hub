package tech.pervian.fiapestudante.ui

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.ArquivoEscolhido
import tech.pervian.fiapestudante.data.BASE_URL
import tech.pervian.fiapestudante.data.RespMateriais
import tech.pervian.fiapestudante.data.Sessao
import tech.pervian.fiapestudante.data.lerUri

private fun tamanho(bytes: Long): String {
    val u = listOf("B", "KB", "MB", "GB"); var n = bytes.toDouble(); var i = 0
    while (n >= 1024 && i < u.size - 1) { n /= 1024; i++ }
    return "%.0f %s".format(n, u[i])
}

private fun baixar(ctx: Context, token: String?, id: Int, nome: String) {
    val dm = ctx.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    val req = DownloadManager.Request(Uri.parse("$BASE_URL/api/mobile/arquivo/$id"))
        .addRequestHeader("Authorization", "Bearer $token")
        .setTitle(nome)
        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, nome)
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
    dm.enqueue(req)
    Toast.makeText(ctx, "Baixando $nome…", Toast.LENGTH_SHORT).show()
}

private data class TipoArquivo(val rotulo: String, val cor: Color)

private fun tipoDe(nome: String): TipoArquivo {
    val ext = nome.substringAfterLast('.', "").uppercase()
    return when (ext) {
        "PDF" -> TipoArquivo("PDF", FiapMagenta)
        "PY" -> TipoArquivo(".py", Color(0xFF2D6FE5))
        "XLSX", "XLS", "CSV" -> TipoArquivo(ext, Color(0xFF1F9D55))
        "" -> TipoArquivo("?", Color(0xFF8B5CF6))
        else -> TipoArquivo(ext.take(4), Color(0xFF8B5CF6))
    }
}

@Composable
fun MateriaisScreen(api: Api, sessao: Sessao, disc: String) {
    var aba by remember { mutableStateOf("turma") }
    var dados by remember { mutableStateOf<RespMateriais?>(null) }
    var escolhido by remember { mutableStateOf<ArquivoEscolhido?>(null) }
    val ctx = LocalContext.current
    val escopo = rememberCoroutineScope()

    suspend fun recarregar() { dados = runCatching { api.materiais(aba, disc) }.getOrNull() }
    LaunchedEffect(aba) { recarregar() }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val a = lerUri(ctx, uri)
            if (a == null) Toast.makeText(ctx, "Não consegui ler o arquivo", Toast.LENGTH_SHORT).show()
            else if (a.bytes.size > 25 * 1024 * 1024) Toast.makeText(ctx, "Máximo 25 MB", Toast.LENGTH_SHORT).show()
            else escolhido = a
        }
    }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Column(
                Modifier.fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .bordaTracejada(FiapMagenta.copy(alpha = 0.4f), 18.dp)
                    .clickable { picker.launch("*/*") }
                    .padding(vertical = 22.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                IconeCaixa(Icons.Filled.UploadFile, tamanho = 46.dp)
                Spacer(Modifier.height(8.dp))
                Text("Enviar material", fontWeight = FontWeight.Bold, fontSize = 14.5.sp)
                Text("PDF, py, csv, xlsx — até 25 MB", fontSize = 12.sp, color = corMuted())
            }
            Spacer(Modifier.height(14.dp))
            SegmentoDuplo("Da turma", "Meus arquivos", aba == "turma", onA = { aba = "turma" }, onB = { aba = "meus" })
            Spacer(Modifier.height(2.dp))
        }
        val d = dados
        if (d == null) { item { CarregandoLista() }; return@LazyColumn }
        if (d.materiais.isEmpty()) { item { CentroTexto("Nenhum material aqui ainda. Toque em Enviar.") }; return@LazyColumn }
        items(d.materiais) { m ->
            val tipo = tipoDe(m.nome)
            GlassCard(Modifier.fillMaxWidth(), padding = 14.dp) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(38.dp).clip(RoundedCornerShape(11.dp)).background(tipo.cor.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center,
                    ) { Text(tipo.rotulo, color = tipo.cor, fontSize = 9.5.sp, fontWeight = FontWeight.ExtraBold) }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(m.nome, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                        if (m.descricao.isNotEmpty()) Text(m.descricao, fontSize = 12.sp, color = corMuted())
                        Text(
                            "${tamanho(m.tamanho)} · ${if (m.usuario_id == d.euId) "você" else m.autor.split(" ").first()}",
                            fontSize = 11.sp, color = corMuted(),
                        )
                    }
                    IconButton(onClick = { baixar(ctx, sessao.token, m.id, m.nome) }) {
                        Icon(Icons.Filled.Download, "Baixar", tint = FiapMagenta)
                    }
                }
            }
        }
    }

    escolhido?.let { a ->
        var descricao by remember { mutableStateOf("") }
        var publico by remember { mutableStateOf(true) }
        var enviando by remember { mutableStateOf(false) }
        AlertDialog(
            onDismissRequest = { if (!enviando) escolhido = null },
            confirmButton = {
                TextButton(enabled = !enviando, onClick = {
                    enviando = true
                    escopo.launch {
                        val ok = runCatching { api.enviarMaterial(a.nome, a.mime, a.bytes, descricao, publico, disc) }.getOrDefault(false)
                        enviando = false; escolhido = null
                        Toast.makeText(ctx, if (ok) "Material enviado!" else "Falha no envio", Toast.LENGTH_SHORT).show()
                        if (ok) { aba = "meus"; recarregar() }
                    }
                }) { Text(if (enviando) "Enviando…" else "Enviar", color = FiapMagenta, fontWeight = FontWeight.Bold) }
            },
            dismissButton = { TextButton(enabled = !enviando, onClick = { escolhido = null }) { Text("Cancelar") } },
            title = { Text("Enviar material") },
            text = {
                Column {
                    Text(a.nome, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                    Text(tamanho(a.bytes.size.toLong()), fontSize = 12.sp, color = Color.Gray)
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(descricao, { descricao = it.take(200) }, label = { Text("Descrição (opcional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(publico, { publico = it }, colors = CheckboxDefaults.colors(checkedColor = FiapMagenta))
                        Text("Público (toda a turma vê)", fontSize = 13.sp)
                    }
                }
            },
        )
    }
}
