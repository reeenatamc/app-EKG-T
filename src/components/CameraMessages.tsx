import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { CameraMessages as Messages } from '@/camera/cameraMessages';
import type { Rect } from '@/camera/framing';
import { isSideways, type QuarterTurn } from '@/camera/turn';
import { gap, paperDark, radius, scrim } from '@/design/tokens';
import { type } from '@/design/type';

interface CameraMessagesProps {
  readonly messages: Messages;
  /** Donde se apoya el bloque, en coordenadas de la pantalla. */
  readonly area: Rect;
  /** Giro del telefono: el bloque gira con el. */
  readonly turn: QuarterTurn;
  /** Contra que borde del area se pega, visto con el telefono girado. */
  readonly edge: 'top' | 'bottom';
}

/**
 * Los textos de la captura, derechos con el telefono en cualquier postura.
 *
 * GIRA EL BLOQUE, NO LA PANTALLA. La aplicacion esta bloqueada en vertical, y
 * cambiarlo exigiria recompilar la parte nativa y redisenar cada pantalla en
 * apaisado. Las camaras de sistema hacen lo mismo que esto: la disposicion se
 * queda quieta y lo que se lee gira. El bloque se dimensiona con el ancho y el
 * alto del area cambiados cuando el telefono esta de lado, y se gira alrededor
 * de su centro, que es el del area: asi cae exactamente encima.
 *
 * Todo va sobre velo solido y no sobre vidrio, por lo de siempre en esta
 * pantalla: la imagen en vivo cambia de claridad cada vez que se mueve.
 *
 * No intercepta toques: debajo esta la vista previa y, en los bordes, controles.
 *
 * @param messages Etiqueta, titulo y avisos.
 * @param area Region donde se apoya.
 * @param turn Giro del telefono.
 * @param edge Borde del area contra el que se pega.
 * @returns El bloque de textos.
 */
export function CameraMessages({ messages, area, turn, edge }: CameraMessagesProps) {
  return (
    <View pointerEvents="none" style={[styles.block, placeTurned(area, turn, edge)]}>
      {messages.eyebrow === null ? null : (
        <Text style={[type.eyebrow, styles.pill, styles.eyebrow]}>{messages.eyebrow}</Text>
      )}
      <Text style={[type.body, styles.pill]}>{messages.title}</Text>
      {messages.notes.map((note) => (
        <Text key={note} style={[type.caption, styles.pill]}>
          {note}
        </Text>
      ))}
    </View>
  );
}

/**
 * Coloca un bloque sobre un area, girado.
 *
 * @param area Region de destino, sin girar.
 * @param turn Giro a aplicar.
 * @param edge Borde contra el que se apila el contenido, ya girado.
 * @returns Posicion, tamano y giro del bloque.
 */
function placeTurned(area: Rect, turn: QuarterTurn, edge: 'top' | 'bottom'): ViewStyle {
  const sideways = isSideways(turn);
  const width = sideways ? area.height : area.width;
  const height = sideways ? area.width : area.height;

  return {
    left: area.x + (area.width - width) / 2,
    top: area.y + (area.height - height) / 2,
    width,
    height,
    justifyContent: edge === 'top' ? 'flex-start' : 'flex-end',
    transform: [{ rotate: `${turn}deg` }],
  };
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    alignItems: 'center',
    gap: gap.xs,
    padding: gap.md,
    overflow: 'hidden',
  },
  pill: {
    color: paperDark.textHigh,
    backgroundColor: scrim.strong,
    paddingVertical: gap.xs,
    paddingHorizontal: gap.md,
    borderRadius: radius.pill,
    overflow: 'hidden',
    textAlign: 'center',
  },
  eyebrow: { paddingVertical: 2, color: paperDark.textLow },
});
