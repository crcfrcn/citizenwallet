import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("dev.flutter.flutter-gradle-plugin")
}

// 签名只声明官方Gradle配置；材料路径由当前获准流程交付。
val signingFile = System.getenv("ANDROID_KEY_PROPERTIES")?.let { file(it) }
val signingProperties = Properties().apply {
    signingFile?.inputStream()?.use { load(it) }
}
android {
    // AGP9只为选定构建类型创建单测组件；保持既有Release测试入口。
    testBuildType = "release"
    namespace = "com.crcfrcn.citizenwallet"
    compileSdk = 36
    ndkVersion = "28.2.13676358"
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    defaultConfig {
        applicationId = "com.crcfrcn.citizenwallet"
        minSdk = 24
        targetSdk = 36
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        ndk { abiFilters.add("arm64-v8a") }
    }
    sourceSets.getByName("main").jniLibs.srcDirs(
        System.getenv("CITIZENWALLET_NATIVE_ANDROID_DIR") ?: "src/main/jniLibs"
    )
    signingConfigs {
        if (signingFile != null) {
            create("release") {
                storeFile = file(signingProperties.getProperty("storeFile"))
                storePassword = signingProperties.getProperty("storePassword")
                keyAlias = signingProperties.getProperty("keyAlias")
                keyPassword = signingProperties.getProperty("keyPassword")
            }
        }
    }
    buildTypes {
        release {
            // 本机无签名编译不冒充正式包；自动化缺材料由产品入口明确拒绝。
            signingConfig = if (signingFile != null) signingConfigs.getByName("release") else null
        }
    }
    packaging { jniLibs.excludes.addAll(listOf("lib/armeabi*/**", "lib/x86/**", "lib/x86_64/**")) }
}
kotlin { compilerOptions { jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17 } }
flutter { source = "../.." }
dependencies {
    implementation("androidx.biometric:biometric:1.1.0")
    implementation("androidx.core:core:1.13.1")
    testImplementation("junit:junit:4.13.2")
}
