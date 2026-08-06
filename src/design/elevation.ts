import { Platform, type ViewStyle } from 'react-native';

import { glass } from '@/design/tokens';

/**
 * Sombras de superficie opaca.
 *
 * POR QUE UN MODULO Y NO UN TOKEN SUELTO. Una sombra no es un valor, son cinco
 * que solo tienen sentido juntos y que ademas se declaran distinto en cada
 * plataforma: iOS usa `shadow*` y Android `elevation`, que no son la misma
 * primitiva. Repartirlos por `tokens.ts` obligaria a recomponerlos a mano en cada
 * componente, y ahi es donde se desincronizan.
 *
 * SUSTITUYEN AL BORDE. Desde D-20 el lienzo de las pantallas de producto es hueso
 * puro, o sea el mismo valor que la superficie: una tarjeta clara no puede
 * separarse por color y se separa como un objeto apoyado en una mesa de su mismo
 * color. Las referencias de `inspo/` hacen exactamente eso —ninguna de las seis
 * lleva contorno— y ademas la sombra es ancha y baja, un halo y no un contorno
 * desplazado.
 *
 * El color en iOS sale de `glass.shadow`, que es carmin-ciruela y no un gris
 * ajeno. Android no deja elegir color de elevacion: ahi la sombra es gris del
 * sistema, y es una diferencia asumida entre plataformas.
 */

const CARD_ELEVATION = 3;
const ROW_ELEVATION = 1;

/** Modulo del bento: pieza grande que flota sobre el lienzo. */
export const cardShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: glass.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
  },
  android: { elevation: CARD_ELEVATION },
  default: {},
});

/**
 * Fila de una lista o de un formulario.
 *
 * Mas floja que la de tarjeta, y no por estetica: `StudyListRow` vive dentro de
 * una lista que recicla filas, asi que su sombra se paga por fila visible en cada
 * fotograma de scroll. Una fila no necesita flotar tanto como un modulo.
 */
export const rowShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: glass.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: ROW_ELEVATION },
  default: {},
});
