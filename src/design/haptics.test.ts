import * as Haptics from 'expo-haptics';

import { playHaptic } from '@/design/haptics';
import { useSettings } from '@/state/settings';

/**
 * El modulo nativo se sustituye entero. Lo que se prueba aqui no es que el
 * telefono vibre —eso no se puede— sino que se le pide lo correcto y, sobre
 * todo, que **no se le pide nada** cuando el usuario ha apagado la vibracion.
 */
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

beforeEach(() => {
  jest.clearAllMocks();
  useSettings.setState({ haptics: true });
});

describe('playHaptic', () => {
  it('el cambio de seleccion usa el patron mas suave', () => {
    playHaptic('selection');

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('el obturador es un impacto, no una seleccion', () => {
    // Se pulsa mirando el papel: el golpe tactil es la unica confirmacion que
    // llega, asi que no puede ser el patron mas debil que existe.
    playHaptic('shutter');

    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it('acierto y fallo se distinguen entre si', () => {
    playHaptic('success');
    playHaptic('failure');

    expect(Haptics.notificationAsync).toHaveBeenNthCalledWith(1, 'success');
    expect(Haptics.notificationAsync).toHaveBeenNthCalledWith(2, 'error');
  });
});

describe('con la vibracion desactivada', () => {
  beforeEach(() => {
    useSettings.setState({ haptics: false });
  });

  it.each(['selection', 'shutter', 'success', 'failure'] as const)(
    'no pide nada al modulo nativo para %s',
    (event) => {
      playHaptic(event);

      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    },
  );
});

describe('cuando el dispositivo no puede vibrar', () => {
  it('no propaga el fallo', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.mocked(Haptics.selectionAsync).mockRejectedValueOnce(new Error('sin motor'));

    expect(() => playHaptic('selection')).not.toThrow();

    // Deja correr el rechazo: sin el `catch` esto seria una promesa rechazada
    // sin manejar, que en produccion aparece como un aviso rojo en pantalla.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(console.warn).toHaveBeenCalled();
  });
});
