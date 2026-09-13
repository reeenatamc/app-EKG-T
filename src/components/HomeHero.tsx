import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { HOME_TEXT } from '@/constants/shellText';
import { cardShadow } from '@/design/elevation';
import { useTheme, type Theme } from '@/design/theme';
import { brand, gap, hero, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface HomeHeroProps {
  /** Fecha larga ya compuesta, para la micro-etiqueta de la tarjeta. */
  readonly dateLabel: string;
}

/**
 * Tarjeta principal del inicio, con volumen.
 *
 * El degradado y el brillo son estilo nativo (`experimental_backgroundImage` de React
 * Native), no un segundo lienzo de Skia: la pantalla ya tiene el de la atmosfera.
 *
 * TODO EL TEXTO VA EN HUESO. La tinta de apoyo rosada no llegaba a 4.5:1 bajo el brillo
 * en claro; la jerarquia la hacen el tamano y el peso, no un gris rosado.
 *
 * @param dateLabel Fecha del dia.
 * @returns La tarjeta con el boton de nuevo estudio.
 */
export function HomeHero({ dateLabel }: HomeHeroProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.card, heroSurface(theme), cardShadow]}>
      <Text style={[type.caption, { color: brand.onCarmine }]}>{dateLabel}</Text>
      <Text style={[type.section, { color: brand.onCarmine }]}>{HOME_TEXT.heroTitle}</Text>
      <Text style={[type.caption, { color: brand.onCarmine }]}>{HOME_TEXT.newStudyHint}</Text>
      <View style={styles.row}>
        <ActionButton
          icon="plus"
          label={HOME_TEXT.newStudy}
          onPress={() => router.push('/capture')}
          variant="onBrand"
        />
      </View>
    </View>
  );
}

/**
 * Relleno y bisel de la tarjeta segun el tema.
 *
 * El color plano de respaldo es el extremo oscuro del degradado, por si la plataforma
 * no dibujara `experimental_backgroundImage`: la tinta hueso sigue legible encima.
 *
 * @param theme Tema activo.
 * @returns El estilo de superficie.
 */
function heroSurface(theme: Theme): ViewStyle {
  const palette = hero[theme.mode === 'dark' ? 'dark' : 'light'];

  return {
    backgroundColor: palette.edge,
    experimental_backgroundImage: `linear-gradient(180deg, ${hero.sheen} 0%, transparent 42%), radial-gradient(circle at 16% 8%, ${palette.focus} 0%, ${palette.edge} 100%)`,
    borderTopColor: palette.rim,
    borderLeftColor: palette.rim,
    borderBottomColor: palette.shade,
    borderRightColor: palette.shade,
  };
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderCurve: 'continuous',
    borderWidth: size.hairline,
    padding: gap.lg,
    gap: gap.sm,
  },
  row: { flexDirection: 'row', marginTop: gap.xs },
});
