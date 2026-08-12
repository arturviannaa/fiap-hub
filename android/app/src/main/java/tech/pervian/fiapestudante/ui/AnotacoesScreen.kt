package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.NotaApp
import tech.pervian.fiapestudante.data.RespNotas
import tech.pervian.fiapestudante.data.Sessao

@Composable
fun AnotacoesScreen(api: Api, sessao: Sessao) {
    var aba by remember { mutableStateOf("minhas") }
    var dados by remember { mutableStateOf<RespNotas?>(null) }
    var criando by remember { mutableStateOf(false) }
    val escopo = rememberCoroutineScope()

    suspend fun recarregar() { dados = runCatching { api.notas(aba) }.getOrNull() }
    LaunchedEffect(aba) { recarregar() }

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { criando = true }, containerColor = FiapMagenta, contentColor = Color.White,
                icon = { Icon(Icons.Filled.Add, null) }, text = { Text("Anotar") },
            )
        },
    ) { pad ->
        Column(Modifier.fillMaxSize().padding(pad)) {
            Text("Anotações", fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp, 16.dp, 16.dp, 8.dp))
            TabRow(selectedTabIndex = if (aba == "minhas") 0 else 1, containerColor = Color.Transparent, contentColor = FiapMagenta) {
                Tab(selected = aba == "minhas", onClick = { aba = "minhas" }, text = { Text("Minhas") })
                Tab(selected = aba == "turma", onClick = { aba = "turma" }, text = { Text("Da turma") })
            }
            val d = dados
            if (d == null) { Carregando(); return@Column }
            if (d.notas.isEmpty()) {
                CentroTexto(if (aba == "minhas") "Você ainda não tem anotações." else "Ninguém compartilhou anotações ainda.")
                return@Column
            }
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
                items(d.notas) { n ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                        Column(Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Avatar(n.autor, n.usuario_id, n.autor_foto, sessao.token, 22)
                                Spacer(Modifier.width(6.dp))
                                Text(if (n.usuario_id == d.euId) "você" else n.autor.split(" ").first(), fontSize = 12.sp, color = Color.Gray)
                                Spacer(Modifier.width(6.dp))
                                Icon(if (n.publica) Icons.Filled.Public else Icons.Filled.Lock, null, tint = Color.Gray, modifier = Modifier.size(12.dp))
                                Spacer(Modifier.weight(1f))
                                if (n.usuario_id == d.euId) {
                                    IconButton(onClick = { escopo.launch { runCatching { api.apagarNota(n.id) }; recarregar() } }, modifier = Modifier.size(28.dp)) {
                                        Icon(Icons.Outlined.DeleteOutline, "Apagar", tint = Color.Gray, modifier = Modifier.size(18.dp))
                                    }
                                }
                            }
                            if (n.titulo.isNotEmpty()) { Spacer(Modifier.height(4.dp)); Text(n.titulo, fontWeight = FontWeight.SemiBold) }
                            Spacer(Modifier.height(2.dp))
                            Text(n.corpo, fontSize = 14.sp)
                        }
                    }
                }
            }
        }
    }

    if (criando) {
        var titulo by remember { mutableStateOf("") }
        var corpo by remember { mutableStateOf("") }
        var publica by remember { mutableStateOf(false) }
        AlertDialog(
            onDismissRequest = { criando = false },
            confirmButton = {
                TextButton(
                    enabled = corpo.trim().isNotEmpty(),
                    onClick = {
                        escopo.launch {
                            runCatching { api.criarNota(corpo, titulo, publica) }
                            criando = false; aba = "minhas"; recarregar()
                        }
                    },
                ) { Text("Salvar", color = FiapMagenta, fontWeight = FontWeight.Bold) }
            },
            dismissButton = { TextButton(onClick = { criando = false }) { Text("Cancelar") } },
            title = { Text("Nova anotação") },
            text = {
                Column {
                    OutlinedTextField(titulo, { titulo = it.take(160) }, label = { Text("Título (opcional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(corpo, { corpo = it }, label = { Text("Escreva aqui…") }, modifier = Modifier.fillMaxWidth().height(120.dp))
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(publica, { publica = it }, colors = CheckboxDefaults.colors(checkedColor = FiapMagenta))
                        Text("Compartilhar com a turma", fontSize = 13.sp)
                    }
                }
            },
        )
    }
}
