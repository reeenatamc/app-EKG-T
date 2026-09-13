import { useState, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { SegmentedControl, type SegmentedOption } from '@/components/SegmentedControl';
import { TwelveLeadViewer } from '@/components/TwelveLeadViewer';
import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgSignal, LeadName } from '@/ecg/signal';
import { useTheme } from '@/design/theme';
import { gap, size } from '@/design/tokens';
import { type } from '@/design/type';

type TraceView = 'trace' | 'photo';

const VIEW_OPTIONS: readonly SegmentedOption<TraceView>[] = [
  { value: 'trace', label: STUDY_TEXT.viewTrace },
  { value: 'photo', label: STUDY_TEXT.viewPhotoShort },
];

interface StudyTraceProps {
  readonly study: QueuedStudy;
  readonly signal: EcgSignal;
  /** Lo que hay que saber de este trazado antes de mirarlo, si hace falta decirlo. */
  readonly caption?: string;
  /** Derivaciones resaltadas, o null para ninguna. */
  readonly focusedLeads?: readonly LeadName[] | null;
  /** Lo que va debajo del trazado, como la accion de resaltar. */
  readonly footer?: ReactNode;
}

/**
 * Bloque Trazado del detalle: titulo, selector Trazado/Foto y el visor.
 *
 * EL MISMO BLOQUE EN TODOS LOS ESTADOS. Procesando con el trazado temprano, fallido
 * tras digitalizar y listo dibujan lo mismo; solo cambia el rotulo de encima. Asi el
 * trazado no salta de sitio cuando la interpretacion termina.
 *
 * DE BORDE A BORDE. Cada punto de ancho es escala del trazado, y en un telefono el
 * margen lateral eran cuarenta y ocho puntos de retícula perdidos.
 *
 * @param study Estudio del trazado.
 * @param signal Senal digitalizada.
 * @returns El bloque.
 */
export function StudyTrace({
  study,
  signal,
  caption,
  focusedLeads = null,
  footer,
}: StudyTraceProps) {
  const theme = useTheme();
  // Trazado o foto: la misma hoja vista dos veces. Poder saltar de una a otra es
  // lo que deja comprobar a ojo que lo digitalizado es lo que estaba en el papel.
  const [view, setView] = useState<TraceView>('trace');
  const { calibration, mount } = study.metadata;

  return (
    <View style={styles.block}>
      <TraceHeading view={view} onChange={setView} />
      {caption === undefined ? null : (
        <Text style={[type.caption, { color: theme.textLow }]}>{caption}</Text>
      )}
      <View style={[styles.bleed, { borderColor: theme.edge }]}>
        {view === 'photo' ? (
          <StudyPhoto study={study} />
        ) : (
          <TwelveLeadViewer {...{ signal, mount, calibration, focusedLeads }} isFullBleed />
        )}
      </View>
      <Text style={[type.caption, { color: theme.textLow }]}>
        {calibration.speedMmPerSecond} mm/s · {calibration.gainMmPerMillivolt} mm/mV
      </Text>
      {footer}
    </View>
  );
}

interface TraceHeadingProps {
  readonly view: TraceView;
  readonly onChange: (view: TraceView) => void;
}

/** Titulo del bloque con el selector a la derecha. */
function TraceHeading({ view, onChange }: TraceHeadingProps) {
  const theme = useTheme();

  return (
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={[type.section, { color: theme.textHigh }]}>
        {STUDY_TEXT.signalSection}
      </Text>
      <View style={styles.switch}>
        <SegmentedControl
          options={VIEW_OPTIONS}
          value={view}
          onChange={onChange}
          accessibilityLabel={STUDY_TEXT.viewSwitchLabel}
        />
      </View>
    </View>
  );
}

/** La foto tal como se envio, a su proporcion, para cotejarla con el trazado. */
function StudyPhoto({ study }: { readonly study: QueuedStudy }) {
  const theme = useTheme();

  return (
    <Image
      source={{ uri: study.imageUri }}
      style={[
        styles.photo,
        { aspectRatio: study.imageWidth / study.imageHeight, backgroundColor: theme.surface },
      ]}
      resizeMode="contain"
      accessibilityLabel={STUDY_TEXT.viewPhoto}
    />
  );
}

const styles = StyleSheet.create({
  block: { gap: gap.sm },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: gap.md,
  },
  switch: { width: size.viewSwitch },
  // Anula el margen lateral de la pantalla para ir de borde a borde.
  bleed: {
    marginHorizontal: -gap.xl,
    borderTopWidth: size.hairline,
    borderBottomWidth: size.hairline,
  },
  photo: { width: '100%' },
});
