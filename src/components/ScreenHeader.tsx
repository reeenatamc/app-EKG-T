import { StyleSheet, Text, View } from 'react-native';

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
 * @param title Titular de la pantalla.
 * @param eyebrow Micro-etiqueta opcional, solo si informa.
 * @returns El titular renderizado.
 */
export function ScreenHeader({ title, eyebrow }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      {eyebrow === undefined ? null : (
        <Text style={[type.eyebrow, { color: theme.textLow }]}>{eyebrow}</Text>
      )}
      <Text style={[type.display, { color: theme.textHigh }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: gap.sm, marginBottom: gap.sm },
});
