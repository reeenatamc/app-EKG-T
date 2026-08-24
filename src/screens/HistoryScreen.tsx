import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useQueueHydrated, useUploadQueue } from '@/capture/uploadQueue';
import { ActionButton } from '@/components/ActionButton';
import { Notice } from '@/components/Notice';
import { AppTabBar } from '@/components/AppTabBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StudyListRow } from '@/components/StudyListRow';
import { QUEUE_TEXT } from '@/constants/captureText';
import { HISTORY_LIST_TEXT } from '@/constants/studyText';
import { HISTORY_TEXT } from '@/constants/shellText';
import { Background } from '@/design/Background';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';
import { historyView, type HistoryView } from '@/shell/queueSummary';
import { useTask } from '@/shell/useTask';

const TAB_BAR_CLEARANCE = 96;

/**
 * Historial de estudios.
 *
 * Tres estados, no dos. Mientras la cola se lee del disco no se ensena
 * ninguno: el vacio afirma que no hay estudios, y eso no se sabe todavia.
 *
 * Cuando de verdad no hay nada, el estado vacio es lo mas importante de la pantalla:
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
  const hasHydrated = useQueueHydrated();
  const studies = useUploadQueue((state) => state.studies);

  const padding: ViewStyle = {
    paddingTop: insets.top + gap.xl,
    paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
  };

  return (
    <Background atmosphere={false} chrome={<AppTabBar />}>
      <HistoryBody view={historyView(hasHydrated, studies.length)} padding={padding} />
    </Background>
  );
}

/**
 * Reparte entre los tres estados de la pantalla.
 *
 * El de carga no dibuja nada. Es una lectura de AsyncStorage, unos
 * milisegundos: un indicador que aparece y desaparece en ese tiempo es un
 * parpadeo mas, no una explicacion. Y ensenar el vacio mientras tanto seria
 * peor, porque invita a capturar a quien ya tiene estudios guardados.
 *
 * @param view Estado resuelto por `historyView`.
 * @param padding Margenes de area segura y hueco de la barra.
 * @returns El cuerpo de la pantalla.
 */
function HistoryBody({
  view,
  padding,
}: {
  readonly view: HistoryView;
  readonly padding: ViewStyle;
}) {
  if (view === 'loading') {
    return null;
  }

  return view === 'empty' ? <EmptyHistory padding={padding} /> : <StudyList padding={padding} />;
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

/**
 * Los estudios, del mas reciente al mas antiguo.
 *
 * DESLIZAR HACIA ABAJO VUELVE A INTENTAR LOS ENVIOS. La cola no detecta la red:
 * reintenta al volver la aplicacion al primer plano y al pulsar reintentar en
 * una fila fallida, no al recuperar cobertura. Este es el tercer disparador, y
 * el unico que sirve para «acabo de recuperar senal, intentalo ya» sin tener
 * que salir de la aplicacion y volver a entrar.
 *
 * @param padding Margenes de area segura y hueco de la barra.
 * @returns La lista de estudios.
 */
function StudyList({ padding }: { readonly padding: ViewStyle }) {
  const studies = useUploadQueue((state) => state.studies);
  const drain = useUploadQueue((state) => state.drain);
  const task = useTask('[cola] el vaciado manual no salio');
  const ordered = [...studies].reverse();

  return (
    <FlashList
      data={ordered}
      keyExtractor={(study) => study.id}
      renderItem={({ item }) => <StudyListRow study={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={{ ...padding, paddingHorizontal: gap.lg }}
      refreshing={task.isBusy}
      onRefresh={() => task.run(drain)}
      ListHeaderComponent={<StudyListHeader hasFailed={task.hasFailed} />}
    />
  );
}

/**
 * Titular de la lista y, si toca, el aviso de que el intento no arranco.
 *
 * El aviso va aqui y no por fila porque no pertenece a ningun estudio: un envio
 * que falla lo cuenta su propia fila con su causa, y esto es que el intento se
 * rompio antes de llegar a ninguna.
 *
 * @param hasFailed Cierto si el ultimo vaciado manual no salio.
 * @returns La cabecera de la lista.
 */
function StudyListHeader({ hasFailed }: { readonly hasFailed: boolean }) {
  return (
    <>
      <ScreenHeader title={HISTORY_LIST_TEXT.title} />
      {hasFailed ? (
        <View style={styles.headerNotice}>
          <Notice title={QUEUE_TEXT.drainFailure.title} action={QUEUE_TEXT.drainFailure.action} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  // El vacio ya no va centrado a mano: el titular en display lo ancla arriba,
  // como en el resto de la aplicacion, y asi las doce pantallas comparten eje.
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: gap.lg, gap: gap.md },
  action: { flexDirection: 'row', marginTop: gap.lg },
  separator: { height: gap.md },
  // La cabecera no lleva separador detras, asi que el hueco lo pone el aviso.
  headerNotice: { marginBottom: gap.md },
});
