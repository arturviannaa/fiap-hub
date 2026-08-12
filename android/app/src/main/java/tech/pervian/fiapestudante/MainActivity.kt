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
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.filled.EventNote
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
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

            MaterialTheme(
                colorScheme = if (escuro) darkColorScheme(primary = FiapMagenta) else lightColorScheme(primary = FiapMagenta),
            ) {
                CompositionLocalProvider(LocalTemaEscuro provides escuro) {
                    if (tema == null) {
                        DialogTema { escolhido -> sessao.tema = escolhido; tema = escolhido }
                    }
                    var logado by remember { mutableStateOf(sessao.logado) }
                    if (!logado) {
                        LoginScreen(api, sessao) { logado = true }
                    } else {
                        AppPrincipal(
                            api = api, sessao = sessao,
                            tema = tema ?: "sistema",
                            onTema = { sessao.tema = it; tema = it },
                            aoSair = { sessao.limpar(); logado = false },
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
fun AppPrincipal(api: Api, sessao: Sessao, tema: String, onTema: (String) -> Unit, aoSair: () -> Unit) {
    val nav = rememberNavController()
    val ctx = LocalContext.current
    val abas = listOf(
        Aba("aulas", "Aulas", Icons.AutoMirrored.Filled.MenuBook),
        Aba("anotacoes", "Notas", Icons.AutoMirrored.Filled.EventNote),
        Aba("materiais", "Materiais", Icons.Filled.FolderOpen),
        Aba("chat", "Chat", Icons.Filled.Chat),
        Aba("grupos", "Grupos", Icons.Filled.Lock),
    )
    val eu = sessao.usuario

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

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("FIAP Estudante", fontWeight = androidx.compose.ui.text.font.FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { nav.navigate("perfil") }) {
                        Avatar(eu?.nome ?: "", eu?.id ?: 0, eu?.foto, sessao.token, 30)
                    }
                },
                actions = {
                    IconButton(onClick = { nav.navigate("turma") }) { Icon(Icons.Filled.Groups, "Turma") }
                    IconButton(onClick = { nav.navigate("notif") }) {
                        BadgedBox(badge = { if (naoLidas > 0) Badge { Text("$naoLidas") } }) {
                            Icon(Icons.Filled.Notifications, "Notificações")
                        }
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(titleContentColor = FiapMagenta),
            )
        },
        bottomBar = {
            val atual = nav.currentBackStackEntryAsState().value?.destination?.route?.substringBefore("/")
            NavigationBar {
                abas.forEach { aba ->
                    NavigationBarItem(
                        selected = atual == aba.rota,
                        onClick = { nav.navigate(aba.rota) { popUpTo("aulas"); launchSingleTop = true } },
                        icon = { Icon(aba.icone, aba.rotulo) },
                        label = { Text(aba.rotulo, fontSize = androidx.compose.ui.unit.TextUnit.Unspecified) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = FiapMagenta, selectedTextColor = FiapMagenta,
                            indicatorColor = FiapMagenta.copy(alpha = 0.12f),
                        ),
                    )
                }
            }
        },
    ) { pad ->
        NavHost(nav, startDestination = "aulas", modifier = Modifier.padding(pad)) {
            composable("aulas") { AulasScreen(api, sessao, onAbrirAula = { nav.navigate("aula/$it") }) }
            composable("aula/{slug}") {
                AulaScreen(api, sessao, it.arguments?.getString("slug") ?: "", onVoltar = { nav.popBackStack() }, onAula = { s -> nav.navigate("aula/$s") })
            }
            composable("anotacoes") { AnotacoesScreen(api, sessao) }
            composable("materiais") { MateriaisScreen(api, sessao) }
            composable("chat") { ChatScreen(api, sessao, onAbrirPerfil = { nav.navigate("u/$it") }) }
            composable("grupo/{id}") {
                val gid = it.arguments?.getString("id") ?: ""
                ChatScreen(api, sessao, canalInicial = "g:$gid", onAbrirPerfil = { u -> nav.navigate("u/$u") })
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
