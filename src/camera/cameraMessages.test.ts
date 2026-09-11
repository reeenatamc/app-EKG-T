import { cameraMessages, type CameraMessageInput } from '@/camera/cameraMessages';
import { CAMERA_TEXT } from '@/constants/captureText';

const CALM: CameraMessageInput = {
  isAligned: false,
  tiltMode: 'flat',
  isTilted: false,
  isDim: false,
  hasCaptureFailed: false,
  hasImportFailed: false,
  suggestSideways: false,
};

describe('cameraMessages', () => {
  it('sin nada que avisar, solo la instruccion y la postura', () => {
    expect(cameraMessages(CALM)).toEqual({
      eyebrow: CAMERA_TEXT.tiltModeFlat,
      title: CAMERA_TEXT.instruction,
      notes: [],
    });
  });

  it('alineado, confirma el encuadre', () => {
    expect(cameraMessages({ ...CALM, isAligned: true }).title).toBe(CAMERA_TEXT.aligned);
  });

  it('sin sensor no inventa una postura', () => {
    expect(cameraMessages({ ...CALM, tiltMode: null }).eyebrow).toBeNull();
  });

  it('LO QUE FALLO VA ANTES QUE LO QUE SOLO MEJORA', () => {
    const { notes } = cameraMessages({
      ...CALM,
      suggestSideways: true,
      isTilted: true,
      isDim: true,
      hasCaptureFailed: true,
    });

    expect(notes).toEqual([
      CAMERA_TEXT.shutterFailure,
      CAMERA_TEXT.dimWarning,
      CAMERA_TEXT.tiltWarning,
      CAMERA_TEXT.sidewaysHint,
    ]);
  });

  it('la sugerencia de girar solo sale cuando se pide', () => {
    expect(cameraMessages(CALM).notes).not.toContain(CAMERA_TEXT.sidewaysHint);
    expect(cameraMessages({ ...CALM, suggestSideways: true }).notes).toContain(
      CAMERA_TEXT.sidewaysHint,
    );
  });
});
