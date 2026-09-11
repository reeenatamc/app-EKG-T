import { Canvas, Group, rect } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import type { MountId } from '@/camera/mounts';
import type { Calibration } from '@/capture/study';
import { LeadTrace } from '@/components/LeadTrace';
import { MeasuringGrid } from '@/components/MeasuringGrid';
import { computeGridGeometry } from '@/ecg/grid';
import type { EcgSignal, LeadName } from '@/ecg/signal';
import { computeViewerLayout, type ViewerCell } from '@/ecg/viewerLayout';
import { useTheme, type Theme } from '@/design/theme';
import { gap, opacity, radius } from '@/design/tokens';
import { type } from '@/design/type';

interface TwelveLeadViewerProps {
  readonly signal: EcgSignal;
  readonly mount: MountId;
  readonly calibration: Calibration;
  /**
   * Derivaciones en las que se apoya la observacion elegida, o null si no hay
   * ninguna elegida. Las demas se atenuan.
   */
  readonly focusedLeads?: readonly LeadName[] | null;
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
export function TwelveLeadViewer({
  signal,
  mount,
  calibration,
  focusedLeads = null,
}: TwelveLeadViewerProps) {
  const theme = useTheme();
  // El reparto entero del visor cuelga de este numero: de el salen los pixeles
  // por milimetro y, de ahi, la retícula y la escala del trazado.
  const [width, setWidth] = useState<number | null>(null);

  // La duracion y las tiras salen de la senal, no del montaje: ver
  // recordSecondsOf y rhythmStripLeads.
  const { layout, grid } = useViewerGeometry(mount, width, calibration, signal);

  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={[styles.surface, { backgroundColor: theme.surface }]} onLayout={handleLayout}>
      {layout === null || grid === null ? null : (
        <>
          <ViewerCanvas
            signal={signal}
            layout={layout}
            grid={grid}
            theme={theme}
            focusedLeads={focusedLeads}
          />
          <LeadLabels cells={layout.cells} />
        </>
      )}
    </View>
  );
}

/**
 * El reparto del visor y la retícula que le corresponde.
 *
 * Los dos calculos cuelgan del ancho medido, y el segundo del primero, asi que
 * viajan juntos. Van memoizados porque de aqui salen los pixeles por milimetro
 * de toda la pantalla.
 *
 * @param mount Montaje del registro.
 * @param width Ancho medido, o null mientras no se ha medido.
 * @param calibration Velocidad y amplitud con que se imprimio.
 * @returns El reparto y la retícula, nulos hasta que hay ancho.
 */
function useViewerGeometry(
  mount: MountId,
  width: number | null,
  calibration: Calibration,
  signal: EcgSignal,
) {
  const layout = useMemo(
    () => (width === null ? null : computeViewerLayout(mount, width, calibration, signal)),
    [mount, width, calibration, signal],
  );
  const grid = useMemo(
    () => (layout === null ? null : computeGridGeometry(layout.scale)),
    [layout],
  );

  return { layout, grid };
}

interface ViewerCanvasProps {
  readonly signal: EcgSignal;
  readonly layout: ReturnType<typeof computeViewerLayout>;
  readonly grid: ReturnType<typeof computeGridGeometry>;
  readonly theme: Theme;
  readonly focusedLeads: readonly LeadName[] | null;
}

/**
 * El lienzo: retícula de medicion y las doce derivaciones.
 *
 * UN SOLO `<Canvas>` para toda la rejilla, no uno por derivacion. Doce lienzos
 * serian doce superficies de GPU para dibujar lo que es una sola imagen.
 */
function ViewerCanvas({ signal, layout, grid, theme, focusedLeads }: ViewerCanvasProps) {
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
          // La fila entra en la identidad, y hace falta: en un 3x4 con tira de
          // ritmo la derivacion de la tira sale dos veces, en su celda de la
          // rejilla y abajo, y las dos empiezan en el segundo cero. Sin la fila
          // las dos celdas son la misma para React, que avisa y puede confundir
          // una con otra al redibujar.
          key={`${cell.lead}-${cell.fromSecond}-${cell.y}`}
          cell={cell}
          {...{ signal, layout, theme }}
          isFocused={focusedLeads === null || focusedLeads.includes(cell.lead)}
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
          key={`label-${cell.lead}-${cell.fromSecond}-${cell.y}`}
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
  readonly isFocused: boolean;
}

/**
 * Una celda del visor: una derivacion en su ventana temporal.
 *
 * FUERA DE FOCO SE ATENUA, NO SE PINTA DE OTRO COLOR. El color aqui dice de
 * donde viene la senal -- §12.8 reserva el verde de fosforo para un sensor en
 * vivo y esta senal sale de papel -- asi que usarlo tambien para decir "mira
 * aqui" le daria dos significados a lo mismo. La opacidad no significa nada
 * todavia, y por eso puede.
 *
 * La atenuada sigue siendo legible a proposito: quien mira tiene que poder ver
 * que el trazado esta entero, no solo el trozo que alguien le senala.
 */
function LeadCell({ cell, signal, layout, theme, isFocused }: LeadCellProps) {
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
      opacity={isFocused ? 1 : opacity.leadUnfocused}
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
