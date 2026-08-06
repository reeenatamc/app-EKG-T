import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useUploadQueue } from '@/capture/uploadQueue';

/**
 * Mantiene la cola vaciandose mientras la aplicacion esta en uso.
 *
 * Dispara al montar y cada vez que la aplicacion vuelve al primer plano. Ese
 * segundo momento es el que hace que la cola funcione de verdad sin conexion:
 * quien salio de cobertura, guardo el telefono y volvio a sacarlo ya en zona
 * cubierta reanuda el envio sin tener que acordarse de nada.
 *
 * NO HAY DETECCION DE RED, y es una decision, no un olvido. Anadirla traeria
 * una dependencia mas para adelantar unos segundos algo que ya ocurre al volver
 * al primer plano o al pulsar reintentar. Si el envio real de la Etapa 5
 * demuestra que hace falta, entonces se justifica sola.
 */
export function useQueueDrain(): void {
  const drain = useUploadQueue((state) => state.drain);

  useEffect(() => {
    void drain();

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void drain();
      }
    });

    return () => subscription.remove();
  }, [drain]);
}
