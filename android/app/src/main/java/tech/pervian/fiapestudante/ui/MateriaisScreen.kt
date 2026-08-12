package tech.pervian.fiapestudante.ui

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Download
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
import androidx.compose.foundation.background
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.BASE_URL
import tech.pervian.fiapestudante.data.MaterialApp
import tech.pervian.fiapestudante.data.RespMateriais
import tech.pervian.fiapestudante.data.Sessao

private fun tamanho(bytes: Long): String {
    val u = listOf("B", "KB", "MB", "GB"); var n = bytes.toDouble(); var i = 0
    while (n >= 1024 && i < u.size - 1) { n /= 1024; i++ }
    return "%.0f %s".format(n, u[i])
}

// Baixa via DownloadManager com o Bearer no header; salva na pasta Downloads.
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
    val ctx = LocalContext.current

    LaunchedEffect(aba) { dados = runCatching { api.materiais(aba) }.getOrNull() }

    Column(Modifier.fillMaxSize()) {
        Text("Materiais", fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp, 16.dp, 16.dp, 8.dp))
        TabRow(selectedTabIndex = if (aba == "turma") 0 else 1, containerColor = Color.Transparent, contentColor = FiapMagenta) {
            Tab(selected = aba == "turma", onClick = { aba = "turma" }, text = { Text("Da turma") })
            Tab(selected = aba == "meus", onClick = { aba = "meus" }, text = { Text("Meus") })
        }
        val d = dados
        if (d == null) { Carregando(); return@Column }
        if (d.materiais.isEmpty()) { CentroTexto("Nenhum material aqui ainda."); return@Column }
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
