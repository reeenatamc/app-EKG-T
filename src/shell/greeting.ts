import type { Session } from '@/auth/AuthService';
import { CALENDAR_TEXT, GREETING_TEXT } from '@/constants/shellText';

/**
 * Saludo de inicio: la hora del dia y a quien se saluda.
 *
 * POR QUE UNA CARPETA NUEVA. `src/shell/` es la primera logica del armazon —
 * inicio, pestanas, perfil— que no es autenticacion, ni captura, ni tokens de
 * diseno. Meterla en `auth/` diria que el saludo autentica algo, y en `design/`
 * que es un token. El copy ya vivia separado en `constants/shellText.ts`, asi que
 * el nombre es coherente con lo que ya habia.
 *
 * Todo lo de aqui es puro y con pruebas: la hora y el correo entran por
 * parametro. Un modulo que lea el reloj por su cuenta no se puede probar.
 */

/** A las 6 empieza la manana, a las 12 la tarde y a las 20 la noche. */
const MORNING_FROM = 6;
const AFTERNOON_FROM = 12;
const EVENING_FROM = 20;

/**
 * Elige el saludo segun la hora.
 *
 * @param at Momento del saludo.
 * @returns "Buenos dias", "Buenas tardes" o "Buenas noches".
 */
export function greetingFor(at: Date): string {
  const hour = at.getHours();

  if (hour >= MORNING_FROM && hour < AFTERNOON_FROM) {
    return GREETING_TEXT.morning;
  }

  if (hour >= AFTERNOON_FROM && hour < EVENING_FROM) {
    return GREETING_TEXT.afternoon;
  }

  return GREETING_TEXT.evening;
}

/**
 * Nombre con el que dirigirse al usuario.
 *
 * SE DERIVA DEL CORREO PORQUE NO HAY NOMBRE. `Session` trae `userId`, `email` y
 * `role`, y nada mas; inventar un campo de nombre aqui seria fingir un dato que
 * el contrato de `AuthService` no da. Se toma el primer segmento del correo, que
 * es lo que la mayoria de la gente usa como nombre de pila, y se capitaliza.
 *
 * Devuelve null cuando no hay de donde sacarlo. Un saludo sin nombre es un
 * saludo; un saludo a "Undefined" es una averia a la vista.
 *
 * @param session Sesion activa, o null si no hay.
 * @returns El nombre capitalizado, o null.
 */
export function displayNameFrom(session: Session | null): string | null {
  const local = session?.email.split('@')[0] ?? '';
  // Los separadores habituales de un correo compuesto: renata.mc, renata_mc...
  const first = local.split(/[._+-]/)[0] ?? '';

  if (first.length === 0) {
    return null;
  }

  return first.charAt(0).toLocaleUpperCase('es') + first.slice(1).toLocaleLowerCase('es');
}

/**
 * El saludo completo, ya listo para pintar.
 *
 * @param session Sesion activa, o null si no hay.
 * @param at Momento del saludo.
 * @returns "Buenas tardes, Renata" o, sin nombre, "Buenas tardes".
 */
export function welcomeLine(session: Session | null, at: Date): string {
  const greeting = greetingFor(at);
  const name = displayNameFrom(session);

  return name === null ? greeting : `${greeting}, ${name}`;
}

/**
 * Fecha larga en espanol, para la micro-etiqueta del inicio.
 *
 * Se compone de las tablas de `CALENDAR_TEXT` y no de `toLocaleDateString` con
 * opciones: ese camino depende de que el motor traiga ICU completo y falla en
 * silencio donde no lo trae. Ver la nota de esas tablas.
 *
 * @param at Dia a escribir.
 * @returns Por ejemplo "miercoles 29 de julio".
 */
export function longDate(at: Date): string {
  const weekday = CALENDAR_TEXT.weekdays[at.getDay()] ?? '';
  const month = CALENDAR_TEXT.months[at.getMonth()] ?? '';

  return `${weekday} ${at.getDate()} de ${month}`;
}
