import { StyleSheet, Text, View } from 'react-native';

import { useOnboardingSteps } from '@/auth/useOnboardingSteps';
import { ActionButton } from '@/components/ActionButton';
import { AuthLink } from '@/components/AuthLink';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import {
  FORM_ICON_PATHS,
  FORM_ICON_VIEWBOX,
  type FormIconName,
} from '@/components/icons/formIcons';
import { LineIcon } from '@/components/icons/LineIcon';
import { ONBOARDING_TEXT } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { gap, size } from '@/design/tokens';
import { type } from '@/design/type';

/**
 * El icono de cada paso.
 *
 * Uno por paso y nada mas. La version anterior acompanaba cada paso de cuatro
 * cosas que decian lo mismo: la micro-etiqueta «PASO 01 DE 03», una fila de
 * pildoras «01 Captura / 02 Senal / 03 Criterio», una segunda pildora con la
 * etiqueta «ENCUADRE OPTICO» y el titular. Cuatro elementos para una sola
 * informacion, y tres de ellos dentro de tarjetas con borde y sombra.
 */
const STEP_ICONS: readonly FormIconName[] = ['camera', 'pulse', 'shield'];

/** Lado del icono del paso. Grande: aqui es el sujeto, no una marca de campo. */
const STEP_ICON_SIDE = 44;

/**
 * Presentacion en tres pasos.
 *
 * El paso en el que se esta lo dice la micro-etiqueta y nada mas; el titular dice
 * que es ese paso y el cuerpo lo explica. El icono va suelto sobre el vidrio,
 * sin halo ni tarjeta propia: una tarjeta dentro de otra tarjeta es un marco
 * alrededor de un marco.
 *
 * @returns La pantalla de presentacion.
 */
export function OnboardingScreen() {
  const theme = useTheme();
  const { step, stepIndex, stepCount, isLastStep, advance, skipToNotice } = useOnboardingSteps();
  const iconName = STEP_ICONS[stepIndex] ?? STEP_ICONS[0];

  return (
    <AuthScreenLayout
      title={step?.title ?? ''}
      eyebrow={`PASO 0${stepIndex + 1} DE 0${stepCount}`}
      footer={
        <ActionButton
          label={isLastStep ? ONBOARDING_TEXT.start : ONBOARDING_TEXT.next}
          onPress={advance}
          variant="primary"
        />
      }
    >
      <View style={styles.icon}>
        <LineIcon
          path={FORM_ICON_PATHS[iconName ?? 'camera']}
          color={theme.bloom}
          viewBox={FORM_ICON_VIEWBOX}
          side={STEP_ICON_SIDE}
        />
      </View>
      <Text style={[type.body, styles.bodyText, { color: theme.textLow }]}>{step?.body ?? ''}</Text>
      {isLastStep ? null : <AuthLink label={ONBOARDING_TEXT.skip} onPress={skipToNotice} />}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', minHeight: size.touchTarget },
  bodyText: { lineHeight: 22, textAlign: 'center', paddingHorizontal: gap.xs },
});
