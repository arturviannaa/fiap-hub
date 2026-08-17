package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.EventNote
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
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
fun AnotacoesScreen(api: Api, sessao: Sessao, disc: String) {
    var aba by remember { mutableStateOf("minhas") }
    var dados by remember { mutableStateOf<RespNotas?>(null) }
    var criando by remember { mutableStateOf(false) }
    val escopo = rememberCoroutineScope()

    suspend fun recarregar() { dados = runCatching { api.notas(aba, disc) }.getOrNull() }
    LaunchedEffect(aba) { recarregar() }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            SegmentoDuplo(
                "Minhas" + (dados?.let { if (aba == "minhas") " · ${it.notas.size}" else "" } ?: ""),
                "Da turma" + (dados?.let { if (aba == "turma") " · ${it.notas.size}" else "" } ?: ""),
                aSelecionado = aba == "minhas",
                onA = { aba = "minhas" }, onB = { aba = "turma" },
                modifier = Modifier.fillMaxWidth().padding(16.dp, 16.dp, 16.dp, 4.dp),
            )
            val d = dados
            if (d == null) { CarregandoLista(); return@Column }
            if (d.notas.isEmpty()) {
                CentroTexto(if (aba == "minhas") "Você ainda não tem anotações." else "Ninguém compartilhou anotações ainda.")
                return@Column
            }
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(16.dp, 8.dp, 16.dp, 96.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                itemsIndexed(d.notas) { i, n -> CartaoPostit(n, i, souAutor = n.usuario_id == d.euId, sessao) { escopo.launch { runCatching { api.apagarNota(n.id) }; recarregar() } } }
            }
        }
        FabRedondo(Icons.Filled.Add, onClick = { criando = true }, modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp))
    }

    if (criando) {
        var titulo by remember { mutableStateOf("") }
        var corpo by remember { mutableStateOf("") }
        var publica by remember { mutableStateOf(false) }
        PopupPadrao(
            icone = Icons.Filled.Edit,
            titulo = "Nova anotação",
            subtitulo = "Guarde o que aprendeu, compartilhe se quiser.",
            onFechar = { criando = false },
            textoConfirmar = "Salvar",
            confirmarHabilitado = corpo.trim().isNotEmpty(),
            onConfirmar = {
                escopo.launch {
                    runCatching { api.criarNota(corpo, titulo, publica, disc) }
                    criando = false; aba = "minhas"; recarregar()
                }
            },
        ) {
            CampoPadrao(titulo, { titulo = it.take(160) }, label = "Título (opcional)", icone = Icons.Filled.Edit, placeholder = "Ex.: Variáveis e tipos")
            CampoPadrao(corpo, { corpo = it }, label = "Anotação", icone = Icons.AutoMirrored.Filled.EventNote, placeholder = "Escreva aqui…", linhaUnica = false, minAltura = 100.dp)
            CheckboxPadrao(publica, { publica = it }, "Compartilhar com a turma")
        }
    }
}

@Composable
private fun CartaoPostit(n: NotaApp, indice: Int, souAutor: Boolean, sessao: Sessao, onApagar: () -> Unit) {
    val cor = coresPostit[indice % coresPostit.size]
    val textoEscuro = Color(0xFF2B2B2B)
    Box(Modifier.fillMaxWidth()) {
        Column(
            Modifier.fillMaxWidth()
                .rotate(if (indice % 2 == 0) -1.4f else 1.6f)
                .shadow(8.dp, RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp, bottomStart = 14.dp, bottomEnd = 14.dp), ambientColor = Color(0x66603C14), spotColor = Color(0x66603C14))
                .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp, bottomStart = 14.dp, bottomEnd = 14.dp))
                .background(cor)
                .padding(top = 20.dp, start = 14.dp, end = 14.dp, bottom = 14.dp),
        ) {
            if (n.titulo.isNotEmpty()) Text(n.titulo, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = textoEscuro)
            Text(
                n.corpo, fontSize = 12.sp, lineHeight = 16.sp, color = textoEscuro.copy(alpha = 0.82f),
                maxLines = 5, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 4.dp),
            )
            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Avatar(n.autor, n.usuario_id, n.autor_foto, sessao.token, 18)
                Spacer(Modifier.width(5.dp))
                Text(if (souAutor) "você" else n.autor.split(" ").first(), fontSize = 10.5.sp, color = textoEscuro.copy(alpha = 0.65f))
                Spacer(Modifier.width(5.dp))
                Icon(if (n.publica) Icons.Filled.Public else Icons.Filled.Lock, null, tint = textoEscuro.copy(alpha = 0.5f), modifier = Modifier.size(11.dp))
                Spacer(Modifier.weight(1f))
                if (souAutor) {
                    Icon(
                        Icons.Outlined.DeleteOutline, "Apagar", tint = textoEscuro.copy(alpha = 0.5f),
                        modifier = Modifier.size(15.dp).clickableSemRipple(onApagar),
                    )
                }
            }
        }
        Box(
            Modifier.size(14.dp).align(Alignment.TopCenter).offset(y = (-7).dp)
                .shadow(3.dp, CircleShape, clip = false)
                .clip(CircleShape)
                .background(
                    androidx.compose.ui.graphics.Brush.radialGradient(
                        colors = listOf(Color(0xFFFF7A8A), Color(0xFFD21F3C)),
                        center = androidx.compose.ui.geometry.Offset(13f, 11f),
                        radius = 20f,
                    ),
                ),
        )
    }
}
