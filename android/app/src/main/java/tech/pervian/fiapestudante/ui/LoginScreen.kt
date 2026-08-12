package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import tech.pervian.fiapestudante.data.Api
import tech.pervian.fiapestudante.data.Sessao

@Composable
fun LoginScreen(api: Api, sessao: Sessao, aoEntrar: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var senha by remember { mutableStateOf("") }
    var erro by remember { mutableStateOf<String?>(null) }
    var carregando by remember { mutableStateOf(false) }
    val escopo = rememberCoroutineScope()

    fun entrar() {
        erro = null
        carregando = true
        escopo.launch {
            try {
                val r = api.login(email.trim(), senha)
                if (r.token != null && r.usuario != null) {
                    sessao.salvar(r.token, r.usuario)
                    aoEntrar()
                } else erro = r.erro ?: "Falha no login."
            } catch (e: Exception) {
                erro = e.message ?: "Erro de conexão."
            } finally {
                carregando = false
            }
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(Color(0xFF0C0D11))
            .verticalScroll(rememberScrollState())
            .systemBarsPadding()
            .imePadding()
            .padding(28.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(40.dp))
        Box(
            Modifier.size(72.dp).clip(RoundedCornerShape(20.dp)).background(FiapMagenta),
            contentAlignment = Alignment.Center,
        ) { Text("FIAP", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp) }

        Spacer(Modifier.height(20.dp))
        Text("FIAP Estudante", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Text("Plataforma de estudos da turma", color = Color(0xFF969AA8), fontSize = 13.sp)
        Spacer(Modifier.height(28.dp))

        erro?.let {
            Text(it, color = Color(0xFFFB7185), fontSize = 13.sp, modifier = Modifier.padding(bottom = 12.dp))
        }

        OutlinedTextField(
            value = email, onValueChange = { email = it },
            label = { Text("E-mail institucional") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
            modifier = Modifier.fillMaxWidth().semantics { contentType = ContentType.Username + ContentType.EmailAddress },
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = senha, onValueChange = { senha = it },
            label = { Text("Senha") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
            modifier = Modifier.fillMaxWidth().semantics { contentType = ContentType.Password },
        )
        Spacer(Modifier.height(20.dp))
        Button(
            onClick = { entrar() },
            enabled = !carregando && email.isNotBlank() && senha.isNotBlank(),
            colors = ButtonDefaults.buttonColors(containerColor = FiapMagenta),
            modifier = Modifier.fillMaxWidth().height(50.dp),
        ) {
            if (carregando) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
            else Text("Entrar", fontSize = 16.sp)
        }
        Spacer(Modifier.height(16.dp))
        Text("Use a mesma conta do site fiap.pervian.tech", color = Color(0xFF6B7280), fontSize = 12.sp)
    }
}
