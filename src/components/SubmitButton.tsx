import { ActionButton } from '@/components/ActionButton';

interface SubmitButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  /** Deshabilita el boton mientras la peticion esta en curso. */
  readonly isBusy: boolean;
}

/**
 * Boton principal de un formulario de acceso.
 *
 * Envuelve ActionButton para que las cinco pantallas de formulario no repitan
 * la misma combinacion de variante y estado ocupado, y para que sea imposible
 * olvidarse de deshabilitarlo y permitir un doble envio.
 *
 * @param label Texto del boton.
 * @param onPress Accion de envio.
 * @param isBusy Cierto mientras hay una peticion en curso.
 * @returns El boton de envio.
 */
export function SubmitButton({ label, onPress, isBusy }: SubmitButtonProps) {
  return <ActionButton label={label} onPress={onPress} variant="primary" disabled={isBusy} />;
}
