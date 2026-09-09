import { httpEcgAnalysisService } from '@/ecg/HttpEcgAnalysisService';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      name: 'EKG Reader',
      version: '0.1.0',
      extra: { apiBaseUrl: 'http://localhost:8000' },
    },
  },
}));

const mockStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

const TOKEN_KEY = 'ekg.token';
const STUDY_ID = '23e78f57-71b6-4c14-b7df-aa71310d00f5';

/** Un analisis listo, en la forma exacta que devuelve api-EKG. */
const READY = {
  studyId: STUDY_ID,
  status: 'ready',
  signal: {
    samplingRateHz: 500,
    durationSeconds: 10,
    leads: [
      { name: 'II', segments: [{ startSecond: 0, values: [0, 0.1, -0.05] }] },
      { name: 'V4R', segments: [{ startSecond: 2.5, values: [0.2] }] },
    ],
  },
  measurements: null,
  observations: [
    {
      id: 'sinus-rhythm',
      label: 'SINUS RHYTHM',
      leads: ['II'],
      confidence: 0.94,
      needsReview: true,
    },
  ],
  failure: null,
  completedAt: '2026-09-09T00:20:00.000Z',
};

const QUEUED = {
  studyId: STUDY_ID,
  status: 'queued',
  signal: null,
  measurements: null,
  observations: [],
  failure: null,
  completedAt: null,
};

function responding(status: number, body: unknown): Response {
  return { status, text: async () => JSON.stringify(body) } as unknown as Response;
}

const mockedFetch = jest.fn();

beforeEach(() => {
  mockStore.clear();
  mockStore.set(TOKEN_KEY, 'tok-123');
  mockedFetch.mockReset();
  global.fetch = mockedFetch as unknown as typeof fetch;
});

describe('pedir un analisis', () => {
  it('devuelve el analisis en el estado que diga el servidor', async () => {
    mockedFetch.mockResolvedValue(responding(201, QUEUED));

    const analysis = await httpEcgAnalysisService.request(STUDY_ID);

    expect(analysis.status).toBe('queued');
    expect(analysis.signal).toBeNull();
    expect(analysis.failure).toBeNull();
  });

  it('un estudio que el servidor no conoce se cuenta como fallo', async () => {
    // Pasa con los estudios que la simulacion dio por enviados sin enviarlos.
    // Devolver "en cola" los dejaria esperando para siempre a algo que no va a
    // llegar; como fallo, el usuario puede reintentar o descartarlos.
    mockedFetch.mockResolvedValue(responding(404, null));

    const analysis = await httpEcgAnalysisService.request(STUDY_ID);

    expect(analysis.status).toBe('failed');
    expect(analysis.failure).toBe('unexpected');
  });

  it('sin red devuelve un analisis fallido, no una excepcion', async () => {
    // Quien llama no captura: el contrato promete un analisis siempre.
    mockedFetch.mockRejectedValue(new TypeError('Network request failed'));

    const analysis = await httpEcgAnalysisService.request(STUDY_ID);

    expect(analysis.status).toBe('failed');
    expect(analysis.failure).toBe('network-unreachable');
  });

  it('traduce el motivo que da el servidor', async () => {
    mockedFetch.mockResolvedValue(responding(422, { reason: 'grid-not-detected' }));

    expect((await httpEcgAnalysisService.request(STUDY_ID)).failure).toBe('grid-not-detected');
  });
});

describe('consultar como va', () => {
  it('devuelve el analisis cuando el servidor responde', async () => {
    mockedFetch.mockResolvedValue(responding(200, READY));

    const analysis = await httpEcgAnalysisService.get(STUDY_ID);

    expect(analysis?.status).toBe('ready');
    expect(analysis?.signal?.leads).toHaveLength(2);
  });

  it('SIN RED DEVUELVE null, NO UN FALLO', async () => {
    // Quien sondea conserva lo que tenia y vuelve a preguntar. Un corte de red
    // debe comportarse como una espera mas larga, no convertirse en un analisis
    // fallido que haya que reintentar a mano.
    mockedFetch.mockRejectedValue(new TypeError('Network request failed'));

    expect(await httpEcgAnalysisService.get(STUDY_ID)).toBeNull();
  });

  it('un estudio desconocido tambien es null', async () => {
    mockedFetch.mockResolvedValue(responding(404, null));

    expect(await httpEcgAnalysisService.get(STUDY_ID)).toBeNull();
  });
});

describe('lo que llega se comprueba', () => {
  it('needsReview se pone a true aunque el servidor diga lo contrario', async () => {
    // La aplicacion no diagnostica, y esa promesa no puede depender de lo que
    // mande un servidor.
    const observations = [{ ...READY.observations[0], needsReview: false }];
    mockedFetch.mockResolvedValue(responding(200, { ...READY, observations }));

    const analysis = await httpEcgAnalysisService.get(STUDY_ID);

    expect(analysis?.observations[0]?.needsReview).toBe(true);
  });

  it('una derivacion con un nombre desconocido invalida el analisis entero', async () => {
    // Descartarla en silencio dejaria un electrocardiograma con menos
    // derivaciones, indistinguible de un registro que de verdad tenia menos.
    const leads = [{ name: 'aVX', segments: [{ startSecond: 0, values: [0] }] }];
    mockedFetch.mockResolvedValue(
      responding(200, { ...READY, signal: { ...READY.signal, leads } }),
    );

    expect(await httpEcgAnalysisService.get(STUDY_ID)).toBeNull();
  });

  it('una muestra que no es un numero invalida el analisis entero', async () => {
    // Interpolarla o saltarla seria inventar una muestra que nadie registro.
    const leads = [{ name: 'II', segments: [{ startSecond: 0, values: [0, null, 0.1] }] }];
    mockedFetch.mockResolvedValue(
      responding(200, { ...READY, signal: { ...READY.signal, leads } }),
    );

    expect(await httpEcgAnalysisService.get(STUDY_ID)).toBeNull();
  });

  it('unas medidas incompletas se descartan enteras', async () => {
    // EcgMeasurements no tiene forma parcial: rellenar PR y QT con cualquier
    // cosa seria inventar medidas de un paciente.
    const measurements = { heartRateBpm: 60, prIntervalMs: 160 };
    mockedFetch.mockResolvedValue(responding(200, { ...READY, measurements }));

    expect((await httpEcgAnalysisService.get(STUDY_ID))?.measurements).toBeNull();
  });

  it('las medidas nulas del servidor real pasan tal cual', async () => {
    // Es lo que devuelve api-EKG hoy: el pipeline no delinea ondas.
    mockedFetch.mockResolvedValue(responding(200, READY));

    expect((await httpEcgAnalysisService.get(STUDY_ID))?.measurements).toBeNull();
  });

  it('un cuerpo que no se puede interpretar no llega a la pantalla', async () => {
    mockedFetch.mockResolvedValue(responding(200, { status: 'inventado' }));

    expect(await httpEcgAnalysisService.get(STUDY_ID)).toBeNull();
  });
});
