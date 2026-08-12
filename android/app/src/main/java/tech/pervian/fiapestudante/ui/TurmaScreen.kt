package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.RespTurma
import tech.pervian.fiapestudante.data.Sessao

@Composable
fun TurmaScreen(api: Api, sessao: Sessao) {
    var dados by remember { mutableStateOf<RespTurma?>(null) }
    LaunchedEffect(Unit) { dados = try { api.turma() } catch (e: Exception) { null } }

    val d = dados ?: run { Carregando(); return }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
        item {
            Text("Turma", fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("${d.membros.size} pessoas", color = Color.Gray, fontSize = 13.sp)
            Spacer(Modifier.height(12.dp))
        }
        items(d.membros) { m ->
            val pct = if (d.total > 0) m.aulas * 100 / d.total else 0
            val on = online(m.visto_em)
            Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                Row(Modifier.padding(14.dp)) {
                    Avatar(m.nome, m.id, m.foto, sessao.token, 44)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                m.nome + if (m.id == d.euId) " (você)" else "",
                                fontWeight = FontWeight.Medium,
                            )
                            Spacer(Modifier.width(6.dp))
                            Tags(m.papeis)
                        }
                        if (m.bio.isNotEmpty()) Text(m.bio, fontSize = 13.sp, color = Color.Gray)
                        Spacer(Modifier.height(6.dp))
                        LinearProgressIndicator(
                            progress = { pct / 100f },
                            color = FiapMagenta,
                            modifier = Modifier.fillMaxWidth().height(5.dp).clip(RoundedCornerShape(3.dp)),
                        )
                        Spacer(Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(8.dp).clip(CircleShape).background(if (on) Color(0xFF10B981) else Color.Gray))
                            Spacer(Modifier.width(5.dp))
                            Text(
                                "${m.aulas}/${d.total} aulas · " + if (on) "ativo agora" else "ativo ${quando(m.visto_em)} atrás",
                                fontSize = 11.sp, color = Color.Gray,
                            )
                        }
                    }
                }
            }
        }
    }
}
