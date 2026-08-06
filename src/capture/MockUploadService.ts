import type { UploadResult, UploadService } from '@/capture/UploadService';
import type { QueuedStudy } from '@/capture/study';

/**
 * Implementacion simulada del envio de estudios.
 *
 * Existe para que la cola, sus estados y sus pantallas se puedan construir y
 * ver funcionando antes de que api-EKG tenga endpoint. Lo que simula es
 * unicamente la conversacion con el servidor: el traslado de la imagen a disco,
 * la persistencia de la cola y el borrado tras confirmar son reales y se
 * ejercitan igual que en produccion.
 *
 * Siempre acepta el estudio. La rama de fallo no se simula al azar porque un
 * fallo aleatorio en una demostracion se lee como un error de la aplicacion, no
 * como una funcion; esa rama esta cubierta por las pruebas de queue.ts, que la
 * ejercitan de forma determinista. Se cerrara de verdad en la Etapa 5.
 */

/**
 * Latencia simulada por megabyte, para que los estados de envio se vean.
 *
 * Se hace proporcional al tamano porque una foto de electrocardiograma a
 * resolucion plena pesa varios megabytes, y un envio instantaneo daria una idea
 * equivocada de cuanto dura esto en una sala con mala cobertura.
 */
const SIMULATED_MS_PER_MEGABYTE = 700;

const BYTES_PER_MEGABYTE = 1024 * 1024;

/** Suelo de latencia, para que el estado de envio no parpadee. */
const MINIMUM_LATENCY_MS = 500;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Estima cuanto tardaria el envio de una imagen de este tamano.
 *
 * @param study Estudio a enviar.
 * @returns La espera simulada, en milisegundos.
 */
function simulatedLatency(study: QueuedStudy): number {
  // Sin acceso al tamano real se estima desde las dimensiones, suponiendo la
  // compresion tipica de un JPEG de este sujeto.
  const estimatedBytes = (study.imageWidth * study.imageHeight) / 4;
  const megabytes = estimatedBytes / BYTES_PER_MEGABYTE;

  return Math.max(MINIMUM_LATENCY_MS, megabytes * SIMULATED_MS_PER_MEGABYTE);
}

export const mockUploadService: UploadService = {
  async send(study: QueuedStudy): Promise<UploadResult> {
    await delay(simulatedLatency(study));

    return {
      ok: true,
      value: {
        remoteId: `mock-${study.id}`,
        receivedAt: new Date().toISOString(),
      },
    };
  },
};
