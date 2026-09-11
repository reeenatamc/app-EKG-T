import { studyState } from '@/capture/studyState';
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
