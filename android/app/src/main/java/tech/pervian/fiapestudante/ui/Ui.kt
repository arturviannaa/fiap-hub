package tech.pervian.fiapestudante.ui

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.runtime.getValue
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.DataArray
import androidx.compose.material.icons.filled.Functions
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import tech.pervian.fiapestudante.data.BASE_URL

val FiapMagenta = Color(0xFFED145B)
val FiapRosa = Color(0xFFFB7099)
val FiapGradiente = listOf(FiapRosa, FiapMagenta)

// Tokens "glass" — mesmos valores do --painel/--borda/--texto-2 do web (globals.css).
@Composable fun corFundo() = if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0xFF0E0F10) else Color(0xFFF2F0EE)
@Composable fun corPainel() = if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0x99181818) else Color(0x8CFFFFFF)
@Composable fun corBorda() = if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0x24ACC1CC) else Color(0x1414101E)
@Composable fun corMuted() = if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0xFFBDBFC7) else Color(0xFF7A7280)

// Painel de vidro: fundo translúcido + borda fina, a base visual de todo o novo design.
@Composable
fun GlassCard(modifier: Modifier = Modifier, padding: Dp = 16.dp, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier
            .clip(RoundedCornerShape(20.dp))
            .background(corPainel())
            .border(androidx.compose.foundation.BorderStroke(1.dp, corBorda()), RoundedCornerShape(20.dp))
            .padding(padding),
        content = content,
    )
}

// Botão principal cheio, gradiente rosa->magenta — usado em CTAs de destaque.
@Composable
fun BotaoGradiente(texto: String, modifier: Modifier = Modifier, habilitado: Boolean = true, cores: List<Color> = FiapGradiente, onClick: () -> Unit) {
    Box(
        modifier
            .fillMaxWidth()
            .height(50.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(if (habilitado) Brush.horizontalGradient(cores) else Brush.horizontalGradient(listOf(Color.Gray, Color.Gray)))
            .then(if (habilitado) Modifier.clickable(onClick = onClick) else Modifier),
        contentAlignment = Alignment.Center,
    ) { Text(texto, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp) }
}

// Barra de progresso linear com trilho neutro e preenchimento em gradiente.
@Composable
fun BarraProgressoLinear(pct: Float, modifier: Modifier = Modifier) {
    val alvo = pct.coerceIn(0f, 1f)
    val anim by androidx.compose.animation.core.animateFloatAsState(
        targetValue = alvo, animationSpec = tween(700), label = "barra",
    )
    Box(
        modifier.fillMaxWidth().height(9.dp).clip(RoundedCornerShape(7.dp)).background(corBorda().copy(alpha = 0.5f)),
    ) {
        Box(
            Modifier.fillMaxHeight().fillMaxWidth(anim).clip(RoundedCornerShape(7.dp))
                .background(Brush.horizontalGradient(FiapGradiente)),
        )
    }
}

// Ícone dentro de caixa arredondada colorida — usado em módulos, grupos e tipos de arquivo.
@Composable
fun IconeCaixa(icone: ImageVector, cor: Color = FiapMagenta, tamanho: Dp = 40.dp) {
    Box(
        Modifier.size(tamanho).clip(RoundedCornerShape(12.dp)).background(cor.copy(alpha = 0.12f))
            .border(androidx.compose.foundation.BorderStroke(1.dp, cor.copy(alpha = 0.18f)), RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center,
    ) { Icon(icone, null, tint = cor, modifier = Modifier.size(tamanho * 0.48f)) }
}

val cores = listOf(
    0xFFED145B, 0xFF7C5CFF, 0xFF0EA5E9, 0xFF10B981, 0xFFF59E0B, 0xFFEF4444, 0xFF8B5CF6, 0xFF14B8A6,
).map { Color(it) }

// Ícones de módulo, ciclados por índice — Painel e Aulas usam a mesma sequência.
val iconesModulo = listOf(
    Icons.Filled.Category, Icons.Filled.AccountTree, Icons.Filled.DataArray,
    Icons.Filled.Repeat, Icons.Filled.Functions, Icons.Filled.Layers,
)

// Paleta de post-it — Anotações cicla por essas cores conforme o índice.
val coresPostit = listOf(0xFFFFF3A8, 0xFFBDE4C4, 0xFFFFC9DD, 0xFFBCD8FF, 0xFFFFD9A8, 0xFFE6D5FF).map { Color(it) }

@Composable private fun corChipCodigo() = if (tech.pervian.fiapestudante.LocalTemaEscuro.current) Color(0x1FFFFFFF) else Color(0x21785A8C)

// Chip pequeno estilo "código" (monospace, fundo neutro) — tags de aula, badges.
@Composable
fun TagCodigo(texto: String) {
    Box(
        Modifier.clip(RoundedCornerShape(6.dp)).background(corChipCodigo())
            .padding(horizontal = 7.dp, vertical = 3.dp),
    ) { Text(texto, fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace, fontSize = 11.sp, color = corMuted()) }
}

// Seletor duplo em pílula (segmented control) — Minhas/Da turma, Da turma/Meus arquivos.
@Composable
fun SegmentoDuplo(rotuloA: String, rotuloB: String, aSelecionado: Boolean, onA: () -> Unit, onB: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier.clip(RoundedCornerShape(13.dp)).background(corPainel())
            .border(androidx.compose.foundation.BorderStroke(1.dp, corBorda()), RoundedCornerShape(13.dp))
            .padding(4.dp),
    ) {
        SegmentoBotao(rotuloA, aSelecionado, onA, Modifier.weight(1f))
        SegmentoBotao(rotuloB, !aSelecionado, onB, Modifier.weight(1f))
    }
}

@Composable
private fun SegmentoBotao(rotulo: String, on: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier.clip(RoundedCornerShape(10.dp))
            .then(if (on) Modifier.background(Brush.horizontalGradient(FiapGradiente)) else Modifier)
            .clickableSemRipple(onClick)
            .padding(vertical = 9.dp),
        contentAlignment = Alignment.Center,
    ) { Text(rotulo, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = if (on) Color.White else corMuted()) }
}

// FAB redondo só com ícone, gradiente — usado em Anotações e Grupos.
@Composable
fun FabRedondo(icone: ImageVector, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier.size(58.dp).clip(RoundedCornerShape(20.dp)).background(Brush.linearGradient(FiapGradiente))
            .clickableSemRipple(onClick),
        contentAlignment = Alignment.Center,
    ) { Icon(icone, null, tint = Color.White, modifier = Modifier.size(26.dp)) }
}

// Borda tracejada — usada na dropzone de upload de Materiais.
fun Modifier.bordaTracejada(cor: Color, raio: Dp = 18.dp) = this.drawWithContent {
    drawContent()
    val stroke = Stroke(width = 1.6.dp.toPx(), pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(10f, 8f)))
    drawRoundRect(cor, style = stroke, cornerRadius = androidx.compose.ui.geometry.CornerRadius(raio.toPx()))
}

@Composable
fun Avatar(nome: String, usuarioId: Int, foto: String?, token: String?, tamanho: Int = 40) {
    val mod = Modifier.size(tamanho.dp).clip(CircleShape)
    if (foto != null && token != null) {
        val ctx = LocalContext.current
        val req = ImageRequest.Builder(ctx)
            .data("$BASE_URL/api/mobile/avatar/$usuarioId?v=${foto.take(12)}")
            .addHeader("Authorization", "Bearer $token")
            .crossfade(true)
            .build()
        AsyncImage(model = req, contentDescription = nome, modifier = mod, contentScale = ContentScale.Crop)
    } else {
        val iniciais = nome.trim().split(" ").filter { it.isNotEmpty() }.take(2)
            .joinToString("") { it.first().uppercase() }.ifEmpty { "?" }
        var h = 0
        for (c in nome) h = (h * 31 + c.code)
        val cor = cores[((h % cores.size) + cores.size) % cores.size]
        Box(mod.background(cor), contentAlignment = Alignment.Center) {
            Text(iniciais, color = Color.White, fontWeight = FontWeight.Bold, fontSize = (tamanho * 0.38).sp)
        }
    }
}

@Composable
fun TagPapel(papel: String) {
    val (cor, texto) = when (papel) {
        "admin" -> FiapMagenta to "ADMIN"
        "professor" -> Color(0xFF8B5CF6) to "PROFESSOR"
        else -> Color(0xFF0EA5E9) to "ALUNO"
    }
    Box(
        Modifier
            .padding(end = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(cor.copy(alpha = 0.15f))
            .padding(horizontal = 6.dp, vertical = 1.dp),
    ) {
        Text(texto, color = cor, fontSize = 9.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun Tags(papeis: List<String>, mudo: Boolean = false) {
    val ordem = listOf("admin", "professor", "aluno")
    Row {
        papeis.distinct().filter { !mudo || it != "aluno" }.sortedBy { ordem.indexOf(it) }.forEach { TagPapel(it) }
    }
}

fun corDoModulo() = FiapMagenta

// Clique sem o efeito ripple (usado no título/switcher da top bar).
fun Modifier.clickableSemRipple(onClick: () -> Unit): Modifier =
    this.clickable(interactionSource = MutableInteractionSource(), indication = null, onClick = onClick)

// Anel de progresso animado com gradiente FIAP e % no centro.
@Composable
fun AnelProgresso(pct: Float, tamanho: Dp = 96.dp, stroke: Dp = 9.dp) {
    val alvo = pct.coerceIn(0f, 1f)
    val anim by androidx.compose.animation.core.animateFloatAsState(
        targetValue = alvo,
        animationSpec = tween(900, easing = androidx.compose.animation.core.FastOutSlowInEasing),
        label = "anel",
    )
    Box(Modifier.size(tamanho), contentAlignment = Alignment.Center) {
        val trilho = Color(0x22808080)
        val grad = Brush.sweepGradient(listOf(FiapMagenta, FiapRosa, FiapMagenta))
        Canvas(Modifier.size(tamanho)) {
            val w = stroke.toPx()
            Stroke(w, cap = StrokeCap.Round).let { st ->
                drawArc(trilho, 0f, 360f, false, style = st)
                drawArc(grad, -90f, 360f * anim, false, style = st)
            }
        }
        Text("${(anim * 100).toInt()}%", fontWeight = FontWeight.Bold, fontSize = (tamanho.value * 0.19).sp)
    }
}

// ---- Skeletons (shimmer) --------------------------------------------------

@Composable
fun ShimmerBox(modifier: Modifier, shape: Shape = RoundedCornerShape(8.dp)) {
    val tr = rememberInfiniteTransition(label = "shimmer")
    val p by tr.animateFloat(
        0f, 1f,
        infiniteRepeatable(tween(1200, easing = LinearEasing), RepeatMode.Restart),
        label = "p",
    )
    val escuro = tech.pervian.fiapestudante.LocalTemaEscuro.current
    val c0 = if (escuro) Color(0xFF20232B) else Color(0xFFE9EAEE)
    val c1 = if (escuro) Color(0xFF2E323C) else Color(0xFFF6F7F9)
    val brush = Brush.linearGradient(
        colors = listOf(c0, c1, c0),
        start = Offset(-260f + p * 680f, 0f),
        end = Offset(p * 680f, 0f),
    )
    Box(modifier.clip(shape).background(brush))
}

// Lista de placeholders enquanto carrega (no lugar do spinner).
@Composable
fun CarregandoLista(linhas: Int = 7) {
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        repeat(linhas) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                ShimmerBox(Modifier.size(42.dp), CircleShape)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    ShimmerBox(Modifier.fillMaxWidth(0.55f).height(14.dp))
                    Spacer(Modifier.height(8.dp))
                    ShimmerBox(Modifier.fillMaxWidth(0.85f).height(10.dp))
                }
            }
        }
    }
}

// ---- Conquistas (badges) --------------------------------------------------

data class Conquista(val emoji: String, val titulo: String, val desbloqueada: Boolean)

@Composable
fun BadgeConquista(c: Conquista) {
    val a = if (c.desbloqueada) 1f else 0.4f
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(78.dp)) {
        Box(
            Modifier.size(56.dp).clip(CircleShape)
                .background(if (c.desbloqueada) FiapMagenta.copy(alpha = 0.14f) else Color.Gray.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) { Text(c.emoji, fontSize = 26.sp, modifier = Modifier.alpha(a)) }
        Spacer(Modifier.height(5.dp))
        Text(
            c.titulo, fontSize = 10.sp, lineHeight = 12.sp, textAlign = TextAlign.Center, maxLines = 2,
            color = if (c.desbloqueada) MaterialTheme.colorScheme.onSurface else Color.Gray,
        )
    }
}
