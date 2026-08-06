import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUploadQueue } from '@/capture/uploadQueue';
import { ActionButton } from '@/components/ActionButton';
import { AppTabBar } from '@/components/AppTabBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StudyListRow } from '@/components/StudyListRow';
import { HISTORY_LIST_TEXT } from '@/constants/studyText';
import { HISTORY_TEXT } from '@/constants/shellText';
import { Background } from '@/design/Background';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

const TAB_BAR_CLEARANCE = 96;

/**
 * Historial de estudios.
 *
 * Mientras no haya nada, el estado vacio es lo mas importante de la pantalla:
 * es lo primero que ve alguien que abre la aplicacion por primera vez. Por eso
 * **invita a capturar** en lugar de informar de que no hay datos. "Sin
 * resultados" seria tecnicamente cierto y completamente inutil. El texto habla
 * en futuro —aqui apareceran— porque describe lo que va a pasar, no lo que
 * falta.
 *
 * La lista va con FlashList y no con ScrollView: recicla las filas en lugar de
 * montarlas todas, y esta es la unica pantalla de la aplicacion que puede
 * crecer sin limite. Ninguna fila lleva vidrio; el motivo esta en StudyListRow.
 *
 * @returns La pantalla de historial.
 */
export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const studies = useUploadQueue((state) => state.studies);

  const padding: ViewStyle = {
    paddingTop: insets.top + gap.xl,
    paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
  };

  return (
    <Background atmosphere={false} chrome={<AppTabBar />}>
      {studies.length === 0 ? <EmptyHistory padding={padding} /> : <StudyList padding={padding} />}
    </Background>
  );
}

/**
 * Lo que ve quien todavia no ha capturado nada.
 *
 * Es una invitacion, no un aviso de ausencia de datos.
 */
function EmptyHistory({ padding }: { readonly padding: ViewStyle }) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.empty, padding]}>
      <Text style={[type.display, { color: theme.textHigh }]}>{HISTORY_TEXT.emptyTitle}</Text>
      <Text style={[type.body, { color: theme.textLow }]}>{HISTORY_TEXT.emptyBody}</Text>
      <View style={styles.action}>
        <ActionButton
          label={HISTORY_TEXT.emptyAction}
          onPress={() => router.push('/capture')}
          variant="primary"
        />
      </View>
    </View>
  );
}

/** Los estudios, del mas reciente al mas antiguo. */
function StudyList({ padding }: { readonly padding: ViewStyle }) {
  const studies = useUploadQueue((state) => state.studies);
  const ordered = [...studies].reverse();

  return (
    <FlashList
      data={ordered}
      keyExtractor={(study) => study.id}
      renderItem={({ item }) => <StudyListRow study={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={{ ...padding, paddingHorizontal: gap.lg }}
      ListHeaderComponent={<ScreenHeader title={HISTORY_LIST_TEXT.title} />}
    />
  );
}

const styles = StyleSheet.create({
  // El vacio ya no va centrado a mano: el titular en display lo ancla arriba,
  // como en el resto de la aplicacion, y asi las doce pantallas comparten eje.
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: gap.lg, gap: gap.md },
  action: { flexDirection: 'row', marginTop: gap.lg },
  separator: { height: gap.md },
});
