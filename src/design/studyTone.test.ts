import { contrastRatio } from '@/design/contrast';
import { paperDark, paperLight, studyTone } from '@/design/tokens';

describe('tonos de estado de un estudio', () => {
  const MIN_TEXT_CONTRAST = 4.5;

  it.each(Object.entries(studyTone.light))(
    'en claro, %s se lee sobre la superficie',
    (_state, tone) => {
      expect(contrastRatio(tone, paperLight.surface)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    },
  );

  it.each(Object.entries(studyTone.dark))(
    'en oscuro, %s se lee sobre la superficie',
    (_state, tone) => {
      expect(contrastRatio(tone, paperDark.surface)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    },
  );

  it('LOS DOS TEMAS CUBREN LOS MISMOS ESTADOS', () => {
    // Un estado sin tono en un tema pintaria undefined, que en pantalla es negro
    // sobre ciruela: ilegible justo en el caso que hay que atender.
    expect(Object.keys(studyTone.dark).sort()).toEqual(Object.keys(studyTone.light).sort());
  });
});
