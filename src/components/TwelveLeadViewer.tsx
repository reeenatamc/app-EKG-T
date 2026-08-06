import { Canvas, Group, rect } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import type { MountId } from '@/camera/mounts';
import type { Calibration } from '@/capture/study';
import { LeadTrace } from '@/components/LeadTrace';
import { MeasuringGrid } from '@/components/MeasuringGrid';
import { computeGridGeometry } from '@/ecg/grid';
import type { EcgSignal } from '@/ecg/signal';
import { computeViewerLayout, type ViewerCell } from '@/ecg/viewerLayout';
import { useTheme, type Theme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

interface TwelveLeadViewerProps {
  readonly signal: EcgSignal;
  readonly mount: MountId;
  readonly calibration: Calibration;
}

/**
 * El visor de doce derivaciones.
 *
 * SUPERFICIE OPACA, sin excepcion: §12.1 no admite vidrio bajo un dato clinico,
 * y esto es el dato clinico de la aplicacion entera.
 *
 * UN SOLO `<Canvas>` para toda la rejilla, no uno por derivacion. Doce lienzos
 * serian doce superficies de GPU y doce arboles de Skia para dibujar lo que es
 * una sola imagen. Cada derivacion es un `<Group>` trasladado y recortado a su
 * celda.
 *
 * El recorte por celda no es estetico: sin el, un complejo alto se saldria de su
 * fila y se dibujaria encima de la derivacion de arriba, que es peor que
 * recortarlo, porque parece senal de otra derivacion.
 *
 * @param signal Senal digitalizada.
 * @param mount Montaje del registro, que decide el reparto.
 * @param calibration Velocidad y amplitud con que se imprimio.
 * @returns El visor.
 */
export function TwelveLeadViewer({ signal, mount, calibration }: TwelveLeadViewerProps) {
  const theme = useTheme();
  // El reparto entero del visor cuelga de este numero: de el salen los pixeles
  // por milimetro y, de ahi, la retícula y la escala del trazado.
  const [width, setWidth] = useState<number | null>(null);

  const layout = useMemo(
    () => (width === null ? null : computeViewerLayout(mount, width, calibration)),
    [mount, width, calibration],
  );
  const grid = useMemo(
    () => (layout === null ? null : computeGridGeometry(layout.scale)),
    [layout],
  );

  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={[styles.surface, { backgroundColor: theme.surface }]} onLayout={handleLayout}>
      {layout === null || grid === null ? null : (
        <>
          <ViewerCanvas signal={signal} layout={layout} grid={grid} theme={theme} />
          <LeadLabels cells={layout.cells} />
        </>
      )}
    </View>
  );
}

interface ViewerCanvasProps {
  readonly signal: EcgSignal;
  readonly layout: ReturnType<typeof computeViewerLayout>;
  readonly grid: ReturnType<typeof computeGridGeometry>;
  readonly theme: Theme;
}

/**
 * El lienzo: retícula de medicion y las doce derivaciones.
 *
 * UN SOLO `<Canvas>` para toda la rejilla, no uno por derivacion. Doce lienzos
 * serian doce superficies de GPU para dibujar lo que es una sola imagen.
 */
function ViewerCanvas({ signal, layout, grid, theme }: ViewerCanvasProps) {
  return (
    <Canvas style={{ width: layout.width, height: layout.height }}>
      <MeasuringGrid
        width={layout.width}
        height={layout.height}
        geometry={grid}
        fineColor={theme.gridFine}
        boldColor={theme.gridBold}
      />

      {layout.cells.map((cell) => (
        <LeadCell
          key={`${cell.lead}-${cell.fromSecond}`}
          cell={cell}
          {...{ signal, layout, theme }}
        />
      ))}
    </Canvas>
  );
}

/**
 * Los nombres de las derivaciones, sobre el lienzo.
 *
 * En texto de React Native y no dibujados con Skia: rotular en Skia obliga a
 * cargar una fuente propia y a gestionar su ciclo de vida, y estos catorce
 * rotulos no se mueven ni se animan. Ademas asi los lee un lector de pantalla.
 */
function LeadLabels({ cells }: { readonly cells: readonly ViewerCell[] }) {
  const theme = useTheme();

  return (
    <>
      {cells.map((cell) => (
        <Text
          key={`label-${cell.lead}-${cell.fromSecond}`}
          style={[
            type.data,
            styles.label,
            { left: cell.x + gap.xs, top: cell.y + gap.xs, color: theme.textLow },
          ]}
        >
          {cell.lead}
        </Text>
      ))}
    </>
  );
}

interface LeadCellProps {
  readonly cell: ViewerCell;
  readonly signal: EcgSignal;
  readonly layout: ReturnType<typeof computeViewerLayout>;
  readonly theme: Theme;
}

/**
 * Una celda del visor: una derivacion en su ventana temporal.
 */
function LeadCell({ cell, signal, layout, theme }: LeadCellProps) {
  const lead = signal.leads.find((candidate) => candidate.name === cell.lead);
  const viewport = useMemo(
    () => ({ fromSecond: cell.fromSecond, toSecond: cell.toSecond, baselineY: cell.height / 2 }),
    [cell],
  );

  if (lead === undefined) {
    return null;
  }

  return (
    <Group
      transform={[{ translateX: cell.x }, { translateY: cell.y }]}
      clip={rect(0, 0, cell.width, cell.height)}
    >
      <LeadTrace
        lead={lead}
        samplingRateHz={signal.samplingRateHz}
        viewport={viewport}
        scale={layout.scale}
        // El trazado va en la tinta del tema, nunca en verde de fosforo: §12.8.
        color={theme.ink}
      />
    </Group>
  );
}

const styles = StyleSheet.create({
  surface: { borderRadius: radius.tile, overflow: 'hidden' },
  label: { position: 'absolute' },
});
