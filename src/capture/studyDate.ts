import { CALENDAR_TEXT } from '@/constants/shellText';

/**
 * Fecha y hora de captura de un estudio, legibles.
 *
 * CON HORA Y NO SOLO CON DIA: dos estudios del mismo paciente en la misma manana
 * son justo lo que hay que poder distinguir. Sin segundos, que en una lista son
 * ruido y en un detalle no aportan nada que un clinico vaya a usar.
 *
 * SE COMPONE A MANO CON LAS TABLAS DE `CALENDAR_TEXT`, igual que `longDate`, y no
 * con `toLocaleString` y opciones: ese camino depende de que el motor traiga ICU
 * completo y falla en silencio donde no lo trae. Una primera version lo uso y en
 * el telefono de pruebas funcionaba, que es justo como pasa desapercibido.
 *
 * Hora en veinticuatro horas y con dos cifras, para que una columna de fechas se
 * lea alineada en monoespaciada.
 *
 * @param capturedAt Instante ISO de la captura.
 * @param withYear Cierto para el detalle, donde el ano identifica; en una lista
 *   de estudios recientes sobra.
 * @returns Por ejemplo "11 sept · 02:42" o "11 de septiembre de 2026 · 02:42".
 */
export function formatStudyDate(capturedAt: string, withYear = false): string {
  const at = new Date(capturedAt);
  const month = CALENDAR_TEXT.months[at.getMonth()] ?? '';
  const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`;

  const day = withYear
    ? `${at.getDate()} de ${month} de ${at.getFullYear()}`
    : `${at.getDate()} ${shortMonth(month)}`;

  return `${day} · ${time}`;
}

/**
 * Abreviatura del mes: tres letras, y cuatro para septiembre.
 *
 * Es la norma de la RAE, y "sep" ademas se confunde a primera vista.
 *
 * @param month Nombre completo del mes.
 * @returns La abreviatura.
 */
function shortMonth(month: string): string {
  return month.startsWith('sept') ? 'sept' : month.slice(0, 3);
}

/** Dos cifras. */
function pad(value: number): string {
  return String(value).padStart(2, '0');
}
