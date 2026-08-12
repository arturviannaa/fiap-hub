package tech.pervian.fiapestudante.ui

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Upload
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

@Composable
fun MateriaisScreen(api: Api, sessao: Sessao) {
    var aba by remember { mutableStateOf("turma") }
    var dados by remember { mutableStateOf<RespMateriais?>(null) }
    var escolhido by remember { mutableStateOf<ArquivoEscolhido?>(null) }
    val ctx = LocalContext.current
    val escopo = rememberCoroutineScope()

    suspend fun recarregar() { dados = runCatching { api.materiais(aba) }.getOrNull() }
    LaunchedEffect(aba) { recarregar() }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val a = lerUri(ctx, uri)
            if (a == null) Toast.makeText(ctx, "Não consegui ler o arquivo", Toast.LENGTH_SHORT).show()
            else if (a.bytes.size > 25 * 1024 * 1024) Toast.makeText(ctx, "Máximo 25 MB", Toast.LENGTH_SHORT).show()
            else escolhido = a
        }
    }

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { picker.launch("*/*") }, containerColor = FiapMagenta, contentColor = Color.White,
                icon = { Icon(Icons.Filled.Upload, null) }, text = { Text("Enviar") },
            )
        },
    ) { pad ->
        Column(Modifier.fillMaxSize().padding(pad)) {
            Text("Materiais", fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp, 16.dp, 16.dp, 8.dp))
            TabRow(selectedTabIndex = if (aba == "turma") 0 else 1, containerColor = Color.Transparent, contentColor = FiapMagenta) {
                Tab(selected = aba == "turma", onClick = { aba = "turma" }, text = { Text("Da turma") })
                Tab(selected = aba == "meus", onClick = { aba = "meus" }, text = { Text("Meus") })
            }
            val d = dados
            if (d == null) { Carregando(); return@Column }
            if (d.materiais.isEmpty()) { CentroTexto("Nenhum material aqui ainda. Toque em Enviar."); return@Column }
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
                items(d.materiais) { m ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)).background(FiapMagenta.copy(alpha = 0.12f)), contentAlignment = Alignment.Center) {
                                Icon(Icons.Filled.Description, null, tint = FiapMagenta, modifier = Modifier.size(20.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(m.nome, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                                if (m.descricao.isNotEmpty()) Text(m.descricao, fontSize = 12.sp, color = Color.Gray)
                                Text("${tamanho(m.tamanho)} · ${if (m.usuario_id == d.euId) "você" else m.autor.split(" ").first()}", fontSize = 11.sp, color = Color.Gray)
                            }
                            IconButton(onClick = { baixar(ctx, sessao.token, m.id, m.nome) }) {
                                Icon(Icons.Filled.Download, "Baixar", tint = FiapMagenta)
                            }
                        }
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
                        val ok = runCatching { api.enviarMaterial(a.nome, a.mime, a.bytes, descricao, publico) }.getOrDefault(false)
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
