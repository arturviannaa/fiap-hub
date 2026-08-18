package tech.pervian.fiapestudante

import android.content.Context
import android.os.Looper
import androidx.test.core.app.ApplicationProvider
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

// Fumaca de abertura. Existe porque a v1.9 saiu de um merge que ninguem tinha
// rodado: compila != abre. Roda offline (a API falha e cai no estado de erro),
// e com FIAP_TOKEN no ambiente exercita tambem o caminho com dados reais.
// Abre o app de verdade na JVM (sem emulador e sem a regra do Compose, pra o
// dispatcher ser o AndroidUiDispatcher real igual no aparelho): sessao logada ->
// AppPrincipal -> PainelScreen com dados reais da API. Crash de abertura estoura aqui.
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class AberturaTest {

    @Test
    fun abreOAppComoNoAparelho() {
        val ctx = ApplicationProvider.getApplicationContext<Context>()
        ctx.getSharedPreferences("fiap", Context.MODE_PRIVATE).edit()
            .putString("token", System.getenv("FIAP_TOKEN") ?: "sem-rede")
            .putString("usuario", """{"id":3,"nome":"Artur Vianna","email":"a@b.c","papeis":["aluno","admin"]}""")
            .putString("disciplina", "python")
            .putString("disciplinaCurto", "Python")
            .putString("tema", "escuro")
            .commit()

        Robolectric.buildActivity(MainActivity::class.java).setup()

        val main = shadowOf(Looper.getMainLooper())
        repeat(50) {
            main.idle()
            Thread.sleep(200)
            main.idle()
        }
        println("=== abriu sem crash ===")
    }
}
