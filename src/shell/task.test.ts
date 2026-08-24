import { IDLE_TASK, taskFailed, taskStarted, taskSucceeded } from '@/shell/task';

describe('estado de una accion', () => {
  it('empieza sin nada en marcha y sin aviso', () => {
    expect(IDLE_TASK).toEqual({ isBusy: false, hasFailed: false });
  });

  it('arrancar limpia el aviso del intento anterior', () => {
    // La razon de ser de la transicion: sin esto, el aviso de lo de antes
    // acompana al intento nuevo y ya no se sabe de cual habla.
    expect(taskStarted()).toEqual({ isBusy: true, hasFailed: false });
  });

  it('fallar deja de estar ocupado, para poder reintentar', () => {
    // Si `isBusy` siguiera en cierto, el boton quedaria desactivado justo
    // despues de decirle al usuario que lo intente otra vez.
    expect(taskFailed()).toEqual({ isBusy: false, hasFailed: true });
  });

  it('salir bien vuelve al reposo', () => {
    expect(taskSucceeded()).toEqual(IDLE_TASK);
  });

  it('un ciclo completo de fallo y reintento acaba limpio', () => {
    const afterFailure = taskFailed();
    expect(afterFailure.hasFailed).toBe(true);

    const afterRetry = taskStarted();
    expect(afterRetry.hasFailed).toBe(false);

    expect(taskSucceeded()).toEqual(IDLE_TASK);
  });
});
