package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.Membro
import tech.pervian.fiapestudante.data.RespTurma
import tech.pervian.fiapestudante.data.Sessao

@Composable
fun TurmaScreen(api: Api, sessao: Sessao, onAbrirPerfil: (Int) -> Unit = {}) {
    var dados by remember { mutableStateOf<RespTurma?>(null) }
    LaunchedEffect(Unit) { dados = try { api.turma() } catch (e: Exception) { null } }

    val d = dados ?: run { CarregandoLista(); return }
    val ranking = d.membros.sortedByDescending { it.aulas }
    val podio = ranking.take(3)

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
        item {
            Text("Turma", fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("${d.membros.size} pessoas · ranking por progresso", color = Color.Gray, fontSize = 13.sp)
            Spacer(Modifier.height(16.dp))
        }
        if (podio.size == 3) {
            item {
                Podio(podio, d.total, sessao.token, onAbrirPerfil)
                Spacer(Modifier.height(20.dp))
                Text("Todo mundo", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Spacer(Modifier.height(6.dp))
            }
        }
        itemsIndexed(ranking) { i, m ->
            val pct = if (d.total > 0) m.aulas * 100 / d.total else 0
            val on = online(m.visto_em)
            Card(Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable { onAbrirPerfil(m.id) }) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "${i + 1}", fontWeight = FontWeight.Bold, fontSize = 14.sp,
                        color = if (i < 3) FiapMagenta else Color.Gray,
                        modifier = Modifier.width(24.dp), textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.width(6.dp))
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

@Composable
private fun Podio(top: List<Membro>, total: Int, token: String?, onAbrir: (Int) -> Unit) {
    // ordem visual: 2º, 1º, 3º
    val ordem = listOf(Triple(top[1], 2, 92.dp), Triple(top[0], 1, 116.dp), Triple(top[2], 3, 78.dp))
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp))
            .background(Brush.verticalGradient(listOf(FiapMagenta.copy(alpha = 0.10f), Color.Transparent)))
            .padding(vertical = 14.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.SpaceEvenly,
    ) {
        ordem.forEach { (m, pos, tam) ->
            val medalha = when (pos) { 1 -> "🥇"; 2 -> "🥈"; else -> "🥉" }
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f).clickable { onAbrir(m.id) }) {
                Text(medalha, fontSize = if (pos == 1) 26.sp else 20.sp)
                Spacer(Modifier.height(4.dp))
                Box(contentAlignment = Alignment.BottomEnd) {
                    if (pos == 1) {
                        Box(Modifier.size((if (pos == 1) 60 else 48).dp).clip(CircleShape).background(FiapMagenta.copy(alpha = 0.18f)))
                    }
                    Avatar(m.nome, m.id, m.foto, token, if (pos == 1) 60 else 48)
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    m.nome.split(" ").first(), fontWeight = FontWeight.SemiBold, fontSize = 12.sp,
                    maxLines = 1, textAlign = TextAlign.Center,
                )
                Text("${m.aulas}/$total", fontSize = 11.sp, color = FiapMagenta, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                Box(
                    Modifier.fillMaxWidth(0.7f).height(tam).clip(RoundedCornerShape(10.dp, 10.dp, 0.dp, 0.dp))
                        .background(Brush.verticalGradient(FiapGradiente)),
                    contentAlignment = Alignment.TopCenter,
                ) { Text("$pos", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(top = 6.dp)) }
            }
        }
    }
}
