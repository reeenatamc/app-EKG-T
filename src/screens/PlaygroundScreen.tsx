import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PLAYGROUND_TEXT } from '@/constants/text';
import { Background } from '@/design/Background';
import { BeatSpecimen } from '@/design/BeatSpecimen';
import { FpsMeter } from '@/design/FpsMeter';
import { GestureProbe } from '@/design/GestureProbe';
import { GlassSpecimen } from '@/design/GlassSpecimen';
import { PlaygroundChrome } from '@/design/PlaygroundChrome';
import { PlaygroundControls } from '@/design/PlaygroundControls';
import { ScrollLoad } from '@/design/ScrollLoad';
import { TypeSpecimen } from '@/design/TypeSpecimen';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

/** Espacio reservado bajo el scroll para que el chrome flotante no tape contenido. */
const CHROME_CLEARANCE = 96;

/**
 * Banco de pruebas de la capa de diseno.
 *
 * Monta exactamente el presupuesto de vidrio que permite §3: el chrome
 * flotante y una unica tarjeta de contexto. Esa es la configuracion que se
 * mide, no una mas benigna.
 *
 * @returns El banco de pruebas.
 */
export function PlaygroundScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const contentStyle = [
    styles.content,
    { paddingTop: insets.top + gap.lg, paddingBottom: insets.bottom + CHROME_CLEARANCE },
  ];

  return (
    <Background>
      <ScrollView contentContainerStyle={contentStyle}>
        <Text style={[type.h1, { color: theme.textHigh }]}>{PLAYGROUND_TEXT.title}</Text>
        <FpsMeter />
        <PlaygroundControls />
        <GlassSpecimen />
        <BeatSpecimen />
        <GestureProbe />
        <TypeSpecimen />
        <ScrollLoad />
      </ScrollView>

      <PlaygroundChrome />
    </Background>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gap.lg, gap: gap.md },
});
