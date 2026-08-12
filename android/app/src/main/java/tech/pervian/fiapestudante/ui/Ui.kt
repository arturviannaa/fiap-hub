package tech.pervian.fiapestudante.ui

import androidx.compose.runtime.getValue
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import tech.pervian.fiapestudante.data.BASE_URL

val FiapMagenta = Color(0xFFED145B)

private val cores = listOf(
    0xFFED145B, 0xFF7C5CFF, 0xFF0EA5E9, 0xFF10B981, 0xFFF59E0B, 0xFFEF4444, 0xFF8B5CF6, 0xFF14B8A6,
).map { Color(it) }

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
@androidx.compose.runtime.Composable
fun AnelProgresso(pct: Float, tamanho: androidx.compose.ui.unit.Dp = 96.dp, stroke: androidx.compose.ui.unit.Dp = 9.dp) {
    val alvo = pct.coerceIn(0f, 1f)
    val anim by androidx.compose.animation.core.animateFloatAsState(
        targetValue = alvo,
        animationSpec = androidx.compose.animation.core.tween(900, easing = androidx.compose.animation.core.FastOutSlowInEasing),
        label = "anel",
    )
    androidx.compose.foundation.layout.Box(
        androidx.compose.ui.Modifier.size(tamanho),
        contentAlignment = androidx.compose.ui.Alignment.Center,
    ) {
        val trilho = Color(0x22808080)
        val grad = androidx.compose.ui.graphics.Brush.sweepGradient(listOf(FiapMagenta, Color(0xFFFB7099), FiapMagenta))
        androidx.compose.foundation.Canvas(androidx.compose.ui.Modifier.size(tamanho)) {
            val w = stroke.toPx()
            androidx.compose.ui.graphics.drawscope.Stroke(w, cap = androidx.compose.ui.graphics.StrokeCap.Round).let { st ->
                drawArc(trilho, 0f, 360f, false, style = st)
                drawArc(grad, -90f, 360f * anim, false, style = st)
            }
        }
        Text("${(anim * 100).toInt()}%", fontWeight = FontWeight.Bold, fontSize = (tamanho.value * 0.19).sp)
    }
}
