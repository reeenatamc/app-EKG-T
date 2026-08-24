/**
 * Estado de una accion que puede tardar y puede fallar.
 *
 * Modulo puro: son cuatro transiciones sobre dos banderas, y ninguna necesita
 * React. El gancho que las usa vive en `useTask.ts`.
 *
 * POR QUE EXISTE. Cuatro acciones de la aplicacion —recortar, disparar, traer de
 * la galeria y exportar el informe— fallaban **solo en consola**: el usuario
 * pulsaba, no pasaba nada, y no habia forma de distinguir eso de un boton que no
 * responde. `useAuthAction` ya resolvia lo mismo para los formularios de acceso,
 * pero con el vocabulario de la autenticacion —resultado, causa, sesion—, que
 * ahi no encaja: recortar una foto no devuelve un `AuthResult`.
 *
 * Solo hay dos banderas y no una causa como en `AuthFailureReason` porque aqui
 * **no se sabe por que fallo**. Un recorte que revienta devuelve una excepcion
 * opaca de la capa nativa, y fingir que se conoce la causa para escribir un
 * mensaje mas concreto seria inventarsela.
 */

/** Las dos cosas que la interfaz necesita saber de una accion en curso. */
export interface TaskState {
  /** Cierto mientras la accion esta en marcha. */
  readonly isBusy: boolean;
  /** Cierto si el ultimo intento no salio y el aviso sigue en pantalla. */
  readonly hasFailed: boolean;
}

/** Nada en marcha y nada que avisar. */
export const IDLE_TASK: TaskState = { isBusy: false, hasFailed: false };

/**
 * Arranca la accion.
 *
 * LIMPIA EL FALLO ANTERIOR. Si no lo hiciera, el aviso del intento pasado
 * seguiria en pantalla durante el nuevo intento, y quien lo lee no puede saber
 * si habla de lo que acaba de pulsar o de lo de antes.
 *
 * @returns El estado en curso.
 */
export function taskStarted(): TaskState {
  return { isBusy: true, hasFailed: false };
}

/**
 * La accion salio.
 *
 * @returns El estado en reposo.
 */
export function taskSucceeded(): TaskState {
  return IDLE_TASK;
}

/**
 * La accion no salio.
 *
 * Deja de estar ocupada: el boton tiene que volver a ser pulsable, porque
 * reintentar es justo lo que se espera que haga quien acaba de ver el aviso.
 *
 * @returns El estado fallido.
 */
export function taskFailed(): TaskState {
  return { isBusy: false, hasFailed: true };
}
