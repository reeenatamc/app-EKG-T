import { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import { CAPTURE_FRAME } from '@/camera/captureConfig';
import { computeFrameRect, type Rect, type Size } from '@/camera/framing';
import { findMount, type MountId } from '@/camera/mounts';
import { turnSize, type QuarterTurn } from '@/camera/turn';

export interface PreviewFrame {
  /** Tamano medido del contenedor, o null antes del primer diseno. */
  readonly container: Size | null;
  /** Marco de encuadre derivado del contenedor, o null antes del primer diseno. */
  readonly frame: Rect | null;
  readonly handleLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Mide el contenedor de la vista previa y deriva el marco de encuadre.
 *
 * El tamano se mide con onLayout en lugar de leerlo de Dimensions porque el
 * contenedor no ocupa toda la pantalla en todos los dispositivos: barras del
 * sistema y muescas lo reducen. Usar la medida real es lo que hace que el
 * recorte posterior coincida con lo que el usuario vio.
 *
 * La proporcion del marco la manda el montaje elegido. Un 12x1 es una columna
 * de doce bandas apiladas y ocupa una hoja mas alta que ancha; un 6x2 es casi
 * el doble de ancho que alto. Encuadrar los dos con el mismo rectangulo dejaria
 * papel fuera en un caso y aire de sobra en el otro.
 *
 * CON EL TELEFONO DE LADO, EL MARCO SE ALARGA A LO LARGO DEL TELEFONO. La
 * pantalla sigue en vertical, asi que un registro apaisado visto con el telefono
 * en horizontal ocupa, en coordenadas de pantalla, un rectangulo alto: la misma
 * proporcion con ancho y alto cambiados. Es lo que aprovecha el lado largo del
 * sensor, que es para lo que se gira el telefono.
 *
 * @param mountId Montaje elegido, que decide la proporcion del marco.
 * @param turn Giro del telefono.
 * @returns El contenedor medido, el marco derivado y el manejador de diseno.
 */
export function usePreviewFrame(mountId: MountId, turn: QuarterTurn): PreviewFrame {
  const [container, setContainer] = useState<Size | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainer({ width, height });
  }, []);

  const frame = useMemo(() => {
    if (container === null) {
      return null;
    }
    return computeFrameRect(
      container,
      turnSize(findMount(mountId).aspect, turn),
      CAPTURE_FRAME.horizontalMarginRatio,
      CAPTURE_FRAME.maxHeightRatio,
    );
  }, [container, mountId, turn]);

  return { container, frame, handleLayout };
}
