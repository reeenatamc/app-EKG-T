# Capa de diseño — BioGlass RN

Este documento traza la especificación de diseño (`SKILL.md`, en la raíz del
repositorio) contra el código que la implementa. Registra también las
mediciones de contraste y toda desviación respecto de la especificación.

La tesis central de la especificación gobierna todo lo demás:

> **El vidrio flota, el dato no.** Si se ve a través de algo, ese algo no es
> diagnóstico.

---

## 1. Regla de la especificación → dónde vive en el código

| Regla                                                                   | Sección       | Implementación                                                                                       |
| ----------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Un literal de color, tamaño, radio o duración fuera de tokens es un bug | §2            | `tokens.ts` — fuente única. **Comprobado por `palette.test.ts`**, no a ojo                           |
| `semantic.*` reservado para alarmas, nunca decoración                   | §2            | `tokens.ts` con la advertencia junto a la definición; lista blanca en `palette.test.ts`              |
| La identidad es carmín, hueso y ciruela                                 | §2            | `tokens.ts` → `identity`, del que derivan `brand`, `paperLight` y `paperDark`                        |
| El acento de marca es `brand.*`; `aurora.*` no sale del lienzo          | §2            | `ActionButton.tsx` y `BentoTile.tsx` usan `brand.carmine`; `aurora` solo en `Aurora.tsx`, comprobado |
| Regla de tamaño: carmín en grande, alarma en pequeño                    | §12.9         | Dos listas blancas y la exigencia de medida acotada, en `palette.test.ts`                            |
| Toda superficie opaca lleva filo propio                                 | §2            | `theme.edge`; antes el par superficie/lienzo era 1.04:1                                              |
| La atmósfera es de la entrada, no del producto                          | §1, §4, D-20  | `Background` → prop `atmosphere`; siete pantallas con malla, seis con lienzo plano                   |
| El lienzo plano es hueso puro                                           | §2, D-20      | `theme.canvasFlat`; en claro la tarjeta se define solo por su filo, 1.82:1                           |
| El lienzo se pinta **dentro** del objetivo de desenfoque, como hijo     | §3, D-23      | `Background` → `CanvasFill`; como fondo del objetivo no entra en la foto y el vidrio sale gris       |
| Un solo tinte en el bento, y no depende del tema                        | §10, D-23     | `tokens.ts` → `tinted`, constante compartida. Tres tonos distintos hacían un muestrario              |
| La pestaña activa se marca con el color de acento                       | §12.9, D-22   | `TabBarItem`; carmín como tinte, nunca relleno. Comprobado en `palette.test.ts`                      |
| El inicio saluda por franja del día y con el nombre                     | §6, D-22      | `src/shell/greeting.ts`, puro y probado; el nombre se deriva del correo                              |
| Sombra en vez de borde en toda superficie opaca                         | §10, D-21     | `src/design/elevation.ts` → `cardShadow` y `rowShadow`                                               |
| Campos y pistas hundidos, no elevados                                   | §7, D-22      | `FormField` y `SegmentedControl` sobre `theme.canvas`: un campo es un hueco, no una tarjeta          |
| Paper es la identidad; dos temas, claro y oscuro                        | §2            | `theme.tsx` → `buildTheme()`; conmutación sin remontar el árbol                                      |
| `monitor` y `trace` reservados, fuera de la interfaz                    | §2, §12       | `tokens.ts`; verificado: ningún componente los importa                                               |
| Verde de fósforo nunca sobre señal digitalizada de papel                | §12.8         | El trazado usa `paperLight.ink` / `paperDark.ink`, que se invierten con el tema                      |
| La pantalla de captura es oscura siempre                                | —             | `CameraScreen.tsx`; motivo óptico, documentado en el propio archivo                                  |
| Vidrio con caída a opaco                                                | §3            | `Glass.tsx` → `GlassSurface`, rama `isFlat`                                                          |
| `overflow: 'hidden'` en todo BlurView                                   | §3            | `Glass.tsx`, estilo `base`                                                                           |
| Capa de tinte propia, nunca por debajo de 0.30                          | §3            | `Glass.tsx`; valores en `tokens.glass`                                                               |
| Línea especular, una sola dirección de luz                              | §3            | `Glass.tsx`, estilo `specular`                                                                       |
| Sombras declaradas para iOS y para Android                              | §3            | `Glass.tsx`, `Platform.select` en `base`                                                             |
| Presupuesto de dos superficies de vidrio                                | §3            | Sin cambios: una sola en el producto, la barra. Medido en §3 de este documento                       |
| Malla radial, nunca degradado lineal                                    | §4            | `Aurora.tsx` — tres blobs, ninguno centrado, uno anclado bajo el vidrio                              |
| Blur en el `layer` del `Group`, que funde las costuras                  | §4            | `Aurora.tsx`, prop `layer`                                                                           |
| Aurora atenuada en los dos temas                                        | §4            | `theme.tsx` → `auroraOpacity`: 0.42 claro, 0.50 oscuro                                               |
| El latido difuso se separa de su fondo                                  | §8            | `theme.bloom`: sombra sobre hueso, resplandor sobre ciruela                                          |
| Cifras e identificadores en monoespaciada                               | §6            | `FormField` (código), `StudyListRow` (id y fecha), `StudyDetailScreen`                               |
| Cada rol de `type` tiene consumidores                                   | §6            | Comprobado por `palette.test.ts`; antes `vital` no aparecía en ninguna pantalla                      |
| Toda pantalla principal abre con titular en display                     | §6            | `ScreenHeader.tsx`, en las once pantallas con contenido                                              |
| `lineHeight` y `letterSpacing` en píxeles absolutos                     | §6            | `type.ts`, valores ya convertidos                                                                    |
| Splash retenido hasta que carguen las fuentes                           | §6            | `type.ts` → `useAppFonts()`; `app/_layout.tsx` no renderiza antes                                    |
| Transparencia reducida ramifica de verdad                               | §7            | `a11y.ts` → `useReducedTransparency()`, consumido por `Glass.tsx`                                    |
| Interruptor manual, porque Android no expone la preferencia             | §7, §0        | `state/settings.ts`; expuesto en `PlaygroundControls.tsx`                                            |
| Movimiento reducido                                                     | §7, §11       | `a11y.ts` → `useReducedMotion()`                                                                     |
| Área táctil ≥ 44×44                                                     | §7            | `tokens.size.touchTarget`, aplicado en todo control                                                  |
| Fondo Skia fuera del árbol de accesibilidad                             | §7            | `BackgroundLayers.tsx`                                                                               |
| Chrome flotante respeta las áreas seguras                               | §7            | `useSafeAreaInsets()` en `PlaygroundScreen` y `CameraScreen`                                         |
| El latido dibuja P, QRS y T reales                                      | §8            | `SignalBloom.tsx` → `BEAT_SVG`                                                                       |
| `SkPath` construido a nivel de módulo                                   | §8, §13       | `SignalBloom.tsx` → `BEAT_PATH`                                                                      |
| Un único `<Canvas>` por pantalla                                        | §1, §13       | `BackgroundLayers.tsx`; `Aurora` y `SignalBloom` devuelven nodos                                     |
| Retícula ambiental es textura, no información                           | §1, §9, §12.5 | `AmbientGrid.tsx`; **un solo nivel**, paso 11, sin línea gruesa que contar                           |
| El objetivo de desenfoque contiene el contenido, no solo el fondo       | §3            | `Background.tsx`; el vidrio va encima del objetivo, como hermano                                     |
| El vidrio flotante se monta desde la pantalla, no desde el router       | §3            | `AppTabBar` por la prop `chrome` de `Background`; `(tabs)/_layout` da `null`                         |
| Solo se animan `transform` y `opacity`                                  | §11           | `motion.ts` documenta la restricción                                                                 |

---

## 2. Contraste medido

Calculado con la fórmula de luminancia relativa de la WCAG sobre los valores
reales de `tokens.ts`. Los pares de vidrio se miden **sobre el compuesto**, no
sobre el token: se compone el tinte con el peor fondo posible detrás.

**Esta tabla ya no se mantiene a mano.** La aritmética vive en
`src/design/contrast.ts` y cada cifra de aquí está fijada en
`src/design/contrast.test.ts` con el valor exacto, no solo contra el umbral.
Cambiar un token rompe la suite y obliga a copiar el número nuevo, así que la
prueba y la documentación no se pueden desincronizar. Medido con la paleta
carmín-hueso-ciruela de D-18.

| Par                                                          | Ratio     | Umbral 4.5:1 |
| ------------------------------------------------------------ | --------- | ------------ |
| claro: `textHigh` sobre `canvas`                             | **13.42** | ✅           |
| claro: `textLow` sobre `canvas`                              | **5.19**  | ✅           |
| claro: `textHigh` sobre `surface`                            | **16.61** | ✅           |
| claro: `textLow` sobre `surface`                             | **6.42**  | ✅           |
| claro: `ink` sobre `surface` (trazado)                       | **17.82** | ✅           |
| oscuro: `textHigh` sobre `canvas`                            | **16.04** | ✅           |
| oscuro: `textLow` sobre `canvas`                             | **8.09**  | ✅           |
| oscuro: `textHigh` sobre `surface`                           | **12.59** | ✅           |
| oscuro: `textLow` sobre `surface`                            | **6.35**  | ✅           |
| oscuro: `ink` sobre `surface` (trazado)                      | **12.59** | ✅           |
| `brand.onCarmine` sobre `brand.carmine` (botón primario)     | **7.48**  | ✅           |
| `brand.onCarmineLow` sobre `brand.carmine` (apoyo del hero)  | **4.82**  | ✅           |
| `brand.carmine` sobre `paperLight.surface` (botón invertido) | **7.48**  | ✅           |
| claro: `textHigh` sobre vidrio, peor caso                    | **5.53**  | ✅           |
| oscuro: `textHigh` sobre vidrio, peor caso                   | **4.84**  | ✅           |
| `tinted.title` sobre `tinted.focus` (subtarjeta, núcleo)     | **12.59** | ✅           |
| `tinted.title` sobre `tinted.edge` (subtarjeta, borde)       | **9.67**  | ✅           |
| `tinted.body` sobre `tinted.focus`                           | **9.93**  | ✅           |
| `tinted.body` sobre `tinted.edge`                            | **7.62**  | ✅           |

### El peor caso de vidrio cambió, y por eso subieron los tintes

Antes del rediseño el objetivo de desenfoque contenía **solo el fondo**, así que
lo peor que podía haber detrás del vidrio era el blob más oscuro de la malla.
Desde la corrección de D.4 el objetivo contiene también **el contenido que se
desplaza**, y lo que pasa por debajo de la barra al scrollear puede ser un bloque
de tinta o de carmín a ancho completo. Medido contra ese peor caso:

| Tinte                       | Claro   | Oscuro  |
| --------------------------- | ------- | ------- |
| El anterior (0.42 / 0.55)   | 3.67 ❌ | 3.35 ❌ |
| **El actual (0.55 / 0.68)** | 5.53 ✅ | 4.84 ✅ |

Con el hero de carmín pasando por debajo, que es el caso realista, el vidrio
claro queda en **7.10**. El 3.67 es el número que justifica la enmienda de §3 y
está fijado en la prueba: si alguien baja el tinte «porque así se ve más el
desenfoque», la suite dice cuánto cuesta.

### Contornos y filos

| Par                                              | Ratio    | Para qué                   |
| ------------------------------------------------ | -------- | -------------------------- |
| `brand.edge` sobre `paperLight.canvas`           | **3.59** | WCAG 1.4.11, mínimo 3:1 ✅ |
| `brand.edge` sobre `paperDark.canvas`            | **3.97** | WCAG 1.4.11, mínimo 3:1 ✅ |
| claro: `edge` sobre `surface` (filo de tarjeta)  | 1.82     | separación visible         |
| oscuro: `edge` sobre `surface` (filo de tarjeta) | 1.84     | separación visible         |
| claro: `canvas` contra `surface`                 | 1.24     | antes **1.04**, o sea nada |
| oscuro: `canvas` contra `surface`                | 1.27     | antes 1.12                 |
| `brand.carmine` contra `semantic.alarmHigh`      | 2.14     | antes **1.70** con el rosa |

Ninguna combinación de la interfaz baja de 4.5:1, ni siquiera la peor
composición de vidrio de cada tema.

### Texto sobre colores de alarma

| Alarma                 | Texto blanco | Texto `paperLight.ink` |
| ---------------------- | ------------ | ---------------------- |
| `semantic.alarmHigh`   | 3.69 ❌      | **4.89** ✅            |
| `semantic.alarmMedium` | 1.58 ❌      | **11.42** ✅           |
| `semantic.alarmLow`    | 1.92 ❌      | **9.37** ✅            |
| `semantic.ok`          | 1.44 ❌      | **12.50** ✅           |

Esta medición motivó la enmienda **D-3**.

---

## 3. Rendimiento de vidrio medido

Criterio fijado antes de medir: **scroll sostenido a 60 fps** en el dispositivo
de referencia, con el chrome de vidrio montado más una tarjeta de contexto. Si
no se alcanza, el chrome pasa a opaco con borde y el vidrio queda reservado a
una única tarjeta por pantalla.

Dispositivo de referencia: **Xiaomi Redmi Note 9 Pro**, Snapdragon 720G,
Android 10, compilación de depuración.

Medición con `useUiThreadFps`, que cuenta fotogramas en el **hilo de UI** y no
en el de JavaScript: el desenfoque, el scroll y la composición de Skia ocurren
allí, y un contador basado en `requestAnimationFrame` marcaría 60 fps mientras
la pantalla va a tirones.

### Resultado

Prueba: 20 barridos continuos, unos 20 segundos de scroll ininterrumpido sobre
el `Playground` en modo **Paper**, que es el más costoso porque su malla se
dibuja a opacidad completa. Montado a la vez: chrome de vidrio flotante,
tarjeta de contexto de vidrio, y las cuatro capas del fondo Skia.

| Medición                      | Valor  |
| ----------------------------- | ------ |
| fps en reposo                 | 60–61  |
| **fps mínimo durante scroll** | **59** |

**Criterio cumplido. Se mantiene el vidrio.**

El mínimo de 59 no son fotogramas perdidos: es ruido de la ventana de muestreo.
La prueba está en que el mismo medidor marca **61** en reposo, y un panel de
60 Hz no puede entregar 61 fotogramas reales. Los límites de la ventana de un
segundo no se alinean con el vsync, así que la lectura oscila ±1 alrededor de la
tasa real. El dispositivo sostiene sus 60 Hz.

Se deja constancia de que la medición se hizo en **compilación de depuración**.
Una compilación de release sólo puede mejorar la cifra, nunca empeorarla.

### Segunda medición: inicio en bento con la barra de pestañas

La primera medición se hizo sobre un `ScrollView` de filas planas. El inicio
real tiene módulos con más composición, y la barra de pestañas de vidrio está
montada **en todas las pantallas del grupo, siempre**. Se volvió a medir con la
configuración de producción: tema oscuro, barra de vidrio activa —transparencia
reducida desactivada— y 20 barridos sostenidos.

| Medición                      | Valor  |
| ----------------------------- | ------ |
| fps en reposo                 | 60     |
| **fps mínimo durante scroll** | **60** |

**Criterio cumplido. Se mantiene el vidrio en la barra de pestañas.**

Consecuencia que conviene no olvidar: la barra consume **una de las dos**
superficies de vidrio que permite §3. El presupuesto restante para cualquier
pantalla del grupo es **una sola tarjeta**. Por eso ningún módulo del inicio es
de vidrio.

---

## 4. Dónde se guarda cada cosa

La aplicación usa **dos** almacenes. No es duplicación: son dos propósitos
distintos, y usar uno solo obligaría a tratar mal alguno de los dos.

| Almacén             | Qué guarda                                                                | Por qué ese                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo-secure-store` | Sesión, introducción completada, desbloqueo biométrico activo             | Son credenciales y decisiones de acceso. Respalda en el Keystore de Android y el Keychain de iOS. `AsyncStorage` guardaría un token en texto plano dentro del sandbox                                      |
| `AsyncStorage`      | Tema, estándar de electrodos, transparencia reducida, movimiento reducido | Son preferencias de presentación, no secretos. Meterlas en el almacén seguro pediría al hardware de cifrado que descifre si el usuario prefiere oscuro, y retrasaría el primer render sin ninguna ganancia |

**El arranque espera a las preferencias.** La lectura de `AsyncStorage` es
asíncrona, así que sin esperarla la aplicación pintaría un fotograma con el tema
por defecto antes de saber cuál quiere el usuario: en un dispositivo en oscuro
eso es un destello blanco perfectamente visible. `useAppReady` retiene el splash
nativo hasta que **fuentes y preferencias** están listas. Retenerlo unos
milisegundos más es preferible al destello.

**Verificado en el dispositivo**, leyendo la base de AsyncStorage con `run-as`
tras un cierre forzado:

```
ekg.settings {"state":{"mode":"dark","electrodeStandard":"AHA",
              "reduceTransparency":false,"reduceMotion":true},"version":0}
```

Se observaron tres estados distintos a lo largo de la sesión de pruebas y los
tres sobrevivieron al cierre y se aplicaron al arrancar.

---

## 5. Riesgos de iOS, sin verificar

**Nada de esta capa se ha ejecutado nunca en un dispositivo iOS.** Todo lo
medido en este documento —contraste sobre el compuesto, fotogramas, colores
muestreados del framebuffer, geometría del recorte— procede de un Xiaomi Redmi
Note 9 Pro con Android 10.

Esta sección no describe fallos observados. Describe **dónde es razonable
esperar que se rompa**, para que quien lo pruebe sepa qué mirar primero. Es
deuda reconocida, no una promesa de que funcione.

| Qué                                   | Por qué puede romperse en iOS                                                                                                                                             | Cómo se nota                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`overflow: 'hidden'` + sombra**     | En iOS la sombra se dibuja fuera de los límites de la vista, y `overflow: 'hidden'` la recorta. Android usa `elevation`, que no se ve afectado                            | Las tarjetas de vidrio flotan en Android y quedan planas en iOS                                                                                          |
| **`tint` de `BlurView`**              | En iOS el tinte lo aplica el efecto nativo `UIBlurEffect`; nuestra capa de tinte propia se suma **encima**. En Android esa capa es la única fuente de tinte               | Doble tinte: superficies más turbias y oscuras de lo diseñado, y el contraste medido en §2 deja de ser el real                                           |
| **`blurTarget`**                      | Es exclusivo de Android. En iOS el desenfoque toma lo que haya detrás de verdad, sin vista designada                                                                      | En iOS el vidrio desenfocará también las tarjetas que tenga debajo; en Android solo el fondo. Misma pantalla, dos profundidades distintas                |
| **`borderCurve: 'continuous'`**       | Solo iOS. En Android se ignora                                                                                                                                            | Las esquinas son _squircle_ en iOS y circulares en Android. Cosmético, pero la comparación de capturas engaña                                            |
| **`isReduceTransparencyEnabled()`**   | En iOS **sí devuelve el valor real** del sistema, al revés que en Android, donde siempre es `false`                                                                       | La caída a opaco puede activarse sola en iOS sin tocar el interruptor. Es la rama que en Android nunca se ejercita: en iOS es la que se ejercita primero |
| **`blurRadius` de `Image`**           | Implementaciones nativas distintas; el radio no equivale entre plataformas                                                                                                | Cuando llegue la anonimización de la Etapa 3, el mismo valor difuminará distinto                                                                         |
| **Correspondencia marco ↔ recorte**   | El modelo de recorte centrado se verificó sobre `CameraX`. En iOS la previa es `AVCaptureVideoPreviewLayer`, que se asume `resizeAspectFill` pero **no se ha comprobado** | Si el supuesto no se cumple, el aviso `[framing]` aparecerá en consola. Es el primer sitio donde mirar                                                   |
| **`pictureRef` de expo-camera**       | La optimización de captura se midió solo en Android                                                                                                                       | La orientación o las dimensiones podrían llegar distintas; se vería en la revisión                                                                       |
| **Áreas seguras**                     | Muesca e indicador de inicio no existen en el dispositivo de referencia                                                                                                   | El chrome flotante y el obturador usan `useSafeAreaInsets()`, pero nadie ha visto el resultado con una muesca real                                       |
| **`presentation: 'fullScreenModal'`** | Presentación nativa de iOS; en Android se traduce a otra cosa                                                                                                             | La captura podría abrirse con una transición distinta a la esperada                                                                                      |

**Qué hacer el día que haya un Mac:** compilar, abrir el `Playground` y recorrer
la lista de arriba en ese orden. Las tres primeras filas son las que más
probablemente afecten a algo medido en este documento.

---

## 6. Registro de desviaciones

Toda desviación respecto de `SKILL.md` se registra aquí con fecha, motivo y
alternativa descartada. Si algo de la especificación resulta imposible, se
enmienda la especificación y se anota; nunca se ignora en silencio.

### D-23 · El vidrio nunca desenfocó, y la subtarjeta deja de depender del tema

**2026-07-30 · §1, §3, §10 · dos hallazgos medidos en el Redmi**

#### El vidrio no desenfocaba, y la corrección de D-18 no lo había arreglado

D-18 dio por resuelto el desenfoque tras mover la barra de pestañas dentro de
`Background`. **No lo estaba.** Aquella verificación fue una captura estática, y
una captura estática no distingue un desenfoque de un tinte plano.

La barra medía `#CBC9C7` sobre lienzo hueso, un gris que no está en ninguna
paleta. La aritmética del tinte decía que por debajo había un gris de ~63 en vez
del hueso 252, o sea que el desenfoque estaba fotografiando algo que no era el
lienzo. La prueba que lo cerró: **se pintó el objetivo de verde puro `#00FF00` y
la barra siguió midiendo `#CBC9C7`, idéntica hasta el byte.** Un vidrio cuyo
color no cambia cuando cambia todo lo que tiene debajo no está desenfocando nada.

La causa está en `expo-blur@57.0.2`. `ExpoBlurTargetView` no se fotografía a sí
mismo: en su constructor crea un `BlurTarget` interno y **reparenta ahí a todos
sus hijos**, y lo que la cámara del desenfoque dibuja es ese objetivo interno. Un
`backgroundColor` puesto en el componente se queda en el envoltorio de fuera, que
nunca entra en la foto. Las zonas sin contenido se fotografían transparentes y el
vidrio acaba enseñando el color con que Android limpia el fotograma.

La corrección es pintar el lienzo como **hijo** del objetivo, no como fondo suyo:
`CanvasFill` en `Background.tsx`. Con el color dentro, la misma prueba en verde
dio `#C3F8BF` —la aritmética predecía `#BFFABB`, cuatro unidades de diferencia— y
la barra sobre hueso pasó de `#CBC9C7` a `#FAF7F4`.

| Barra de pestañas sobre lienzo hueso | Antes     | Después   |
| ------------------------------------ | --------- | --------- |
| Color medido                         | `#CBC9C7` | `#FAF7F4` |
| Con el lienzo pintado de verde puro  | `#CBC9C7` | `#C3F8BF` |

**Lo que esto NO arregla, y hay que decirlo:** ninguna de las tres pantallas del
menú tiene contenido suficiente para desplazarse, así que por debajo del vidrio
no pasa nada nunca. Se comprobó arrastrando en Historial con cuatro estudios: las
dos capturas salieron con el mismo tamaño en bytes, o sea que la pantalla no se
movió. El vídeo del scroll que pide D.4 sigue sin poder hacerse, y el motivo ya
no es el vidrio sino que **falta contenido**. Es el mismo hueco que la autora
describió como «la pantalla home se ve vacía».

#### La subtarjeta del bento pasa a ser un color propio

Había dos tintes: en oscuro un vino apagado con el borde subiendo a carmín, y en
claro su reflejo —núcleo hueso, borde rosa—. La autora vio el de oscuro y pidió
el mismo en claro.

El rosa no se sostenía: sobre hueso quedaba a **1.91:1** del lienzo, o sea que la
tarjeta apenas existía como objeto y toda la separación la hacía la sombra. El
vino existe en los dos lienzos, así que `tinted` sale de las dos paletas y pasa a
ser una constante compartida, igual que el carmín del hero. Lo único que cambia
con el tema es el lienzo de debajo.

| Par                               | Medido    |
| --------------------------------- | --------- |
| Titular sobre el núcleo del vino  | **12.59** |
| Titular sobre el borde del vino   | **9.67**  |
| Apoyo sobre el núcleo             | **9.93**  |
| Apoyo sobre el borde              | **7.62**  |
| Vino contra lienzo hueso          | **10.66** |
| Vino contra lienzo ciruela        | **1.66**  |
| Rosa anterior contra lienzo hueso | 1.91      |

**El coste, dicho claro:** el borde del vino y el borde del hero quedan a
**1.04:1**, o sea que en luminancia son el mismo bloque oscuro. Lo que los separa
es la saturación —el hero es rojo cargado, la subtarjeta vino apagado— y el
tamaño. En claro la pantalla pasa a leerse como bloques oscuros sobre hueso, un
contraste bastante más duro que el de antes.

Medido en el dispositivo tras el cambio: lienzo `#FCF8F4`, hero `#9C1C36`,
subtarjeta `#3B243A` en el núcleo y `#502838` en el borde.

### D-22 · Pase de estética iOS, y el saludo en el inicio

**2026-07-29 · §6, §10, §12 · decisión de la autora sobre la carpeta `inspo/`**

La autora reunió seis referencias en `inspo/` y pidió replicar el estilo, no la
paleta. De las guías de **Liquid Glass de iOS 26** se toman tres cosas: aplicar el
vidrio con moderación y solo en superficies clave —que ya era el presupuesto de
§3—, capas lógicas con el chrome sobre el contenido, y evitar sombras duras y
ángulos.

**Dos cosas de esas guías NO se siguen, y conviene que conste.** Recomiendan radio
16 para las formas de vidrio y **no hornear degradados** dentro de las tarjetas.
Aquí el radio es 40 y las tarjetas llevan degradado, que es literalmente lo que la
referencia muestra. Se acepta la divergencia: esas guías describen el vidrio del
sistema, y estas son superficies opacas.

#### Un solo tinte, y al revés que el hero

Se probó con tres tonos distintos —ciruela, rosa y arena— y **no funcionó**: la
pantalla se volvía un muestrario y ninguna tarjeta mandaba. Ahora hay un único
carmín suavizado, con el degradado invertido respecto del hero: **núcleo hueso en
el centro, borde cargado**. La jerarquía la decide la densidad, no el tono.

| Par                                  | Ratio    |
| ------------------------------------ | -------- |
| Título sobre el borde del tinte      | **8.70** |
| `inkOnTint` sobre el borde del tinte | **5.25** |
| El tinte contra el carmín de marca   | 3.92     |
| El tinte contra `semantic.alarmHigh` | 1.83     |

`inkOnTint` existe porque `textLow` cae a **3.36:1** sobre ese borde. Era eso o
dejar las tarjetas descoloridas.

#### La pestaña activa va en carmín

La autora dijo que la barra «no se hovereaba». Se comprobó antes de tocar nada: el
árbol de accesibilidad daba `selected=true` en la pestaña correcta, o sea que **la
lógica estaba bien**. Lo que fallaba era el contraste — tinta oscura contra gris,
a trece puntos y sobre vidrio, no se lee.

La activa pasa a `brand.carmine`, medido en **7.4:1** sobre el vidrio claro. No
contradice §12.9: esa regla prohíbe el carmín como **relleno** de un elemento
pequeño, no como tinte de un icono y su etiqueta, que es además la convención de
iOS para el color de acento. `palette.test.ts` lo vigila con una prueba nueva: los
módulos que tiñen con carmín no pueden además rellenar con él.

#### El resto del pase

- Botones y control segmentado a `radius.pill`; campos y filas a `radius.tile`;
  `borderCurve: 'continuous'` en toda superficie.
- `elevation.ts` con `cardShadow` y `rowShadow`, que sustituyen al borde en filas
  y módulos. Una sombra son cinco valores que solo tienen sentido juntos y que se
  declaran distinto por plataforma; repartirlos por `tokens.ts` los desincroniza.
- **Campos y pistas hundidos**, con relleno `theme.canvas`. Un campo de entrada no
  es una tarjeta: es un hueco donde escribir, y sobre lienzo hueso una caja blanca
  con sombra se leía como una tarjeta más.

#### El inicio saluda, y deja de mentir

El titular era «Del papel a la señal». Pasa a **«Buenas tardes, Renata»**, con la
fecha larga en la micro-etiqueta monoespaciada. La tesis no se pierde: el módulo
hero dice «Fotografía un electrocardiograma», o sea que sigue en pantalla y ahora
está pegada a la acción que la ejecuta.

**El nombre se deriva del correo** porque `Session` trae `userId`, `email` y
`role` y nada más; inventar un campo de nombre sería fingir un dato que el
contrato de `AuthService` no da. Lógica pura y probada en `src/shell/greeting.ts`.

**Carpeta nueva, `src/shell/`.** Es la primera lógica del armazón que no es
autenticación, ni captura, ni tokens. El copy ya vivía separado en
`constants/shellText.ts`, así que el nombre es coherente con lo que había.

**Los nombres de día y mes van escritos a mano** en `CALENDAR_TEXT`, no por
`toLocaleDateString` con opciones: ese camino depende de que el motor traiga ICU
completo, y donde falta devuelve el nombre en inglés — un fallo silencioso que
solo se vería en el dispositivo.

**Y un fallo que salió al mirarlo:** el módulo «Últimos estudios» decía «Todavía
ninguno» **fijo**, mientras el historial mostraba cuatro. Una interfaz que miente
sobre lo que hay guardado. Ahora lee la cola y muestra el identificador del último
en monoespaciada.

### D-21 · Las tarjetas: sombra en vez de borde, y degradado en la de marca

**2026-07-29 · §10 y §13 · decisión de la autora sobre una referencia visual**

La autora aportó una referencia y pidió replicar **la forma de las tarjetas**, no
su paleta ni su fondo. Medida la referencia, lo que la define son cuatro cosas:
radio de esquina muy grande, cero bordes, relleno con degradado radial en las
tarjetas de color, y fondo gris con tarjetas blancas.

Se toman tres y se descarta una:

- **Radio 28 → 40**, con `borderCurve: 'continuous'`. A 28 los módulos leían como
  rectángulos con la esquina limada.
- **Fuera el borde, dentro la sombra.** Sobre un lienzo blanco una tarjeta blanca
  no puede separarse por color, así que se separa como un objeto apoyado en una
  mesa de su mismo color. Medido en el dispositivo: donde antes había un borde
  duro de `#CDB6B2` ahora hay una caída de `#F9F5F1` a `#F1EDE9` en cuatro
  píxeles.
- **Degradado radial en el módulo de marca**, con el foco descentrado al 28 %/34 %
  por lo mismo que los blobs del aurora: una luz centrada se lee como degradado y
  descentrada se lee como luz.
- **No se toma el fondo gris.** La referencia lo usa para que sus tarjetas se lean
  blancas; aquí el lienzo se queda en hueso por decisión previa, y la separación
  la hace la sombra.

**El degradado oscurece hacia fuera, al revés que la referencia.** La suya va de
rosa saturado a rosa casi blanco, y sobre esa zona pálida su tinta clara se queda
sin contraste: es bonito y es un fallo de accesibilidad. Invirtiendo la dirección
se consigue la misma profundidad y el suelo de §7 solo puede mejorar hacia el
borde.

| Par                                        | Ratio     |
| ------------------------------------------ | --------- |
| `onCarmine` sobre `carmineLit` (peor caso) | **6.15**  |
| `onCarmine` sobre `carmineDeep`            | **10.23** |
| `onCarmineLow` sobre `carmineLit`          | **4.67**  |
| `onCarmineLow` sobre `carmineDeep`         | **7.77**  |

`onCarmineLow` se aclaró de `#EBBFC6` a `#F2D3D8`: sobre el foco del degradado el
valor anterior caía a 3.96:1.

**Sobre el `<Canvas>` propio, que §13 marca como antipatrón.** La regla existe por
coste: un lienzo por tarjeta en una pantalla que ya tiene el del fondo son dos
pasadas de GPU donde debería haber una. Aquí no se da: desde D-20 las pantallas de
producto **no montan ningún lienzo**, y el módulo hero es uno solo por pantalla,
así que el total sigue siendo uno. Se cumple el motivo de la regla, no su letra, y
queda anotado en `TileGlow.tsx` que si algún día hay dos módulos de marca en
la misma pantalla hay que subir el degradado al fondo.

**Verificado en el dispositivo**, muestreando el framebuffer: el degradado va de
`#B0223E` en el foco a `#7A1226` en la esquina más lejana, o sea la rampa completa
dentro de la tarjeta.

### D-20 · La atmósfera es de la entrada, no del producto

**2026-07-29 · §1 y §4 · `SKILL.md` enmendado · decisión de la autora**

§1 dice que **toda** pantalla lleva las seis capas. Deja de ser cierto a
propósito. Las pantallas se parten en dos familias y el lienzo es lo que las
separa.

| Familia      | Fondo                                      | Pantallas                                                                   |
| ------------ | ------------------------------------------ | --------------------------------------------------------------------------- |
| **Entrada**  | Seis capas: malla, latido difuso, retícula | Splash, Introducción, Acceso, Registro, Verificación, Recuperar, Desbloqueo |
| **Producto** | Lienzo plano, `theme.canvas` y nada más    | Inicio, Historial, Perfil, Ajustes, Detalle del estudio, flujo de Captura   |
| Aparte       | Seis capas                                 | `Playground`, que es el banco donde se prueba la propia atmósfera           |

**Por qué.** En la lámina de contacto de D.1 el aurora era el elemento más
fuerte de las doce pantallas y le ganaba al contenido. Bajarlo al 42 % ayudó pero
no lo resolvió: una malla decorativa detrás de una lista de estudios sigue
compitiendo con la lista. En la entrada no compite con nada —no hay dato que
leer, solo un formulario corto— y ahí es donde la atmósfera hace su trabajo, que
es dar carácter antes de que empiece el trabajo de verdad.

Efecto secundario que resuelve un problema abierto: el claro no leía como hueso,
leía como rosa, y lo que lo teñía era el blob `aurora.haze`. En las seis
pantallas de producto el hueso ahora es hueso.

**Ajustes va en producto** aunque comparta composición con las pantallas de
acceso: se llega desde Perfil. `AuthScreenLayout` recibe la prop para eso, y su
nombre se queda corto — sirve a seis pantallas y solo cinco son de acceso.

**Alternativa descartada:** dejar la malla en todas y seguir bajándole la
opacidad. Ya está en 0.42; por debajo deja de ser atmósfera y pasa a ser una
mancha, y el problema no era la intensidad sino que compitiera con una lista.

**Elegido:** `Background` recibe `atmosphere`. En falso no monta
`BackgroundLayers` en absoluto, así que en esas seis pantallas **no existe ni un
nodo de Skia** y desaparece un `<Canvas>` por pantalla.

**Consecuencia sobre el vidrio, y hay que tenerla presente.** La barra de
pestañas se queda de vidrio —decisión tomada— pero sobre un lienzo plano lo único
que puede desenfocar es el contenido que pasa por debajo al desplazarse. Antes
tenía además la malla. O sea que el efecto ahora **depende enteramente del
scroll**, y eso hace que la verificación en vídeo de §3 deje de ser una
comprobación y pase a ser la única prueba de que el vidrio se gana el sitio. Si
no se lo gana, pasarlo a opaco con borde son dos líneas y §12.6 lo respalda.

Los umbrales de contraste no cambian: el peor caso bajo el vidrio sigue siendo un
bloque de tinta pasando por debajo, que es lo que ya estaba medido.

#### El lienzo plano es hueso puro, y su tarjeta se define solo por el filo

Decisión de la autora sobre la marcha: las pantallas sólidas van en **blanco**, no
en el hueso en sombra. Se añade `canvasFlat` — `identity.bone` en claro,
`identity.plum` en oscuro, donde el extremo ya era el fondo.

En claro eso deja el lienzo y la superficie **del mismo color**, así que la forma
de una tarjeta la dibuja únicamente su filo, medido en **1.82:1**. No es un
descuido: no se puede ser más claro que el hueso más claro. Las tarjetas pasan de
rellenas a contorneadas, y el carmín del hero gana fuerza porque ahora es lo único
relleno de la pantalla.

#### Un objetivo de desenfoque sin fondo se fotografía negro

Encontrado al quitar las capas: sobre lienzo plano la barra de vidrio salía
**gris**, `#CBC9C7`, un color que no está en la paleta. La causa es que el color
del lienzo lo pintaba la vista **padre**, fuera del objetivo de desenfoque, y con
el aurora dentro no se notaba porque él pintaba el lienzo entero. Sin ninguna
capa, lo que Android fotografía donde no hay contenido es transparente, y el
vidrio promedia con negro.

La aritmética lo confirmó antes de arreglarlo: tinte blanco de expo-blur al 60 %
sobre negro, más la capa de hueso al 55 % encima, da `rgb(207,205,203)`; lo medido
era `rgb(203,201,199)`. Tras pintar el fondo **dentro** del objetivo, medido
`#F9F7F5` frente a `~#F9F6F3` calculado.

**Regla que se lleva de aquí:** el objetivo de desenfoque tiene que pintar fondo.
No basta con que su padre lo pinte.

#### Riesgo abierto: sobre blanco el vidrio casi no se ve

Medido en Inicio con lienzo plano: el relleno de la barra da `#FAF8F6` contra un
lienzo `#FCF8F4`, o sea **1.01:1**. La barra se distingue solo por su borde de un
píxel y su sombra. Es el riesgo que se aceptó al elegir «deja el vidrio», y queda
por decidir con el vídeo delante: o se acepta, o pasa a opaca con un relleno algo
distinto del lienzo, que es lo que §12.6 respalda.

### D-19 · El modo oscuro forzado de MIUI seguía vivo, en el otro sentido

**2026-07-29 · ajeno a la especificación · corrección de un error propio**

D-7 dio por cerrado el modo oscuro forzado de MIUI. Estaba cerrado a medias, y el
rediseño lo puso a la vista.

**Lo que D-7 arregló:** sistema en oscuro, aplicación en claro. MIUI repintaba
todas las vistas y `userInterfaceStyle: 'automatic'` lo detuvo.

**Lo que quedaba:** sistema en oscuro, aplicación **también** en oscuro. MIUI
sigue oscureciendo cualquier `View` cuyo fondo sea claro. No se notaba porque
hasta el rediseño el tema oscuro no tenía ni una: todas las superficies eran
ciruela. Ahora sí las hay —el botón invertido del módulo hero, la opción activa
del control segmentado— y ahí se vio.

**Medido sobre el framebuffer del dispositivo**, barriendo el centro de la
pantalla de inicio en oscuro:

| Elemento                         | Declarado | En pantalla  |
| -------------------------------- | --------- | ------------ |
| Relleno del hero                 | `#9E1B32` | `#9E1B32` ✅ |
| Texto del hero                   | `#FCF8F4` | `#FCF8F4` ✅ |
| **Relleno del botón invertido**  | `#FCF8F4` | `#221F1D` ❌ |
| **Opción activa del segmentado** | `#F5EBF1` | `#2D252A` ❌ |

Es la misma asimetría que delató D-7: el texto y el lienzo Skia conservan su
color, las `View` no. Confirmado además en el dispositivo, `ui_night_mode = 2`, y
en el proyecto generado, que no declaraba `forceDarkAllowed` en ninguna parte.

**Alternativa descartada:** no pintar nunca un fondo claro en tema oscuro. Le
quitaría al tema oscuro la inversión tinta/lienzo con la que se marcan estado y
acción, y dejaría el botón del hero en carmín sobre carmín, que no es un botón.

**Elegido:** `android:forceDarkAllowed="false"` mediante un plugin de
configuración propio, `plugins/withoutForcedDark.js`. Va en un plugin y no
editando `android/` porque ese directorio lo regenera `expo prebuild` y el cambio
se perdería en el siguiente `run:android`. Verificado en `styles.xml` generado y
después sobre el framebuffer.

### D-18 · Rediseño visual: carmín, hueso y ciruela

**2026-07-29 · §2, §3, §4, §6, §12 · `SKILL.md` enmendado · etapa propia**

Etapa de rediseño abierta antes de consolidar la Etapa 4, con el argumento de
que repintar ahora cuesta una tarde y después costaría una semana. Empezó por una
auditoría medida —lámina de contacto de las doce pantallas más inventario de uso
real de tipografías, tokens y vidrio— y las cifras de esa auditoría son lo que
justifica cada cambio de abajo. La lámina previa está en el informe.

**Lo que la auditoría encontró, en números.**

| Medición                                    | Antes             | Después        |
| ------------------------------------------- | ----------------- | -------------- |
| `type.display` presente en                  | 1 de 12 pantallas | 11 de 12       |
| `type.vital` presente en                    | **0 de 12**       | 1 (el código)  |
| `type.data` sobre cifras reales             | **0 sitios**      | 4              |
| `surface` contra `canvas`, claro            | **1.04:1**        | 1.24:1 + filo  |
| Acento de marca contra `semantic.alarmHigh` | **1.70:1**        | 2.14:1         |
| `<BlurView>` que desenfocan de verdad       | **0 de 1**        | 1 de 1         |
| Tokens definidos sin referencia             | 15 (4 muertos)    | 11, reservados |

**Cinco decisiones, y la alternativa que se descartó en cada una.**

**1. La paleta arranca de tres valores.** `identity` —carmín, hueso, ciruela— y
de ahí derivan `brand`, `paperLight` y `paperDark`. El fallo de la paleta
anterior no era el tono, era que `aurora.rose` hacía de niebla del fondo **y** de
color de todos los controles: la aplicación entera hablaba con la voz de un blob
decorativo, y a 1.70:1 de la alarma crítica. Ahora `brand.*` es el acento y
`aurora.*` no sale del lienzo, lo cual **lo comprueba un test**, no la disciplina.

_Descartado:_ oscurecer los colores de alarma para separarlos del carmín. Rompe
la correspondencia con la IEC 60601-1-8, que es el motivo de que estén reservados.
Se separan por tamaño (§12.9) y por luminancia.

**2. El lienzo claro es más oscuro que la superficie clara.** Es la relación
física —una hoja se apoya sobre algo y ese algo está en sombra— y es lo único que
le da borde propio a una tarjeta sin añadir cromo. Con 1.04:1 la forma de los
tiles la dibujaba el aurora de detrás.

_Descartado:_ aclarar la superficie. Ya estaba en #FFFBF9, a un paso del blanco
puro que §2 prohíbe.

**3. El carmín está pendiente de medir sobre fotos propias.** El alcance de la
etapa pedía derivarlo **midiendo electros ya digitalizados**, no de una rueda
cromática. No se pudo: `run-as com.reeenatamc.appekg ls files/studies` devuelve el
directorio **vacío**, o sea que el dispositivo no tiene ni un estudio. El valor
actual se derivó del rojo de retícula que ya estaba en `tokens.ts` —elegido del
papel real— llevado a densidad de tinta. **Queda por hacer**, y no es cosmético:
si el carmín real del papel resulta más naranja, el de marca debería seguirlo.

**4. El vidrio: el objetivo tiene que contener el contenido.** Ver la enmienda de
§3 en `SKILL.md`. Dos fallos encadenados: la barra se montaba desde el `tabBar`
del router, o sea **por encima** de `Background`, así que `useBlurTarget()`
devolvía `null` y expo-blur caía en silencio a «sin desenfoque» —el fallo de D-6
otra vez, por otra puerta—; y aun resuelto eso, el objetivo contenía **solo el
fondo**, que es una malla suave y quieta. Desenfocar una malla suave no se ve.
Ahora el objetivo contiene fondo y contenido, y el vidrio va encima como hermano.
El coste cae sobre el contraste y está medido en §2: los tintes suben de 0.42 a
0.55 en claro y de 0.55 a 0.68 en oscuro, porque con los anteriores las etiquetas
de la barra quedaban en 3.67:1 y 3.35:1.

_Descartado:_ dejar el tinte bajo y aceptar 3.67:1 «porque así se aprecia más el
desenfoque». El suelo de §7 es un guardarraíl clínico y no se negocia con estética.

**5. La retícula ambiental pierde el nivel grueso.** Tenía paso fino 8 y grueso
40: una relación de 1 a 5, exactamente la del papel de electrocardiograma, así que
invitaba a contar cuadros grandes sobre una textura **sin calibrar**. Con la
retícula de medición de la Etapa 4 ya en escena, §12.5 lo convierte en riesgo de
lectura. Sin cuadro grande no hay nada que contar, y la retícula de dos niveles
queda como vocabulario exclusivo del componente que sí mide.

_Descartado:_ cambiar solo la relación de pasos. Seguiría habiendo dos niveles, o
sea la misma invitación con otros números.

**Y lo que se quitó, que cuenta igual.** `StepDots` entero —el contador
monoespaciado dice lo mismo con más precisión y además se puede leer en voz alta,
que los puntos no—; el cuarto blob del aurora; los cuatro tokens muertos
(`opacity.glassTint`, `opacity.glassBorder`, `opacity.specular`,
`size.cornerHandleArm`); el degradado de tres colores del latido; y el `#E6F4FE`
azul de plantilla que pintaba el fondo del icono adaptativo.

**Tests estáticos, que estaban acordados desde la Etapa 3 y no existían.**
`palette.test.ts` implementa las dos mitades de §12.9, la lista blanca de
`semantic.*`, la de `aurora.*`, la regla de `type.vital` frente a `GlassCard`, la
ausencia de hex sueltos, que ningún rol de `type` se quede sin consumidores, y que
los dos colores de `app.config.ts` sigan siendo los de `identity`.
`contrast.test.ts` fija los veinte pares **con su valor exacto**, no solo contra
el umbral: así la tabla de §2 no puede quedarse mintiendo.

**Riesgo aceptado.** El presupuesto de vidrio no sube —sigue habiendo una sola
superficie en el producto— pero ahora esa superficie desenfoca de verdad, o sea
que hace trabajo que antes no hacía. Los 60 fps de §3 se midieron con el vidrio
**sin desenfocar nada**, así que esa medición ya no vale y hay que repetirla.

### D-1 · Bricolage Grotesque sustituye a Archivo Expanded

**2026-07-29 · §6 · `SKILL.md` enmendado**

La especificación pedía `ArchivoExpanded_800ExtraBold`. No existe el paquete
`@expo-google-fonts/archivo-expanded`, y `@expo-google-fonts/archivo` no
publica ninguna instancia Expanded, así que la fuente no era instalable en un
proyecto Expo.

**Alternativa descartada:** empaquetar el fichero de fuente a mano desde Google
Fonts. Añade un binario al repositorio y su actualización queda fuera del
control de dependencias.

**Elegido:** Bricolage Grotesque 800, que la propia §6 ya listaba como cara de
display admitida y sí existe empaquetada.

### D-2 · El `<Canvas>` lo posee `Background`, no cada capa

**2026-07-29 · §1 frente a §4 · aclaración interna, sin enmienda**

§1 exige que las capas 1 a 3 vivan en un único `<Canvas>` por pantalla, y §13
marca «un Canvas por tarjeta» como antipatrón. Pero el ejemplo de código de §4
envuelve la malla en su propio `<Canvas>`. Aplicar el ejemplo al pie de la letra
daría tres lienzos por pantalla.

**Resuelto:** `Aurora`, `SignalBloom` y `AmbientGrid` devuelven nodos de Skia;
`BackgroundLayers` es el único que monta un `<Canvas>`. Prevalece la regla sobre
el ejemplo.

### D-3 · Texto de alarma en tinta oscura, no en blanco

**2026-07-29 · §12.2 · `SKILL.md` enmendado**

§12.2 exigía alarmas con texto blanco. Medido contra esta paleta, el blanco
incumple el mínimo de 4.5:1 de §7 en las cuatro alarmas, porque las cuatro son
de luminancia alta. `paper.ink` cumple en las cuatro. Las cifras están en §2 de
este documento.

**Alternativa descartada:** oscurecer los colores de alarma hasta que el blanco
contrastara. Rompería la correspondencia con la jerarquía de la IEC 60601-1-8,
que es precisamente el motivo de que esos colores estén reservados.

**Elegido:** cambiar el color del texto. El suelo de contraste de §7 es un
guardarraíl clínico y pesa más que un valor por defecto de estilo.

### D-4 · Extensiones a los tokens de §2

**2026-07-29 · §2 · adición, sin enmienda**

§2 no cubre todos los valores que la aplicación necesita. Se añaden en
`tokens.ts`, que sigue siendo la fuente única, agrupados y comentados:

| Token         | Motivo                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `surface`     | §2 solo definía superficie opaca para Monitor, y §12.1 la exige en cualquier tema. Con D-8 quedó absorbida en `paperLight` y `paperDark` |
| `scrim`       | Velos sobre imagen en vivo, derivados de `paperDark.canvas` en vez de un negro ajeno                                                     |
| `opacity`     | Evita decimales sueltos por los estilos                                                                                                  |
| `size`        | Incluye `touchTarget: 44`, mínimo de §7                                                                                                  |
| `blur`        | Intensidades de §3 y §8 en un solo sitio                                                                                                 |
| `glass`       | Composición del vidrio: tintes, bordes y especular                                                                                       |
| `ambientGrid` | Pasos de la retícula de textura, deliberadamente no milimétricos                                                                         |

### D-17 · La foto pendiente vive en documentos, no en caché

**2026-07-29 · Etapa 3 · ajuste de una restricción del proyecto**

La regla del proyecto es que la foto no salga del almacenamiento temporal. La
Etapa 3 pide además que la cola de subida sobreviva al cierre de la aplicación.
Las dos cosas no se pueden cumplir a la vez: Android vacía el directorio de
caché cuando le falta espacio, así que una cola en caché **pierde estudios en
silencio**, que es el peor fallo posible aquí — nadie se entera hasta que va a
buscar el estudio y no está.

**Alternativa descartada:** dejarlo en caché y aceptar la pérdida. Un estudio
perdido es un desplazamiento hasta el paciente tirado, y encima invisible.

**Elegido:** `Paths.document`, en subcarpeta privada de la aplicación — ni la
galería, ni otras aplicaciones, ni el escaneo de medios la ven — y **borrado en
cuanto el servidor confirma**. La imagen persiste exactamente lo que dura su
envío. El espíritu de la regla se mantiene: la foto de un paciente no se acumula
en el dispositivo. Se añade limpieza de huérfanos al rehidratar, para los
archivos que quedan sin dueño si el proceso muere entre el traslado y el guardado
de la cola. Ver `src/capture/studyFiles.ts`.

### D-16 · La perspectiva se corrige en el servidor, no en el dispositivo

**2026-07-29 · Etapa 3 · decisión central de la etapa**

Evidencia de partida: sobre este proyecto, la recuperación de la derivación I
cae al **26%** con la imagen a resolución insuficiente y sube al **99%** con la
imagen a la escala adecuada. La calidad de la imagen que llega al modelo es el
factor que decide si el sistema funciona.

Corregir la perspectiva en el dispositivo obliga a **remuestrear** la imagen
entera sobre una GPU de gama media, con el filtro que le toque. El remuestreo es
exactamente donde se pierde un trazo de un milímetro de ancho.

**Alternativa descartada:** aplicar la homografía con Skia y enviar la imagen ya
enderezada. Es lo que parecería pedir el enunciado y es lo que más se ve.

**Elegido:** la homografía se calcula en la aplicación **solo para la
previsualización** —que es literalmente lo que pide el alcance— y **las cuatro
esquinas viajan como metadato**. La imagen se recorta al rectángulo que las
contiene, sin reescalar un solo píxel. El servidor, que tiene la resolución
nativa y mejores herramientas, hace la corrección definitiva.

**Consecuencia:** esto crea una obligación de contrato para la Etapa 5, que debe
aceptar `quad` junto a la imagen. Es barato de revertir: la homografía ya existe
y está probada, hornearla en el archivo son unas treinta líneas.

> **RIESGO ABIERTO — decidir antes de cerrar el contrato de la Etapa 5.**
>
> El digitalizador **ya corrige la perspectiva por su cuenta**: detecta las
> direcciones de la retícula con transformada de Hough, arma el cuadrilátero que
> contiene el electrocardiograma y aplica una homografía. Es una etapa propia,
> anterior a la extracción de señal.
>
> Eso deja las cuatro esquinas del cliente en una de tres situaciones, y **no
> están descartadas**:
>
> | Situación      | Qué significa                                                                     |
> | -------------- | --------------------------------------------------------------------------------- |
> | **Redundante** | El pipeline lo hace igual y las esquinas se ignoran                               |
> | **Atajo**      | Se le pasan como semilla y se salta la detección de Hough                         |
> | **Conflicto**  | El pipeline recorta según su detección y las esquinas del cliente dicen otra cosa |
>
> La tercera es la peligrosa: dos recortes distintos sobre la misma imagen, y el
> resultado depende de cuál gane. **Hay que descartarla por escrito.**
>
> Esta decisión **no se toma desde la aplicación**: la toma quien cierre el
> contrato con `api-EKG`, con el pipeline delante. Lo que la aplicación aporta
> mientras tanto es que las esquinas ya son un dato aislado, calculado y probado
> —`camera/quad.ts` y `camera/homography.ts`—, así que dejar de enviarlas es
> borrar un campo, no rehacer una pantalla.
>
> Lo que **no** cambia sea cual sea la respuesta: la aplicación no remuestrea la
> imagen. Ese es el motivo de D-16 y es independiente de quién acabe usando las
> esquinas.

### D-15 · La resolución de captura se fija al máximo del sensor

**2026-07-29 · Etapa 3 · corrección de un fallo propio**

Hasta esta etapa no se fijaba `pictureSize`, así que `expo-camera` capturaba al
tamaño por defecto del dispositivo, que **en Android rara vez es el máximo del
sensor**. Para una foto cualquiera es un matiz; a la luz de la evidencia del
26% / 99% de D-16, era el fallo más caro del proyecto y llevaba ahí desde la
HU-12.

**Elegido:** `getAvailablePictureSizesAsync()` y se toma la de mayor **área**, no
la más ancha: un 16:9 más ancho suele tener menos píxeles totales porque recorta
arriba y abajo en vez de añadir detalle. La elección no rompe el encuadre, porque
`computeCropRegion` deriva la transformación del tamaño real de la foto. Módulo
puro y probado en `src/camera/pictureSize.ts`.

### D-14 · El aviso de reflejo no puede ser en vivo

**2026-07-29 · Etapa 3 · límite de plataforma, verificado**

El alcance pide avisar de reflejo sobre la vista previa. Se comprobó leyendo los
tipos instalados de `expo-camera` que **no expone ninguna API de acceso a
fotogramas, luminancia ni exposición**. Sin fotogramas no hay nada que analizar
hasta que la foto existe.

**Alternativa descartada:** `react-native-vision-camera`, que sí tiene
procesadores de fotogramas. La cierra el ADR-002.

**Elegido:** repartir los tres avisos según lo que se puede medir de verdad.

| Aviso           | Cuándo      | Con qué                                            |
| --------------- | ----------- | -------------------------------------------------- |
| **Inclinación** | en vivo     | `DeviceMotion`, vector de gravedad                 |
| **Poca luz**    | en vivo     | `LightSensor` — **solo Android**; en iOS no existe |
| **Reflejo**     | en revisión | análisis de píxeles sobre la foto ya tomada        |

El reflejo en la revisión sigue cumpliendo «advierte antes de subir», que es el
requisito real. Queda como riesgo de iOS que la poca luz allí solo se detecte en
la revisión.

### D-13 · El encuadre correcto no cambia de color: se afila

**2026-07-29 · §12 · momento firma de la Etapa 3**

El momento firma pedido es que la guía transicione 200 ms «al color de estado
OK». Lo natural sería el verde, pero el verde de «todo bien» es `semantic.ok`,
que pertenece a la jerarquía de alarma de la IEC 60601-1-8 y está **reservado**.

**Alternativa descartada:** usar `semantic.ok`. Enseñaría al usuario que en esta
aplicación el verde significa «correcto», y ese aprendizaje se lo llevaría puesto
a la pantalla donde el verde significa «paciente estable». Diluir un vocabulario
de alarma para adornar un visor de cámara es justo lo que §12 prohíbe. Descartado
también cualquier otro verde: la dilución es perceptiva, no de espacio de
nombres.

**Elegido:** el recurso de un instrumento óptico. Al enfocar, la retícula no
cambia de tono: **se afila**. La guía gana grosor y luminancia durante los 200 ms
de `motion.micro` y no toca el tono. Se implementa superponiendo una segunda guía
más gruesa de la que solo se anima la opacidad, porque §11 no permite animar
`borderWidth`: obligaría a recalcular la disposición en cada fotograma con la
cámara en vivo detrás.

### D-12 · Sin iconos en la barra de pestañas

**2026-07-29 · §13 · decisión, no pendiente**

La barra de pestañas va con etiquetas de texto y sin iconos. §13 pide iconos de
línea **dibujados desde el vocabulario del instrumento**, y un paquete de iconos
genéricos no lo es: una casa y un reloj no dicen nada sobre electrocardiografía.

**Alternativa descartada:** usar un paquete genérico. Cumpliría la forma —hay
iconos— e incumpliría el motivo, que es que el icono signifique algo en este
dominio.

**Elegido:** etiquetas de texto. Son inequívocas, accesibles sin trabajo extra y
no fingen un lenguaje visual que no existe todavía. Dibujar los iconos propios
es una tarea con entidad y se hará cuando haya con qué compararlos: el trazado,
la retícula y el visor llegan en la Etapa 4.

### D-11 · La internacionalización queda fuera del alcance

**2026-07-29 · decisión, no pendiente**

Ajustes muestra el idioma como **fila informativa**, no como selector. La
aplicación está en español y un selector con una sola opción es decoración, que
la especificación prohíbe.

**Por qué queda fuera y no en una lista de tareas:** la internacionalización
completa —extraer todo el copy, una biblioteca de traducción, mantener dos
juegos de textos clínicos en paralelo— es media etapa de trabajo, y esta tesis
demuestra la captura, digitalización e interpretación de un electrocardiograma,
no la localización de una interfaz. Anotarlo como «pendiente» sugeriría que
está previsto; no lo está.

El copy vive concentrado en `src/constants/`, así que el día que haga falta el
trabajo estará acotado. Eso es lo único que la arquitectura debe garantizar hoy.

### D-10 · El bloom NO necesita separarse por tema — hipótesis descartada

**2026-07-29 · §8 · sin enmienda: la especificación se sostiene**

Se sospechaba que el gradiente salmón-rosa-lila de §8, diseñado sobre crema,
quedaría demasiado caliente sobre el ciruela del tema oscuro, y se introdujo una
opacidad separada por tema.

**Verificado en el Redmi: la sospecha era falsa.** El latido lee bien en ambos
temas sin ajuste; en oscuro el resplandor incluso se aprecia mejor. La
comprobación se hizo con `BeatSpecimen`, en el `Playground`, porque en el
arranque real el latido solo se ve unos ochocientos milisegundos y no da tiempo
a evaluarlo.

Para el trazado difuso del fondo —que es otro elemento, con desenfoque de 48 y
trazo de 34— no se pudo aislar su aporte: en el `Playground` las tarjetas cubren
el fondo, y el píxel más separado del lienzo resultó ser texto, no bloom.

**Decisión: se retira la separación por tema.** Una complicación que no se puede
sostener con evidencia no se queda «por si acaso». Vuelve el valor único de §8 y
desaparece un token. Si alguna pantalla futura muestra el bloom de forma
prominente, se revisará entonces y con datos.

### D-9 · Enmienda a §2 de la especificación registrada en `SKILL.md`, no aquí

**2026-07-29 · nota de procedimiento**

Las enmiendas D-1, D-3, D-6 y D-8 modifican el texto de `SKILL.md`. Ese archivo
está en `.prettierignore` a propósito: se conserva literal para que las
enmiendas sean trazables frente al documento original, y cada una lleva su
bloque `> **Amendment**` con fecha en la sección afectada.

### D-8 · Paper es la identidad; Monitor pasa a reservado

**2026-07-29 · §2 y §12 · `SKILL.md` enmendado · decisión de la autora**

La especificación entregaba Paper y Monitor como dos modos intercambiables.
Monitor se diseñó para telemetría en vivo, y esta aplicación no hace
telemetría: captura, digitaliza y revisa.

Además había un problema de **honestidad del dato**. Un electrocardiograma
digitalizado desde papel se imprimió en tinta negra sobre retícula rosa.
Pintarlo de verde de fósforo lo disfraza de telemetría en vivo y tergiversa su
procedencia — exactamente la clase de mentira que §12 existe para impedir. Se
añade como regla §12.8.

**Alternativa descartada:** borrar `monitor` y `trace`. Están bien definidos y
siguen la convención de los monitores multiparámetro. El día que la aplicación
maneje señal en vivo —un dispositivo vestible, una captura en tiempo real— el
verde de fósforo será correcto, porque la señal vendrá de verdad de un sensor.

**Elegido:** `paperLight` y `paperDark` como los dos temas de la interfaz, con
`monitor` y `trace` conservados y marcados como reservados. El tema oscuro es
Paper oscurecido: misma familia cromática, fondo ciruela, retícula rosa apagada
y tinta clara. Los tres selectores del `Playground` pasan a claro, oscuro y
sistema.

**Excepción de la cámara.** `CameraScreen` es oscura siempre e ignora el tema.
El motivo es óptico, no estético: una interfaz clara a pantalla completa rebota
sobre el papel satinado, mete reflejos en la foto y desajusta la exposición de
la vista previa. Por eso no se negocia con la preferencia del usuario.

**Verificación:** las once combinaciones de la nueva paleta se remidieron y
todas superan 4.5:1, incluidos los peores casos de vidrio de ambos temas. Ver
§2 de este documento.

### D-7 · El modo oscuro forzado del sistema repintaba la aplicación

**2026-07-29 · ajeno a la especificación · corrección de un error propio**

En modo Paper, todas las superficies se renderizaban oscuras pese a que el tema
entregaba `#FFFBF9`. Se descartó por medición que fuera un fallo de `buildTheme`
—se instrumentaron proveedor y consumidor, y ambos reportaban el valor
correcto— y que fuera inconsistencia de Fast Refresh, porque persistía tras un
arranque limpio.

La pista fue una asimetría: el lienzo Skia conservaba sus colores reales y las
`View` de React Native no. Lo único que las distingue es que una es superficie
de GPU y la otra la compone el sistema. **MIUI estaba aplicando modo oscuro
forzado.** Confirmado en el dispositivo (`ui_night_mode = 2`) y en el proyecto
generado (`styles.xml` sin `forceDarkAllowed`).

**Origen del error.** En una iteración anterior se retiró `userInterfaceStyle`
de `app.config.ts` con el argumento de que era configuración muerta. No lo era:
estaba inerte por faltar `expo-system-ui`, que es justo lo que advertía
`expo prebuild`. El aviso se interpretó mal.

**Elegido:** instalar `expo-system-ui` y declarar
`userInterfaceStyle: 'automatic'`, con lo que la aplicación afirma gestionar su
propio claro y oscuro y el sistema deja de repintarla.

**Verificación:** el píxel de una superficie en modo Paper pasó de `#1F1D1B` a
`#FAFAFA`, muestreado sobre el framebuffer del dispositivo.

### D-6 · El vidrio de Android exige una vista objetivo explícita

**2026-07-29 · §3 · `SKILL.md` enmendado**

El ejemplo de §3 pasaba `experimentalBlurMethod` y ningún objetivo. En
expo-blur 57 esa prop está obsoleta y, peor, `dimezisBlurView` **sin
`blurTarget` cae en silencio a «sin desenfoque»**. El fallo es invisible en una
captura de pantalla —la tarjeta sigue pintando su tinte— y solo aparece en la
consola. Se detectó en el primer arranque del `Playground` en el dispositivo.

**Alternativa descartada:** aceptar el tinte sin desenfoque en Android. Sería
renunciar al efecto en la mitad de los dispositivos sin decirlo, justo lo que la
regla de gobierno prohíbe.

**Elegido:** `Background` envuelve sus capas en `<BlurTargetView>` y publica la
referencia por contexto (`blurTarget.ts`); `Glass` la consume. Ningún componente
de vidrio necesita saber dónde está el fondo.

**Consecuencia que conviene tener presente:** en Android el vidrio desenfoca _la
vista designada_, no un fondo arbitrario. Puede desenfocar la capa de fondo,
nunca otra tarjeta apilada por debajo.

### D-5 · `react-native-gesture-handler` excluido del autolinking — RESUELTO

**2026-07-29 · resuelto el mismo día · ya no bloquea la Etapa 3**

**Qué se hizo:** se activó `LongPathsEnabled` en el registro de Windows y
`core.longpaths` en git, se reinició la máquina, se instaló
`react-native-gesture-handler` en la versión **2.32.0**, la que fija el SDK, y
se retiró la exclusión del autolinking.

**Verificación en el Redmi**, no solo que enlace:

- El codegen de C++ produce sus 6 objetos, incluido `ShadowNodes.cpp.o`.
- El módulo aparece en `PackageList.java`, `Android-autolinking.cmake` y
  `autolinking.cpp`.
- Un `GestureDetector` real (`GestureProbe.tsx`, en el `Playground`) se arrastra
  en el dispositivo. Medido sobre el framebuffer: el control pasa de
  `x=540 y=1612` a `x=676 y=1520` durante el arrastre, y `withSpring` lo
  devuelve a `x=539 y=1611` al soltar.

> **Matiz importante, y corrige la atribución.** El arreglo real fue la
> **versión**, no el registro. `react-native-gesture-handler@3.1.0` —la que npm
> instalaba por su cuenta al resolver un peer abierto— genera una ruta de
> codegen de 370 caracteres; la 2.32.0 la deja en 248. Medida la ruta más larga
> de todo el proyecto generado: **248 caracteres, por debajo del límite de 260**.
> Es decir, `LongPathsEnabled` **nunca llegó a ejercitarse** y sigue sin estar
> probado en esta cadena de herramientas.
>
> Se conserva como seguro, pero la protección efectiva hoy es mantener
> gesture-handler en la versión que fija el SDK. Subir a la rama 3.x
> reintroduciría el riesgo, y esa vez el seguro tendría que funcionar de verdad.

### D-5 (histórico) · Por qué se excluyó del autolinking

**2026-07-29 · ajeno a la especificación · TEMPORAL, bloquea la Etapa 3**

El codegen de C++ de `react-native-gesture-handler` genera una ruta de **370
caracteres**, que supera el límite MAX_PATH de 260 de Windows y rompe la
compilación nativa. El módulo entra solo como dependencia de `expo-router`;
ningún código propio lo usa todavía.

**Alternativa descartada:** mover el repositorio a una ruta corta. Medido: la
ruta quedaría en 345 caracteres, sigue sin caber, porque la carpeta de salida de
CMake incrusta la ruta del proyecto dos veces.

**Elegido:** excluirlo del autolinking mediante `expo.autolinking.exclude` en
`package.json`.

> **Acción obligatoria antes de la Etapa 3.** Esa etapa necesita gestos para las
> esquinas arrastrables del recorte. Hay que activar `LongPathsEnabled` en
> `HKLM\SYSTEM\CurrentControlSet\Control\FileSystem` (requiere administrador y
> reinicio) y retirar entonces la exclusión.

---

## 7. Qué no cubre todavía esta capa

- **Umbral de píxeles por milímetro sin calibrar.** `MIN_PIXELS_PER_MM = 8` sale
  de una deducción física: el trazo mide unos 0,4 mm y hacen falta unos tres
  píxeles a lo ancho para que sobreviva al muestreo. Es el único umbral del
  control de calidad que **no se puede derivar del papel**, porque depende también
  de la escala a la que se entrenó el modelo de digitalización. Hay que
  contrastarlo contra el propio proyecto: es el número que separa el 26% de
  recuperación del 99%. Lo mismo, en menor medida, para `MIN_FOCUS_VARIANCE`.
- **Verificación en dispositivo del sentido del nivel de burbuja.**
  `BUBBLE_DIRECTION` en `camera/tilt.ts` depende del convenio de ejes del
  fabricante. La matemática está probada, pero el signo hay que comprobarlo
  inclinando un teléfono real y viendo hacia dónde va el punto. Con el papel en
  vertical el convenio es **otro** y también está sin comprobar en la mano: ahí
  no hay lado alto, y el punto marca el borde que se va hacia atrás. Se comprueba
  con el teléfono de pie, dejando caer la parte de arriba hacia el papel y viendo
  si el punto baja. Si sube, es cambiar un signo en `uprightOffset`.
- **El giro alrededor del eje de la gravedad, con el papel en vertical.** Acercarse
  al papel desde la izquierda o desde la derecha en vez de de frente deforma en
  perspectiva igual que inclinarse, pero no mueve el vector de gravedad, así que
  un acelerómetro no puede verlo. Con el papel en una mesa no pasa, porque ahí el
  eje de la gravedad coincide con el de la cámara y los dos giros que importan
  quedan a la vista. En vertical el nivel vigila la mitad de los errores, y por
  eso sigue avisando en vez de bloquear.
- **Ajuste accesible de las esquinas.** Arrastrar no es accesible por sí solo.
  Está mitigado, no resuelto: las esquinas parten del marco ya encuadrado, así
  que **el flujo se completa entero sin tocarlas**. Quien no pueda hacer un
  arrastre preciso pierde el ajuste fino, no la función.
- **La rama de fallo de la subida no es demostrable.** `MockUploadService`
  siempre acepta, porque un fallo al azar en una demostración se lee como un
  error de la aplicación. Las transiciones de fallo y reintento están cubiertas
  por las pruebas de `capture/queue.ts`; se cerrarán de verdad en la Etapa 5.
- **Sin detección de red.** La cola reintenta al volver la aplicación al primer
  plano y al pulsar reintentar, no al recuperar cobertura. Añadir `expo-network`
  adelantaría unos segundos algo que ya ocurre; si el envío real lo demuestra
  necesario, se justificará solo.
- **Retícula de medición calibrada** (§9). Es un componente distinto de la
  retícula ambiental y llega con el visor de derivaciones de la Etapa 4.
- **Renderizado del trazado real** (§9): decimado, memoización por ventana
  visible y corte en los huecos. Etapa 4.
- **El carmín está sin medir sobre fotos propias.** El rediseño pedía derivarlo
  midiendo electros ya digitalizados. `files/studies` en el dispositivo está
  vacío, así que se derivó del rojo de retícula que ya venía del papel real. Es
  lo primero que hay que rehacer en cuanto haya una captura de verdad; está
  anotado en D-18 y en el comentario de `identity.carmine`.
- **Los 60 fps de §3 hay que volver a medirlos.** Aquella medición se hizo con el
  vidrio de la barra **sin desenfocar nada**, porque no tenía objetivo. Ahora
  desenfoca el contenido que se desplaza, o sea que hace trabajo que antes no
  hacía. La cifra de §3 de este documento describe el estado anterior y no vale
  como garantía del actual.
- **El vídeo del scroll bajo el vidrio, en ambos temas.** El desenfoque solo se
  puede juzgar en movimiento: en una captura estática un tinte y un desenfoque se
  parecen. Pendiente de grabar en el Redmi.
