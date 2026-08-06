import { SplashScreen } from '@/screens/SplashScreen';

/**
 * Ruta de arranque.
 *
 * Presenta el latido mientras se resuelve si hay sesion, y deriva a
 * introduccion, acceso, desbloqueo o captura.
 *
 * @returns La pantalla de arranque.
 */
export default function BootRoute() {
  return <SplashScreen />;
}
