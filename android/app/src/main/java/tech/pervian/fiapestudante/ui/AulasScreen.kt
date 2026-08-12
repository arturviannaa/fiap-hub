package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.Circle
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
import tech.pervian.fiapestudante.data.RespAulas
import tech.pervian.fiapestudante.data.Sessao

@Composable
fun AulasScreen(api: Api, sessao: Sessao, disc: String, onAbrirAula: (String) -> Unit) {
    var dados by remember { mutableStateOf<RespAulas?>(null) }
    var erro by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(disc) {
        try { dados = api.aulas(disc) } catch (e: Exception) { erro = e.message }
    }

    val d = dados
    if (erro != null) { CentroTexto(erro!!); return }
    if (d == null) { Carregando(); return }

    val slugsDaDisc = d.modulos.flatMap { it.aulas }.map { it.slug }.toSet()
    val feitas = d.concluidas.filter { it in slugsDaDisc }.toSet()
    val totalAulas = d.modulos.sumOf { it.aulas.size }
    val pct = if (totalAulas > 0) feitas.size * 100 / totalAulas else 0

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
        item {
            Text(d.disciplina.nome, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text("Prof. ${d.disciplina.professora}", color = Color.Gray, fontSize = 13.sp)
            Spacer(Modifier.height(12.dp))
            LinearProgressIndicator(
                progress = { pct / 100f },
                color = FiapMagenta,
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
            )
            Text("${feitas.size}/$totalAulas aulas · $pct%", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp))
            Spacer(Modifier.height(16.dp))
        }

        d.modulos.forEachIndexed { i, m ->
            item {
                Text(
                    "${(i + 1).toString().padStart(2, '0')}. ${m.titulo}",
                    fontWeight = FontWeight.Bold, fontSize = 16.sp,
                    modifier = Modifier.padding(top = 16.dp, bottom = 6.dp),
                )
            }
            items(m.aulas) { a ->
                Card(
                    Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable { onAbrirAula(a.slug) },
                    colors = CardDefaults.cardColors(),
                ) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        if (a.slug in feitas)
                            Icon(Icons.Filled.CheckCircle, null, tint = Color(0xFF10B981), modifier = Modifier.size(22.dp))
                        else
                            Icon(Icons.Outlined.Circle, null, tint = Color.Gray, modifier = Modifier.size(22.dp))
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(a.titulo, fontWeight = FontWeight.Medium)
                            Text("${a.minutos} min · ${a.exemplos} exemplos", fontSize = 12.sp, color = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun Carregando() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = FiapMagenta)
    }
}

@Composable
fun CentroTexto(t: String) {
    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Text(t, color = Color.Gray)
    }
}
