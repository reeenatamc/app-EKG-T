import { useCallback, useEffect, useRef, useState } from 'react';

import { capturePhoto, type CaptureRequest, type CapturedPhoto } from '@/camera/capturePhoto';
import { reportCaptureCompleted, reportPreviewReady } from '@/camera/captureTimings';
import { useTask } from '@/shell/useTask';

export interface CameraCapture {
  /** Cierto cuando la vista previa ya puede tomar fotos. */
  readonly isReady: boolean;
  /** Cierto mientras hay una captura en curso. */
  readonly isCapturing: boolean;
  /** Cierto si el ultimo disparo se quedo sin foto. */
  readonly hasFailed: boolean;
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
 * UN DISPARO QUE NO DA FOTO SE DICE EN PANTALLA. Antes solo se liberaba el
 * obturador y se anotaba en consola: desde fuera, un disparo fallido y uno que
 * no se llego a registrar se ven exactamente igual, y quien esta delante del
 * papel no sabe si tiene la foto o no.
 *
 * @param onCaptured Se invoca con la foto ya recortada.
 * @returns Estado de la captura y sus manejadores.
 */
export function useCameraCapture(onCaptured: (photo: CapturedPhoto) => void): CameraCapture {
  const mountedAt = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const { isBusy, hasFailed, run } = useTask('[capture] no se pudo completar la captura');

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

      // El obturador se libera solo, salga o no: `taskFailed` deja `isBusy` en
      // falso, que es lo que hace falta para poder reintentar.
      run(async () => {
        const photo = await capturePhoto(request);
        reportCaptureCompleted(startedAt);
        onCaptured(photo);
      });
    },
    [run, onCaptured],
  );

  return { isReady, isCapturing: isBusy, hasFailed, capture, handlePreviewReady };
}
