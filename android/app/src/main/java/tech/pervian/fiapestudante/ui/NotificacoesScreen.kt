package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.background
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.Notificacao
import tech.pervian.fiapestudante.data.Sessao

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificacoesScreen(
    api: Api,
    sessao: Sessao,
    onVoltar: () -> Unit,
    onAbrirGrupo: (Int) -> Unit,
    onAbrirAula: (String) -> Unit,
    onLidas: () -> Unit,
) {
    var itens by remember { mutableStateOf<List<Notificacao>?>(null) }

    LaunchedEffect(Unit) {
        itens = runCatching { api.notificacoes().notificacoes }.getOrNull() ?: emptyList()
        api.marcarNotifVisto()
        onLidas()
    }

    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Notificações") },
            navigationIcon = { IconButton(onClick = onVoltar) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } },
        )
        val lista = itens ?: run { Carregando(); return }
        if (lista.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Filled.NotificationsNone, null, tint = Color.Gray, modifier = Modifier.size(48.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("Nenhuma novidade por enquanto", color = Color.Gray)
                }
            }
            return
        }
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp)) {
            items(lista) { n ->
                Card(
                    Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable {
                        n.canal?.let { c -> Regex("^g:(\\d+)$").find(c)?.let { onAbrirGrupo(it.groupValues[1].toInt()) } }
                        n.slug?.let(onAbrirAula)
                    },
                ) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.size(40.dp).clip(CircleShape).background(FiapMagenta.copy(alpha = 0.12f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                if (n.tipo == "grupo") Icons.Filled.Group else Icons.AutoMirrored.Filled.MenuBook,
                                null, tint = FiapMagenta, modifier = Modifier.size(20.dp),
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(n.titulo, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                            if (n.texto.isNotEmpty()) Text(n.texto, fontSize = 12.sp, color = Color.Gray)
                        }
                        if (n.quando.isNotEmpty()) Text(quando(n.quando), fontSize = 11.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}
