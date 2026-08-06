import { useCameraPermissions } from 'expo-camera';
import type { ReactNode } from 'react';
import { Linking } from 'react-native';

import { CameraPermissionNotice } from '@/components/CameraPermissionNotice';
import { PERMISSION_TEXT } from '@/constants/text';

interface CameraPermissionGateProps {
  readonly children: ReactNode;
}

/**
 * Deja pasar a sus hijos solo cuando el permiso de camara esta concedido.
 *
 * Distingue los dos estados de denegacion porque requieren acciones distintas:
 * si el sistema aun permite preguntar, se vuelve a pedir; si no, la unica salida
 * son los ajustes del dispositivo. En ningun caso se bloquea la aplicacion.
 *
 * @param children Contenido a mostrar con el permiso concedido.
 * @returns Los hijos, o el mensaje correspondiente al estado del permiso.
 */
export function CameraPermissionGate({ children }: CameraPermissionGateProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (permission === null) {
    return (
      <CameraPermissionNotice
        title={PERMISSION_TEXT.checking}
        body={PERMISSION_TEXT.rationale}
        action={null}
      />
    );
  }

  if (permission.granted) {
    return <>{children}</>;
  }

  return (
    <CameraPermissionNotice
      title={PERMISSION_TEXT.title}
      body={buildDeniedBody(permission.canAskAgain)}
      action={buildDeniedAction(permission.canAskAgain, requestPermission)}
    />
  );
}

function buildDeniedBody(canAskAgain: boolean): string {
  if (canAskAgain) {
    return PERMISSION_TEXT.rationale;
  }
  return `${PERMISSION_TEXT.rationale}\n\n${PERMISSION_TEXT.deniedHint}`;
}

function buildDeniedAction(
  canAskAgain: boolean,
  requestPermission: () => Promise<unknown>,
): { label: string; onPress: () => void } {
  if (canAskAgain) {
    return { label: PERMISSION_TEXT.grant, onPress: () => void requestPermission() };
  }
  // Sin canAskAgain el sistema ya no muestra el dialogo: los ajustes son la
  // unica via para revertir la denegacion.
  return { label: PERMISSION_TEXT.openSettings, onPress: () => void Linking.openSettings() };
}
