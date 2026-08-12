package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.PerfilUsuario
import tech.pervian.fiapestudante.data.Sessao

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PerfilPublicoScreen(api: Api, sessao: Sessao, id: Int, onVoltar: () -> Unit) {
    var p by remember(id) { mutableStateOf<PerfilUsuario?>(null) }
    var papeis by remember(id) { mutableStateOf(listOf<String>()) }
    var nome by remember(id) { mutableStateOf("") }
    val escopo = rememberCoroutineScope()

    LaunchedEffect(id) {
        runCatching { api.usuario(id) }.getOrNull()?.let {
            p = it; papeis = it.papeis; nome = it.nome
        }
    }

    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Perfil") },
            navigationIcon = { IconButton(onClick = onVoltar) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") } },
        )
        val perfil = p ?: run { Carregando(); return }
        val on = online(perfil.visto_em)

        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Avatar(nome, perfil.id, perfil.foto, sessao.token, 80)
                Spacer(Modifier.width(16.dp))
                Column {
                    Text(nome, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(4.dp))
                    Tags(papeis)
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(8.dp).clip(CircleShape).background(if (on) Color(0xFF10B981) else Color.Gray))
                        Spacer(Modifier.width(5.dp))
                        Text(if (on) "ativo agora" else "ativo ${quando(perfil.visto_em)} atrás", fontSize = 12.sp, color = Color.Gray)
                    }
                }
            }

            if (perfil.bio.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                Text(perfil.bio, fontSize = 14.sp)
            }

            Spacer(Modifier.height(20.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatCard("${perfil.aulas}/${perfil.total}", "aulas", Modifier.weight(1f))
                StatCard("${perfil.notas}", "anotações", Modifier.weight(1f))
                StatCard("${perfil.arquivos}", "materiais", Modifier.weight(1f))
            }

            // Controles de admin: alterar tags e corrigir nome.
            if (perfil.souAdmin) {
                Spacer(Modifier.height(24.dp))
                Text("MODERAÇÃO (ADMIN)", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(10.dp))
                Text("Tags", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("aluno", "professor", "admin").forEach { tag ->
                        val ativo = tag in papeis
                        val ehVoceAdmin = perfil.ehVoce && tag == "admin" && ativo
                        FilterChip(
                            selected = ativo,
                            enabled = !ehVoceAdmin,
                            onClick = {
                                escopo.launch {
                                    val r = runCatching { api.adminPapel(perfil.id, tag) }.getOrNull()
                                    if (r?.ok == true) papeis = r.papeis
                                }
                            },
                            label = { Text(tag) },
                            leadingIcon = if (ativo) { { Icon(Icons.Filled.Check, null, Modifier.size(16.dp)) } } else null,
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))
                Text("Corrigir nome", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(6.dp))
                var editando by remember { mutableStateOf(nome) }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = editando, onValueChange = { editando = it.take(60) },
                        singleLine = true, modifier = Modifier.weight(1f),
                        leadingIcon = { Icon(Icons.Filled.Edit, null, Modifier.size(18.dp)) },
                    )
                    Spacer(Modifier.width(8.dp))
                    Button(
                        onClick = {
                            escopo.launch {
                                val r = runCatching { api.adminNome(perfil.id, editando) }.getOrNull()
                                if (r?.ok == true) nome = r.nome
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = FiapMagenta),
                    ) { Text("Salvar") }
                }
            }

            Spacer(Modifier.height(24.dp))
            Text(
                "Na turma desde ${perfil.criado_em.take(10)}",
                fontSize = 12.sp, color = Color.Gray, modifier = Modifier.align(Alignment.CenterHorizontally),
            )
        }
    }
}

@Composable
private fun StatCard(valor: String, rotulo: String, modifier: Modifier = Modifier) {
    Card(modifier) {
        Column(Modifier.padding(14.dp)) {
            Text(valor, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = FiapMagenta)
            Text(rotulo, fontSize = 11.sp, color = Color.Gray)
        }
    }
}
