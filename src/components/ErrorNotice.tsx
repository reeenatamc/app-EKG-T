import type { AuthFailureReason } from '@/auth/AuthService';
import { Notice } from '@/components/Notice';
import { AUTH_ERROR_COPY } from '@/constants/authText';

interface ErrorNoticeProps {
  readonly reason: AuthFailureReason | null;
}

/**
 * Aviso de error de un formulario de acceso.
 *
 * Recibe una causa, nunca un texto: el copy vive en AUTH_ERROR_COPY, de modo
 * que ningun codigo de estado ni mensaje del servidor puede acabar en pantalla.
 * Cada aviso dice que paso y que hacer, y no culpa a la persona.
 *
 * Solo traduce. Pintar es cosa de `Notice`, que es la unica forma que tiene la
 * aplicacion de dibujar un aviso, y asi las seis pantallas de acceso y las
 * acciones del resto del producto avisan igual.
 *
 * @param reason Causa del fallo, o null si no hay error que mostrar.
 * @returns El aviso, o null.
 */
export function ErrorNotice({ reason }: ErrorNoticeProps) {
  if (reason === null) {
    return null;
  }

  const copy = AUTH_ERROR_COPY[reason];

  return <Notice title={copy.title} action={copy.action} />;
}
