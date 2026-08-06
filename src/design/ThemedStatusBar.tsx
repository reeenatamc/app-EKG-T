import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/design/theme';

/**
 * Barra de estado acorde al modo activo.
 *
 * No se usa style="auto" porque ese valor sigue al esquema del sistema, no al
 * modo de la aplicacion. Si el usuario fuerza Monitor con el telefono en claro,
 * "auto" pintaria iconos oscuros sobre un lienzo casi negro.
 *
 * @returns La barra de estado configurada.
 */
export function ThemedStatusBar() {
  const theme = useTheme();

  return <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />;
}
