import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { cardShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { TileGlow } from '@/design/TileGlow';
import { brand, gap, radius, tinted } from '@/design/tokens';
import { type } from '@/design/type';

/** Los tres tamanos que permite §10. Ni uno mas: a partir de cuatro deja de leerse como sistema. */
export type BentoSize = 'hero' | 'wide' | 'half';

/**
 * Tono del modulo, o sea su relleno.
 *
 * `brand` es carmin cargado y **solo lo usa el hero**, que es la superficie mas
 * grande de la pantalla: es una de las tres excepciones de la regla de tamano de
 * §12.9. `tinted` es un vino desaturado del mismo palo, o sea que se distingue
 * por saturacion y no por claridad, asi que no compite. `plain` no lleva
 * degradado.
 */
export type BentoTone = 'plain' | 'brand' | 'tinted';

interface BentoTileProps {
  readonly size: BentoSize;
  readonly title: string;
  readonly body?: string;
  readonly tone?: BentoTone;
  readonly children?: ReactNode;
}

/** Foco y borde del degradado de cada tono, y la tinta que va encima. */
interface TonePaint {
  readonly focus: string;
  readonly edge: string;
  readonly title: string;
  readonly body: string;
}

/**
 * Alto minimo por tamano, en puntos.
 *
 * `half` era `aspectRatio: 1`, o sea un cuadrado forzado, y en el dispositivo eso
 * dejaba dos tercios del modulo vacios: sus tres palabras se apoyaban arriba y
 * debajo no habia nada. Un hueco asi no se lee como aire, se lee como sin
 * terminar. Con un alto minimo el modulo respira sin fingir que hay contenido.
 */
const MIN_HEIGHT: Record<BentoSize, number | undefined> = {
  hero: undefined,
  wide: undefined,
  half: 148,
};

/**
 * Resuelve el relleno de un tono.
 *
 * NINGUNO DE LOS DOS DEPENDE DEL TEMA. El hero nunca dependio: un carmin cargado
 * es igual de carmin sobre hueso que sobre ciruela. La subtarjeta acaba de
 * dejar de depender, ver `tinted`. Lo que cambia con el tema es el lienzo de
 * detras, no las tarjetas.
 */
function paintFor(tone: BentoTone): TonePaint | null {
  if (tone === 'plain') {
    return null;
  }

  if (tone === 'brand') {
    return {
      focus: brand.carmineLit,
      edge: brand.carmineDeep,
      title: brand.onCarmine,
      body: brand.onCarmineLow,
    };
  }

  return tinted;
}

/**
 * Modulo del inicio en rejilla bento.
 *
 * Se apoya en superficie **opaca**, nunca en vidrio: la barra de pestanas ya
 * consume una de las dos superficies que permite §3, y llenar el inicio de
 * tarjetas de vidrio agotaria el presupuesto en la primera pantalla.
 *
 * NI BORDE NI RELLENO PLANO: SOMBRA Y DEGRADADO. Desde D-20 el lienzo de las
 * pantallas de producto es hueso puro, o sea el mismo valor que la superficie,
 * asi que una tarjeta clara no puede separarse por color. Se separa como se
 * separa un objeto apoyado en una mesa de su mismo color: por la sombra. El borde
 * se retira porque un contorno sobre una sombra son dos formas de decir lo mismo.
 *
 * Un modulo es una idea. Si hace falta meter dos metricas que compiten, son dos
 * modulos (§10).
 *
 * @param size Tamano dentro de la rejilla.
 * @param title Titulo del modulo.
 * @param body Texto de apoyo, opcional.
 * @param tone Relleno del modulo.
 * @param children Contenido propio del modulo, opcional.
 * @returns El modulo renderizado.
 */
export function BentoTile({ size, title, body, tone = 'plain', children }: BentoTileProps) {
  const theme = useTheme();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const paint = paintFor(tone);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  };

  return (
    <View
      onLayout={paint === null ? undefined : onLayout}
      style={[
        styles.tile,
        size === 'half' ? styles.half : styles.full,
        cardShadow,
        // El recorte solo hace falta con degradado: sin el, Android lo pinta
        // cuadrado por debajo de la esquina redondeada, igual que le pasa al
        // vidrio (§3). Y es incompatible con la sombra en iOS, ver `raised`.
        paint === null ? null : styles.clipped,
        { backgroundColor: paint === null ? theme.surface : paint.edge },
        { minHeight: MIN_HEIGHT[size] },
      ]}
    >
      {paint !== null && box.width > 0 ? <TileGlow {...box} {...paint} /> : null}
      <TileText size={size} title={title} body={body} paint={paint} />
      {children}
    </View>
  );
}

interface TileTextProps extends Pick<BentoTileProps, 'size' | 'title' | 'body'> {
  readonly paint: TonePaint | null;
}

/** Titulo y linea de apoyo, con la tinta que corresponde al relleno. */
function TileText({ size, title, body, paint }: TileTextProps) {
  const theme = useTheme();
  const titleColor = paint?.title ?? theme.textHigh;
  const bodyColor = paint?.body ?? theme.textLow;

  return (
    <>
      <Text style={[size === 'hero' ? type.h1 : type.body, { color: titleColor }]}>{title}</Text>
      {body === undefined ? null : <Text style={[type.caption, { color: bodyColor }]}>{body}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  tile: {
    padding: gap.lg,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    gap: gap.sm,
  },

  clipped: { overflow: 'hidden' },

  full: { width: '100%' },
  half: { flex: 1 },
});
