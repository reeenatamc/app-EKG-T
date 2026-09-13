/**
 * Fuente unica de tokens de diseno. Implementa SKILL.md §2.
 *
 * Un literal de color, tamano, radio o duracion fuera de este archivo es un
 * bug. Si falta un valor, se anade aqui; no se escribe suelto en un estilo.
 *
 * La identidad de la aplicacion es **carmin, hueso y ciruela**. El sujeto es
 * una hoja de electrocardiograma: papel hueso, retícula carmin, tinta ciruela
 * casi negra. Todo lo demas se deriva de esos tres valores.
 */

/**
 * Los tres colores de la identidad. Ninguna otra familia los redefine.
 *
 * - **carmin** es la marca. Es rojo porque el corazon es rojo y porque el papel
 *   de electrocardiograma se imprime en rojo; fingir otra cosa seria elegir un
 *   color de rueda cromatica en vez del color del instrumento. Se derivo del
 *   rojo de retícula del papel llevado a densidad de tinta. Ver la desviacion
 *   D-18: la medicion sobre fotos digitalizadas propias esta **pendiente**,
 *   porque el dispositivo no tiene ningun estudio todavia.
 * - **hueso** es blanco calido. Queda como color de identidad; las pantallas de
 *   producto del tema claro pasaron a blanco neutro por decision de la autora
 *   (ver `paperLight.canvasFlat`).
 * - **ciruela** es el #171019 del tema oscuro, ahora estructural: es la tinta
 *   del tema claro, el lienzo del oscuro y la sombra de los dos.
 */
export const identity = {
  carmine: '#9E1B32',
  bone: '#FCF8F4',
  plum: '#171019',
} as const;

/**
 * Marca. **Relleno grande, nunca estado.**
 *
 * REGLA DE TAMANO (§12.9). El carmin profundo solo rellena superficies grandes:
 * el boton de accion principal a ancho completo, el modulo hero del inicio y la
 * identidad. Nunca rellena un elemento pequeno que se lea como estado —punto
 * activo, opcion elegida, pulgar de interruptor, borde de seleccion—, porque a
 * ese tamano un rojo saturado es indistinguible de una alarma. El estado lo
 * lleva la tinta.
 *
 * La prohibicion simetrica vive en `semantic`: alarma solo en superficie
 * pequena, nunca como fondo grande. Las dos se comprueban en `palette.test.ts`.
 *
 * `edge` existe solo como **borde** del relleno de marca: da al boton primario
 * un limite de 3:1 contra el lienzo en los dos temas, que es lo que pide la
 * WCAG 1.4.11 para el contorno de un control. No rellena nada.
 */
export const brand = {
  carmine: identity.carmine,
  edge: '#C8455E',
  /** Tinta sobre carmin. Medida: 7.47:1 contra el relleno, en los dos temas. */
  onCarmine: identity.bone,
  /** Texto de apoyo sobre la tarjeta carmín. */
  onCarmineLow: '#F2D3D8',
} as const;

/**
 * Tema claro. Es la identidad por defecto de la aplicacion.
 *
 * El lienzo es MAS OSCURO que la superficie, al contrario que antes. Es la
 * relacion fisica correcta —la hoja se apoya sobre algo, y ese algo esta en
 * sombra— y es lo unico que le da a una tarjeta un borde propio: medido, el
 * par anterior (#FDF6F3 contra #FFFBF9) estaba en 1.04:1, o sea invisible.
 */
export const paperLight = {
  canvas: '#EADFD9',
  /** Fondo gris ciruela suave que separa las tarjetas blancas del lienzo. */
  canvasFlat: '#F3F1F5',
  surface: '#FEFEFD',
  /** Color del trazado digitalizado: la tinta con que se imprimio en papel. */
  ink: '#150F1A',
  /** Filo de toda superficie opaca. Sin el, la forma la dibuja el fondo. */
  edge: '#CDB6B2',
  gridFine: '#E3CBCE',
  gridBold: '#D0A4AB',
  textHigh: '#1F1622',
  textLow: '#6B5560',
  /** Latido difuso de la capa 2. Mas oscuro que su fondo: es una sombra. */
  bloom: '#8C2F4A',
} as const;

/**
 * Tema oscuro. Es la hoja vista en ciruela, no un monitor.
 *
 * Misma familia cromatica —ciruela y carmin apagado— con tinta clara sobre
 * fondo ciruela profundo. Nunca verde de fosforo: ese color pertenece al mundo
 * de la telemetria y usarlo aqui fingiria que la senal viene de un monitor
 * cuando en realidad se digitalizo de papel.
 */
export const paperDark = {
  canvas: identity.plum,
  /** En oscuro el extremo ya era el lienzo, asi que plano y con atmosfera coinciden. */
  canvasFlat: identity.plum,
  surface: '#31233A',
  /** El trazado se invierte con el tema: tinta clara sobre fondo oscuro. */
  ink: '#F5EBF1',
  /** 1.84:1 contra la superficie, igualado al 1.82:1 del tema claro. */
  edge: '#61476E',
  gridFine: '#4A3348',
  gridBold: '#67465C',
  textHigh: '#F5EBF1',
  textLow: '#B9A4BC',
  /** Aqui el latido es mas claro que su fondo: es un resplandor. */
  bloom: '#E0728C',
} as const;

/**
 * RESERVADO. Paleta de monitor de constantes vitales.
 *
 * Esta bien definida y sigue la convencion de los monitores multiparametro,
 * pero NO se usa en la interfaz: esta aplicacion captura, digitaliza y revisa;
 * no hace telemetria. Despierta el dia que exista senal en vivo, por ejemplo un
 * dispositivo vestible o una captura en tiempo real. Ese dia el verde de
 * fosforo sera correcto, porque la senal vendra de verdad de un sensor.
 */
export const monitor = {
  canvas: '#07090C',
  surface: '#11151B',
  textHigh: '#E8EEF2',
  textLow: '#7C8A96',
} as const;

/**
 * RESERVADO, junto con monitor. Color por parametro de senal en vivo.
 *
 * Convencion de monitores, no decoracion. No aparece sobre senal digitalizada
 * desde papel: para eso estan paperLight.ink y paperDark.ink.
 */
export const trace = {
  ecg: '#3DF57E',
  spo2: '#34D5F5',
  resp: '#F5D93D',
  abp: '#FF5C7A',
} as const;

/**
 * Atmosfera de la capa 1. **Solo fondo.**
 *
 * Tres blobs, no cuatro, y ninguno vale como acento de interfaz: el error de la
 * paleta anterior fue que `aurora.rose` era a la vez la niebla del fondo y el
 * color de todos los controles, asi que la aplicacion entera hablaba con la voz
 * de un blob decorativo. Ahora la marca es `brand.carmine` y esta familia no
 * sale nunca del lienzo. Lo comprueba `palette.test.ts`.
 */
/**
 * Opacidad de la malla por tema. BAJADAS DE 0.5 Y 0.42.
 *
 * A los valores anteriores el aurora seguia siendo lo primero que se veia al
 * abrir la aplicacion: sobre el hueso, el lobulo ciruela caia justo detras del
 * titular de las pantallas de acceso y lo dejaba lavado, con las esquinas de la
 * pantalla en dos tonos distintos. La pantalla se leia sucia, no atmosferica.
 *
 * Es la misma conclusion de D.1 —«el aurora era el elemento mas fuerte de las
 * doce pantallas»— llevada hasta el final. Alli se resolvio quitando el aurora
 * de las pantallas de producto y bajandolo a 0.42 en las de entrada; esto
 * segundo se anoto entonces como que «ayudo sin arreglarlo». Esto lo arregla.
 * D-25 lo devuelve a las pestanas en modo suave, con estos mismos valores.
 *
 * El oscuro baja menos: sobre ciruela profundo el mismo valor se ve la mitad, y
 * ahi el aurora es lo unico que separa el fondo de un negro plano.
 */
export const auroraOpacity = { light: 0.2, dark: 0.38 } as const;

/**
 * Volumen del corazon del arranque y del icono. **Solo identidad.** Ver D-27.
 *
 * No es otra familia de marca: son las luces y sombras del mismo carmin, para
 * que un relleno plano se lea como un objeto con volumen. `lit` es el carmin
 * llevado hacia el hueso, `shade` y `core` hacia la ciruela. Los brillos son
 * hueso con alfa, nunca blanco puro. Cada color con alfa tiene su pareja
 * transparente del mismo tono: un degradado hacia `transparent` pasa por gris y
 * deja un filo sucio.
 *
 * Solo lo consume `heartArt.ts`, que es el dibujo compartido entre la pantalla
 * y el script de iconos. Lo comprueba `palette.test.ts`.
 */
export const heart = {
  lit: '#D9546C',
  shade: '#5E0C20',
  core: '#33081A',
  bounce: 'rgba(236, 118, 142, 0.38)',
  bounceClear: 'rgba(236, 118, 142, 0)',
  sheen: 'rgba(252, 248, 244, 0.5)',
  sheenClear: 'rgba(252, 248, 244, 0)',
  spark: 'rgba(252, 248, 244, 0.95)',
  sparkClear: 'rgba(252, 248, 244, 0)',
  shadowLight: 'rgba(23, 16, 25, 0.34)',
  shadowLightClear: 'rgba(23, 16, 25, 0)',
  shadowDark: 'rgba(158, 27, 50, 0.5)',
  shadowDarkClear: 'rgba(158, 27, 50, 0)',
  glowLight: 'rgba(190, 74, 94, 0.3)',
  glowLightClear: 'rgba(190, 74, 94, 0)',
  glowDark: 'rgba(224, 114, 140, 0.3)',
  glowDarkClear: 'rgba(224, 114, 140, 0)',
} as const;

export const aurora = {
  carmine: '#BE4A5E',
  plum: '#6E3A63',
  haze: '#E8C9C6',
} as const;

/**
 * Tono de cada estado de un estudio en el historial y el inicio.
 *
 * FUERA DE `semantic` A PROPOSITO. Lo natural seria verde para listo, ambar para
 * en curso y rojo para fallido, y son exactamente los colores de la jerarquia de
 * alarma de la IEC 60601-1-8. Ensenar aqui que verde es "bien" es un aprendizaje
 * que el usuario se lleva a la pantalla donde verde significa "paciente estable".
 * Estos tonos salen de la propia paleta: tinta, ciruela, carmin y gris.
 *
 * NUNCA VAN SOLOS (§12.3). Analizando y fallido tienen casi la misma luminosidad
 * —1,09:1 entre ellos en los dos temas— y solo los separa el tono, que alguien
 * con daltonismo no distingue. Por eso cada estado lleva siempre su texto, y los
 * fallidos ademas su causa.
 *
 * El carmin de `failed` es TINTE de un punto y una etiqueta, no relleno: la misma
 * excepcion que usa la pestana activa (§12.9). Contraste medido contra `surface`
 * de cada tema, todos por encima de 6:1; lo fija `studyTone.test.ts`.
 */
export const studyTone = {
  light: {
    waiting: '#6B5560',
    sending: '#6B5560',
    analyzing: '#6E3A63',
    ready: '#1F1622',
    failed: '#9E1B32',
  },
  dark: {
    waiting: '#B9A4BC',
    sending: '#B9A4BC',
    analyzing: '#D9B3D6',
    ready: '#F5EBF1',
    failed: '#F4A0AE',
  },
} as const;

/**
 * RESERVADO. Jerarquia de prioridad de alarma de la IEC 60601-1-8.
 *
 * Nunca como decoracion, acento de marca, estado pulsado, borde o relleno
 * ilustrativo. Un boton "Guardar" rojo es una alarma inventada. El texto sobre
 * estos colores va en tinta oscura, no en blanco: ver la enmienda D-3.
 *
 * REGLA DE TAMANO (§12.9), mitad simetrica de la de `brand`: la alarma solo
 * ocupa superficies pequenas, siempre con icono y texto al lado, y **nunca es
 * un fondo grande**. Un rojo de alarma a ancho de pantalla convierte la
 * pantalla entera en la alarma.
 */
export const semantic = {
  alarmHigh: '#FF2D3E',
  alarmMedium: '#FFC53D',
  alarmLow: '#4CC9F0',
  ok: '#3DF57E',
} as const;

/** Radios compartidos: tarjetas suaves y controles en cápsula. */
export const radius = { pill: 999, card: 28, tile: 24, chip: 12 } as const;

export const gap = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const motion = { micro: 200, card: 350, screen: 500 } as const;

// ---------------------------------------------------------------------------
// Extensiones a §2. Ver el registro de desviaciones en src/design/README.md.
// ---------------------------------------------------------------------------

/**
 * Velos oscuros sobre contenido en vivo.
 *
 * Derivados de la ciruela de la identidad en lugar de un negro arbitrario, para
 * que el oscurecimiento comparta tinte con la paleta y no introduzca un gris
 * ajeno.
 */
export const scrim = {
  soft: 'rgba(23, 16, 25, 0.35)',
  strong: 'rgba(23, 16, 25, 0.62)',
} as const;

/** Opacidades reutilizadas. Evita decimales sueltos por los estilos. */
export const opacity = {
  ambientGrid: 0.06,
  /**
   * Latido difuso del fondo. Un solo valor para los dos temas: la separacion
   * por tema se probo y se retiro por falta de evidencia (D-10). Lo que cambia
   * con el tema es el **color**, no la opacidad.
   */
  bloom: 0.3,
  disabled: 0.35,
  /**
   * Derivación fuera de foco en el visor.
   *
   * NO ES `disabled`. Una derivación atenuada no está desactivada ni fuera de
   * juego: sigue siendo señal registrada del mismo paciente, y hay que poder
   * leerla para saber que el trazado está completo. Lo único que dice este
   * valor es «la observación que estás mirando no se apoya en esta».
   *
   * Por eso queda por encima de la retícula ambiente y por debajo de lo
   * desactivado: bastante contraste para seguir el trazo, bastante diferencia
   * para que el ojo vaya solo a las que importan.
   */
  leadUnfocused: 0.25,
  pressed: 0.7,
  /**
   * Guia de encuadre mientras se busca el encuadre.
   *
   * Al alinearse sube a 1. Ese cambio de luminancia, junto con el de grosor de
   * size.frameBorderAligned, ES el momento firma: la guia no cambia de tono.
   * Ver la nota de size.frameBorderAligned.
   */
  guideIdle: 0.5,
} as const;

/**
 * Tamanos en puntos.
 *
 * touchTarget es el minimo de §7 y no se baja por motivos esteticos: la app se
 * usa con guantes y con prisa.
 */
export const size = {
  noticeIcon: 20,
  summaryTile: 96,
  tabHeight: 52,
  tabLabelLineHeight: 18,
  tabIcon: 24,
  tabExpandedMinWidth: 300,
  tabExpandedMaxFontScale: 1.2,
  touchTarget: 44,
  hairline: 1,
  frameBorder: 3,
  /**
   * Grosor de la guia de encuadre cuando el encuadre esta alineado.
   *
   * POR QUE EL ESTADO CORRECTO NO CAMBIA DE COLOR. Lo natural seria ponerla
   * verde, pero el verde de "todo bien" es semantic.ok, que pertenece a la
   * jerarquia de alarma de la IEC 60601-1-8 y esta reservado. Usarlo aqui
   * ensenaria al usuario que en esta aplicacion el verde significa "correcto", y
   * ese aprendizaje se lo llevaria puesto a la pantalla donde el verde
   * significa "paciente estable". Diluir un vocabulario de alarma para adornar
   * un visor de camara es justo lo que §12 prohibe.
   *
   * La alternativa que se aplica es la de un instrumento optico: al enfocar, la
   * reticula no cambia de tono, se afila. Aqui la guia gana grosor y luminancia
   * durante los 200 ms de motion.micro y no toca el tono. Ver la desviacion
   * D-13 en src/design/README.md.
   */
  frameBorderAligned: 5,
  /**
   * Lado del icono que acompana a un campo de formulario.
   *
   * Mas pequeno que el de navegacion: aqui el icono no es el objeto que se toca,
   * es una marca de que se pide en ese hueco. Quien manda en la fila es el texto
   * que se escribe.
   */
  fieldIcon: 18,

  /** Area agarrable de una esquina de recorte. Igual al minimo tactil de §7. */
  cornerHandle: 44,
  /** Punto visible de la esquina, centrado en su area agarrable. */
  cornerHandleDot: 18,
  /** Diametro del nivel de burbuja que indica la inclinacion. */
  levelOuter: 56,
  /** Diametro de la zona central que corresponde a un encuadre alineado. */
  levelTarget: 16,
  /** Diametro del punto movil del nivel. */
  levelBubble: 12,
  /**
   * Grosor de la linea de cinco milimetros de la retícula de medicion.
   *
   * Doble que la fina, como en el papel: es lo que permite contar cuadros
   * grandes de un vistazo sin pararse a contar los pequenos.
   */
  gridBold: 2,
  /**
   * Grosor del trazado.
   *
   * Del orden del ancho real del trazo de un electrocardiografo, que ronda los
   * 0,4 mm. Mas fino se pierde sobre la retícula; mas grueso engorda las
   * deflexiones y falsea la lectura de amplitudes pequenas.
   */
  trace: 1.6,
  shutterOuter: 76,
  shutterInner: 62,
} as const;

/**
 * Composicion del vidrio de §3.
 *
 * LOS TINTES SUBIERON, y no por estetica. Desde que el objetivo de desenfoque
 * incluye el contenido que se desplaza —y no solo el fondo, que era el fallo de
 * D.4—, lo que puede pasar por debajo del vidrio ya no es una malla suave: es
 * un bloque de tinta o de carmin a ancho completo. Medido contra ese peor caso,
 * el 0.42 anterior dejaba las etiquetas de la barra en 3.67:1. Con 0.55 en claro
 * y 0.68 en oscuro ningun compuesto baja de 4.5:1. Ver §2 del README y D-18.
 */
export const glass = {
  tintLight: 'rgba(254, 254, 253, 0.55)',
  tintDark: 'rgba(49, 35, 58, 0.68)',
  borderLight: 'rgba(252, 248, 244, 0.55)',
  borderDark: 'rgba(245, 235, 241, 0.20)',
  /**
   * La burbuja que marca la pestana activa, dentro de la barra de vidrio.
   *
   * Un velo, no un relleno. Una segunda capa de desenfoque dentro de la barra
   * costaria otra pasada de vidrio en cada fotograma de la animacion, en un
   * telefono donde ya se midio un 30 % de fotogramas a tirones; un velo
   * translucido con su filo claro se lee como vidrio sobre vidrio sin ese coste.
   *
   * En claro lleva un punto de carmin para que se distinga de la propia barra,
   * que tambien es clara; a este porcentaje es un tinte, no el relleno de carmin
   * que la regla 12.9 prohibe en superficies pequenas.
   */
  selectionLight: 'rgba(190, 74, 94, 0.13)',
  selectionDark: 'rgba(245, 235, 241, 0.14)',
  shadow: '#5A1C2E',
} as const;

/**
 * Reticula ambiental de la capa 3.
 *
 * UN SOLO PASO, sin linea gruesa. La version anterior tenia paso fino 8 y paso
 * grueso 40: una relacion de 1 a 5 que es exactamente la del papel de
 * electrocardiograma real, asi que invitaba a contar cuadros grandes sobre una
 * textura que no esta calibrada. Con la retícula de medicion de la Etapa 4 ya en
 * escena, §12.5 —«una retícula de medicion esta calibrada o no existe»— lo
 * convierte en un riesgo de lectura, no en un adorno neutro.
 *
 * Con un solo nivel no hay cuadro grande que contar, y la retícula de dos
 * niveles queda como vocabulario exclusivo del componente que si mide. El paso
 * es 11 a proposito: no guarda relacion entera con ningun milimetro.
 */
export const ambientGrid = { step: 11, offset: 3 } as const;

/** Desenfoques de §3 y §8. Por encima de 80 el vidrio parece plastico. */
export const blur = {
  card: 28,
  chrome: 60,
  aurora: 14,
  bloom: 48,
} as const;

/**
 * Superficie escarchada de las tarjetas informativas de las pestanas.
 *
 * NO ES VIDRIO CON DESENFOQUE. Un BlurView dentro del contenido que se desplaza
 * queda dentro de su propio objetivo y cae a un tinte plano (ver
 * `AuthScreenLayout`). Esto es translucidez sin desenfoque: deja pasar el color de
 * la atmosfera suave sin pagar una pasada de GPU por tarjeta. El relleno es la
 * superficie del tema con alfa; el contraste se mide sobre el blob mas contrario
 * de la atmosfera en `contrast.test.ts`.
 */
export const frost = {
  // `rim` es el filo iluminado (arriba e izquierda) y `edge` el que queda en sombra
  // (abajo y derecha). La luz llega de arriba, como en el resto de la app, y ese
  // contraste entre filos es lo que da volumen a la tarjeta sin pintar vidrio.
  light: {
    fill: 'rgba(254, 254, 253, 0.72)',
    rim: 'rgba(254, 254, 253, 0.95)',
    edge: 'rgba(205, 182, 178, 0.55)',
  },
  // En oscuro la sombra usa el mismo filo que la barra de vidrio.
  dark: {
    fill: 'rgba(49, 35, 58, 0.62)',
    rim: 'rgba(245, 235, 241, 0.34)',
    edge: glass.borderDark,
  },
} as const;
