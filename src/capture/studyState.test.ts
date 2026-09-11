import type { QueuedStudy, StudyStatus } from '@/capture/study';
import { STANDARD_CALIBRATION } from '@/capture/study';
import { studyCounts, studyState } from '@/capture/studyState';
import { rectToQuad } from '@/camera/quad';
import type { AnalysisStatus, EcgAnalysis } from '@/ecg/EcgAnalysisService';

const analysis = (status: AnalysisStatus): EcgAnalysis => ({
  studyId: 's-1',
  status,
  signal: null,
  measurements: null,
  observations: [],
  failure: null,
  completedAt: null,
});

describe('studyState', () => {
  it('antes de enviarse, lo dice el envio', () => {
    expect(studyState('pending', undefined)).toBe('waiting');
    expect(studyState('uploading', undefined)).toBe('sending');
    expect(studyState('failed', undefined)).toBe('failed');
  });

  it('UN ESTUDIO ENVIADO YA NO SE QUEDA EN "ENVIADO"', () => {
    // Era el fallo: todo lo enviado ponia lo mismo hasta que se abria el detalle,
    // estuviese procesandose, listo o fallido.
    expect(studyState('uploaded', analysis('processing'))).toBe('analyzing');
    expect(studyState('uploaded', analysis('ready'))).toBe('ready');
    expect(studyState('uploaded', analysis('failed'))).toBe('failed');
  });

  it('enviado y sin respuesta todavia cuenta como analizandose', () => {
    // La sesion pide el analisis nada mas enviarse: lo que falta es la respuesta.
    expect(studyState('uploaded', undefined)).toBe('analyzing');
    expect(studyState('uploaded', analysis('queued'))).toBe('analyzing');
  });

  it('un envio fallido y una lectura fallida son el mismo aviso en la lista', () => {
    // Para quien mira la lista, los dos dicen "aqui hay algo que atender". La
    // causa concreta se lee dentro, no en la fila.
    expect(studyState('failed', undefined)).toBe(studyState('uploaded', analysis('failed')));
  });
});

describe('studyCounts', () => {
  function study(id: string, status: StudyStatus, remoteId: string | null): QueuedStudy {
    return {
      id,
      imageUri: `file:///studies/${id}.jpg`,
      imageWidth: 3000,
      imageHeight: 2000,
      metadata: {
        anonymousId: `ECG-${id}`,
        capturedAt: '2026-09-11T07:42:00.000Z',
        mount: 'standard-3x4',
        calibration: STANDARD_CALIBRATION,
        quad: rectToQuad({ x: 0, y: 0, width: 3000, height: 2000 }),
      },
      status,
      remoteId,
      attempts: 0,
      lastFailure: null,
    };
  }

  it('agrupa en listos, en marcha y con error', () => {
    const studies = [
      study('a', 'uploaded', 'r-a'),
      study('b', 'uploaded', 'r-b'),
      study('c', 'uploaded', 'r-c'),
      study('d', 'pending', null),
      study('e', 'failed', null),
    ];
    const byStudy = {
      'r-a': analysis('ready'),
      'r-b': analysis('failed'),
      'r-c': analysis('processing'),
    };

    expect(studyCounts(studies, byStudy)).toEqual({ ready: 1, inProgress: 2, failed: 2 });
  });

  it('LOS TRES SUMAN EL TOTAL: NINGUN ESTUDIO SE QUEDA SIN CONTAR', () => {
    // Una cifra que no cuadra con el historial es una interfaz que miente sobre lo
    // que hay guardado, que es exactamente lo que ya le paso a este inicio.
    const studies = (['pending', 'uploading', 'failed', 'uploaded'] as const).map((status, index) =>
      study(String(index), status, status === 'uploaded' ? 'r' : null),
    );
    const counts = studyCounts(studies, {});

    expect(counts.ready + counts.inProgress + counts.failed).toBe(studies.length);
  });
});
