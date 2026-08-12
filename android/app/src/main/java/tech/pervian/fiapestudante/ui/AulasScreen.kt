package tech.pervian.fiapestudante.ui

import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.ui.graphics.Brush
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
    val pct = if (totalAulas > 0) feitas.size.toFloat() / totalAulas else 0f
    val continuar = d.modulos.flatMap { it.aulas }.firstOrNull { it.slug !in feitas }
    val hora = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    val saudacao = when { hora < 6 -> "Boa madrugada"; hora < 12 -> "Bom dia"; hora < 18 -> "Boa tarde"; else -> "Boa noite" }
    val primeiroNome = (sessao.usuario?.nome ?: "").split(" ").firstOrNull() ?: ""


    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
        item {
            androidx.compose.animation.AnimatedVisibility(visible = true, enter = fadeIn() + slideInVertically { it / 3 }) {
                Column {
                    Text("$saudacao,", fontSize = 13.sp, color = Color.Gray)
                    Text("$primeiroNome 👋", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(14.dp))
                    Card(
                        Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                AnelProgresso(pct)
                                Spacer(Modifier.width(16.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(d.disciplina.nome, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text("${feitas.size}/$totalAulas aulas concluídas", fontSize = 12.sp, color = Color.Gray)
                                    if (d.online > 0) {
                                        Spacer(Modifier.height(6.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(Modifier.size(7.dp).clip(androidx.compose.foundation.shape.CircleShape).background(Color(0xFF10B981)))
                                            Spacer(Modifier.width(5.dp))
                                            Text("${d.online} ${if (d.online == 1) "pessoa online" else "colegas online agora"}", fontSize = 12.sp, color = Color(0xFF10B981))
                                        }
                                    }
                                }
                            }
                            if (continuar != null) {
                                Spacer(Modifier.height(14.dp))
                                Button(
                                    onClick = { onAbrirAula(continuar.slug) },
                                    modifier = Modifier.fillMaxWidth().height(50.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    contentPadding = PaddingValues(0.dp),
                                ) {
                                    Box(
                                        Modifier.fillMaxSize().clip(RoundedCornerShape(14.dp))
                                            .background(Brush.horizontalGradient(listOf(FiapMagenta, Color(0xFFFB7099)))),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text(
                                            (if (feitas.isEmpty()) "Começar: " else "Continuar: ") + continuar.titulo,
                                            color = Color.White, fontWeight = FontWeight.SemiBold, maxLines = 1,
                                        )
                                    }
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(18.dp))
                }
            }
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
