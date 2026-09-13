import { BlurTargetView } from 'expo-blur';
import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackgroundLayers } from '@/design/BackgroundLayers';
import { BlurTargetContext } from '@/design/blurTarget';
import { useTheme } from '@/design/theme';

interface BackgroundProps {
  readonly children: ReactNode;
  /**
   * Vidrio flotante de la pantalla: barra de pestanas, cabeceras, pildoras.
   *
   * Va en una prop propia y no dentro de children porque su sitio en el arbol es
   * lo que decide si desenfoca algo. Ver la explicacion de abajo.
   */
  readonly chrome?: ReactNode;
  /**
   * Monta las capas 1 a 3: malla, latido difuso y retícula.
   *
   * Falso deja el lienzo **plano**, con el color de `theme.canvas` y nada mas: ni
   * un solo nodo de Skia. `'soft'` es la atmosfera de las pestanas: malla y
   * retícula sobre el lienzo plano, sin latido difuso, para que la escarcha de las
   * tarjetas tenga color que dejar pasar. Ver D-20 y D-25.
   */
  readonly atmosphere?: boolean | 'soft';
  /**
   * Oculta el latido difuso. Util en pantallas cuyo contenido principal es una
   * imagen o un trazado real, donde un segundo trazado de fondo confundiria.
   *
   * Solo tiene efecto con `atmosphere` activa: sin atmosfera no hay capa 2 que
   * ocultar.
   */
  readonly showSignalBloom?: boolean;
}

/**
 * Compone las capas 0 a 5 de SKILL.md §1 y publica el objetivo de desenfoque.
 *
 * EL CONTENIDO VA DENTRO DEL OBJETIVO DE DESENFOQUE, y el vidrio va encima de
 * ese objetivo, como hermano. Es la correccion central de D.4 y merece la
 * explicacion completa, porque la version anterior parecia correcta:
 *
 * Antes, el `BlurTargetView` envolvia solo las capas 1 a 3 y `children` quedaba
 * fuera. Eso daba dos fallos encadenados. El primero, que la barra de pestanas
 * se monta desde el layout del grupo de rutas —por **encima** de este
 * componente—, asi que `useBlurTarget()` devolvia null y expo-blur caia en
 * silencio a «sin desenfoque»: el vidrio seguia pintando su tinte y en una
 * captura estatica parecia funcionar. El segundo, mas de fondo: aun con el
 * objetivo bien resuelto, ese objetivo contenia **solo el fondo**, que es una
 * malla suave y practicamente inmovil. Desenfocar una malla suave no se ve.
 *
 * Ahora el objetivo contiene el fondo Y el contenido que se desplaza, asi que al
 * scrollear pasan tarjetas, titulares y bloques de color por debajo del vidrio y
 * el desenfoque tiene algo que ensenar. El vidrio queda fuera del objetivo,
 * encima, que es la relacion que expo-blur espera y ademas evita cualquier duda
 * sobre desenfocarse a si mismo.
 *
 * Consecuencia medida: lo que puede pasar por debajo del vidrio ya no es una
 * malla, es un bloque de tinta o de carmin a ancho completo. Por eso subieron los
 * tintes de `glass` — con el 0.42 anterior las etiquetas de la barra caian a
 * 3.67:1. Ver §2 del README.
 *
 * LA ATMOSFERA NO ES UNIVERSAL, que es una desviacion deliberada de §1. Las
 * pantallas de **entrada** —splash, introduccion y las cinco de acceso— llevan
 * las seis capas. Las de **producto** —las tres pestanas, ajustes, el detalle del
 * estudio y el flujo de captura— van sobre lienzo plano. El motivo es que una
 * malla decorativa detras de una lista de estudios compite con el contenido: en
 * la lamina de contacto de D.1 el aurora era el elemento mas fuerte de las doce
 * pantallas. Sin atmosfera no se monta ni un nodo de Skia, asi que ademas
 * desaparece un `<Canvas>` de esas pantallas. Ver D-20.
 *
 * @param children Capa 5: el contenido, que pasa por debajo del vidrio.
 * @param chrome Capa 4: el vidrio flotante, que se monta encima del objetivo.
 * @param atmosphere Falso para dejar el lienzo plano; `'soft'` para la atmosfera de las pestanas.
 * @param showSignalBloom Falso para omitir la capa 2.
 * @returns La pantalla con su fondo compuesto.
 */
export function Background({
  children,
  chrome,
  atmosphere = true,
  showSignalBloom = true,
}: BackgroundProps) {
  const theme = useTheme();
  const blurTarget = useRef<View>(null);
  const { layout, onLayout } = useViewLayout();

  // Solo la entrada va sobre el lienzo en sombra. Las pestanas, con o sin atmosfera
  // suave, conservan el lienzo plano del producto. En oscuro los dos coinciden.
  const ground = atmosphere === true ? theme.canvas : theme.canvasFlat;

  return (
    <View style={[styles.root, { backgroundColor: ground }]} onLayout={onLayout}>
      <BlurTargetView ref={blurTarget} style={styles.target}>
        <CanvasFill color={ground} />
        <Atmosphere mode={atmosphere} layout={layout} showSignalBloom={showSignalBloom} />
        {children}
        {atmosphere === true ? null : <StatusScrim color={ground} />}
      </BlurTargetView>

      {chrome === undefined ? null : (
        <BlurTargetContext.Provider value={blurTarget}>{chrome}</BlurTargetContext.Provider>
      )}
    </View>
  );
}

/**
 * Tamano de una vista, para dimensionar el lienzo de Skia que la llena.
 *
 * @returns El tamano medido y el manejador que lo actualiza.
 */
function useViewLayout() {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  return { layout, onLayout };
}

interface AtmosphereProps {
  readonly mode: BackgroundProps['atmosphere'];
  readonly layout: { readonly width: number; readonly height: number };
  readonly showSignalBloom: boolean;
}

/**
 * Capas 1 a 3, o nada.
 *
 * Nada sin atmosfera, y nada hasta que la vista tiene tamano: un lienzo de cero
 * puntos no dibuja. En modo suave nunca lleva el latido difuso.
 *
 * @param mode Atmosfera pedida por la pantalla.
 * @param layout Tamano de la pantalla.
 * @param showSignalBloom Falso para omitir la capa 2.
 * @returns El lienzo con sus capas, o null.
 */
function Atmosphere({ mode, layout, showSignalBloom }: AtmosphereProps) {
  if (mode === false || layout.width === 0 || layout.height === 0) {
    return null;
  }

  return <BackgroundLayers {...layout} showSignalBloom={showSignalBloom && mode !== 'soft'} />;
}

/**
 * Color del lienzo, pintado DENTRO del objetivo de desenfoque.
 *
 * ES UN HIJO Y NO UN `backgroundColor` DEL OBJETIVO, y esa distincion es la
 * diferencia entre que el vidrio desenfoque o no desenfoque nada.
 *
 * `ExpoBlurTargetView` no se fotografia a si mismo: en su constructor crea un
 * `BlurTarget` interno y REPARENTA ahi a todos sus hijos, y lo que la camara del
 * desenfoque dibuja es ese objetivo interno. Un `backgroundColor` puesto en el
 * componente se queda en el envoltorio de fuera, que nunca entra en la foto. Con
 * eso, las zonas sin contenido se fotografian transparentes y el vidrio acaba
 * ensenando solo el color con que Android limpia el fotograma: un gris neutro
 * que no esta en ninguna paleta y que no cambia por mucho que cambie el fondo.
 *
 * Medido en la barra de pestanas sobre lienzo hueso: #CBC9C7 con el color en el
 * envoltorio. Para descartar que fuera otra cosa se pinto el envoltorio de verde
 * puro y la barra siguio saliendo #CBC9C7, identica hasta el byte. Pintado aqui
 * dentro, esa misma prueba en verde dio #C3F8BF —predicho #BFFABB por la
 * aritmetica del tinte—, o sea que el desenfoque por fin ve lo que tiene debajo.
 *
 * @param color Color del lienzo, ya resuelto contra el tema.
 * @returns La capa 0, dentro del objetivo.
 */
function CanvasFill({ color }: { readonly color: string }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} pointerEvents="none" />
  );
}

/**
 * Franja del color del lienzo detras de la barra de notificaciones.
 *
 * EL CONTENIDO NO PASA POR DEBAJO DE LA HORA. La aplicacion se dibuja de borde a
 * borde, y al desplazar una pantalla plana el texto cruzaba la barra de
 * notificaciones y se mezclaba con sus iconos. Solo en las pantallas planas: en
 * las de entrada cortaria la atmosfera con un borde recto.
 */
function StatusScrim({ color }: { readonly color: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      style={[styles.statusScrim, { height: insets.top, backgroundColor: color }]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // El objetivo ocupa la pantalla y aloja el contenido, asi que no puede ser
  // absoluteFill ni ignorar los toques como cuando solo contenia el fondo.
  target: { flex: 1 },
  statusScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
});
