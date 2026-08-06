import { useEffect, useState } from 'react';

import { analyzePhoto } from '@/camera/analyzePhoto';
import type { QualityFinding } from '@/camera/quality';

export interface QualityReport {
  readonly findings: readonly QualityFinding[];
  readonly isAnalyzing: boolean;
}

/**
 * Mide la calidad de una imagen en cuanto esta disponible.
 *
 * El analisis decodifica y recorre la imagen, asi que no puede hacerse durante
 * el renderizado. Se lanza en un efecto y el resultado llega despues; mientras
 * tanto la pantalla dice que esta midiendo en lugar de afirmar que todo esta
 * bien, que seria mentir por omision.
 *
 * @param uri Ruta de la imagen a analizar.
 * @param capturedWidthPx Ancho en pixeles de la imagen que se enviara.
 * @returns Los hallazgos y si el analisis sigue en marcha.
 */
export function useQualityReport(uri: string, capturedWidthPx: number): QualityReport {
  const [findings, setFindings] = useState<readonly QualityFinding[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // El estado de "midiendo" se escribe en la continuacion y no en el cuerpo
    // del efecto: escribirlo aqui provocaria un renderizado inmediato y React
    // avisa de ello con razon.
    void analyzePhoto(uri, capturedWidthPx).then((measured) => {
      if (cancelled) {
        return;
      }
      setFindings(measured);
      setIsAnalyzing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [uri, capturedWidthPx]);

  return { findings, isAnalyzing };
}
