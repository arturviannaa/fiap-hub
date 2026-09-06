package tech.pervian.fiapestudante.ui

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Settings
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
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.RespMe
import tech.pervian.fiapestudante.data.lerUri
import kotlinx.coroutines.launch
import tech.pervian.fiapestudante.data.Sessao

@Composable
fun PerfilScreen(api: Api, sessao: Sessao, onConfig: () -> Unit) {
    var me by remember { mutableStateOf<RespMe?>(null) }
    val ctx = LocalContext.current
    val escopo = rememberCoroutineScope()
    suspend fun recarregar() { me = runCatching { api.me() }.getOrNull() }
    LaunchedEffect(Unit) { recarregar() }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val a = lerUri(ctx, uri)
            if (a == null || !a.mime.startsWith("image/")) Toast.makeText(ctx, "Escolha uma imagem", Toast.LENGTH_SHORT).show()
            else if (a.bytes.size > 5 * 1024 * 1024) Toast.makeText(ctx, "Máximo 5 MB", Toast.LENGTH_SHORT).show()
            else escopo.launch {
                val nova = runCatching { api.enviarFoto(a.mime, a.bytes) }.getOrNull()
                if (nova != null) recarregar() else Toast.makeText(ctx, "Falha ao enviar", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val m = me ?: run { Carregando(); return }
    val u = m.usuario

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            IconButton(onClick = onConfig) { Icon(Icons.Filled.Settings, "Configurações") }
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box {
                Avatar(u.nome, u.id, u.foto, sessao.token, 72)
                Box(
                    Modifier.align(Alignment.BottomEnd).size(26.dp).clip(CircleShape).background(FiapMagenta)
                        .clickable { picker.launch("image/*") },
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Filled.CameraAlt, "Trocar foto", tint = Color.White, modifier = Modifier.size(15.dp)) }
            }
            Spacer(Modifier.width(16.dp))
            Column {
                Text(u.nome, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text(u.email, color = androidx.compose.ui.graphics.Color.Gray, fontSize = 13.sp)
                Spacer(Modifier.height(4.dp))
                Tags(u.papeis)
            }
        }

        Spacer(Modifier.height(20.dp))
        val cards = listOf(
            "${m.stats.aulas}/${m.total}" to "aulas concluídas",
            m.stats.notas to "anotações",
            m.stats.arquivos to "materiais",
            m.stats.mensagens to "mensagens",
        )
        LazyVerticalGrid(columns = GridCells.Fixed(2), verticalArrangement = Arrangement.spacedBy(10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(cards.size) { i ->
                Card {
                    Column(Modifier.padding(16.dp)) {
                        Text(cards[i].first, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = FiapMagenta)
                        Text(cards[i].second, fontSize = 12.sp, color = androidx.compose.ui.graphics.Color.Gray)
                    }
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        val aulas = m.stats.aulas.toIntOrNull() ?: 0
        val notas = m.stats.notas.toIntOrNull() ?: 0
        val arquivos = m.stats.arquivos.toIntOrNull() ?: 0
        val mensagens = m.stats.mensagens.toIntOrNull() ?: 0

        // Ofensiva de dias (streak).
        Card(colors = CardDefaults.cardColors(containerColor = FiapMagenta.copy(alpha = 0.10f)), modifier = Modifier.fillMaxWidth()) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("🔥", fontSize = 30.sp)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(
                        if (m.streak > 0) "${m.streak} ${if (m.streak == 1) "dia" else "dias"} de ofensiva" else "Comece sua ofensiva!",
                        fontWeight = FontWeight.Bold, fontSize = 16.sp,
                    )
                    Text(
                        if (m.streak > 0) "Abra o app todo dia pra não zerar" else "Volte amanhã pra manter a sequência",
                        fontSize = 12.sp, color = androidx.compose.ui.graphics.Color.Gray,
                    )
                }
            }
        }
        Spacer(Modifier.height(16.dp))

        val conquistas = listOf(
            Conquista("🎯", "Primeira aula", aulas >= 1),
            Conquista("📗", "5 aulas", aulas >= 5),
            Conquista("📚", "Na metade", m.total > 0 && aulas >= m.total / 2),
            Conquista("🏆", "Tudo feito", m.total > 0 && aulas >= m.total),
            Conquista("🔥", "Ofensiva 3d", m.streak >= 3),
            Conquista("⚡", "Ofensiva 7d", m.streak >= 7),
            Conquista("✍️", "Anotador", notas >= 3),
            Conquista("📎", "Compartilhou", arquivos >= 1),
            Conquista("💬", "Tagarela", mensagens >= 20),
        )
        val quantas = conquistas.count { it.desbloqueada }
        Text("Conquistas · $quantas/${conquistas.size}", fontWeight = FontWeight.Bold, fontSize = 15.sp)
        Spacer(Modifier.height(10.dp))
        LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            items(conquistas) { BadgeConquista(it) }
        }

        Spacer(Modifier.weight(1f))
        OutlinedButton(onClick = onConfig, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Filled.Settings, null, Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Configurações")
        }
    }
}
