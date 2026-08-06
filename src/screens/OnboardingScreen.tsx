import { Text } from 'react-native';

import { useOnboardingSteps } from '@/auth/useOnboardingSteps';
import { ActionButton } from '@/components/ActionButton';
import { AuthLink } from '@/components/AuthLink';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ONBOARDING_TEXT } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { type } from '@/design/type';

/** Dos digitos siempre, para que el contador no cambie de ancho al avanzar. */
const PAD = 2;

/**
 * Introduccion en tres pasos.
 *
 * El tercer paso es el aviso clinico, y es un paso propio a proposito: que la
 * aplicacion no diagnostica no puede ir como letra chica al pie de otra
 * pantalla.
 *
 * EL CONTADOR SUSTITUYE A LOS PUNTOS. Los tres puntos decian el paso con menos
 * precision, quedaban ocultos a accesibilidad —no se pueden leer en voz alta— y
 * eran una segunda copia de una informacion que el titular ya insinua. Un
 * contador monoespaciado sobre el titular lo dice mejor y desaparece un
 * componente.
 *
 * @returns La pantalla de introduccion.
 */
export function OnboardingScreen() {
  const theme = useTheme();
  const { step, stepIndex, stepCount, isLastStep, advance, skipToNotice } = useOnboardingSteps();

  const counter = `${ONBOARDING_TEXT.stepCounter} ${String(stepIndex + 1).padStart(PAD, '0')} / ${String(stepCount).padStart(PAD, '0')}`;

  return (
    <AuthScreenLayout
      title={step?.title ?? ''}
      eyebrow={counter}
      footer={
        <ActionButton
          label={isLastStep ? ONBOARDING_TEXT.start : ONBOARDING_TEXT.next}
          onPress={advance}
          variant="primary"
        />
      }
    >
      <Text style={[type.body, { color: theme.textLow }]}>{step?.body ?? ''}</Text>
      {isLastStep ? null : <AuthLink label={ONBOARDING_TEXT.skip} onPress={skipToNotice} />}
    </AuthScreenLayout>
  );
}
