import { useCallback, useEffect, useRef, useState } from 'react';

import { capturePhoto, type CaptureRequest, type CapturedPhoto } from '@/camera/capturePhoto';
import { reportCaptureCompleted, reportPreviewReady } from '@/camera/captureTimings';

export interface CameraCapture {
  /** Cierto cuando la vista previa ya puede tomar fotos. */
  readonly isReady: boolean;
  /** Cierto mientras hay una captura en curso. */
  readonly isCapturing: boolean;
  readonly capture: (request: CaptureRequest) => void;
  readonly handlePreviewReady: () => void;
}

/**
 * Gobierna el ciclo de vida de la captura: desde que la vista previa queda
 * operativa hasta que la foto recortada esta lista.
 *
 * capture no devuelve una promesa a proposito. Marca el estado de ocupado de
 * forma sincrona, antes de tocar la camara, para que la retroalimentacion del
 * obturador no dependa de cuanto tarde el modulo nativo.
 *
 * @param onCaptured Se invoca con la foto ya recortada.
 * @returns Estado de la captura y sus manejadores.
 */
export function useCameraCapture(onCaptured: (photo: CapturedPhoto) => void): CameraCapture {
  const mountedAt = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // El cronometro arranca en un efecto y no en el cuerpo del hook: leer el
  // reloj durante el renderizado lo haria impuro y React puede repetirlo.
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const handlePreviewReady = useCallback(() => {
    reportPreviewReady(mountedAt.current);
    setIsReady(true);
  }, []);

  const capture = useCallback(
    (request: CaptureRequest) => {
      const startedAt = Date.now();
      setIsCapturing(true);

      void capturePhoto(request)
        .then((photo) => {
          reportCaptureCompleted(startedAt);
          setIsCapturing(false);
          onCaptured(photo);
        })
        .catch((error: unknown) => {
          // No se bloquea al usuario: se libera el obturador para reintentar.
          setIsCapturing(false);
          console.error('[capture] no se pudo completar la captura', error);
        });
    },
    [onCaptured],
  );

  return { isReady, isCapturing, capture, handlePreviewReady };
}
