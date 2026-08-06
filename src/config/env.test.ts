import Constants from 'expo-constants';

import { getAppEnvironment } from '@/config/env';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: null },
}));

// expo-constants declara expoConfig como solo lectura. El cast permite simular
// cada estado de configuracion sin depender de una compilacion nativa real.
const mockedConstants = Constants as unknown as { expoConfig: unknown };

const VALID_EXPO_CONFIG = {
  name: 'EKG Reader',
  version: '0.1.0',
  extra: { apiBaseUrl: 'http://localhost:8000' },
};

describe('getAppEnvironment', () => {
  it('devuelve la configuracion cuando app.config.ts es valida', () => {
    mockedConstants.expoConfig = VALID_EXPO_CONFIG;

    expect(getAppEnvironment()).toEqual({
      name: 'EKG Reader',
      version: '0.1.0',
      apiBaseUrl: 'http://localhost:8000',
    });
  });

  it('falla si expo-constants no expone configuracion alguna', () => {
    mockedConstants.expoConfig = null;

    expect(getAppEnvironment).toThrow(/configuracion de Expo/);
  });

  it('falla si API_BASE_URL no esta definida', () => {
    mockedConstants.expoConfig = { ...VALID_EXPO_CONFIG, extra: {} };

    expect(getAppEnvironment).toThrow(/API_BASE_URL/);
  });

  it('falla si API_BASE_URL esta vacia', () => {
    mockedConstants.expoConfig = { ...VALID_EXPO_CONFIG, extra: { apiBaseUrl: '' } };

    expect(getAppEnvironment).toThrow(/API_BASE_URL/);
  });

  it('falla si la version no llega desde package.json', () => {
    mockedConstants.expoConfig = { ...VALID_EXPO_CONFIG, version: undefined };

    expect(getAppEnvironment).toThrow(/version/);
  });
});
