import { httpAuthService } from '@/auth/HttpAuthService';

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

/**
 * Almacen seguro en memoria.
 *
 * El de verdad respalda en el Keystore de Android, que no existe en Node. Se
 * sustituye por un mapa para poder comprobar que se guarda y se borra lo que
 * toca, que es justo lo que estas pruebas vigilan.
 */
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

const SESSION_KEY = 'ekg.session';
const TOKEN_KEY = 'ekg.token';

const SESSION = { userId: 'u-1', email: 'ron@prueba.local', role: 'professional' };

function responding(status: number, body: unknown): Response {
  return { status, text: async () => JSON.stringify(body) } as unknown as Response;
}

const mockedFetch = jest.fn();

beforeEach(() => {
  mockStore.clear();
  mockedFetch.mockReset();
  global.fetch = mockedFetch as unknown as typeof fetch;
});

describe('registro y verificacion', () => {
  it('el registro devuelve la espera de verificacion', async () => {
    mockedFetch.mockResolvedValue(
      responding(201, { email: 'ron@prueba.local', expiresInSeconds: 600 }),
    );

    const result = await httpAuthService.register({
      email: 'ron@prueba.local',
      password: 'unaclavelarga',
      role: 'professional',
    });

    expect(result).toEqual({
      ok: true,
      value: { email: 'ron@prueba.local', expiresInSeconds: 600 },
    });
  });

  it('un rechazo del servidor llega como motivo, no como codigo de estado', async () => {
    // Es la mitad servidor de un acuerdo que declara AuthService: el servicio
    // devuelve una causa y la pantalla decide como se cuenta, para que ningun
    // "Error 409" acabe delante de un usuario.
    mockedFetch.mockResolvedValue(responding(409, { reason: 'email-already-registered' }));

    const result = await httpAuthService.register({
      email: 'ron@prueba.local',
      password: 'unaclavelarga',
      role: 'professional',
    });

    expect(result).toEqual({ ok: false, failure: { reason: 'email-already-registered' } });
  });

  it('verificar el codigo guarda la sesion y la credencial', async () => {
    mockedFetch.mockResolvedValue(responding(200, { token: 'tok-123', session: SESSION }));

    const result = await httpAuthService.verifyCode({
      email: 'ron@prueba.local',
      code: '984959',
    });

    expect(result).toEqual({ ok: true, value: SESSION });
    expect(mockStore.get(TOKEN_KEY)).toBe('tok-123');
    expect(JSON.parse(mockStore.get(SESSION_KEY) ?? 'null')).toEqual(SESSION);
  });

  it('una sesion con un rol que el contrato no admite se rechaza', async () => {
    // Lo que llega por red es texto hasta que alguien lo comprueba. Una sesion a
    // medias se guardaria en el almacen seguro y reapareceria en cada arranque.
    mockedFetch.mockResolvedValue(
      responding(200, { token: 'tok-123', session: { ...SESSION, role: 'administrador' } }),
    );

    const result = await httpAuthService.verifyCode({
      email: 'ron@prueba.local',
      code: '984959',
    });

    expect(result).toEqual({ ok: false, failure: { reason: 'unexpected' } });
    expect(mockStore.has(TOKEN_KEY)).toBe(false);
  });
});

describe('entrada sin servidor', () => {
  it('sin red, entrar devuelve network-unreachable y no otro motivo', async () => {
    // La pantalla ofrece reintentar ante este motivo y ofrece registrarse ante
    // account-not-found. Confundirlos manda al usuario a crear una cuenta que ya
    // tiene porque el wifi se cayo.
    mockedFetch.mockRejectedValue(new TypeError('Network request failed'));

    const result = await httpAuthService.signIn({
      email: 'ron@prueba.local',
      password: 'unaclavelarga',
    });

    expect(result).toEqual({ ok: false, failure: { reason: 'network-unreachable' } });
  });
});

describe('restaurar la sesion al arrancar', () => {
  it('sin credencial guardada no hay sesion, y no se pregunta al servidor', async () => {
    mockStore.set(SESSION_KEY, JSON.stringify(SESSION));

    expect(await httpAuthService.restoreSession()).toBeNull();
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('si el servidor dice que la sesion ya no vale, se borra todo', async () => {
    // El caso que este endpoint existe para detectar: sesion cerrada desde otro
    // dispositivo. Enterarse al arrancar y no en la primera subida.
    mockStore.set(SESSION_KEY, JSON.stringify(SESSION));
    mockStore.set(TOKEN_KEY, 'tok-viejo');
    mockedFetch.mockResolvedValue(responding(401, { detail: 'Invalid token.' }));

    expect(await httpAuthService.restoreSession()).toBeNull();
    expect(mockStore.has(SESSION_KEY)).toBe(false);
    expect(mockStore.has(TOKEN_KEY)).toBe(false);
  });

  it('SIN RED SE ENTRA IGUAL: un arranque sin cobertura no es una sesion muerta', async () => {
    // Echar al usuario porque el arranque no tuvo red convertiria una molestia
    // en una perdida de acceso.
    mockStore.set(SESSION_KEY, JSON.stringify(SESSION));
    mockStore.set(TOKEN_KEY, 'tok-123');
    mockedFetch.mockRejectedValue(new TypeError('Network request failed'));

    expect(await httpAuthService.restoreSession()).toEqual(SESSION);
    expect(mockStore.get(TOKEN_KEY)).toBe('tok-123');
  });

  it('el servidor manda sobre lo guardado cuando responde', async () => {
    // Un cambio de rol hecho en el servidor llega en el siguiente arranque.
    const ascendido = { ...SESSION, role: 'student' };
    mockStore.set(SESSION_KEY, JSON.stringify(SESSION));
    mockStore.set(TOKEN_KEY, 'tok-123');
    mockedFetch.mockResolvedValue(responding(200, { session: ascendido }));

    expect(await httpAuthService.restoreSession()).toEqual(ascendido);
    expect(JSON.parse(mockStore.get(SESSION_KEY) ?? 'null')).toEqual(ascendido);
  });
});

describe('cerrar sesion', () => {
  it('borra sesion y credencial del dispositivo', async () => {
    mockStore.set(SESSION_KEY, JSON.stringify(SESSION));
    mockStore.set(TOKEN_KEY, 'tok-123');
    mockedFetch.mockResolvedValue(responding(204, null));

    await httpAuthService.signOut();

    expect(mockStore.size).toBe(0);
  });

  it('borra lo local aunque el servidor no conteste', async () => {
    // signOut no devuelve resultado, asi que no hay forma de contarle a nadie
    // que el servidor no contesto. Conservar la credencial por eso significaria
    // que pulsar "cerrar sesion" no cierra la sesion.
    mockStore.set(SESSION_KEY, JSON.stringify(SESSION));
    mockStore.set(TOKEN_KEY, 'tok-123');
    mockedFetch.mockRejectedValue(new TypeError('Network request failed'));

    await httpAuthService.signOut();

    expect(mockStore.size).toBe(0);
  });
});
