import { StyleSheet, Text, View } from 'react-native';

import { LineIcon } from '@/components/icons/LineIcon';
import { NAV_ICON_PATHS, NAV_ICON_VIEWBOX } from '@/components/icons/navIcons';
import { CLINICAL_NOTICE } from '@/constants/studyText';
import { useTheme } from '@/design/theme';
import { clinicalNotice, gap, radius, size } from '@/design/tokens';
import { font, type } from '@/design/type';

/** Aviso permanente de alcance, visible antes de leer los resultados. */
export function ClinicalDisclaimer() {
  const theme = useTheme();
  const palette = clinicalNotice[theme.mode === 'dark' ? 'dark' : 'light'];

  return (
    <View
      accessible
      style={[styles.container, { backgroundColor: palette.surface, borderColor: palette.edge }]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LineIcon
          path={NAV_ICON_PATHS.info}
          color={theme.textHigh}
          viewBox={NAV_ICON_VIEWBOX}
          side={size.noticeIcon}
        />
      </View>
      <View style={styles.copy}>
        <Text style={[type.caption, styles.title, { color: theme.textHigh }]}>
          {CLINICAL_NOTICE.title}
        </Text>
        <Text style={[type.caption, { color: theme.textHigh }]}>{CLINICAL_NOTICE.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.md,
    padding: gap.md,
    borderRadius: radius.control,
    borderWidth: size.hairline,
  },
  copy: { flex: 1, gap: gap.xs },
  title: { fontFamily: font.semibold },
});
