import {
  enqueue,
  markFailed,
  markUploaded,
  markUploading,
  MAX_AUTOMATIC_ATTEMPTS,
  nextPending,
  remove,
  retry,
  unresolved,
} from '@/capture/queue';
import { STANDARD_CALIBRATION, type QueuedStudy, type StudyStatus } from '@/capture/study';
import { rectToQuad } from '@/camera/quad';

function studyWith(id: string, status: StudyStatus = 'pending', attempts = 0): QueuedStudy {
  return {
    id,
    imageUri: `file:///studies/${id}.jpg`,
    imageWidth: 3000,
    imageHeight: 2000,
    metadata: {
      anonymousId: `ECG-260729-${id}`,
      capturedAt: '2026-07-29T10:00:00.000Z',
      mount: 'standard-3x4',
      calibration: STANDARD_CALIBRATION,
      quad: rectToQuad({ x: 0, y: 0, width: 3000, height: 2000 }),
    },
    status,
    attempts,
    lastFailure: null,
  };
}

describe('enqueue', () => {
  it('anade al final para respetar el orden de captura', () => {
    const queue = enqueue(enqueue([], studyWith('a')), studyWith('b'));

    expect(queue.map((study) => study.id)).toEqual(['a', 'b']);
  });
});

describe('markUploading', () => {
  // El intento se cuenta al empezar, no al fallar. Si contase al fallar, un
  // estudio que matase el proceso a mitad de envio nunca sumaria intentos y se
  // reintentaria eternamente al arrancar.
  it('cuenta el intento al empezar el envio', () => {
    const queue = markUploading([studyWith('a')], 'a');

    expect(queue[0]?.status).toBe('uploading');
    expect(queue[0]?.attempts).toBe(1);
  });
});

describe('nextPending', () => {
  it('elige el mas antiguo pendiente', () => {
    const queue = [studyWith('a', 'uploaded'), studyWith('b'), studyWith('c')];

    expect(nextPending(queue)?.id).toBe('b');
  });

  it('no devuelve nada mientras haya un envio en curso', () => {
    const queue = [studyWith('a', 'uploading', 1), studyWith('b')];

    expect(nextPending(queue)).toBeNull();
  });

  it('deja de reintentar solo tras agotar los intentos automaticos', () => {
    const queue = [studyWith('a', 'pending', MAX_AUTOMATIC_ATTEMPTS)];

    expect(nextPending(queue)).toBeNull();
  });

  it('no devuelve nada con la cola vacia', () => {
    expect(nextPending([])).toBeNull();
  });
});

describe('markFailed', () => {
  it('guarda la causa para poder explicarla', () => {
    const queue = markFailed([studyWith('a', 'uploading', 1)], 'a', 'network-unreachable');

    expect(queue[0]?.status).toBe('failed');
    expect(queue[0]?.lastFailure).toBe('network-unreachable');
  });
});

describe('retry', () => {
  it('devuelve el estudio a la cola con los intentos a cero', () => {
    const failed = markFailed(
      [studyWith('a', 'uploading', MAX_AUTOMATIC_ATTEMPTS)],
      'a',
      'server-error',
    );
    const queue = retry(failed, 'a');

    expect(queue[0]?.status).toBe('pending');
    expect(queue[0]?.attempts).toBe(0);
    expect(queue[0]?.lastFailure).toBeNull();
    expect(nextPending(queue)?.id).toBe('a');
  });
});

describe('markUploaded', () => {
  it('limpia el ultimo fallo al conseguirlo', () => {
    const failed = markFailed([studyWith('a', 'uploading', 1)], 'a', 'server-error');
    const queue = markUploaded(failed, 'a');

    expect(queue[0]?.status).toBe('uploaded');
    expect(queue[0]?.lastFailure).toBeNull();
  });
});

describe('remove', () => {
  it('saca solo el estudio pedido', () => {
    const queue = remove([studyWith('a'), studyWith('b')], 'a');

    expect(queue.map((study) => study.id)).toEqual(['b']);
  });
});

describe('unresolved', () => {
  it('deja fuera los ya subidos', () => {
    const queue = [studyWith('a', 'uploaded'), studyWith('b', 'failed'), studyWith('c')];

    expect(unresolved(queue).map((study) => study.id)).toEqual(['b', 'c']);
  });
});
