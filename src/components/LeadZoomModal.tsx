import { Canvas } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Calibration } from '@/capture/study';
import { IconButton } from '@/components/IconButton';
import { LeadTrace } from '@/components/LeadTrace';
import { MeasuringGrid } from '@/components/MeasuringGrid';
import { STUDY_TEXT } from '@/constants/studyText';
import { computeLeadZoom, formatScaleNumber, type LeadZoomGeometry } from '@/ecg/leadZoom';
import type { EcgSignal, Lead, LeadName } from '@/ecg/signal';
import type { ViewerCell } from '@/ecg/viewerLayout';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

interface LeadZoomModalProps {
  /** Celda ampliada, o null si no hay ninguna abierta. */
  readonly cell: ViewerCell | null;
  readonly signal: EcgSignal;
  readonly calibration: Calibration;
  readonly onClose: () => void;
}

/**
 * Una derivacion vista de cerca, a pantalla completa.
 *
 * Existe para contar cuadros: en el visor de doce derivaciones un cuadro
 * pequeno mide un par de puntos y no se puede. Aqui mide ocho, con la reticula
 * fina visible y el valor de cada cuadro escrito arriba.
 */
export function LeadZoomModal({ cell, signal, calibration, onClose }: LeadZoomModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={cell !== null} animationType="slide" onRequestClose={onClose}>
      <View
        style={[styles.screen, { backgroundColor: theme.surface, paddingTop: insets.top + gap.md }]}
      >
        {cell === null ? null : (
          <>
            <ZoomHeader lead={cell.lead} calibration={calibration} onClose={onClose} />
            <ZoomTrace cell={cell} signal={signal} calibration={calibration} />
          </>
        )}
      </View>
    </Modal>
  );
}

interface ZoomHeaderProps {
  readonly lead: LeadName;
  readonly calibration: Calibration;
  readonly onClose: () => void;
}

/** Nombre de la derivacion, valor de un cuadro pequeno y boton de cerrar. */
function ZoomHeader({ lead, calibration, onClose }: ZoomHeaderProps) {
  const theme = useTheme();
  const seconds = formatScaleNumber(1 / calibration.speedMmPerSecond);
  const millivolts = formatScaleNumber(1 / calibration.gainMmPerMillivolt);

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={[type.body, { color: theme.textHigh }]}>
          {STUDY_TEXT.zoomTitle} {lead}
        </Text>
        <Text style={[type.caption, { color: theme.textLow }]}>
          {STUDY_TEXT.zoomSquare}: {seconds} s × {millivolts} mV
        </Text>
      </View>
      <IconButton
        icon="close"
        label={STUDY_TEXT.zoomClose}
        onPress={onClose}
        color={theme.textHigh}
        background={theme.surface}
      />
    </View>
  );
}

interface ZoomTraceProps {
  readonly cell: ViewerCell;
  readonly signal: EcgSignal;
  readonly calibration: Calibration;
}

/** El trazado ampliado sobre su reticula, con desplazamiento lateral. */
function ZoomTrace({ cell, signal, calibration }: ZoomTraceProps) {
  const zoom = useMemo(() => computeLeadZoom(cell, calibration), [cell, calibration]);
  const lead = signal.leads.find((candidate) => candidate.name === cell.lead);

  if (lead === undefined) {
    return null;
  }

  return (
    <ScrollView horizontal bounces={false}>
      <ZoomCanvas lead={lead} samplingRateHz={signal.samplingRateHz} zoom={zoom} />
    </ScrollView>
  );
}

interface ZoomCanvasProps {
  readonly lead: Lead;
  readonly samplingRateHz: number;
  readonly zoom: LeadZoomGeometry;
}

/** Reticula y trazado de la vista ampliada, en un solo lienzo. */
function ZoomCanvas({ lead, samplingRateHz, zoom }: ZoomCanvasProps) {
  const theme = useTheme();

  return (
    <Canvas style={{ width: zoom.width, height: zoom.height }}>
      <MeasuringGrid
        width={zoom.width}
        height={zoom.height}
        geometry={zoom.grid}
        fineColor={theme.gridFine}
        boldColor={theme.gridBold}
      />
      <LeadTrace
        lead={lead}
        samplingRateHz={samplingRateHz}
        viewport={zoom.viewport}
        scale={zoom.scale}
        color={theme.ink}
        maxPointsPerSegment={zoom.maxPointsPerSegment}
      />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: gap.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gap.lg,
    gap: gap.md,
  },
  headerText: { flex: 1, gap: gap.xs },
});
