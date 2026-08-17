package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

// Modal padronizado: ícone gradiente, título/subtítulo, fechar, conteúdo, divisor, ghost+primário.
@Composable
fun PopupPadrao(
    icone: ImageVector,
    titulo: String,
    subtitulo: String,
    onFechar: () -> Unit,
    textoCancelar: String = "Cancelar",
    textoConfirmar: String,
    confirmarHabilitado: Boolean = true,
    onConfirmar: () -> Unit,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    Dialog(onDismissRequest = onFechar, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        val corModal = if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0xF0181818) else Color(0xF0FFFFFF)
        Column(
            Modifier
                .fillMaxWidth(0.9f)
                .clip(RoundedCornerShape(26.dp))
                .background(corModal)
                .border(androidx.compose.foundation.BorderStroke(1.dp, corBorda()), RoundedCornerShape(26.dp))
                .padding(24.dp, 26.dp, 24.dp, 22.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Box(
                    Modifier.size(44.dp).clip(RoundedCornerShape(14.dp))
                        .background(Brush.linearGradient(FiapGradiente)),
                    contentAlignment = Alignment.Center,
                ) { Icon(icone, null, tint = Color.White, modifier = Modifier.size(22.dp)) }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(titulo, fontSize = 21.sp, fontWeight = FontWeight.ExtraBold)
                    Text(subtitulo, fontSize = 12.5.sp, color = corMuted(), modifier = Modifier.padding(top = 2.dp))
                }
                Box(
                    Modifier.size(30.dp).clip(RoundedCornerShape(9.dp)).background(corBorda())
                        .clickableSemRipple(onFechar),
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Filled.Close, "Fechar", tint = corMuted(), modifier = Modifier.size(16.dp)) }
            }

            content()

            Box(Modifier.fillMaxWidth().height(1.dp).background(corBorda()))

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                BotaoGhost(textoCancelar, onClick = onFechar, modifier = Modifier.weight(1f))
                BotaoGradiente(textoConfirmar, habilitado = confirmarHabilitado, onClick = onConfirmar, modifier = Modifier.weight(1f).height(50.dp))
            }
        }
    }
}

@Composable
fun BotaoGhost(texto: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier
            .height(50.dp)
            .clip(RoundedCornerShape(15.dp))
            .background(corBorda().let { if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0x14FFFFFF) else Color(0x14785A8C) })
            .border(androidx.compose.foundation.BorderStroke(1.5.dp, corBorda()), RoundedCornerShape(15.dp))
            .clickableSemRipple(onClick),
        contentAlignment = Alignment.Center,
    ) { Text(texto, color = corMuted(), fontWeight = FontWeight.Bold, fontSize = 15.sp) }
}

// Campo de texto padronizado: label acima, ícone à esquerda, borda magenta + destaque no foco.
@Composable
fun CampoPadrao(
    valor: String,
    onValor: (String) -> Unit,
    label: String,
    icone: ImageVector,
    placeholder: String = "",
    senha: Boolean = false,
    linhaUnica: Boolean = true,
    minAltura: androidx.compose.ui.unit.Dp = 48.dp,
    teclado: KeyboardOptions = KeyboardOptions(keyboardType = if (senha) KeyboardType.Password else KeyboardType.Text),
    modifier: Modifier = Modifier,
) {
    var senhaVisivel by remember { mutableStateOf(false) }
    val fonte = remember { MutableInteractionSource() }
    val focado by fonte.collectIsFocusedAsState()
    val corBordaAtual = if (focado) FiapMagenta else corBorda()

    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = corMuted())
        Row(
            Modifier.fillMaxWidth().heightIn(min = minAltura)
                .clip(RoundedCornerShape(14.dp))
                .background(if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0x14FFFFFF) else Color.White)
                .border(androidx.compose.foundation.BorderStroke(if (focado) 2.dp else 1.5.dp, corBordaAtual), RoundedCornerShape(14.dp))
                .padding(horizontal = 14.dp, vertical = if (linhaUnica) 0.dp else 12.dp),
            verticalAlignment = if (linhaUnica) Alignment.CenterVertically else Alignment.Top,
        ) {
            Icon(icone, null, tint = if (focado) FiapMagenta else corMuted(), modifier = Modifier.size(17.dp))
            Spacer(Modifier.width(10.dp))
            Box(Modifier.weight(1f)) {
                if (valor.isEmpty() && placeholder.isNotEmpty()) {
                    Text(placeholder, fontSize = 14.sp, color = corMuted().copy(alpha = 0.7f))
                }
                BasicTextField(
                    value = valor, onValueChange = onValor,
                    singleLine = linhaUnica,
                    interactionSource = fonte,
                    keyboardOptions = teclado,
                    visualTransformation = if (senha && !senhaVisivel) PasswordVisualTransformation() else VisualTransformation.None,
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface),
                    cursorBrush = Brush.linearGradient(listOf(FiapMagenta, FiapMagenta)),
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            if (senha) {
                Spacer(Modifier.width(8.dp))
                Icon(
                    if (senhaVisivel) Icons.Filled.VisibilityOff else Icons.Filled.Visibility, null,
                    tint = corMuted(), modifier = Modifier.size(17.dp).clickableSemRipple { senhaVisivel = !senhaVisivel },
                )
            }
        }
    }
}

// Checkbox padronizado: quadrado arredondado, preenche em gradiente quando marcado.
@Composable
fun CheckboxPadrao(marcado: Boolean, onMudar: (Boolean) -> Unit, texto: String, modifier: Modifier = Modifier) {
    Row(
        modifier.clickableSemRipple { onMudar(!marcado) },
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier.size(22.dp).clip(RoundedCornerShape(7.dp))
                .then(if (marcado) Modifier.background(Brush.linearGradient(FiapGradiente)) else Modifier.background(if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0x14FFFFFF) else Color.White))
                .border(androidx.compose.foundation.BorderStroke(1.5.dp, if (marcado) Color.Transparent else corBorda()), RoundedCornerShape(7.dp)),
            contentAlignment = Alignment.Center,
        ) { if (marcado) Icon(Icons.Filled.Check, null, tint = Color.White, modifier = Modifier.size(14.dp)) }
        Spacer(Modifier.width(11.dp))
        Text(texto, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
    }
}
