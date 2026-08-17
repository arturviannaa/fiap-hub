package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.Circle
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

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AulasScreen(api: Api, sessao: Sessao, disc: String, onAbrirAula: (String) -> Unit) {
    var dados by remember { mutableStateOf<RespAulas?>(null) }
    var erro by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(disc) {
        try { dados = api.aulas(disc) } catch (e: Exception) { erro = e.message }
    }

    val d = dados
    if (erro != null) { CentroTexto(erro!!); return }
    if (d == null) { CarregandoLista(); return }

    val feitas = d.concluidas.toSet()

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        d.modulos.forEachIndexed { i, m ->
            item {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = if (i == 0) 0.dp else 8.dp, bottom = 2.dp)) {
                    IconeCaixa(iconesModulo[i % iconesModulo.size])
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("${(i + 1).toString().padStart(2, '0')}. ${m.titulo}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        if (m.resumo.isNotEmpty()) Text(m.resumo, fontSize = 12.sp, color = corMuted())
                    }
                }
            }
            items(m.aulas) { a ->
                val feita = a.slug in feitas
                GlassCard(
                    Modifier.fillMaxWidth().clickable { onAbrirAula(a.slug) },
                    padding = 16.dp,
                ) {
                    Row(verticalAlignment = Alignment.Top) {
                        if (feita) Icon(Icons.Filled.CheckCircle, null, tint = FiapMagenta, modifier = Modifier.size(22.dp))
                        else Icon(Icons.Outlined.Circle, null, tint = corMuted(), modifier = Modifier.size(22.dp))
                        Spacer(Modifier.width(13.dp))
                        Column(Modifier.weight(1f)) {
                            Text(a.titulo, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text("⏱ ${a.minutos} min · ${a.exemplos} exemplos", fontSize = 11.5.sp, color = corMuted(), modifier = Modifier.padding(top = 4.dp, bottom = 7.dp))
                            if (a.tags.isNotEmpty()) {
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    a.tags.take(4).forEach { TagCodigo(it) }
                                }
                            }
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
