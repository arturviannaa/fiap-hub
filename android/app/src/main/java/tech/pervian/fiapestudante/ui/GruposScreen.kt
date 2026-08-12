package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Logout
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
import tech.pervian.fiapestudante.data.RespGrupos
import tech.pervian.fiapestudante.data.Sessao

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GruposScreen(api: Api, sessao: Sessao, onAbrirGrupo: (Int) -> Unit) {
    var dados by remember { mutableStateOf<RespGrupos?>(null) }
    var criando by remember { mutableStateOf(false) }
    val escopo = rememberCoroutineScope()

    suspend fun recarregar() { dados = runCatching { api.grupos() }.getOrNull() }
    LaunchedEffect(Unit) { recarregar() }

    val d = dados
    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { criando = true },
                containerColor = FiapMagenta, contentColor = Color.White,
                icon = { Icon(Icons.Filled.Add, null) }, text = { Text("Novo grupo") },
            )
        },
    ) { pad ->
        if (d == null) { Carregando(); return@Scaffold }
        LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp)) {
            item {
                Text("Grupos", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text("Espaços privados da turma", color = Color.Gray, fontSize = 13.sp)
                Spacer(Modifier.height(12.dp))
            }
            if (d.grupos.isEmpty()) {
                item { Text("Você ainda não está em nenhum grupo. Crie um!", color = Color.Gray, modifier = Modifier.padding(top = 40.dp)) }
            }
            items(d.grupos) { g ->
                Card(Modifier.fillMaxWidth().padding(vertical = 5.dp)) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.Lock, null, tint = FiapMagenta, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(g.nome, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            Text("${g.membros} membros", fontSize = 12.sp, color = Color.Gray)
                        }
                        if (g.descricao.isNotEmpty()) {
                            Spacer(Modifier.height(4.dp)); Text(g.descricao, fontSize = 13.sp, color = Color.Gray)
                        }
                        Spacer(Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { onAbrirGrupo(g.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = FiapMagenta),
                                modifier = Modifier.weight(1f),
                            ) { Text("Abrir chat") }
                            OutlinedButton(
                                onClick = { escopo.launch { runCatching { api.sairGrupo(g.id) }; recarregar() } },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444)),
                            ) { Icon(Icons.Filled.Logout, null, Modifier.size(16.dp)); Spacer(Modifier.width(4.dp)); Text("Sair") }
                        }
                    }
                }
            }
        }
    }

    if (criando && d != null) {
        DialogNovoGrupo(
            turma = d.turma,
            onCancelar = { criando = false },
            onCriar = { nome, desc, membros ->
                escopo.launch {
                    val r = runCatching { api.criarGrupo(nome, desc, membros) }.getOrNull()
                    criando = false
                    if (r?.ok == true) onAbrirGrupo(r.grupoId) else recarregar()
                }
            },
        )
    }
}

@Composable
private fun DialogNovoGrupo(
    turma: List<tech.pervian.fiapestudante.data.PessoaLite>,
    onCancelar: () -> Unit,
    onCriar: (String, String, List<Int>) -> Unit,
) {
    var nome by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    val selecionados = remember { mutableStateListOf<Int>() }

    AlertDialog(
        onDismissRequest = onCancelar,
        confirmButton = {
            TextButton(
                onClick = { onCriar(nome, desc, selecionados.toList()) },
                enabled = nome.trim().length >= 2,
            ) { Text("Criar", color = FiapMagenta, fontWeight = FontWeight.Bold) }
        },
        dismissButton = { TextButton(onClick = onCancelar) { Text("Cancelar") } },
        title = { Text("Novo grupo") },
        text = {
            Column {
                OutlinedTextField(nome, { nome = it.take(60) }, label = { Text("Nome") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(desc, { desc = it.take(160) }, label = { Text("Descrição (opcional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(12.dp))
                Text("Quem participa", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                LazyColumn(Modifier.heightIn(max = 240.dp)) {
                    items(turma) { p ->
                        Row(
                            Modifier.fillMaxWidth().padding(vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Checkbox(
                                checked = p.id in selecionados,
                                onCheckedChange = { if (it) selecionados.add(p.id) else selecionados.remove(p.id) },
                                colors = CheckboxDefaults.colors(checkedColor = FiapMagenta),
                            )
                            Text(p.nome, fontSize = 14.sp)
                        }
                    }
                }
            }
        },
    )
}
