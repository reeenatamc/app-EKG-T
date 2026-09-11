import type { CapturedPhoto } from '@/camera/capturePhoto';
import { importFromGallery } from '@/capture/importFromGallery';
import { useTask } from '@/shell/useTask';

export interface GalleryImport {
  readonly isImporting: boolean;
  /** Cierto si la ultima imagen elegida no se pudo abrir. */
  readonly hasFailed: boolean;
  readonly importPhoto: () => void;
}

/**
 * Trae una foto de la galeria y avisa mientras tanto.
 *
 * El estado de ocupado existe para que no se pueda abrir dos veces el selector
 * del sistema: la segunda invocacion se queda esperando y devuelve una foto que
 * ya nadie espera.
 *
 * ELEGIR SIN ELEGIR NO ES UN FALLO. `importFromGallery` devuelve null cuando el
 * usuario cierra el selector, y eso resuelve bien: quien se arrepiente de abrir
 * la galeria no ha hecho nada mal y no tiene por que ver un aviso.
 *
 * VIVE FUERA DE LOS CONTROLES porque su fallo se escribe en otro sitio: en el
 * bloque de mensajes de la camara, que gira con el telefono.
 *
 * @param onImported Se invoca con la foto ya recodificada y sin metadatos.
 * @returns El estado de la importacion y la accion para lanzarla.
 */
export function useGalleryImport(onImported: (photo: CapturedPhoto) => void): GalleryImport {
  const task = useTask('[capture] no se pudo importar la imagen');

  const importPhoto = () => {
    if (task.isBusy) {
      return;
    }

    task.run(async () => {
      const photo = await importFromGallery();

      if (photo !== null) {
        onImported(photo);
      }
    });
  };

  return { isImporting: task.isBusy, hasFailed: task.hasFailed, importPhoto };
}
