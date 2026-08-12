package tech.pervian.fiapestudante.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.RocketLaunch
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import tech.pervian.fiapestudante.data.VersaoApp

@Composable
fun SheetAtualizacao(versao: VersaoApp, onAtualizar: () -> Unit, onDepois: (() -> Unit)?) {
    Dialog(
        onDismissRequest = { onDepois?.invoke() },
        properties = DialogProperties(dismissOnBackPress = onDepois != null, dismissOnClickOutside = onDepois != null),
    ) {
        Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surface) {
            Column {
                // topo com gradiente magenta e foguete
                Box(
                    Modifier
                        .fillMaxWidth()
                        .background(Brush.linearGradient(listOf(Color(0xFFED145B), Color(0xFFFB7099))))
                        .padding(vertical = 28.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            Modifier.size(64.dp).clip(RoundedCornerShape(18.dp)).background(Color.White.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center,
                        ) { Icon(Icons.Filled.RocketLaunch, null, tint = Color.White, modifier = Modifier.size(34.dp)) }
                        Spacer(Modifier.height(12.dp))
                        Text("Nova versão disponível", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("FIAP Estudante ${versao.versionName}", color = Color.White.copy(alpha = 0.85f), fontSize = 13.sp)
                    }
                }

                Column(Modifier.padding(20.dp)) {
                    if (versao.novidades.isNotEmpty()) {
                        Text("O que mudou", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        Spacer(Modifier.height(8.dp))
                        versao.novidades.take(6).forEach {
                            Row(Modifier.padding(vertical = 3.dp)) {
                                Text("•  ", color = FiapMagenta, fontWeight = FontWeight.Bold)
                                Text(it, fontSize = 14.sp)
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }

                    Button(
                        onClick = onAtualizar,
                        colors = ButtonDefaults.buttonColors(containerColor = FiapMagenta),
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                    ) { Text("Atualizar agora", fontSize = 16.sp, fontWeight = FontWeight.SemiBold) }

                    if (onDepois != null) {
                        Spacer(Modifier.height(4.dp))
                        TextButton(onClick = onDepois, modifier = Modifier.fillMaxWidth()) {
                            Text("Agora não", color = Color.Gray)
                        }
                    } else {
                        Spacer(Modifier.height(10.dp))
                        Text(
                            "Esta atualização é obrigatória para continuar.",
                            fontSize = 12.sp, color = Color.Gray,
                            modifier = Modifier.align(Alignment.CenterHorizontally),
                        )
                    }
                }
            }
        }
    }
}
