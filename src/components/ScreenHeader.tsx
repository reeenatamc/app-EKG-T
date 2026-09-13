import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { NAV_TEXT } from '@/constants/shellText';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

interface ScreenHeaderProps {
  /** Titular de la pantalla. Tres o cuatro palabras, en display. */
  readonly title: string;
  /**
   * Etiqueta auxiliar sobre el titular.
   *
   * Solo cuando lleva informacion real —el paso de un proceso, el destino de un
   * codigo—. Repetir aqui el nombre de la pantalla seria decoracion.
   */
  readonly eyebrow?: string;
  /**
   * Salida de la pantalla.
   *
   * Solo la pasan las pantallas que se apilan encima de otra. Los tres destinos
   * de la barra de pestanas no la llevan: ahi no se ha entrado desde ningun
   * sitio, y un boton de volver que lleva a una pestana hermana convierte una
   * navegacion plana en un laberinto.
   */
  readonly onBack?: () => void;
  /**
   * `display` en las pantallas de entrada, `headline` en las de trabajo. Ver
   * `type.headline`.
   */
  readonly size?: 'display' | 'headline';
  /** Una linea de apoyo bajo el titular, en cuerpo de texto atenuado. */
  readonly subtitle?: string;
}

/** Cabecera compartida de acceso, captura y estudio, con salida accesible. */
export function ScreenHeader({
  title,
  eyebrow,
  onBack,
  size = 'display',
  subtitle,
}: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      {onBack === undefined ? null : <BackButton onPress={onBack} />}
      {eyebrow === undefined ? null : (
        <Text style={[type.eyebrow, { color: theme.textLow }]}>{eyebrow}</Text>
      )}
      <Text accessibilityRole="header" style={[type[size], { color: theme.textHigh }]}>
        {title}
      </Text>
      {subtitle === undefined ? null : (
        <Text style={[type.body, { color: theme.textLow }]}>{subtitle}</Text>
      )}
    </View>
  );
}

/** La salida de una pantalla apilada, pegada al borde izquierdo del titular. */
function BackButton({ onPress }: { readonly onPress: () => void }) {
  const theme = useTheme();

  return (
    <View style={styles.backSlot}>
      <IconButton
        icon="back"
        label={NAV_TEXT.back}
        onPress={onPress}
        color={theme.textHigh}
        background={theme.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: gap.sm, marginBottom: gap.sm },
  // Sin esto el boton se estira al ancho del bloque: un circulo de cuarenta y
  // cuatro puntos convertido en una pastilla de trescientos.
  backSlot: { alignSelf: 'flex-start' },
});
