import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TabIconName } from '@/components/icons/tabIcons';
import { TabBarItem } from '@/components/TabBarItem';
import { TAB_TEXT } from '@/constants/shellText';
import { GlassChrome } from '@/design/Glass';
import { gap } from '@/design/tokens';

/** Las tres rutas del grupo, en orden, con "Capturar" intercalado en medio. */
const TABS = [
  { route: '/home', label: TAB_TEXT.home, icon: 'home' },
  { route: '/history', label: TAB_TEXT.history, icon: 'history' },
  { route: '/profile', label: TAB_TEXT.profile, icon: 'profile' },
] as const satisfies readonly { route: string; label: string; icon: TabIconName }[];

/** Posicion en la que se inserta la accion de captura, entre Historial y Perfil. */
const CAPTURE_SLOT = 2;

/**
 * Barra de pestanas flotante de vidrio.
 *
 * SE MONTA DESDE DENTRO DE LA PANTALLA, por la prop `chrome` de `Background`, y
 * NO desde la prop `tabBar` del router. Ese cambio es el que arregla D.4: montada
 * desde el layout del grupo quedaba por encima de `Background` en el arbol, asi
 * que `useBlurTarget()` devolvia null y expo-blur caia en silencio a «sin
 * desenfoque». Lo que se veia no era vidrio, era un rectangulo translucido.
 *
 * Por eso tampoco recibe `BottomTabBarProps`: el estado de navegacion lo saca de
 * la ruta activa, que es informacion que cualquier punto del arbol puede leer.
 *
 * "Capturar" no es una pestana sino una accion: abre la ruta modal a pantalla
 * completa, que va sin barra y siempre oscura.
 *
 * Consume una de las **dos** superficies de vidrio que permite §3, y esta
 * montada en las tres pantallas del grupo. El presupuesto restante para
 * cualquiera de ellas es, por tanto, una sola tarjeta de vidrio.
 *
 * @returns La barra de pestanas.
 */
export function AppTabBar() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.slot, { bottom: insets.bottom + gap.md }]} pointerEvents="box-none">
      <GlassChrome style={styles.bar}>
        <TabBarItems />
      </GlassChrome>
    </View>
  );
}

/** Las tres pestanas con la accion de captura intercalada en su hueco. */
function TabBarItems() {
  const router = useRouter();
  const pathname = usePathname();

  const items = TABS.map((tab) => (
    <TabBarItem
      key={tab.route}
      label={tab.label}
      icon={tab.icon}
      isActive={pathname === tab.route}
      onPress={() => router.navigate(tab.route)}
    />
  ));

  items.splice(
    CAPTURE_SLOT,
    0,
    <TabBarItem
      key="capture"
      label={TAB_TEXT.capture}
      icon="capture"
      isActive={false}
      isPrimary
      onPress={() => router.push('/capture')}
    />,
  );

  return <>{items}</>;
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', left: gap.md, right: gap.md },
  bar: { flexDirection: 'row', padding: gap.xs, gap: gap.xs },
});
