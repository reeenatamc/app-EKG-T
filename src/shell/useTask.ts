import { useCallback, useState } from 'react';

import { playHaptic } from '@/design/haptics';
import { IDLE_TASK, taskFailed, taskStarted, taskSucceeded, type TaskState } from '@/shell/task';

export interface Task extends TaskState {
  /**
   * Lanza la accion. No devuelve promesa: quien llama solo mira las banderas.
   *
   * El trabajo puede resolver a lo que sea —`exportReport` devuelve la ruta del
   * PDF— y aqui se ignora: lo unico que interesa es si salio.
   */
  readonly run: (work: () => Promise<unknown>) => void;
}

/**
 * Ejecuta una accion que puede tardar y puede fallar, y deja constancia visible
 * de las dos cosas.
 *
 * NO DEVUELVE UNA PROMESA, a proposito. Marca el estado de ocupado de forma
 * sincrona, antes de tocar nada, para que la respuesta del boton no dependa de
 * cuanto tarde el modulo nativo que hay detras.
 *
 * EL ERROR SE SIGUE REGISTRANDO EN CONSOLA. El aviso de pantalla dice que hacer;
 * el registro dice que paso, y hace falta para depurar. Lo que ya no ocurre es
 * que el registro sea lo **unico**, que era el fallo: quien pulsaba veia que no
 * pasaba nada y no podia distinguirlo de un boton roto.
 *
 * @param diagnostic Linea de consola del fallo, con su prefijo de modulo.
 * @returns Las banderas de la accion y la funcion que la lanza.
 */
export function useTask(diagnostic: string): Task {
  const [state, setState] = useState<TaskState>(IDLE_TASK);

  const run = useCallback(
    (work: () => Promise<unknown>) => {
      setState(taskStarted());

      void work()
        .then(() => setState(taskSucceeded()))
        .catch((error: unknown) => {
          console.error(diagnostic, error);
          // Un solo sitio para la respuesta tactil de todas las acciones que
          // pueden fallar: recortar, disparar, importar, exportar y vaciar la
          // cola. Llega antes de que el ojo encuentre el aviso.
          playHaptic('failure');
          setState(taskFailed());
        });
    },
    [diagnostic],
  );

  return { ...state, run };
}
