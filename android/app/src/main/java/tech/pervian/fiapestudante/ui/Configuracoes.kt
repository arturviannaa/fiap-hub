package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.SettingsBrightness
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog

private data class OpcaoTema(val valor: String, val rotulo: String, val icone: ImageVector)

private val OPCOES = listOf(
    OpcaoTema("claro", "Claro", Icons.Filled.LightMode),
    OpcaoTema("escuro", "Escuro", Icons.Filled.DarkMode),
    OpcaoTema("sistema", "Padrão do sistema", Icons.Filled.SettingsBrightness),
)

// Popup nativo mostrado na primeira abertura para escolher o tema.
@Composable
fun DialogTema(onEscolher: (String) -> Unit) {
    Dialog(onDismissRequest = {}) {
        Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surface) {
            Column(Modifier.padding(24.dp)) {
                Text("Escolha o tema", fontWeight = FontWeight.Bold, fontSize = 19.sp)
                Text("Você pode mudar depois em Configurações.", color = Color.Gray, fontSize = 13.sp)
                Spacer(Modifier.height(16.dp))
                OPCOES.forEach { op ->
                    LinhaTema(op, selecionado = false) { onEscolher(op.valor) }
                }
            }
        }
    }
}

// Seletor de tema dentro de Configurações (mostra o atual marcado).
@Composable
fun SeletorTema(atual: String, onEscolher: (String) -> Unit) {
    Column {
        OPCOES.forEach { op ->
            LinhaTema(op, selecionado = op.valor == atual) { onEscolher(op.valor) }
        }
    }
}

@Composable
private fun LinhaTema(op: OpcaoTema, selecionado: Boolean, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(14.dp),
        color = if (selecionado) FiapMagenta.copy(alpha = 0.10f) else MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, if (selecionado) FiapMagenta else Color.Gray.copy(alpha = 0.3f)),
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(36.dp).clip(RoundedCornerShape(10.dp))
                    .background(if (selecionado) FiapMagenta.copy(alpha = 0.15f) else Color.Gray.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) { Icon(op.icone, null, tint = if (selecionado) FiapMagenta else Color.Gray, modifier = Modifier.size(20.dp)) }
            Spacer(Modifier.width(14.dp))
            Text(op.rotulo, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
            if (selecionado) Icon(Icons.Filled.Check, null, tint = FiapMagenta)
        }
    }
}

@Composable
fun ConfiguracoesScreen(
    temaAtual: String,
    onTema: (String) -> Unit,
    versaoApp: String,
    onSair: () -> Unit,
    onVoltar: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        @OptIn(ExperimentalMaterial3Api::class)
        TopAppBar(
            title = { Text("Configurações") },
            navigationIcon = {
                IconButton(onClick = onVoltar) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar")
                }
            },
        )
        Column(Modifier.fillMaxWidth().weight(1f).padding(16.dp)) {
            Text("APARÊNCIA", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(8.dp))
            SeletorTema(temaAtual, onTema)

            Spacer(Modifier.height(24.dp))
            Text("SOBRE", fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(8.dp))
            Card {
                Column(Modifier.fillMaxWidth().padding(16.dp)) {
                    Text("FIAP Estudante", fontWeight = FontWeight.Medium)
                    Text("Versão $versaoApp · mesma conta do site", fontSize = 13.sp, color = Color.Gray)
                }
            }

            Spacer(Modifier.weight(1f))
            OutlinedButton(
                onClick = onSair,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444)),
            ) { Text("Sair da conta") }
        }
    }
}
