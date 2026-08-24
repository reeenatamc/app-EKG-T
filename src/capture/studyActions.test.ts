import { rectToQuad } from '@/camera/quad';
import { STANDARD_CALIBRATION, type QueuedStudy, type StudyStatus } from '@/capture/study';
import { studyActions } from '@/capture/studyActions';

function studyWith(status: StudyStatus): QueuedStudy {
  return {
    id: 'a',
    imageUri: 'file:///studies/a.jpg',
    imageWidth: 3000,
    imageHeight: 2000,
    metadata: {
      anonymousId: 'ECG-260729-a',
      capturedAt: '2026-07-29T10:00:00.000Z',
      mount: 'standard-3x4',
      calibration: STANDARD_CALIBRATION,
      quad: rectToQuad({ x: 0, y: 0, width: 3000, height: 2000 }),
    },
    status,
    attempts: 0,
    lastFailure: null,
  };
}

const EVERY_STATUS: readonly StudyStatus[] = ['pending', 'uploading', 'failed', 'uploaded'];

describe('studyActions', () => {
  it('solo abre el que ya se envio', () => {
    const opens = EVERY_STATUS.filter((status) => studyActions(studyWith(status)).canOpen);

    expect(opens).toEqual(['uploaded']);
  });

  it('solo reintenta el que fallo', () => {
    const retries = EVERY_STATUS.filter((status) => studyActions(studyWith(status)).canRetry);

    expect(retries).toEqual(['failed']);
  });

  it('solo descarta el que fallo', () => {
    const discards = EVERY_STATUS.filter((status) => studyActions(studyWith(status)).canDiscard);

    expect(discards).toEqual(['failed']);
  });

  // Los dos casos que costarian datos de verdad, escritos aparte de las listas
  // de arriba para que se lean como lo que son: la razon de que la regla exista.
  it('no descarta un envio en curso, que esta leyendo su propia imagen', () => {
    expect(studyActions(studyWith('uploading')).canDiscard).toBe(false);
  });

  it('no descarta uno ya enviado: quitarlo de la lista es otra accion', () => {
    expect(studyActions(studyWith('uploaded')).canDiscard).toBe(false);
  });

  it('el estudio atascado tiene las dos salidas a la vez', () => {
    // Una sola no basta: reintentar sin poder descartar deja atrapado a quien ya
    // sabe que ese envio no va a salir, y al reves obliga a perder la foto.
    expect(studyActions(studyWith('failed'))).toEqual({
      canOpen: false,
      canRetry: true,
      canDiscard: true,
    });
  });
});
