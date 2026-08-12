package tech.pervian.fiapestudante.data

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns

data class ArquivoEscolhido(val nome: String, val mime: String, val bytes: ByteArray)

// Lê o conteúdo de um Uri (do seletor de arquivos) em memória.
fun lerUri(ctx: Context, uri: Uri): ArquivoEscolhido? {
    val cr = ctx.contentResolver
    val mime = cr.getType(uri) ?: "application/octet-stream"
    var nome = "arquivo"
    runCatching {
        cr.query(uri, null, null, null, null)?.use { c ->
            val i = c.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (i >= 0 && c.moveToFirst()) nome = c.getString(i)
        }
    }
    val bytes = runCatching { cr.openInputStream(uri)?.use { it.readBytes() } }.getOrNull() ?: return null
    return ArquivoEscolhido(nome, mime, bytes)
}
