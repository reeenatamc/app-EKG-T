import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

interface SettingsSectionProps {
  readonly title: string;
  readonly children: ReactNode;
}

/**
 * Bloque de ajustes con encabezado.
 *
 * @param title Nombre del bloque.
 * @param children Filas del bloque.
 * @returns El bloque renderizado.
 */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      {/* Rotulo en micro-etiqueta: en caja alta y monoespaciada se distingue del
          contenido de un vistazo, que en cuerpo de texto gris no pasaba. */}
      <Text style={[type.eyebrow, { color: theme.textLow }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: gap.sm },
});
