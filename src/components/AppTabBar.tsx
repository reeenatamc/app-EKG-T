import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { makeMutable, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TabIconName } from '@/components/icons/tabIcons';
import { TabBarItem } from '@/components/TabBarItem';
import { TAB_TEXT } from '@/constants/shellText';
import { useReducedMotion } from '@/design/a11y';
import { GlassChrome } from '@/design/Glass';
import { spring } from '@/design/motion';
import { useTheme } from '@/design/theme';
import { gap, glass, radius, size } from '@/design/tokens';
import { CAPTURE_SLOT, slotForPath, slotOffset, slotWidth, TAB_SLOTS } from '@/shell/tabBar';

/** Etiqueta e icono de cada hueco, en el mismo orden que TAB_SLOTS. */
const SLOT_CONTENT: readonly { readonly label: string; readonly icon: TabIconName }[] = [
  { label: TAB_TEXT.home, icon: 'home' },
  { label: TAB_TEXT.history, icon: 'history' },
  { label: TAB_TEXT.capture, icon: 'capture' },
  { label: TAB_TEXT.profile, icon: 'profile' },
];

/**
 * Hueco en el que esta —o hacia el que viaja— la burbuja.
 *
 * A NIVEL DE MODULO, Y ES LA PIEZA QUE HACE POSIBLE LA ANIMACION. La barra no la
 * dibuja el router: la monta cada pantalla, para que su vidrio desenfoque lo que
 * pasa por debajo. Al cambiar de pestana, la barra de la pantalla nueva nace de
 * cero y no sabria de donde venia la burbuja. Con el valor aqui fuera, las dos
 * barras —la que se va y la que llega, montadas a la vez durante el fundido— leen
 * la misma posicion, y lo que se ve es una sola burbuja deslizandose.
 *
 * -1 significa que todavia no se ha colocado en ningun sitio.
 */
const bubbleSlot = makeMutable(-1);

/** Ultimo hueco de la barra. La burbuja nunca pasa de aqui. */
const LAST_SLOT = TAB_SLOTS.length - 1;

/** Destino de la burbuja, para no reiniciar el muelle hacia donde ya va. */
let bubbleTarget = -1;

/**
 * Lleva la burbuja a un hueco.
 *
 * La primera vez aparece alli sin viajar: no venia de ningun sitio. Despues se
 * desliza con el muelle unico de §11, salvo con movimiento reducido, que salta.
 *
 * @param slot Hueco de destino.
 * @param reduceMotion Cierto si hay que renunciar al movimiento.
 */
function moveBubble(slot: number, reduceMotion: boolean): void {
  if (slot === bubbleTarget) {
    return;
  }
  const isFirst = bubbleTarget < 0;
  bubbleTarget = slot;
  bubbleSlot.value = isFirst || reduceMotion ? slot : withSpring(slot, spring);
}

/**
 * Barra de pestanas flotante de vidrio, con burbuja deslizante.
 *
 * SE MONTA DESDE DENTRO DE LA PANTALLA, por la prop `chrome` de `Background`, y
 * NO desde la prop `tabBar` del router: montada desde el layout del grupo quedaba
 * fuera del objetivo de desenfoque y expo-blur caia en silencio a un tinte (D.4).
 *
 * LA PESTANA ACTIVA SE MARCA CON UNA BURBUJA QUE VIAJA. Antes solo cambiaba de
 * color la etiqueta, y un cambio de color en trece puntos sobre vidrio es facil de
 * no ver. La burbuja sale hacia su destino en el mismo toque, antes de que la
 * ruta cambie, asi que la respuesta no espera a que la pantalla nueva monte.
 *
 * "Capturar" es una accion y no una pestana: abre la captura a pantalla completa.
 * La burbuja nunca va alli.
 *
 * @returns La barra de pestanas.
 */
export function AppTabBar() {
  const insets = useSafeAreaInsets();
  const [rowWidth, setRowWidth] = useState(0);

  return (
    <View style={[styles.slot, { bottom: insets.bottom + gap.md }]} pointerEvents="box-none">
      <GlassChrome>
        <View
          style={styles.row}
          onLayout={(event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width)}
        >
          {rowWidth > 0 ? <TabBubble width={slotWidth(rowWidth, gap.xs, gap.xs)} /> : null}
          <TabBarItems />
        </View>
      </GlassChrome>
    </View>
  );
}

/**
 * Lo que hace tocar un hueco.
 *
 * La burbuja sale antes de navegar, no despues: asi la respuesta al dedo no
 * espera a que monte la pantalla nueva.
 *
 * @param slot Hueco tocado.
 * @param router Navegador.
 * @param reduceMotion Cierto si hay que renunciar al movimiento.
 */
function pressSlot(
  slot: number,
  router: ReturnType<typeof useRouter>,
  reduceMotion: boolean,
): void {
  const route = TAB_SLOTS[slot];
  if (slot === CAPTURE_SLOT || route === null || route === undefined) {
    router.push('/capture');
    return;
  }
  moveBubble(slot, reduceMotion);
  router.navigate(route);
}

/** Los cuatro huecos: tres pestanas y la accion de captura. */
function TabBarItems() {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const active = slotForPath(pathname);

  // Tambien cuando la ruta cambia sin pasar por la barra, por ejemplo desde un
  // boton del inicio que lleva al historial.
  useEffect(() => {
    if (active !== null) {
      moveBubble(active, reduceMotion);
    }
  }, [active, reduceMotion]);

  const press = (slot: number) => pressSlot(slot, router, reduceMotion);

  return (
    <>
      {SLOT_CONTENT.map((content, slot) => (
        <TabBarItem
          key={content.icon}
          label={content.label}
          icon={content.icon}
          isActive={slot === active}
          role={slot === CAPTURE_SLOT ? 'button' : 'tab'}
          onPress={() => press(slot)}
        />
      ))}
    </>
  );
}

/**
 * La burbuja: un velo translucido con filo claro, detras del hueco activo.
 *
 * Solo se anima `transform`, como pide §11, y corre en el hilo de interfaz.
 */
function TabBubble({ width }: { readonly width: number }) {
  const theme = useTheme();
  const isDark = theme.mode === 'dark';

  // El muelle se pasa un poco del destino, y entre pestanas eso es lo que le da
  // vida. En los extremos no: la burbuja chocaba con el borde redondeado de la
  // barra al llegar a Inicio o a Perfil. Se acota solo ahi.
  const motion = useAnimatedStyle(() => {
    const slot = Math.min(Math.max(bubbleSlot.value, 0), LAST_SLOT);

    return {
      opacity: bubbleSlot.value < 0 ? 0 : 1,
      transform: [{ translateX: slotOffset(slot, width, gap.xs, gap.xs) }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          width,
          backgroundColor: isDark ? glass.selectionDark : glass.selectionLight,
          borderColor: isDark ? glass.selectionEdgeDark : glass.selectionEdgeLight,
        },
        motion,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', left: gap.md, right: gap.md },
  row: { flexDirection: 'row', padding: gap.xs, gap: gap.xs },
  bubble: {
    position: 'absolute',
    top: gap.xs,
    bottom: gap.xs,
    left: 0,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: size.hairline,
  },
});
