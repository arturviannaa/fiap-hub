package tech.pervian.fiapestudante.ui

import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

// Parse de ISO sem java.time (minSdk 24). Trunca a fração de segundo e assume UTC.
private fun epochDe(iso: String): Long {
    return try {
        val limpo = iso.substringBefore('.').substringBefore('Z').replace("T", " ")
        val fmt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
        fmt.timeZone = TimeZone.getTimeZone("UTC")
        fmt.parse(limpo)?.time ?: 0L
    } catch (_: Exception) {
        0L
    }
}

fun online(iso: String): Boolean = System.currentTimeMillis() - epochDe(iso) < 90_000

fun quando(iso: String): String {
    val seg = (System.currentTimeMillis() - epochDe(iso)) / 1000
    return when {
        seg < 60 -> "agora"
        seg < 3600 -> "${seg / 60} min"
        seg < 86400 -> "${seg / 3600} h"
        else -> "${seg / 86400} d"
    }
}
