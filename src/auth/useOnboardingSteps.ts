import { useRouter } from 'expo-router';
import { useState } from 'react';

import { completeOnboarding } from '@/auth/preferences';
import { ONBOARDING_TEXT } from '@/constants/authText';

const STEPS = ONBOARDING_TEXT.steps;
const LAST_INDEX = STEPS.length - 1;

interface OnboardingStep {
  readonly title: string;
  readonly body: string;
}

export interface OnboardingProgress {
  readonly step: OnboardingStep | undefined;
  readonly stepIndex: number;
  readonly stepCount: number;
  readonly isLastStep: boolean;
  readonly advance: () => void;
  /** Salta hasta el aviso clinico, nunca por encima de el. */
  readonly skipToNotice: () => void;
}

/**
 * Avance de la introduccion.
 *
 * El salto lleva **al** aviso clinico y no mas alla: el usuario puede ahorrarse
 * la explicacion del flujo, pero no el aviso de que la aplicacion no
 * diagnostica. Ese paso hay que pasarlo, y por eso la regla vive aqui y no en
 * la pantalla, donde seria mas facil romperla sin darse cuenta.
 *
 * @returns El paso actual y las transiciones disponibles.
 */
export function useOnboardingSteps(): OnboardingProgress {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const isLastStep = stepIndex === LAST_INDEX;

  const advance = () => {
    if (!isLastStep) {
      setStepIndex(stepIndex + 1);
      return;
    }
    void completeOnboarding().then(() => router.replace('/login'));
  };

  return {
    step: STEPS[stepIndex],
    stepIndex,
    stepCount: STEPS.length,
    isLastStep,
    advance,
    skipToNotice: () => setStepIndex(LAST_INDEX),
  };
}
