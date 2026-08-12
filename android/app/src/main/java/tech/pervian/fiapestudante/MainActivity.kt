package tech.pervian.fiapestudante

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.Atualizacao
import tech.pervian.fiapestudante.data.Sessao
import tech.pervian.fiapestudante.data.VersaoApp
import tech.pervian.fiapestudante.ui.*

// Tema efetivo (claro/escuro) disponível para telas que precisam dele fora do
// MaterialTheme — como o WebView da aula.
val LocalTemaEscuro = compositionLocalOf { false }

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val sessao = Sessao(applicationContext)
        val api = Api(sessao)

        setContent {
            var tema by remember { mutableStateOf(sessao.tema) }
            val escuro = when (tema) {
                "escuro" -> true
                "claro" -> false
                else -> isSystemInDarkTheme()
            }

            MaterialTheme(
                colorScheme = if (escuro) darkColorScheme(primary = FiapMagenta) else lightColorScheme(primary = FiapMagenta),
            ) {
                CompositionLocalProvider(LocalTemaEscuro provides escuro) {
                    // Primeira abertura: popup nativo para escolher o tema.
                    if (tema == null) {
                        DialogTema { escolhido ->
                            sessao.tema = escolhido
                            tema = escolhido
                        }
                    }

                    var logado by remember { mutableStateOf(sessao.logado) }
                    if (!logado) {
                        LoginScreen(api, sessao) { logado = true }
                    } else {
                        AppPrincipal(
                            api = api,
                            sessao = sessao,
                            tema = tema ?: "sistema",
                            onTema = { sessao.tema = it; tema = it },
                            aoSair = { sessao.limpar(); logado = false },
                        )
                    }
                }
            }
        }
    }
}

private data class Aba(val rota: String, val rotulo: String, val icone: ImageVector)

@Composable
fun AppPrincipal(api: Api, sessao: Sessao, tema: String, onTema: (String) -> Unit, aoSair: () -> Unit) {
    val nav = rememberNavController()
    val ctx = LocalContext.current
    val abas = listOf(
        Aba("aulas", "Aulas", Icons.AutoMirrored.Filled.MenuBook),
        Aba("chat", "Chat", Icons.Filled.Chat),
        Aba("turma", "Turma", Icons.Filled.Groups),
        Aba("perfil", "Perfil", Icons.Filled.Person),
    )

    // Heartbeat de presença enquanto o app está aberto.
    LaunchedEffect(Unit) {
        while (isActive) { api.heartbeat(); delay(45_000) }
    }

    // Checa atualização ao abrir (auto-update de app sideloaded).
    var novaVersao by remember { mutableStateOf<VersaoApp?>(null) }
    var ignorada by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        val v = Atualizacao.checar()
        if (v != null && v.versionCode > BuildConfig.VERSION_CODE) novaVersao = v
    }
    novaVersao?.let { v ->
        if (!ignorada || v.obrigatorio) {
            SheetAtualizacao(
                versao = v,
                onAtualizar = { Atualizacao.baixarEInstalar(ctx, v.apkUrl) },
                onDepois = if (v.obrigatorio) null else { { ignorada = true } },
            )
        }
    }

    Scaffold(
        bottomBar = {
            val atual = nav.currentBackStackEntryAsState().value?.destination?.route?.substringBefore("/")
            NavigationBar {
                abas.forEach { aba ->
                    NavigationBarItem(
                        selected = atual == aba.rota,
                        onClick = { nav.navigate(aba.rota) { popUpTo("aulas"); launchSingleTop = true } },
                        icon = { Icon(aba.icone, aba.rotulo) },
                        label = { Text(aba.rotulo) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = FiapMagenta,
                            selectedTextColor = FiapMagenta,
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
            composable("chat") { ChatScreen(api, sessao) }
            composable("turma") { TurmaScreen(api, sessao) }
            composable("perfil") { PerfilScreen(api, sessao, onConfig = { nav.navigate("config") }) }
            composable("config") {
                ConfiguracoesScreen(
                    temaAtual = tema,
                    onTema = onTema,
                    versaoApp = BuildConfig.VERSION_NAME,
                    onSair = aoSair,
                    onVoltar = { nav.popBackStack() },
                )
            }
        }
    }
}
