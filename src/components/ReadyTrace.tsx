import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { ActionButton } from '@/components/ActionButton';
import { StudyTrace } from '@/components/StudyTrace';
import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgAnalysis, EcgObservation } from '@/ecg/EcgAnalysisService';
import { presentLeads } from '@/ecg/leads';
import type { EcgSignal, LeadName } from '@/ecg/signal';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

interface ReadyTraceProps {
  readonly study: QueuedStudy;
  readonly analysis: EcgAnalysis;
}

/**
 * El trazado de un estudio listo, con la accion de resaltar de donde sale la lectura.
 *
 * EL RESALTADO VA JUNTO AL TRAZADO Y NO EN LA HOJA. Lo que hace se ve en el visor,
 * y la hoja abierta tapa el visor: un boton dentro de ella cambiaria algo que en ese
 * momento no se ve, y habria que cerrar la hoja para comprobar que funciono. Aqui
 * debajo, el efecto aparece justo encima del dedo (D-30).
 *
 * @param study Estudio en cuestion.
 * @param analysis Analisis ya listo.
 * @returns El bloque Trazado, o nada si el analisis no trae senal.
 */
export function ReadyTrace({ study, analysis }: ReadyTraceProps) {
  const [isShown, setIsShown] = useState(false);
  const { signal } = analysis;
  const basis = useMemo(() => readingBasis(signal, analysis.observations), [signal, analysis]);

  if (signal === null) {
    return null;
  }

  return (
    <StudyTrace
      study={study}
      signal={signal}
      focusedLeads={isShown ? basis : null}
      footer={
        <ReadingBasis basis={basis} isShown={isShown} onToggle={() => setIsShown((on) => !on)} />
      }
    />
  );
}

/**
 * Las derivaciones de las que sale la lectura.
 *
 * Se unen las de todas las observaciones porque el pipeline se las pone iguales
 * a todas: las calcula una vez para la lectura entera. El modelo no localiza
 * hallazgos -- recibe una senal y devuelve puntuaciones-- asi que no hay forma de
 * saber en cual se ve cada cosa. La union deja esto correcto si algun dia las
 * distingue, sin prometerlo hoy.
 *
 * @param signal Senal digitalizada, o null si no la hay.
 * @param observations Observaciones de la lectura.
 * @returns Las derivaciones presentes, o null si no se puede decir.
 */
function readingBasis(
  signal: EcgSignal | null,
  observations: readonly EcgObservation[],
): readonly LeadName[] | null {
  if (signal === null) {
    return null;
  }

  const named = [...new Set(observations.flatMap((observation) => observation.leads))];

  return presentLeads(signal, named);
}

interface ReadingBasisProps {
  readonly basis: readonly LeadName[] | null;
  readonly isShown: boolean;
  readonly onToggle: () => void;
}

/**
 * De donde sale la lectura, y el interruptor para verlo en el trazado.
 *
 * UN SOLO INTERRUPTOR, y no una seleccion por observacion. Tocar cada una
 * sugeriria que cada una lleva a un sitio distinto, y no puede: todas se apoyan
 * en las mismas derivaciones porque es lo unico que el pipeline sabe decir.
 *
 * Y con estado a la vista: la etiqueta dice lo que va a hacer.
 */
function ReadingBasis({ basis, isShown, onToggle }: ReadingBasisProps) {
  const theme = useTheme();

  if (basis === null) {
    return null;
  }

  return (
    <View style={styles.basis}>
      <Text style={[type.caption, { color: theme.textLow }]}>
        {STUDY_TEXT.basisLabel} {basis.join(' · ')}
      </Text>
      {/* En fila: a ancho completo pesaria mas que la lectura. */}
      <View style={styles.basisAction}>
        <ActionButton
          label={isShown ? STUDY_TEXT.hideBasis : STUDY_TEXT.showBasis}
          onPress={onToggle}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  basis: { gap: gap.sm, marginTop: gap.xs },
  basisAction: { flexDirection: 'row', alignSelf: 'flex-start' },
});
