package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.DataArray
import androidx.compose.material.icons.filled.Functions
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.RespAulas
import tech.pervian.fiapestudante.data.Sessao

private val iconesModulo = listOf(Icons.Filled.Category, Icons.Filled.AccountTree, Icons.Filled.DataArray, Icons.Filled.Repeat, Icons.Filled.Functions, Icons.Filled.Layers)

@Composable
fun PainelScreen(api: Api, sessao: Sessao, disc: String, onAbrirAula: (String) -> Unit, onIrAulas: () -> Unit) {
    var dados by remember { mutableStateOf<RespAulas?>(null) }
    var erro by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(disc) {
        try { dados = api.aulas(disc) } catch (e: Exception) { erro = e.message }
    }

    val d = dados
    if (erro != null) { CentroTexto(erro!!); return }
    if (d == null) { CarregandoLista(); return }

    val slugsDaDisc = d.modulos.flatMap { it.aulas }.map { it.slug }.toSet()
    val feitas = d.concluidas.filter { it in slugsDaDisc }.toSet()
    val totalAulas = d.modulos.sumOf { it.aulas.size }
    val pct = if (totalAulas > 0) feitas.size.toFloat() / totalAulas else 0f
    val continuar = d.modulos.flatMap { it.aulas }.firstOrNull { it.slug !in feitas }
    val hora = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    val saudacao = when { hora < 6 -> "Boa madrugada"; hora < 12 -> "Bom dia"; hora < 18 -> "Boa tarde"; else -> "Boa noite" }
    val primeiroNome = (sessao.usuario?.nome ?: "").split(" ").firstOrNull() ?: ""

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            GlassCard(Modifier.fillMaxWidth()) {
                Text("$saudacao,", fontSize = 13.sp, color = corMuted())
                Text("$primeiroNome 👋", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
                if (d.online > 0) {
                    Spacer(Modifier.height(4.dp))
                    Text("${d.online} ${if (d.online == 1) "colega online agora" else "colegas online agora"}", fontSize = 12.sp, color = Color(0xFF10B981))
                }
                Spacer(Modifier.height(10.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Progresso", fontSize = 12.sp, color = corMuted())
                    Text("${feitas.size}/$totalAulas · ${(pct * 100).toInt()}%", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(6.dp))
                BarraProgressoLinear(pct)
                if (continuar != null) {
                    Spacer(Modifier.height(14.dp))
                    BotaoGradiente(
                        (if (feitas.isEmpty()) "Começar: " else "Continuar: ") + continuar.titulo,
                        onClick = { onAbrirAula(continuar.slug) },
                    )
                }
            }
        }
        item { Text("Módulos", fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 2.dp)) }
        itemsIndexed(d.modulos) { i, m ->
            val feitasNoModulo = m.aulas.count { it.slug in feitas }
            GlassCard(
                Modifier.fillMaxWidth().clickable { onIrAulas() },
                padding = 16.dp,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconeCaixa(iconesModulo[i % iconesModulo.size])
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text(m.titulo, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("$feitasNoModulo/${m.aulas.size} aulas", fontSize = 12.sp, color = corMuted())
                    }
                    Icon(Icons.AutoMirrored.Filled.ArrowForwardIos, null, tint = corMuted(), modifier = Modifier.size(14.dp))
                }
            }
        }
    }
}
