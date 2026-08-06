import type { CameraView } from 'expo-camera';
import { useEffect, useState, type RefObject } from 'react';

import { selectLargestPictureSize } from '@/camera/pictureSize';

/**
 * Fija la captura en la mayor resolucion que ofrezca la camara.
 *
 * Sin esto, expo-camera captura al tamano por defecto del dispositivo, que en
 * Android rara vez es el maximo del sensor. Para esta aplicacion esa diferencia
 * no es un matiz de calidad: es la diferencia entre que el trazo llegue con
 * pixeles suficientes o que no llegue. Ver la cabecera de pictureSize.ts.
 *
 * Se consulta despues de que la camara avise de que esta lista, porque antes la
 * sesion no ha negociado aun sus formatos y la lista llega vacia.
 *
 * @param camera Referencia a la vista de camara.
 * @param isReady Cierto cuando la vista previa ya esta operativa.
 * @returns La resolucion a pasar a CameraView, o undefined para dejar la del sistema.
 */
export function useLargestPictureSize(
  camera: RefObject<CameraView | null>,
  isReady: boolean,
): string | undefined {
  const [pictureSize, setPictureSize] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isReady || camera.current === null) {
      return;
    }

    let cancelled = false;

    void camera.current
      .getAvailablePictureSizesAsync()
      .then((available) => {
        const largest = selectLargestPictureSize(available);
        if (cancelled || largest === null) {
          return;
        }
        // Se registra con warn porque es la convencion del proyecto para las
        // medidas que hay que poder leer en dispositivo: ver captureTimings.ts.
        console.warn('[capture] resolucion elegida', { largest, available });
        setPictureSize(largest);
      })
      .catch((error: unknown) => {
        // Quedarse con la resolucion por defecto es peor, pero es utilizable.
        // Se registra porque explica una perdida de calidad que si no seria
        // invisible.
        console.warn('[capture] no se pudo consultar la lista de resoluciones', error);
      });

    return () => {
      cancelled = true;
    };
  }, [camera, isReady]);

  return pictureSize;
}
