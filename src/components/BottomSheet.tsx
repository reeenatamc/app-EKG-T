import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { playHaptic } from '@/design/haptics';
import { sheetShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { font, type } from '@/design/type';
import type { BottomSheetControl } from '@/shell/useBottomSheet';

/** Lo que asoma de la hoja cerrada: la barrita y las pestanas. */
export const SHEET_HEADER_HEIGHT = size.sheetGrabArea + size.sheetTabRow;

/**
 * Margen tactil de la barrita hacia arriba. La franja mide veinte puntos, y con
 * esto llega a los cuarenta y cuatro de §7 sin empujar las pestanas.
 */
const GRAB_HIT_SLOP = { top: size.touchTarget - size.sheetGrabArea } as const;

export interface SheetTab<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** Lo que anuncia un lector de pantalla en la barrita y en la fila de pestanas. */
export interface SheetLabels {
  readonly open: string;
  readonly close: string;
  readonly tabs: string;
}

interface BottomSheetProps<T extends string> {
  readonly sheet: BottomSheetControl;
  readonly height: number;
  readonly tabs: readonly SheetTab<T>[];
  readonly activeTab: T;
  readonly onSelectTab: (tab: T) => void;
  readonly labels: SheetLabels;
  readonly children: ReactNode;
}

/**
 * Hoja inferior con pestanas: plegada asoma la barrita y las pestanas.
 *
 * SE ABRE SIN ARRASTRAR. La barrita es un boton que anuncia si esta abierta, y tocar
 * una pestana abre la hoja en esa pestana. El gesto escapar de iOS la cierra. Con la
 * hoja plegada su contenido se oculta al lector de pantalla, que si no lo recorreria
 * aunque este fuera de la pantalla.
 *
 * SUPERFICIE OPACA, no vidrio: dentro van porcentajes y medidas (§12.1).
 *
 * @param sheet Control de `useBottomSheet`.
 * @param height Alto de la hoja abierta.
 * @returns La hoja.
 */
export function BottomSheet<T extends string>(props: BottomSheetProps<T>) {
  const { sheet, height, tabs, activeTab, onSelectTab, labels, children } = props;
  const theme = useTheme();
  const surface = { height, backgroundColor: theme.surface, borderColor: theme.edge };

  return (
    <Animated.View
      onAccessibilityEscape={sheet.close}
      style={[styles.sheet, surface, sheetShadow, sheet.style]}
    >
      <SheetHeader {...{ sheet, tabs, activeTab, onSelectTab, labels }} />
      <View
        style={styles.body}
        accessibilityElementsHidden={!sheet.isOpen}
        importantForAccessibility={sheet.isOpen ? 'auto' : 'no-hide-descendants'}
      >
        {children}
      </View>
    </Animated.View>
  );
}

type SheetHeaderProps<T extends string> = Omit<BottomSheetProps<T>, 'height' | 'children'>;

/**
 * La parte que asoma plegada y la que se arrastra: barrita y pestanas.
 *
 * Tocar una pestana la elige y abre la hoja, que es lo que espera quien la toca con
 * la hoja plegada: ver lo que acaba de pedir.
 */
function SheetHeader<T extends string>(props: SheetHeaderProps<T>) {
  const { sheet, tabs, activeTab, onSelectTab, labels } = props;

  return (
    <GestureDetector gesture={sheet.pan}>
      <View>
        <SheetGrab isOpen={sheet.isOpen} onPress={sheet.toggle} labels={labels} />
        <SheetTabs
          {...{ tabs, activeTab, label: labels.tabs }}
          onSelect={(tab) => {
            onSelectTab(tab);
            sheet.open();
          }}
        />
      </View>
    </GestureDetector>
  );
}

interface SheetGrabProps {
  readonly isOpen: boolean;
  readonly onPress: () => void;
  readonly labels: SheetLabels;
}

/** La barrita: se arrastra con el resto de la cabecera y, tocada, abre o cierra. */
function SheetGrab({ isOpen, onPress, labels }: SheetGrabProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isOpen ? labels.close : labels.open}
      accessibilityState={{ expanded: isOpen }}
      hitSlop={GRAB_HIT_SLOP}
      onPress={onPress}
      style={styles.grabArea}
    >
      <View style={[styles.grab, { backgroundColor: theme.edge }]} />
    </Pressable>
  );
}

interface SheetTabsProps<T extends string> {
  readonly tabs: readonly SheetTab<T>[];
  readonly activeTab: T;
  readonly label: string;
  readonly onSelect: (tab: T) => void;
}

/** La fila de pestanas, con su rol de lista de pestanas. */
function SheetTabs<T extends string>({ tabs, activeTab, label, onSelect }: SheetTabsProps<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={[styles.tabs, { borderBottomColor: theme.edge }]}
    >
      {tabs.map((tab) => (
        <SheetTabButton
          key={tab.value}
          label={tab.label}
          isActive={tab.value === activeTab}
          onPress={() => onSelect(tab.value)}
        />
      ))}
    </View>
  );
}

interface SheetTabButtonProps {
  readonly label: string;
  readonly isActive: boolean;
  readonly onPress: () => void;
}

/**
 * Una pestana.
 *
 * SUBRAYADO EN TINTA, no en carmin (D-30): una pestana elegida es un estado, y la
 * regla de tamano de §12.9 no deja que el carmin marque estados pequenos. El estado
 * va tambien en el peso del texto y en `selected`, no solo en el color (§12.3).
 */
function SheetTabButton({ label, isActive, onPress }: SheetTabButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      onPress={() => {
        playHaptic('selection');
        onPress();
      }}
      style={[styles.tab, isActive ? { borderBottomColor: theme.textHigh } : null]}
    >
      <Text
        maxFontSizeMultiplier={size.tabExpandedMaxFontScale}
        style={[
          type.data,
          isActive ? styles.tabActive : null,
          { color: isActive ? theme.textHigh : theme.textLow },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderCurve: 'continuous',
    borderTopWidth: size.hairline,
  },
  grabArea: { height: size.sheetGrabArea, alignItems: 'center', justifyContent: 'center' },
  grab: {
    width: size.sheetGrabWidth,
    height: size.sheetGrabHeight,
    borderRadius: radius.pill,
  },
  tabs: {
    height: size.sheetTabRow,
    flexDirection: 'row',
    gap: gap.xl,
    paddingHorizontal: gap.xl,
    borderBottomWidth: size.hairline,
  },
  tab: {
    justifyContent: 'center',
    borderBottomWidth: size.sheetTabUnderline,
    borderBottomColor: 'transparent',
  },
  tabActive: { fontFamily: font.semibold },
  body: { flex: 1 },
});
