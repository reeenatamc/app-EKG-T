import { StyleSheet, Text, View } from 'react-native';

import { LineIcon } from '@/components/icons/LineIcon';
import { NAV_ICON_PATHS, NAV_ICON_VIEWBOX } from '@/components/icons/navIcons';
import { CLINICAL_NOTICE } from '@/constants/studyText';
import { FrostCard } from '@/design/Frost';
import { useTheme } from '@/design/theme';
import { gap, size } from '@/design/tokens';
import { type } from '@/design/type';

/**
 * Aviso permanente de alcance, visible antes de leer los resultados.
 *
 * LA MISMA SUPERFICIE QUE LAS DEMAS TARJETAS, sin color propio. Era un recuadro
 * rosa con titulo justo debajo del hero carmin: dos bloques rojizos seguidos, y el
 * aviso se leia como una alerta cuando es contexto permanente. Ahora es una frase
 * tranquila con su icono, y lo que lo distingue es el icono, no el color.
 *
 * @returns El aviso.
 */
export function ClinicalDisclaimer() {
  const theme = useTheme();

  return (
    <FrostCard accessible style={styles.container}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LineIcon
          path={NAV_ICON_PATHS.info}
          color={theme.textLow}
          viewBox={NAV_ICON_VIEWBOX}
          side={size.noticeIcon}
        />
      </View>
      <Text style={[type.caption, styles.copy, { color: theme.textHigh }]}>
        {CLINICAL_NOTICE.body}
      </Text>
    </FrostCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.md,
    paddingVertical: gap.md,
    paddingHorizontal: gap.lg,
  },
  copy: { flex: 1 },
});
