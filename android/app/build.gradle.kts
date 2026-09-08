plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.google.gms.google-services")
}

// Assinatura do app. A chave vive em android/keystore/ (fora do git), com backup em
// pervian:/opt/fiap-hub/secrets/app-signing.jks. Sem ela o Gradle assinaria com a
// ~/.android/debug.keystore da maquina, que e diferente em cada maquina: o Android entao
// recusa a atualizacao de quem ja tem o app e so diz "app nao instalado".
val keystoreDoApp = rootProject.file("keystore/app-signing.jks")

android {
    namespace = "tech.pervian.fiapestudante"
    compileSdk = 36

    defaultConfig {
        applicationId = "tech.pervian.fiapestudante"
        minSdk = 24
        targetSdk = 36
        versionCode = 13
        versionName = "1.10"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    testOptions { unitTests { isIncludeAndroidResources = true } }

    signingConfigs {
        create("app") {
            if (!keystoreDoApp.exists()) throw GradleException(
                "keystore ausente: android/keystore/app-signing.jks - recupere com: " +
                "scp pervian:/opt/fiap-hub/secrets/app-signing.jks android/keystore/app-signing.jks"
            )
            storeFile = keystoreDoApp
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("app")
        }
        release {
            signingConfig = signingConfigs.getByName("app")
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")

    val composeBom = platform("androidx.compose:compose-bom:2025.06.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.8.5")

    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:okhttp-sse:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("io.coil-kt:coil-compose:2.7.0")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.16")
    testImplementation(composeBom)
    testImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")

    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-messaging")
}
