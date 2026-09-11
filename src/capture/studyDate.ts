/**
 * Fecha y hora de captura de un estudio, legibles.
 *
 * CON HORA Y NO SOLO CON DIA: dos estudios del mismo paciente en la misma manana
 * son justo lo que hay que poder distinguir. Sin segundos, que en una lista son
 * ruido y en un detalle no aportan nada que un clinico vaya a usar.
 *
 * Una sola forma para toda la aplicacion. El detalle ensenaba la fecha en crudo
 * —«11/9/2026 2:42:06»— mientras el historial ya la escribia en corto.
 *
 * @param capturedAt Instante ISO de la captura.
 * @param withYear Cierto para incluir el ano, que en el detalle identifica y en
 *   una lista de estudios recientes sobra.
 * @returns La fecha legible.
 */
export function formatStudyDate(capturedAt: string, withYear = false): string {
  return new Date(capturedAt).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  });
}
