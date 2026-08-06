import { Path } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { buildTracePath } from '@/ecg/buildTracePath';
import type { TraceScale } from '@/ecg/grid';
import type { Lead } from '@/ecg/signal';
import { buildLeadPolylines, type TraceViewport } from '@/ecg/tracePath';
import { size } from '@/design/tokens';

interface LeadTraceProps {
  readonly lead: Lead;
  readonly samplingRateHz: number;
  readonly viewport: TraceViewport;
  readonly scale: TraceScale;
  /** Siempre `theme.ink`. Ver la nota sobre el color. */
  readonly color: string;
}

/**
 * El trazado de una derivacion.
 *
 * EL COLOR ES SIEMPRE LA TINTA DEL TEMA, nunca `trace.ecg`. §12.8 reserva el
 * verde de fosforo para senal que venga de verdad de un sensor en vivo. Esta
 * senal se digitalizo de una hoja de papel impresa en tinta oscura, y pintarla
 * de verde fingiria una procedencia que no tiene. Por eso el color entra como
 * prop desde el tema y este componente no conoce ninguna paleta.
 *
 * EL CAMINO SE MEMOIZA por derivacion y por ventana visible. Es el calculo caro
 * de la pantalla —filtrar tramos, decimar y proyectar a pixeles— y sin memoizar
 * se rehace en cada render de una pantalla que tiene doce de estos.
 *
 * @param lead Derivacion a dibujar.
 * @param samplingRateHz Frecuencia de muestreo del registro.
 * @param viewport Ventana visible y linea de base.
 * @param scale Escala calibrada.
 * @param color Color del trazado.
 * @returns El trazado.
 */
export function LeadTrace({ lead, samplingRateHz, viewport, scale, color }: LeadTraceProps) {
  const path = useMemo(
    () => buildTracePath(buildLeadPolylines(lead, samplingRateHz, viewport, scale)),
    [lead, samplingRateHz, viewport, scale],
  );

  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={size.trace}
      strokeJoin="round"
      strokeCap="round"
      color={color}
    />
  );
}
