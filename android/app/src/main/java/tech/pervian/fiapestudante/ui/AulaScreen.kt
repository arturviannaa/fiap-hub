package tech.pervian.fiapestudante.ui

import android.annotation.SuppressLint
import android.webkit.WebView
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import kotlinx.coroutines.launch
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.AulaDetalhe
import tech.pervian.fiapestudante.data.BASE_URL
import tech.pervian.fiapestudante.data.Bloco
import tech.pervian.fiapestudante.data.Sessao

private fun esc(s: String) = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

// Monta um HTML só com os blocos da aula (o HTML já vem pronto do servidor:
// markdown formatado e código com realce). Vira o conteúdo do WebView.
private fun montarHtml(blocos: List<Bloco>, escuro: Boolean): String {
    val sb = StringBuilder()
    for (b in blocos) {
        if (b.tipo == "md") {
            sb.append("<div class=md>").append(b.html ?: "").append("</div>")
        } else {
            sb.append("<pre class=code>").append(b.html ?: esc(b.codigo ?: "")).append("</pre>")
            for (s in b.saidas) when (s.tipo) {
                "imagem" -> sb.append("<img src='$BASE_URL${s.src}'>")
                "html" -> sb.append("<div class=out>").append(s.html ?: "").append("</div>")
                "erro" -> sb.append("<pre class=err>").append(esc(s.texto ?: "")).append("</pre>")
                else -> sb.append("<pre class=out>").append(esc(s.texto ?: "")).append("</pre>")
            }
        }
    }
    val fg = if (escuro) "#eceef4" else "#14151a"
    val bg = if (escuro) "#0c0d11" else "#ffffff"
    val panel = if (escuro) "#1a1d25" else "#f2f3f6"
    val codebg = if (escuro) "#0e1015" else "#1b1d24"
    return """
    <!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1">
    <style>
    body{margin:0;padding:16px;background:$bg;color:$fg;font-family:-apple-system,Roboto,sans-serif;line-height:1.7;font-size:15px}
    .md h1,.md h2,.md h3{font-weight:650;line-height:1.25;margin:1.4em 0 .4em} .md h1{font-size:1.5em}.md h2{font-size:1.3em}.md h3{font-size:1.1em}
    .md p{margin:.6em 0} .md ul,.md ol{padding-left:1.3em} .md li{margin:.3em 0} .md li::marker{color:#ed145b}
    .md code{background:$panel;border-radius:4px;padding:.1em .35em;font-family:monospace;font-size:.85em}
    .md a{color:#ed145b} .md strong{font-weight:650} .md img{max-width:100%;border-radius:8px}
    .md blockquote{border-left:3px solid #ed145b;margin:.6em 0;padding:.2em 0 .2em 1em;color:#888}
    .md table{border-collapse:collapse;width:100%;display:block;overflow-x:auto;font-size:.85em} .md th,.md td{border:1px solid $panel;padding:.4em .6em}
    pre.code{background:$codebg;color:#e6e8f0;padding:14px;border-radius:10px;overflow-x:auto;font-size:13px;font-family:monospace}
    .out{background:$panel;border-radius:8px;padding:10px;overflow-x:auto;font-family:monospace;font-size:12.5px;white-space:pre-wrap;margin:6px 0}
    .out table{border-collapse:collapse;font-size:11px} .out th,.out td{border:1px solid #666;padding:2px 6px;white-space:nowrap}
    pre.err{background:#3a0d17;color:#fb7185;border-radius:8px;padding:10px;font-family:monospace;font-size:12.5px;white-space:pre-wrap}
    img{max-width:100%;border-radius:8px;margin:6px 0}
    .hljs-comment{color:#7b8397;font-style:italic}.hljs-keyword,.hljs-literal{color:#ff7ab2}.hljs-string{color:#a7e08a}
    .hljs-number{color:#f7c86a}.hljs-title,.hljs-title.function_{color:#7fd4ff}.hljs-built_in,.hljs-attr{color:#c9a6ff}.hljs-params{color:#d8dcea}
    </style></head><body>${sb}</body></html>
    """.trimIndent()
}

@OptIn(ExperimentalMaterial3Api::class)
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun AulaScreen(api: Api, sessao: Sessao, slug: String, onVoltar: () -> Unit, onAula: (String) -> Unit) {
    var aula by remember(slug) { mutableStateOf<AulaDetalhe?>(null) }
    var concluida by remember(slug) { mutableStateOf(false) }
    val escuro = tech.pervian.fiapestudante.LocalTemaEscuro.current
    val escopo = rememberCoroutineScope()

    LaunchedEffect(slug) {
        try {
            val a = api.aula(slug)
            aula = a
            concluida = a.concluida
        } catch (_: Exception) {}
    }

    val a = aula
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text(a?.titulo ?: "Aula", maxLines = 1, fontSize = 16.sp) },
            navigationIcon = {
                IconButton(onClick = onVoltar) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") }
            },
            colors = TopAppBarDefaults.topAppBarColors(),
        )
        if (a == null) { Carregando(); return }

        Column(Modifier.weight(1f)) {
            AndroidView(
                factory = { ctx ->
                    WebView(ctx).apply {
                        settings.javaScriptEnabled = false
                        settings.builtInZoomControls = false
                    }
                },
                update = { it.loadDataWithBaseURL(BASE_URL, montarHtml(a.blocos, escuro), "text/html", "utf-8", null) },
                modifier = Modifier.fillMaxSize(),
            )
        }

        Surface(shadowElevation = 8.dp) {
            Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                Button(
                    onClick = {
                        val novo = !concluida
                        concluida = novo
                        escopo.launch { runCatching { api.marcarAula(slug, novo) } }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (concluida) Color(0xFF10B981) else FiapMagenta,
                    ),
                ) {
                    Icon(Icons.Filled.Check, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(if (concluida) "Concluída" else "Marcar concluída")
                }
                Spacer(Modifier.weight(1f))
                a.anterior?.let { TextButton(onClick = { onAula(it.slug) }) { Text("‹ Anterior") } }
                a.proxima?.let { TextButton(onClick = { onAula(it.slug) }) { Text("Próxima ›") } }
            }
        }
    }
}
