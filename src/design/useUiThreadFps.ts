import { useCallback, useState } from 'react';
import { runOnJS, useFrameCallback, useSharedValue } from 'react-native-reanimated';

/** Ventana de muestreo. Un segundo da una lectura estable sin parecer congelada. */
const SAMPLE_WINDOW_MS = 1000;

export interface UiThreadFps {
  /** Fotogramas por segundo de la ultima ventana. */
  readonly current: number;
  /** Peor ventana registrada. Es la cifra que decide si el scroll "se sostiene". */
  readonly minimum: number;
  readonly reset: () => void;
}

/**
 * Mide los fotogramas por segundo del hilo de UI.
 *
 * Se mide el hilo de UI y no el de JavaScript porque el desenfoque, el scroll y
 * la composicion de Skia ocurren alli: un contador basado en
 * requestAnimationFrame marcaria 60 fps mientras la pantalla va a tirones.
 *
 * Solo cruza a JavaScript una vez por segundo, asi que el propio medidor no
 * altera de forma apreciable lo que mide.
 *
 * @returns La lectura actual, el minimo observado y un reinicio del minimo.
 */
export function useUiThreadFps(): UiThreadFps {
  const frames = useSharedValue(0);
  const elapsed = useSharedValue(0);
  const [current, setCurrent] = useState(0);
  const [minimum, setMinimum] = useState(0);

  const publish = useCallback((value: number) => {
    setCurrent(value);
    setMinimum((previous) => (previous === 0 ? value : Math.min(previous, value)));
  }, []);

  useFrameCallback((frame) => {
    'worklet';
    frames.value += 1;
    elapsed.value += frame.timeSincePreviousFrame ?? 0;

    if (elapsed.value >= SAMPLE_WINDOW_MS) {
      runOnJS(publish)(Math.round((frames.value * SAMPLE_WINDOW_MS) / elapsed.value));
      frames.value = 0;
      elapsed.value = 0;
    }
  });

  const reset = useCallback(() => {
    setMinimum(0);
  }, []);

  return { current, minimum, reset };
}
