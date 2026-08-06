import { CameraPermissionGate } from '@/components/CameraPermissionGate';
import { CaptureFlow } from '@/screens/CaptureFlow';

/**
 * Ruta de captura.
 *
 * La puerta de permisos envuelve solo a esta ruta y no a toda la aplicacion:
 * el resto de pantallas no necesita la camara y pedirsela al usuario nada mas
 * abrir, sin contexto, es la forma mas rapida de que la deniegue.
 *
 * @returns El flujo de captura protegido por el permiso de camara.
 */
export default function CaptureRoute() {
  return (
    <CameraPermissionGate>
      <CaptureFlow />
    </CameraPermissionGate>
  );
}
