# app-EKG

Cliente móvil para la lectura de electrocardiogramas en papel.

La aplicación fotografía un ECG impreso y lo envía a un backend en Python que
ejecuta dos modelos: digitalización e interpretación. **La app no ejecuta
modelos de IA**: es un cliente delgado.

> **Estado: HU-12 y HU-13 — captura con guía de encuadre.** El flujo va de la
> cámara a una pantalla de revisión local. Confirmar solo registra la ruta del
> archivo en consola: **todavía no hay envío al backend**, ni selección desde
> galería, ni validación de la imagen.

---

## 1. Requisitos previos

### Comunes

| Requisito | Versión usada | Comprobar con    |
| --------- | ------------- | ---------------- |
| Node.js   | 22.14.0       | `node --version` |
| npm       | 10.9.2        | `npm --version`  |
| Git       | 2.47.1        | `git --version`  |

Node debe ser 20 o superior. El proyecto se desarrolló con 22.14.0.

### Para compilar en Android

- **Android Studio** con el SDK de Android instalado.
- **JDK 17.** Es obligatorio: React Native 0.86 no compila con JDK 21 o 24.
  Comprueba que `JAVA_HOME` apunta al 17, no solo que `java -version` responda.
- Un dispositivo Android con **depuración por USB** activada.

### Para compilar en iOS

- **macOS con Xcode.** No es opcional: no existe forma de generar una build
  nativa de iOS desde Windows o Linux.
- Un Apple ID. Con uno gratuito basta para instalar en tu propio dispositivo,
  pero el perfil caduca a los 7 días y hay que reinstalar.

---

## 2. Instalación

```bash
git clone https://github.com/reeenatamc/app-EKG.git
cd app-EKG

# npm ci (no npm install): respeta package-lock.json al pie de la letra y
# garantiza exactamente las mismas versiones que se usaron al desarrollar.
npm ci

# Configuración local. Sin este paso la app arranca y falla con un mensaje
# explícito pidiendo API_BASE_URL.
cp .env.example .env
```

Edita `.env` y ajusta `API_BASE_URL`:

| Dónde ejecutas     | Valor de `API_BASE_URL`     |
| ------------------ | --------------------------- |
| Emulador Android   | `http://10.0.2.2:8000`      |
| Simulador iOS      | `http://localhost:8000`     |
| Dispositivo físico | `http://<IP-de-tu-PC>:8000` |

En un dispositivo físico, `localhost` es el propio teléfono. Necesitas la IP de
tu ordenador en la red local y que ambos estén en la misma red.

---

## 3. Comandos disponibles

| Comando                | Qué hace                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run android`      | Compila la app nativa y la instala en el Android conectado       |
| `npm run ios`          | Igual, para iOS. **Solo funciona en macOS**                      |
| `npm start`            | Arranca el servidor de Metro para una build ya instalada         |
| `npm run typecheck`    | Comprueba tipos con TypeScript, sin generar archivos             |
| `npm run lint`         | Ejecuta ESLint                                                   |
| `npm run lint:fix`     | Ejecuta ESLint corrigiendo lo que pueda                          |
| `npm run format`       | Formatea el proyecto con Prettier                                |
| `npm run format:check` | Verifica formato sin modificar nada                              |
| `npm test`             | Ejecuta las pruebas unitarias                                    |
| `npm run test:watch`   | Pruebas en modo observación                                      |
| `npm run verify`       | **Las cuatro comprobaciones seguidas.** Úsalo antes de commitear |

`npm start` usa `--dev-client` porque el proyecto usa una _development build_,
no Expo Go.

---

## 4. Estructura de carpetas

Solo existen las carpetas que tienen contenido hoy. No hay carpetas creadas
"para más adelante": cuando haga falta una, se crea con su primer archivo.

```
app-EKG/
├── App.tsx                  Componente raíz
├── index.ts                 Punto de entrada (campo "main" de package.json)
├── app.config.ts            Configuración de Expo, tipada
├── eslint.config.js         Reglas de ESLint (formato flat)
├── jest.config.js           Configuración del runner de pruebas
├── tsconfig.json            TypeScript en modo estricto y alias de imports
├── .env.example             Plantilla de configuración local (SÍ se versiona)
├── .env                     Configuración real (NO se versiona)
├── assets/                  Iconos de la aplicación
└── src/
    ├── camera/              Lógica de cámara: geometría, captura y estado
    ├── components/          Piezas de interfaz reutilizables
    ├── screens/             Pantallas completas
    ├── config/              Configuración de ejecución y su validación
    └── constants/           Valores fijos escritos por nosotros
```

### Por qué cada carpeta

| Carpeta           | Contiene hoy                                                                                           | Justificación                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/camera/`     | `framing.ts`, `capturePhoto.ts`, `confirmCapture.ts`, `discardCapture.ts`, hooks y medición de tiempos | Separa la lógica de cámara de la interfaz. Es lo que permite probar la geometría del encuadre sin renderizar nada ni disponer de un dispositivo.          |
| `src/components/` | `FramingGuide`, `ShutterButton`, `ActionButton`, los dos de permisos                                   | Piezas usadas por más de una pantalla o demasiado grandes para vivir dentro de una. Sin ellas, `CameraScreen` superaría el límite de 30 líneas.           |
| `src/screens/`    | `CameraScreen`, `ReviewScreen`, `CaptureFlow`                                                          | Vistas completas y el coordinador que alterna entre ellas.                                                                                                |
| `src/config/`     | `env.ts`, `env.test.ts`                                                                                | Aísla la lectura de la configuración de entorno. El resto del código consume valores ya validados y no necesita saber que vienen de `expo-constants`.     |
| `src/constants/`  | `app.ts`                                                                                               | Reúne textos, colores y escalas. Impide cadenas y números mágicos dentro de los componentes y deja el camino abierto a traducir la interfaz sin tocarlos. |

`App.tsx` e `index.ts` viven en la raíz porque es donde Expo los espera.

**No existen** `services/` ni `types/`. Se crearán cuando haya un archivo real
que meter dentro.

### La correspondencia entre el marco y la foto

`src/camera/framing.ts` es el archivo más importante del proyecto y no depende
de React Native. La vista previa a pantalla completa muestra solo una parte del
sensor, así que la foto sin recortar abarca más que el marco. `computeCropRegion`
invierte esa transformación y devuelve la región equivalente en píxeles de la
foto, que se recorta con `expo-image-manipulator`.

Si la región calculada no cabe en la foto, se ajusta al límite y se emite un
`console.warn` con el prefijo `[framing]`: significaría que el modelo geométrico
no se cumple en ese dispositivo.

---

## 5. Versiones exactas instaladas

Todas las dependencias están fijadas **sin `^` ni `~`**. Es un proyecto de
tesis: debe reconstruirse igual dentro de un año. `package-lock.json` está
versionado para fijar también las dependencias transitivas.

### Entorno

|          | Versión |
| -------- | ------- |
| Node.js  | 22.14.0 |
| npm      | 10.9.2  |
| Expo SDK | 57      |

### Dependencias

| Paquete                  | Versión |
| ------------------------ | ------- |
| `expo`                   | 57.0.8  |
| `react-native`           | 0.86.0  |
| `react`                  | 19.2.3  |
| `expo-camera`            | 57.0.3  |
| `expo-image-manipulator` | 57.0.6  |
| `expo-file-system`       | 57.0.1  |
| `expo-constants`         | 57.0.7  |
| `expo-status-bar`        | 57.0.1  |

### Dependencias de desarrollo

| Paquete                  | Versión |
| ------------------------ | ------- |
| `typescript`             | 6.0.3   |
| `@types/react`           | 19.2.17 |
| `@types/jest`            | 29.5.14 |
| `eslint`                 | 9.39.5  |
| `eslint-config-expo`     | 57.0.0  |
| `eslint-config-prettier` | 10.1.8  |
| `eslint-plugin-prettier` | 5.5.6   |
| `prettier`               | 3.9.6   |
| `jest`                   | 29.7.0  |
| `jest-expo`              | 57.0.2  |

Generado con `create-expo-app@4.0.0`, plantilla `blank-typescript`.

---

## 6. Decisiones de configuración

Cada una responde a un problema concreto, no a una preferencia.

**`app.config.ts` en lugar de `app.json`.** Un JSON estático no puede leer
`process.env`. La versión se toma de `package.json` para que exista una sola
fuente de verdad y no puedan desincronizarse.

**Variables de entorno vía `extra`.** Expo carga `.env` antes de evaluar
`app.config.ts`, y lo que se ponga en `extra` queda accesible en ejecución a
través de `expo-constants`. `src/config/env.ts` lo lee y **falla de forma
explícita** si falta algo: es más barato detectarlo al arrancar que depurar
errores de red confusos después.

**Sin `baseUrl` en `tsconfig.json`.** TypeScript 6 lo deprecó y deja de
funcionar en la 7. Los alias se resuelven igual con solo `paths`. El ejemplo de
la documentación de Expo todavía incluye `baseUrl` y provoca un error de
compilación.

**`types: ["jest"]` explícito.** TypeScript 6 con la base de Expo no escanea
`node_modules/@types` de forma automática. Sin esa línea, `describe` e `it` no
existen para el compilador aunque `@types/jest` esté instalado.

**El alias `@/` está declarado dos veces**, en `tsconfig.json` y en
`jest.config.js`. Jest no lee los `paths` de TypeScript. Si cambias uno, cambia
el otro.

**`android/` e `ios/` no se versionan.** Expo los regenera con _prebuild_. Si se
commitearan desde Windows, arrastrarían rutas y artefactos que romperían la
compilación en el Mac.

**`.gitattributes` fuerza finales de línea LF.** El desarrollo ocurre en Windows
y la compilación de iOS en macOS; sin esto cada cambio de máquina reescribiría
los finales de línea y ensuciaría los diffs.

---

## 7. Cómo verificar que funciona

### Sin dispositivo

```bash
npm run verify
```

Esperado: tipos correctos, ESLint sin avisos, formato correcto y **14 pruebas en
verde**.

```bash
npx expo-doctor
```

Esperado: `20/20 checks passed. No issues detected!`

### En Android

```bash
adb devices          # tu dispositivo debe aparecer como "device", no "unauthorized"
npm run android
```

La primera compilación tarda entre 5 y 15 minutos porque descarga Gradle. Las
siguientes, 1 o 2 minutos.

Esperado: el sistema pide permiso de cámara; al concederlo aparece la vista
previa a pantalla completa con el marco 3:2 y el texto «Encuadra el trazado
completo dentro del marco».

### Comprobar que el marco corresponde al área capturada

Es la comprobación más importante y lleva medio minuto.

1. Dibuja un rectángulo grande en una hoja, o usa un electrocardiograma real.
2. Coloca el móvil de modo que **las cuatro esquinas del rectángulo coincidan
   exactamente con las cuatro esquinas del marco** en la vista previa.
3. Pulsa el obturador.
4. En la pantalla de revisión, el rectángulo debe llegar **justo hasta los
   bordes** de la imagen: ni un margen sobrante ni un lado cortado.

Si aparece margen de más, la foto se está recortando de menos. Si falta un lado,
de más. Ambos casos indican que el modelo geométrico no se cumple en ese
dispositivo. Revisa también la consola: cualquier aviso con el prefijo
`[framing]` señala lo mismo.

### Rendimiento medido

La consola de Metro emite líneas `[timing]` en cada arranque y cada captura.
Referencia medida en un **Redmi Note 9 Pro** (Snapdragon 720G, sensor de 12 Mpx,
Android 10), en compilación de depuración:

| Medición                | Muestras | Resultado    | Límite  |
| ----------------------- | -------- | ------------ | ------- |
| Vista previa operativa  | 20+      | 287 – 415 ms | 1500 ms |
| Sensor (disparo físico) | 7        | 813 – 922 ms | —       |
| Procesado propio        | 7        | 48 – 80 ms   | 200 ms  |
| Captura completa        | 7        | 869 – 989 ms | 1200 ms |

El primer arranque tras instalar da ~1700 ms de vista previa porque incluye la
descarga inicial del bundle por USB. No vuelve a ocurrir.

**Por qué hay dos límites para la captura.** El criterio original pedía 500 ms
desde el obturador hasta la revisión. Al desglosar resultó que **el 94 % del
tiempo es el disparo del sensor** —enfoque, exposición, lectura e ISP—, que la
aplicación no controla: 857 ms de media frente a 61 ms de procesado propio. Un
límite de 500 ms sobre el total era inalcanzable por hardware, no por código.

Se separó en dos criterios: uno exigente sobre lo que sí controlamos
(procesado < 200 ms) y otro realista sobre la experiencia completa
(captura < 1200 ms). La variación entre 869 y 989 ms depende de si la cámara
tenía la escena ya enfocada.

Ese desglose motivó además la optimización principal: `takePictureAsync` se usa
con `pictureRef`, que devuelve una referencia a la imagen nativa en lugar de un
archivo. Evita codificar la foto completa a JPEG, escribirla, releerla y
decodificarla para acabar conservando una fracción. El procesado propio bajó de
~350 ms a ~61 ms, un **83 % menos**, y de paso desapareció la doble compresión.

### En iOS (en el Mac)

```bash
npm ci
cp .env.example .env
npm run ios
```

Xcode pedirá seleccionar un equipo de firma la primera vez. Con un Apple ID
gratuito, el perfil caduca a los 7 días.

---

## 8. Problemas conocidos

**`adb` no se reconoce como comando.** El SDK de Android está instalado pero
`platform-tools` no está en el `PATH`. En PowerShell, de forma permanente:

```powershell
[Environment]::SetEnvironmentVariable(
  'Path',
  "$([Environment]::GetEnvironmentVariable('Path','User'));$env:LOCALAPPDATA\Android\Sdk\platform-tools",
  'User'
)
```

Cierra y vuelve a abrir la terminal.

**La compilación de Android falla por la versión de Java.** Comprueba
`JAVA_HOME`. Debe apuntar a un JDK 17.

**`npm audit` reporta vulnerabilidades.** Están en la cadena de herramientas de
compilación de Expo (`@expo/cli`, `@expo/config-plugins`, `@eslint/*`), no en
código que llegue al dispositivo. `npm audit fix --force` rompería las versiones
fijadas del SDK. Se dejan tal cual las publica Expo SDK 57.

**La app muestra un error rojo al arrancar.** Falta `.env` o `API_BASE_URL`. El
mensaje indica qué hacer. Si acabas de crear `.env`, recompila: `app.config.ts`
se evalúa en tiempo de compilación, no en ejecución.
