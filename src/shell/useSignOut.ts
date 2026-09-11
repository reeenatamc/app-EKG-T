import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { useSession } from '@/auth/session';
import { unresolved } from '@/capture/queue';
import { useUploadQueue } from '@/capture/uploadQueue';
import { SETTINGS_TEXT, SIGN_OUT_TEXT } from '@/constants/shellText';
import { isAwaiting, useAnalyses } from '@/ecg/analyses';

export interface SignOut {
  /** Cierto si hay estudios a medias que se perderian al cerrar sesion. */
  readonly hasPending: boolean;
  /** Pregunta y, si se confirma, cierra la sesion y vuelve al acceso. */
  readonly signOut: () => void;
}

/**
 * Cerrar sesion, con lo que hay que saber antes.
 *
 * VIVE AQUI Y NO EN UNA PANTALLA porque ahora se cierra sesion desde dos: Perfil,
 * donde se busca, y Ajustes, donde estaba. Las dos tienen que avisar de lo mismo.
 *
 * Se avisa, no se impide. Quien cierra sesion en un telefono compartido puede
 * tener una razon para hacerlo con estudios a medias, y bloquearselo le dejaria
 * sin salida; lo que no puede pasar es que se entere despues.
 *
 * Cuentan las dos formas de quedarse a medias, porque las dos pierden algo: un
 * estudio sin enviar se pierde entero, y de uno que espera resultado se pierde el
 * resultado, que el servidor calculara para nadie.
 *
 * @returns Si hay algo a medias, y la accion de cerrar sesion.
 */
export function useSignOut(): SignOut {
  const router = useRouter();
  const closeSession = useSession((state) => state.close);
  const studies = useUploadQueue((state) => state.studies);
  const analyses = useAnalyses((state) => state.byStudy);

  const awaiting = studies.some(
    (study) => study.remoteId !== null && isAwaiting(analyses[study.remoteId]),
  );
  const hasPending = unresolved(studies).length > 0 || awaiting;

  const signOut = () => {
    Alert.alert(
      SIGN_OUT_TEXT.title,
      hasPending ? SETTINGS_TEXT.pendingOnSignOut.action : SIGN_OUT_TEXT.body,
      [
        { text: SIGN_OUT_TEXT.cancel, style: 'cancel' },
        {
          text: SIGN_OUT_TEXT.confirm,
          style: 'destructive',
          onPress: () => void closeSession().then(() => router.replace('/login')),
        },
      ],
      { cancelable: true },
    );
  };

  return { hasPending, signOut };
}
