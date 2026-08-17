package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.EventNote
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Lock
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

@Composable
fun GruposScreen(api: Api, sessao: Sessao, onAbrirGrupo: (Int) -> Unit) {
    var dados by remember { mutableStateOf<RespGrupos?>(null) }
    var criando by remember { mutableStateOf(false) }
    val escopo = rememberCoroutineScope()

    suspend fun recarregar() { dados = runCatching { api.grupos() }.getOrNull() }
    LaunchedEffect(Unit) { recarregar() }

    val d = dados
    Box(Modifier.fillMaxSize()) {
        if (d == null) { Carregando() } else {
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp, 16.dp, 16.dp, 96.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                item {
                    Text("Grupos", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Text("Espaços privados da turma", color = corMuted(), fontSize = 13.sp)
                }
                if (d.grupos.isEmpty()) {
                    item { Text("Você ainda não está em nenhum grupo. Crie um!", color = corMuted(), modifier = Modifier.padding(top = 24.dp)) }
                }
                items(d.grupos) { g ->
                    val cor = cores[((g.id.let { if (it < 0) -it else it }) % cores.size)]
                    GlassCard(Modifier.fillMaxWidth(), padding = 18.dp) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconeCaixa(Icons.Filled.Lock, cor = cor)
                            Spacer(Modifier.weight(1f))
                            Text("${g.membros} ${if (g.membros == 1) "membro" else "membros"}", fontSize = 12.sp, color = corMuted())
                        }
                        Spacer(Modifier.height(12.dp))
                        Text(g.nome, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        if (g.descricao.isNotEmpty()) {
                            Spacer(Modifier.height(3.dp))
                            Text(g.descricao, fontSize = 13.sp, color = corMuted())
                        }
                        Spacer(Modifier.height(14.dp))
                        BotaoGradiente("Abrir chat", onClick = { onAbrirGrupo(g.id) })
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "Sair do grupo", fontSize = 12.sp, color = Color(0xFFEF4444),
                            modifier = Modifier.clickableSemRipple {
                                escopo.launch { runCatching { api.sairGrupo(g.id) }; recarregar() }
                            }.padding(vertical = 4.dp),
                        )
                    }
                }
            }
        }
        FabRedondo(Icons.Filled.Add, onClick = { criando = true }, modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp))
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

    PopupPadrao(
        icone = Icons.Filled.Lock,
        titulo = "Novo grupo",
        subtitulo = "Espaço privado só pra quem você chamar.",
        onFechar = onCancelar,
        textoConfirmar = "Criar",
        confirmarHabilitado = nome.trim().length >= 2,
        onConfirmar = { onCriar(nome, desc, selecionados.toList()) },
    ) {
        CampoPadrao(nome, { nome = it.take(60) }, label = "Nome", icone = Icons.Filled.Lock, placeholder = "Ex.: Hackers da FIAP")
        CampoPadrao(desc, { desc = it.take(160) }, label = "Descrição (opcional)", icone = Icons.AutoMirrored.Filled.EventNote, placeholder = "Do que se trata")
        Text("Quem participa", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = corMuted())
        LazyColumn(Modifier.heightIn(max = 200.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            items(turma) { p ->
                CheckboxPadrao(
                    marcado = p.id in selecionados,
                    onMudar = { if (it) selecionados.add(p.id) else selecionados.remove(p.id) },
                    texto = p.nome,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                )
            }
        }
    }
}
