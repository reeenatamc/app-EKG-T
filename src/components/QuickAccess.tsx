import type { SkPath } from '@shopify/react-native-skia';
import { type Href, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { LineIcon } from '@/components/icons/LineIcon';
import { NAV_ICON_PATHS, NAV_ICON_VIEWBOX } from '@/components/icons/navIcons';
import { TAB_ICON_PATHS } from '@/components/icons/tabIcons';
import { HOME_TEXT, TAB_TEXT } from '@/constants/shellText';
import { cardShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

/** Lado del circulo de cada acceso y del icono que lleva dentro. */
const CIRCLE_SIDE = 56;
const ICON_SIDE = 24;

interface Shortcut {
  readonly label: string;
  readonly path: SkPath | null;
  readonly href: Href;
}

const SHORTCUTS: readonly Shortcut[] = [
  { label: TAB_TEXT.capture, path: TAB_ICON_PATHS.capture, href: '/capture' },
  { label: TAB_TEXT.history, path: TAB_ICON_PATHS.history, href: '/history' },
  { label: TAB_TEXT.profile, path: TAB_ICON_PATHS.profile, href: '/profile' },
  { label: HOME_TEXT.settings, path: NAV_ICON_PATHS.settings, href: '/settings' },
];

/**
 * Accesos rapidos del inicio: cuatro circulos con icono y nombre.
 *
 * @returns La tarjeta de accesos.
 */
export function QuickAccess() {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, cardShadow]}>
      <Text style={[type.eyebrow, { color: theme.textLow }]}>{HOME_TEXT.quickTitle}</Text>
      <View style={styles.row}>
        {SHORTCUTS.map((shortcut) => (
          <ShortcutButton key={shortcut.label} shortcut={shortcut} />
        ))}
      </View>
    </View>
  );
}

/** Un acceso: el circulo con el icono y, debajo, su nombre. */
function ShortcutButton({ shortcut }: { readonly shortcut: Shortcut }) {
  const router = useRouter();
  const theme = useTheme();
  const press = usePressMotion();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={shortcut.label}
      onPress={() => router.navigate(shortcut.href)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.item, press.style]}
    >
      <View style={[styles.circle, { backgroundColor: theme.canvas }]}>
        <LineIcon
          path={shortcut.path}
          color={theme.textHigh}
          viewBox={NAV_ICON_VIEWBOX}
          side={ICON_SIDE}
        />
      </View>
      <Text style={[type.caption, { color: theme.textHigh }]} numberOfLines={1}>
        {shortcut.label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.tile, padding: gap.lg, gap: gap.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { flex: 1, alignItems: 'center', gap: gap.xs },
  circle: {
    width: CIRCLE_SIDE,
    height: CIRCLE_SIDE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
