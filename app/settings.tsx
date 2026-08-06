import { SettingsScreen } from '@/screens/SettingsScreen';

/**
 * Ruta de ajustes.
 *
 * Vive fuera del grupo de pestanas: se abre desde Perfil y ocupa la pantalla
 * completa, sin barra, porque no es un destino de navegacion principal.
 *
 * @returns La pantalla de ajustes.
 */
export default function SettingsRoute() {
  return <SettingsScreen />;
}
