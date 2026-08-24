import { useState } from 'react';

import type { CapturedPhoto } from '@/camera/capturePhoto';
import { discardCapture } from '@/camera/discardCapture';
import { DEFAULT_MOUNT_ID, type MountId } from '@/camera/mounts';
import type { Quad } from '@/camera/quad';
import { createAnonymousId } from '@/capture/createStudyId';
import { cropToQuad, type PreparedImage } from '@/capture/prepareStudy';
import { submitStudy, type StudyDraft } from '@/capture/submitStudy';
import { useUploadQueue } from '@/capture/uploadQueue';
import { Background } from '@/design/Background';
import { CameraScreen } from '@/screens/CameraScreen';
import { ConfirmScreen } from '@/screens/ConfirmScreen';
import { ReviewScreen } from '@/screens/ReviewScreen';
import { useGoBack } from '@/shell/useGoBack';

/**
 * Los tres pasos del flujo de captura.
 *
 * Modelado como union discriminada y no como varios estados sueltos: asi es
 * imposible representar un estado incoherente, como estar en la confirmacion
 * sin imagen recortada. Con dos booleanos y dos opcionales ese estado seria
 * representable y alguien acabaria alcanzandolo.
 */
type Stage =
  | { readonly kind: 'camera' }
  | { readonly kind: 'review'; readonly photo: CapturedPhoto }
  | {
      readonly kind: 'confirm';
      readonly photo: CapturedPhoto;
      readonly image: PreparedImage;
      readonly anonymousId: string;
    };

/**
 * Encadena captura, ajuste de esquinas y confirmacion.
 *
 * Con tres pasos y transiciones lineales, una biblioteca de navegacion solo
 * anadiria dependencias y configuracion: el propio estado dice que paso toca.
 *
 * La captura no lleva fondo Skia: la imagen en vivo ya ocupa las capas 0 a 3 y
 * montar un lienzo detras seria trabajo invisible. La revision y la
 * confirmacion si lo llevan, pero sin el latido difuso: la foto ya es un
 * trazado y un segundo trazado decorativo detras solo confundiria.
 *
 * @returns El paso activo del flujo de captura.
 */
export function CaptureFlow() {
  const [mount, setMount] = useState<MountId>(DEFAULT_MOUNT_ID);
  const flow = useCaptureFlow();
  const { stage } = flow;

  if (stage.kind === 'camera') {
    return (
      <CameraScreen
        onCaptured={flow.capture}
        mount={mount}
        onMountChange={setMount}
        onClose={flow.close}
      />
    );
  }

  return <PhotoStage stage={stage} mount={mount} flow={flow} />;
}

interface PhotoStageProps {
  /** Los pasos que ya tienen foto. `Exclude` los deriva del propio flujo: si
   *  manana aparece un cuarto paso con imagen, entra aqui solo. */
  readonly stage: Exclude<Stage, { kind: 'camera' }>;
  readonly mount: MountId;
  readonly flow: CaptureFlowControls;
}

/**
 * Los dos pasos que ya tienen foto: ajustar las esquinas y confirmar.
 *
 * Comparten fondo Skia, y por eso comparten componente: el lienzo se monta una
 * vez para los dos en lugar de montarse y desmontarse al pasar de uno al otro.
 * Va sin el latido difuso, porque la foto ya es un trazado y un segundo trazado
 * decorativo detras solo confundiria.
 *
 * @param stage Paso activo, ya con foto.
 * @param mount Montaje elegido en la camara.
 * @param flow Transiciones del flujo.
 * @returns El paso renderizado sobre su fondo.
 */
function PhotoStage({ stage, mount, flow }: PhotoStageProps) {
  return (
    <Background atmosphere={false}>
      {stage.kind === 'review' ? (
        <ReviewScreen
          photo={stage.photo}
          onDiscard={() => flow.discard(stage.photo)}
          onConfirm={(quad) => flow.adjust(stage.photo, quad)}
        />
      ) : (
        <ConfirmScreen
          image={stage.image}
          mount={mount}
          suggestedId={stage.anonymousId}
          onBack={() => flow.back(stage.photo, stage.image)}
          onSubmit={(draft) => flow.submit(stage.photo, stage.image, draft)}
        />
      )}
    </Background>
  );
}

interface CaptureFlowControls {
  readonly stage: Stage;
  readonly capture: (photo: CapturedPhoto) => void;
  readonly discard: (photo: CapturedPhoto) => void;
  readonly adjust: (photo: CapturedPhoto, quad: Quad) => void;
  readonly back: (photo: CapturedPhoto, image: PreparedImage) => void;
  readonly submit: (photo: CapturedPhoto, image: PreparedImage, draft: StudyDraft) => void;
  /** Abandona la captura sin haber tomado nada. */
  readonly close: () => void;
}

/**
 * Gobierna las transiciones del flujo y la limpieza de archivos.
 *
 * QUIEN BORRA QUE. Cada paso limpia lo que deja de hacer falta, porque son
 * fotografias de pacientes y no deben acumularse. Al descartar en la revision
 * se borra la foto; al volver de la confirmacion se borra el recorte, que se
 * rehara al continuar; al enviar se borra la foto de partida, porque la imagen
 * definitiva ya se ha trasladado al almacen de la cola.
 *
 * @returns El paso actual y las transiciones disponibles.
 */
function useCaptureFlow(): CaptureFlowControls {
  const goBack = useGoBack('/home');
  const addToQueue = useUploadQueue((state) => state.add);
  const [stage, setStage] = useState<Stage>({ kind: 'camera' });

  return {
    stage,
    close: goBack,

    capture: (photo) => setStage({ kind: 'review', photo }),

    discard: (photo) => {
      discardCapture(photo);
      setStage({ kind: 'camera' });
    },

    adjust: (photo, quad) => {
      void cropToQuad(photo, quad)
        .then((image) => {
          setStage({ kind: 'confirm', photo, image, anonymousId: createAnonymousId(new Date()) });
        })
        // No se avanza y no se pierde nada: la revision sigue en pantalla con
        // las esquinas donde estaban, y se puede reintentar.
        .catch((error: unknown) => console.error('[capture] no se pudo recortar', error));
    },

    back: (photo, image) => {
      discardCapture(image);
      setStage({ kind: 'review', photo });
    },

    submit: (photo, image, draft) => {
      addToQueue(submitStudy(image, draft, new Date()));
      discardCapture(photo);
      goBack();
    },
  };
}
