package tech.pervian.fiapestudante

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.Atualizacao
import tech.pervian.fiapestudante.data.Push
import tech.pervian.fiapestudante.data.Sessao
import tech.pervian.fiapestudante.data.VersaoApp
import tech.pervian.fiapestudante.ui.*

val LocalTemaEscuro = compositionLocalOf { false }
const val CANAL_NOTIF = "novidades"

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        criarCanalNotificacao()
        val sessao = Sessao(applicationContext)
        val api = Api(sessao)

        setContent {
            var tema by remember { mutableStateOf(sessao.tema) }
            val escuro = when (tema) {
                "escuro" -> true
                "claro" -> false
                else -> isSystemInDarkTheme()
            }

            // Pede permissão de notificação (Android 13+) uma vez.
            val pedirPermissao = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
            LaunchedEffect(Unit) {
                if (Build.VERSION.SDK_INT >= 33 &&
                    ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                ) pedirPermissao.launch(Manifest.permission.POST_NOTIFICATIONS)
            }

            val esquema = if (escuro) darkColorScheme(
                primary = FiapMagenta,
                background = Color(0xFF0E0F10),
                surface = Color(0xFF15171E),
                surfaceVariant = Color(0xFF20232C),
                onBackground = Color(0xFFECEEF4),
                onSurface = Color(0xFFECEEF4),
                onSurfaceVariant = Color(0xFFB6BAC6),
            ) else lightColorScheme(
                primary = FiapMagenta,
                background = Color(0xFFF2F0EE),
                surface = Color(0xFFFFFFFF),
                surfaceVariant = Color(0xFFEEF0F4),
            )
            MaterialTheme(colorScheme = esquema) {
                CompositionLocalProvider(LocalTemaEscuro provides escuro) {
                    if (tema == null) {
                        DialogTema { escolhido -> sessao.tema = escolhido; tema = escolhido }
                    }
                    var logado by remember { mutableStateOf(sessao.logado) }
                    var disciplina by remember { mutableStateOf(sessao.disciplina) }
                    when {
                        !logado -> LoginScreen(api, sessao) { logado = true; disciplina = sessao.disciplina }
                        disciplina == null -> DisciplinaScreen(api, sessao) { d ->
                            sessao.disciplina = d.slug; sessao.disciplinaCurto = d.curto; disciplina = d.slug
                        }
                        else -> AppPrincipal(
                            api = api, sessao = sessao,
                            disc = disciplina!!,
                            tema = tema ?: "sistema",
                            onTema = { sessao.tema = it; tema = it },
                            onTrocarDisciplina = { sessao.disciplina = null; disciplina = null },
                            aoSair = { sessao.limpar(); logado = false; disciplina = null },
                        )
                    }
                }
            }
        }
    }

    private fun criarCanalNotificacao() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val canal = NotificationChannel(CANAL_NOTIF, "Novidades", NotificationManager.IMPORTANCE_DEFAULT)
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(canal)
        }
    }
}

private data class Aba(val rota: String, val rotulo: String, val icone: ImageVector)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppPrincipal(api: Api, sessao: Sessao, disc: String, tema: String, onTema: (String) -> Unit, onTrocarDisciplina: () -> Unit, aoSair: () -> Unit) {
    val nav = rememberNavController()
    val ctx = LocalContext.current
    val haptic = LocalHapticFeedback.current
    val abas = listOf(
        Aba("painel", "Painel", Icons.Filled.Dashboard),
        Aba("aulas", "Aulas", Icons.AutoMirrored.Filled.MenuBook),
        Aba("anotacoes", "Notas", Icons.Filled.Edit),
        Aba("materiais", "Materiais", Icons.Filled.Description),
        Aba("grupos", "Grupos", Icons.Filled.Lock),
    )

    LaunchedEffect(Unit) { Push.registrar(ctx) }
    LaunchedEffect(Unit) { while (isActive) { api.heartbeat(); delay(45_000) } }

    // Auto-update.
    var novaVersao by remember { mutableStateOf<VersaoApp?>(null) }
    var ignorada by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        val v = Atualizacao.checar()
        if (v != null && v.versionCode > BuildConfig.VERSION_CODE) novaVersao = v
    }
    novaVersao?.let { v ->
        if (!ignorada || v.obrigatorio) SheetAtualizacao(
            versao = v,
            onAtualizar = { Atualizacao.baixarEInstalar(ctx, v.apkUrl) },
            onDepois = if (v.obrigatorio) null else { { ignorada = true } },
        )
    }

    // Notificações não lidas: badge no sino + push local quando aumenta.
    var naoLidas by remember { mutableStateOf(0) }
    LaunchedEffect(Unit) {
        var anterior = -1
        while (isActive) {
            val r = runCatching { api.notificacoes() }.getOrNull()
            if (r != null) {
                naoLidas = r.naoLidas
                if (anterior >= 0 && r.naoLidas > anterior && r.notificacoes.isNotEmpty()) {
                    notificarLocal(ctx, r.notificacoes.first().titulo, r.notificacoes.first().texto)
                }
                anterior = r.naoLidas
            }
            delay(60_000)
        }
    }

    val atual = nav.currentBackStackEntryAsState().value?.destination?.route?.substringBefore("/")

    Scaffold(
        topBar = {
            CabecalhoApp(
                tituloTela = abas.find { it.rota == atual }?.rotulo ?: (sessao.disciplinaCurto ?: "FIAP Estudante"),
                subDisciplina = sessao.disciplinaCurto ?: "",
                naoLidas = naoLidas,
                onLogo = { nav.navigate("perfil") },
                onTurma = { nav.navigate("turma") },
                onNotif = { nav.navigate("notif") },
                onTrocarDisciplina = onTrocarDisciplina,
            )
        },
        bottomBar = {
            BarraAbas(abas, atual) { rota ->
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                nav.navigate(rota) { popUpTo("painel"); launchSingleTop = true }
            }
        },
    ) { pad ->
        NavHost(
            nav, startDestination = "painel", modifier = Modifier.padding(pad),
            enterTransition = { androidx.compose.animation.fadeIn(androidx.compose.animation.core.tween(220)) + androidx.compose.animation.slideInVertically(androidx.compose.animation.core.tween(220)) { it / 14 } },
            exitTransition = { androidx.compose.animation.fadeOut(androidx.compose.animation.core.tween(160)) },
            popEnterTransition = { androidx.compose.animation.fadeIn(androidx.compose.animation.core.tween(220)) },
            popExitTransition = { androidx.compose.animation.fadeOut(androidx.compose.animation.core.tween(160)) },
        ) {
            composable("painel") {
                PainelScreen(api, sessao, disc, onAbrirAula = { nav.navigate("aula/$it") }, onIrAulas = { nav.navigate("aulas") { popUpTo("painel") } })
            }
            composable("aulas") { AulasScreen(api, sessao, disc, onAbrirAula = { nav.navigate("aula/$it") }) }
            composable("aula/{slug}") {
                AulaScreen(api, sessao, it.arguments?.getString("slug") ?: "", onVoltar = { nav.popBackStack() }, onAula = { s -> nav.navigate("aula/$s") })
            }
            composable("anotacoes") { AnotacoesScreen(api, sessao, disc) }
            composable("materiais") { MateriaisScreen(api, sessao, disc) }
            composable("chat") { ChatScreen(api, sessao, disc = disc, canalInicial = "$disc:geral", onAbrirPerfil = { nav.navigate("u/$it") }) }
            composable("grupo/{id}") {
                val gid = it.arguments?.getString("id") ?: ""
                ChatScreen(api, sessao, disc = disc, canalInicial = "g:$gid", onAbrirPerfil = { u -> nav.navigate("u/$u") })
            }
            composable("grupos") { GruposScreen(api, sessao, onAbrirGrupo = { nav.navigate("grupo/$it") }) }
            composable("turma") { TurmaScreen(api, sessao, onAbrirPerfil = { nav.navigate("u/$it") }) }
            composable("u/{id}") {
                PerfilPublicoScreen(api, sessao, it.arguments?.getString("id")?.toIntOrNull() ?: 0, onVoltar = { nav.popBackStack() })
            }
            composable("perfil") { PerfilScreen(api, sessao, onConfig = { nav.navigate("config") }) }
            composable("config") {
                ConfiguracoesScreen(temaAtual = tema, onTema = onTema, versaoApp = BuildConfig.VERSION_NAME, onSair = aoSair, onVoltar = { nav.popBackStack() })
            }
            composable("notif") {
                NotificacoesScreen(
                    api, sessao,
                    onVoltar = { nav.popBackStack() },
                    onAbrirGrupo = { nav.navigate("grupo/$it") },
                    onAbrirAula = { nav.navigate("aula/$it") },
                    onLidas = { naoLidas = 0 },
                )
            }
        }
    }
}

// Header em vidro: logo "F" (-> perfil), título da tela / disciplina (-> trocar disciplina), turma e notificações.
@Composable
private fun CabecalhoApp(
    tituloTela: String, subDisciplina: String, naoLidas: Int,
    onLogo: () -> Unit, onTurma: () -> Unit, onNotif: () -> Unit, onTrocarDisciplina: () -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().background(corPainel())
            .windowInsetsPadding(WindowInsets.statusBars)
            .padding(start = 18.dp, end = 18.dp, top = 6.dp, bottom = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier.size(38.dp).clip(RoundedCornerShape(11.dp))
                .background(androidx.compose.ui.graphics.Brush.linearGradient(FiapGradiente))
                .clickableSemRipple(onLogo),
            contentAlignment = Alignment.Center,
        ) { Text("F", color = Color.White, fontWeight = androidx.compose.ui.text.font.FontWeight.ExtraBold, fontSize = 16.sp) }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f).clickableSemRipple(onTrocarDisciplina)) {
            Text(tituloTela, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold, fontSize = 15.sp)
            Text(
                if (subDisciplina.isNotEmpty()) "$subDisciplina · Turma FIAP" else "Turma FIAP",
                fontSize = 11.sp, color = corMuted(),
            )
        }
        Spacer(Modifier.width(8.dp))
        BotaoIb(onClick = onTurma) { Icon(Icons.Filled.Groups, "Turma", modifier = Modifier.size(18.dp)) }
        Spacer(Modifier.width(8.dp))
        BotaoIb(onClick = onNotif) {
            BadgedBox(badge = { if (naoLidas > 0) Badge { Text("$naoLidas") } }) {
                Icon(Icons.Filled.Notifications, "Notificações", modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun BotaoIb(onClick: () -> Unit, content: @Composable () -> Unit) {
    Box(
        Modifier.size(38.dp).clip(RoundedCornerShape(12.dp)).background(corPainel())
            .border(BorderStroke(1.dp, corBorda()), RoundedCornerShape(12.dp))
            .clickableSemRipple(onClick),
        contentAlignment = Alignment.Center,
    ) { content() }
}

// Tab bar em vidro: ícone + rótulo empilhados, ativo em magenta, sem indicador de fundo.
@Composable
private fun BarraAbas(abas: List<Aba>, atual: String?, onSelect: (String) -> Unit) {
    Row(
        Modifier.fillMaxWidth().background(corPainel())
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(vertical = 10.dp, horizontal = 6.dp),
        horizontalArrangement = Arrangement.SpaceAround,
    ) {
        abas.forEach { aba ->
            val on = atual == aba.rota
            Column(
                Modifier.width(64.dp).clickableSemRipple { onSelect(aba.rota) },
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(aba.icone, aba.rotulo, tint = if (on) FiapMagenta else corMuted(), modifier = Modifier.size(23.dp))
                Spacer(Modifier.height(4.dp))
                Text(
                    aba.rotulo, fontSize = 10.sp,
                    fontWeight = if (on) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Medium,
                    color = if (on) FiapMagenta else corMuted(),
                )
            }
        }
    }
}

private fun notificarLocal(ctx: Context, titulo: String, texto: String) {
    if (Build.VERSION.SDK_INT >= 33 &&
        ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return
    val n = NotificationCompat.Builder(ctx, CANAL_NOTIF)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(titulo)
        .setContentText(texto)
        .setAutoCancel(true)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .build()
    runCatching { NotificationManagerCompat.from(ctx).notify(System.identityHashCode(titulo), n) }
}
