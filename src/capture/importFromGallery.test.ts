import { importFromGallery } from '@/capture/importFromGallery';

const mockLaunch = jest.fn();

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunch(...args),
}));

/**
 * La recodificacion se sustituye por una identidad con dimensiones fijas.
 *
 * Lo que estas pruebas vigilan no es como se comprime, sino que region de la
 * imagen se propone recortar. La recodificacion en si esta ahi por los metadatos
 * EXIF, y eso se cubre leyendo las opciones con las que se pide la imagen.
 */
const SAVED = { uri: 'file:///studies/importada.jpg', width: 1800, height: 1080 };

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: () => ({
      renderAsync: async () => ({ saveAsync: async () => SAVED }),
    }),
  },
}));

beforeEach(() => {
  mockLaunch.mockReset();
  mockLaunch.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///galeria/ecg.jpg' }] });
});

describe('importar desde la galeria', () => {
  it('EL RECORTE DE PARTIDA ES LA IMAGEN ENTERA', async () => {
    // Una imagen importada suele venir ya recortada al electrocardiograma, asi
    // que empezar por dentro corta señal antes de que nadie toque nada. Medido:
    // con un margen del diez por ciento, la misma imagen perdia las seis
    // derivaciones de los miembros y el digitalizador la leia como otro montaje.
    const photo = await importFromGallery();

    expect(photo?.framedRegion).toEqual({ x: 0, y: 0, width: 1800, height: 1080 });
  });

  it('el recorte no depende del tamaño de la imagen', async () => {
    // El margen anterior era una fraccion, asi que cuanto mejor era la foto mas
    // se comia: 180 px por lado en un ECG de 1800, y 400 en uno de 4000.
    const photo = await importFromGallery();

    expect(photo?.framedRegion.width).toBe(photo?.width);
    expect(photo?.framedRegion.height).toBe(photo?.height);
  });

  it('pide la imagen sin recorte del sistema y sin EXIF', async () => {
    // El recorte de esta aplicacion es el de las cuatro esquinas, que conserva la
    // perspectiva como dato. Y los EXIF de una foto de galeria pueden llevar
    // coordenadas: la casa del paciente, el hospital.
    await importFromGallery();

    const options = mockLaunch.mock.calls[0][0] as Record<string, unknown>;

    expect(options.allowsEditing).toBe(false);
    expect(options.exif).toBe(false);
  });

  it('cancelar no devuelve nada', async () => {
    mockLaunch.mockResolvedValue({ canceled: true, assets: [] });

    expect(await importFromGallery()).toBeNull();
  });
});
