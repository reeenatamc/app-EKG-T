import { httpUploadService } from '@/capture/HttpUploadService';
import { STANDARD_CALIBRATION, type QueuedStudy } from '@/capture/study';

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

const mockUpload = jest.fn();
const mockFile = { exists: true, extension: '.jpg' };

/**
 * Sustituto del archivo en disco.
 *
 * La subida real la hace codigo nativo que no existe en Node. Lo que estas
 * pruebas vigilan es lo que se le pide: la URL, las cabeceras y los campos del
 * formulario, que es donde se rompe el contrato con api-EKG.
 */
jest.mock('expo-file-system', () => ({
  UploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
  File: class {
    readonly uri: string;

    constructor(uri: string) {
      this.uri = uri;
    }

    get exists(): boolean {
      return mockFile.exists;
    }

    get extension(): string {
      return mockFile.extension;
    }

    upload = mockUpload;
  },
}));

const TOKEN_KEY = 'ekg.token';

const STUDY: QueuedStudy = {
  id: 'ECG-20260909-A1B2',
  imageUri: 'file:///data/user/0/com.reeenatamc.appekg/files/studies/ECG-20260909-A1B2.jpg',
  imageWidth: 3000,
  imageHeight: 2000,
  metadata: {
    anonymousId: 'ECG-20260909-A1B2',
    capturedAt: '2026-09-09T00:15:00.000Z',
    mount: 'standard-3x4',
    calibration: STANDARD_CALIBRATION,
    quad: [
      { x: 20, y: 20 },
      { x: 2980, y: 20 },
      { x: 2980, y: 1980 },
      { x: 20, y: 1980 },
    ],
  },
  status: 'pending',
  attempts: 0,
  lastFailure: null,
};

const RECEIPT = {
  remoteId: '23e78f57-71b6-4c14-b7df-aa71310d00f5',
  receivedAt: '2026-09-09T00:12:21.076876+00:00',
};

/** Respuesta de la subida nativa, que entrega el cuerpo como texto. */
function responding(status: number, body: unknown) {
  return { status, body: JSON.stringify(body), headers: {} };
}

beforeEach(() => {
  mockStore.clear();
  mockStore.set(TOKEN_KEY, 'tok-123');
  mockFile.exists = true;
  mockFile.extension = '.jpg';
  mockUpload.mockReset();
});

/** Las opciones con las que se pidio la subida. */
function uploadOptions(): Record<string, unknown> {
  return mockUpload.mock.calls[0][1] as Record<string, unknown>;
}

describe('envio de un estudio', () => {
  it('un acuse de recibo completo es un envio correcto', async () => {
    mockUpload.mockResolvedValue(responding(201, RECEIPT));

    expect(await httpUploadService.send(STUDY)).toEqual({ ok: true, value: RECEIPT });
  });

  it('sube al endpoint de estudios, como multiparte y con la imagen en su campo', async () => {
    mockUpload.mockResolvedValue(responding(201, RECEIPT));

    await httpUploadService.send(STUDY);

    expect(mockUpload.mock.calls[0][0]).toBe('http://localhost:8000/studies/');
    expect(uploadOptions().httpMethod).toBe('POST');
    expect(uploadOptions().uploadType).toBe(1);
    expect(uploadOptions().fieldName).toBe('image');
  });

  it('manda las dimensiones y los metadatos junto a la imagen', async () => {
    mockUpload.mockResolvedValue(responding(201, RECEIPT));

    await httpUploadService.send(STUDY);

    const parameters = uploadOptions().parameters as Record<string, string>;

    expect(parameters.imageWidth).toBe('3000');
    expect(parameters.imageHeight).toBe('2000');
    expect(JSON.parse(String(parameters.metadata))).toEqual(STUDY.metadata);
  });

  it('los metadatos viajan enteros, en un solo campo', async () => {
    // El servidor valida el cuadrilatero como el objeto que es: comprueba que no
    // se cruza y que encierra area suficiente. Repartido en campos sueltos no
    // podria hacerlo.
    mockUpload.mockResolvedValue(responding(201, RECEIPT));

    await httpUploadService.send(STUDY);

    const parameters = uploadOptions().parameters as Record<string, string>;

    expect(JSON.parse(String(parameters.metadata)).quad).toHaveLength(4);
  });

  it('adjunta la credencial guardada', async () => {
    mockUpload.mockResolvedValue(responding(201, RECEIPT));

    await httpUploadService.send(STUDY);

    const headers = uploadOptions().headers as Record<string, string>;

    expect(headers.Authorization).toBe('Token tok-123');
  });

  it('declara el tipo de imagen segun su extension', async () => {
    // Al otro lado hay un ImageField que valida con Pillow: un tipo equivocado
    // se rechaza como imagen invalida.
    mockUpload.mockResolvedValue(responding(201, RECEIPT));
    mockFile.extension = '.PNG';

    await httpUploadService.send(STUDY);

    expect(uploadOptions().mimeType).toBe('image/png');
  });
});

describe('cuando el envio no sale', () => {
  it('sin credencial no se intenta siquiera', async () => {
    // 'unauthorized' es la causa exacta: la cola la trata como algo que resuelve
    // el usuario entrando otra vez, no reintentando.
    mockStore.clear();

    expect(await httpUploadService.send(STUDY)).toEqual({
      ok: false,
      failure: { reason: 'unauthorized' },
    });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('si la imagen ya no esta en disco, no se gasta un intento de red', async () => {
    // Reintentar esto no lo arregla nunca, asi que no puede llegar como un fallo
    // de red, que es justo lo que la cola reintenta.
    mockFile.exists = false;

    expect(await httpUploadService.send(STUDY)).toEqual({
      ok: false,
      failure: { reason: 'unexpected' },
    });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('sin red devuelve network-unreachable, que la cola sabe reintentar', async () => {
    mockUpload.mockRejectedValue(new Error('Network request failed'));

    expect(await httpUploadService.send(STUDY)).toEqual({
      ok: false,
      failure: { reason: 'network-unreachable' },
    });
  });

  it('traduce el rechazo del servidor a su causa', async () => {
    // payload-rejected es lo que responde api-EKG cuando el cuadrilatero se
    // cruza o cae fuera de la imagen.
    mockUpload.mockResolvedValue(responding(400, { reason: 'payload-rejected' }));

    expect(await httpUploadService.send(STUDY)).toEqual({
      ok: false,
      failure: { reason: 'payload-rejected' },
    });
  });

  it('una credencial caducada llega como unauthorized', async () => {
    mockUpload.mockResolvedValue(responding(401, { reason: 'unauthorized' }));

    expect(await httpUploadService.send(STUDY)).toEqual({
      ok: false,
      failure: { reason: 'unauthorized' },
    });
  });

  it('UN 2XX SIN ACUSE UTILIZABLE NO ES UN ENVIO CORRECTO', async () => {
    // La cola borra la imagen del dispositivo en cuanto da el envio por bueno.
    // Aceptar una respuesta sin identificador borraria la unica copia de la foto
    // de un paciente a cambio de nada, y sin forma de volver a pedirla.
    mockUpload.mockResolvedValue(responding(201, { receivedAt: RECEIPT.receivedAt }));

    expect(await httpUploadService.send(STUDY)).toEqual({
      ok: false,
      failure: { reason: 'unexpected' },
    });
  });

  it('un acuse con identificador vacio tampoco vale', async () => {
    mockUpload.mockResolvedValue(responding(201, { ...RECEIPT, remoteId: '' }));

    expect(await httpUploadService.send(STUDY)).toEqual({
      ok: false,
      failure: { reason: 'unexpected' },
    });
  });
});
