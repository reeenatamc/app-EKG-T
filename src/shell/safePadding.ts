import type { EdgeInsets } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gap } from '@/design/tokens';

/** Relleno vertical de una pantalla, ya sumado a las zonas del sistema. */
export interface SafePadding {
  readonly paddingTop: number;
  readonly paddingBottom: number;
}

/**
 * Suma el aire de la pantalla a las zonas que ocupa el sistema.
 *
 * La aplicacion se dibuja de borde a borde: la barra de notificaciones, el
 * recorte de la camara y la barra de gestos quedan encima del contenido. Un
 * relleno fijo no sabe cuanto miden, y en cada telefono miden distinto.
 *
 * EXISTE PORQUE HACERLO A MANO SE OLVIDA. Cada pantalla sumaba `insets.top` por
 * su cuenta, y dos no lo hacian: el detalle del estudio y el ajuste de esquinas
 * ponian dieciseis puntos desde el borde, asi que el boton de volver quedaba
 * debajo de la hora o del recorte de la camara.
 *
 * @param insets Zonas del sistema.
 * @param top Aire por encima del contenido, ademas de la zona del sistema.
 * @param bottom Aire por debajo del contenido, ademas de la zona del sistema.
 * @returns El relleno a aplicar.
 */
export function safePadding(insets: EdgeInsets, top: number, bottom: number): SafePadding {
  return { paddingTop: insets.top + top, paddingBottom: insets.bottom + bottom };
}

/**
 * El relleno seguro de la pantalla actual.
 *
 * @param top Aire por encima, sin contar la zona del sistema.
 * @param bottom Aire por debajo, sin contar la zona del sistema.
 * @returns El relleno a aplicar.
 */
export function useSafePadding(top: number = gap.lg, bottom: number = gap.lg): SafePadding {
  return safePadding(useSafeAreaInsets(), top, bottom);
}
