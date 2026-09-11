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
   * Micro-etiqueta monoespaciada sobre el titular.
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

/**
 * Titular de una pantalla.
 *
 * POR QUE EXISTE. Medido en D.1, `type.display` aparecia en 1 de las 12
 * pantallas —el splash, que dura unos 800 ms— y las once restantes empezaban
 * directamente en `type.h1`, Inter 24. Once pantallas de doce arrancaban en
 * cuerpo de texto, y eso es lo que las hacia parecer un formulario en vez de un
 * producto. La display se llevaba 88 KB del paquete sin ganarselos.
 *
 * El titular es el unico sitio donde la aplicacion levanta la voz. Todo lo demas
 * —secciones, cuerpo, etiquetas— se queda en Inter, y las cifras en
 * monoespaciada.
 *
 * LA SALIDA VA AQUI y no en una barra propia. `headerShown` esta desactivado de
 * forma global, o sea que ninguna pantalla tiene cabecera del router donde
 * colgar el boton; ponerlo en el titular lo deja en el unico bloque que todas
 * comparten y en el borde por el que se sale.
 *
 * @param title Titular de la pantalla.
 * @param eyebrow Micro-etiqueta opcional, solo si informa.
 * @param onBack Salida opcional, solo en pantallas apiladas.
 * @param size Escalon del titular.
 * @param subtitle Linea de apoyo opcional.
 * @returns El titular renderizado.
 */
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
      <Text style={[type[size], { color: theme.textHigh }]}>{title}</Text>
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
