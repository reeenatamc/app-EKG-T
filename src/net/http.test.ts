import { httpRequest, NetworkUnreachableError, reasonFrom } from '@/net/http';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      name: 'EKG Reader',
      version: '0.1.0',
      // Con barra final a proposito: es como acaba escrito .env la mitad de las veces.
      extra: { apiBaseUrl: 'http://localhost:8000/' },
    },
  },
}));

/** Respuesta minima, con lo unico que el transporte lee de una. */
function responding(status: number, body: string): Response {
  return { status, text: async () => body } as unknown as Response;
}

const mockedFetch = jest.fn();

beforeEach(() => {
  mockedFetch.mockReset();
  global.fetch = mockedFetch as unknown as typeof fetch;
});

/** La URL con la que se llamo a fetch en la ultima peticion. */
function calledUrl(): string {
  return mockedFetch.mock.calls[0][0] as string;
}

/** Las opciones con las que se llamo a fetch en la ultima peticion. */
function calledInit(): RequestInit {
  return mockedFetch.mock.calls[0][1] as RequestInit;
}

describe('httpRequest', () => {
  it('une la base y la ruta sin duplicar la barra', async () => {
    // Una URL con doble barra no falla de forma visible: responde 404 y parece
    // que el endpoint no existe.
    mockedFetch.mockResolvedValue(responding(200, '{}'));

    await httpRequest('/auth/session/');

    expect(calledUrl()).toBe('http://localhost:8000/auth/session/');
  });

  it('devuelve el estado y el cuerpo ya interpretado', async () => {
    mockedFetch.mockResolvedValue(responding(200, '{"session":{"email":"a@b.c"}}'));

    const response = await httpRequest('/auth/session/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ session: { email: 'a@b.c' } });
  });

  it('no lanza ante un codigo de error: un 401 es una respuesta', async () => {
    // El adaptador necesita leer el cuerpo del rechazo para saber el motivo.
    mockedFetch.mockResolvedValue(responding(401, '{"reason":"credentials-mismatch"}'));

    const response = await httpRequest('/auth/sign-in/', { method: 'POST', json: {} });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ reason: 'credentials-mismatch' });
  });

  it('un cuerpo vacio llega como null y no como un fallo', async () => {
    // 204 es la respuesta correcta de sign-out y no trae nada que interpretar.
    mockedFetch.mockResolvedValue(responding(204, ''));

    const response = await httpRequest('/auth/sign-out/', { method: 'POST' });

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it('un cuerpo que no es JSON tampoco es un fallo del transporte', async () => {
    // Un error interno del servidor puede llegar como una pagina HTML.
    mockedFetch.mockResolvedValue(responding(500, '<html>Server Error</html>'));

    const response = await httpRequest('/studies/');

    expect(response.status).toBe(500);
    expect(response.body).toBeNull();
  });

  it('adjunta la credencial cuando se le da una', async () => {
    mockedFetch.mockResolvedValue(responding(200, '{}'));

    await httpRequest('/auth/session/', { token: 'abc123' });

    expect((calledInit().headers as Record<string, string>).Authorization).toBe('Token abc123');
  });

  it('no adjunta cabecera de credencial cuando no la hay', async () => {
    mockedFetch.mockResolvedValue(responding(200, '{}'));

    await httpRequest('/auth/register/', { method: 'POST', json: {} });

    expect((calledInit().headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('no escribe Content-Type en una subida multipart', async () => {
    // Lo tiene que poner fetch: incluye el separador que genera al construir el
    // cuerpo, y uno escrito a mano no lo lleva, asi que el servidor no sabria
    // donde empieza cada parte.
    mockedFetch.mockResolvedValue(responding(201, '{}'));

    await httpRequest('/studies/', { method: 'POST', form: new FormData() });

    expect((calledInit().headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('distingue "no hubo servidor" de "el servidor dijo que no"', async () => {
    mockedFetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(httpRequest('/auth/session/')).rejects.toBeInstanceOf(NetworkUnreachableError);
  });
});

describe('reasonFrom', () => {
  const KNOWN = ['code-mismatch', 'code-expired', 'unexpected'] as const;

  it('devuelve el motivo cuando el servidor manda uno conocido', () => {
    expect(reasonFrom({ reason: 'code-expired' }, KNOWN, 'unexpected')).toBe('code-expired');
  });

  it('degrada un motivo que la interfaz no sabe contar', () => {
    // Un motivo anadido en el servidor y no en la app llegaria a pantalla como
    // texto generico sin que nadie se entere. Asi al menos queda en el registro.
    expect(reasonFrom({ reason: 'motivo-inventado' }, KNOWN, 'unexpected')).toBe('unexpected');
  });

  it('degrada una respuesta sin motivo', () => {
    expect(reasonFrom({}, KNOWN, 'unexpected')).toBe('unexpected');
  });

  it('degrada una respuesta que no es un objeto', () => {
    expect(reasonFrom(null, KNOWN, 'unexpected')).toBe('unexpected');
  });
});
