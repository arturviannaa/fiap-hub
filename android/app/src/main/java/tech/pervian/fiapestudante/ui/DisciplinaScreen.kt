package tech.pervian.fiapestudante.ui

import android.graphics.Color as AndroidColor
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Terminal
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
import tech.pervian.fiapestudante.data.DisciplinaApp
import tech.pervian.fiapestudante.data.Sessao

fun corDe(hex: String): Color = runCatching { Color(AndroidColor.parseColor(hex)) }.getOrDefault(FiapMagenta)

@Composable
fun DisciplinaScreen(api: Api, sessao: Sessao, onEscolher: (DisciplinaApp) -> Unit) {
    var lista by remember { mutableStateOf<List<DisciplinaApp>?>(null) }
    LaunchedEffect(Unit) { lista = runCatching { api.disciplinas().disciplinas }.getOrNull() }

    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Spacer(Modifier.height(24.dp))
        Text("Escolha a disciplina", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text(
            "Aulas, chat, materiais e anotações são de cada disciplina. Seu perfil, tags e grupos seguem com você.",
            fontSize = 13.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp),
        )
        Spacer(Modifier.height(20.dp))

        val d = lista ?: run { Carregando(); return@Column }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(d) { disc ->
                val cor = corDe(disc.cor)
                Card(
                    Modifier.fillMaxWidth().clickable { onEscolher(disc) },
                    colors = CardDefaults.cardColors(),
                ) {
                    Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(52.dp).clip(RoundedCornerShape(16.dp)).background(cor), contentAlignment = Alignment.Center) {
                            Icon(
                                if (disc.icone == "cpu") Icons.Filled.Memory else Icons.Filled.Terminal,
                                null, tint = Color.White, modifier = Modifier.size(26.dp),
                            )
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(disc.nome, fontWeight = FontWeight.SemiBold)
                            Text("Prof. ${disc.professor} · ${disc.totalAulas} aulas", fontSize = 12.sp, color = Color.Gray)
                        }
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = cor)
                    }
                }
            }
        }
    }
}
