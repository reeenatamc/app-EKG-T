import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import type { QueuedStudy } from '@/capture/study';
import { studyCounts } from '@/capture/studyState';
import { useQueueHydrated, useUploadQueue } from '@/capture/uploadQueue';
import { ActionButton } from '@/components/ActionButton';
import { AppTabBar } from '@/components/AppTabBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StudyListRow } from '@/components/StudyListRow';
import { StudySummary } from '@/components/StudySummary';
import { HOME_TEXT } from '@/constants/shellText';
import { Background } from '@/design/Background';
import { useTheme } from '@/design/theme';
import { gap, size } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';
import { useAnalyses } from '@/ecg/analyses';
import { accountLine, greetingFor, longDate } from '@/shell/greeting';

/** Hueco bajo el scroll para que la barra de pestanas flotante no tape contenido. */
const TAB_BAR_CLEARANCE = 96;

/** Cuantos estudios recientes caben en el inicio. El resto, en el historial. */
const RECENT_LIMIT = 3;

/**
 * Inicio.
 *
 * SIN BENTO. Eran cuatro tarjetas con la misma forma para cosas que no se parecen:
 * la accion de capturar, dos recuentos que cambian solos y un aviso que no cambia
 * nunca. Ahora cada cosa tiene la forma de lo que es: la accion es un boton, los
 * recuentos son una lectura sobre el lienzo, los estudios son las mismas filas del
 * historial —que se abren— y el aviso es una nota al pie.
 *
 * EL TITULAR ES SOLO EL SALUDO. Con el nombre dentro se partia en dos lineas; el
 * nombre baja a la linea de apoyo, con el rol.
 *
 * La barra se monta AQUI, por la prop `chrome` de `Background`, no desde el
 * router: es lo que le da un objetivo de desenfoque que contiene el contenido que
 * se desplaza. Ver `AppTabBar` y D-18.
 *
 * @returns La pantalla de inicio.
 */
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const session = useSession((state) => state.session);

  // La hora se lee al renderizar y no se guarda en estado: nadie deja el inicio
  // abierto cruzando la medianoche, y un temporizador para eso seria un
  // temporizador vivo toda la sesion a cambio de nada.
  const now = new Date();

  return (
    <Background atmosphere={false} chrome={<AppTabBar />}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + gap.xl, paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
        ]}
      >
        <ScreenHeader
          eyebrow={longDate(now)}
          title={greetingFor(now)}
          subtitle={accountLine(session)}
          size="headline"
        />
        <NewStudy />
        <HomeStudies />
        <Text style={[type.caption, { color: theme.textLow }]}>{HOME_TEXT.notice}</Text>
      </ScrollView>
    </Background>
  );
}

/** La accion de la aplicacion, y en una linea que tipo de registro espera. */
function NewStudy() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={styles.newStudy}>
      {/* En fila: el boton se estira con flex, y en una columna creceria en alto. */}
      <View style={styles.row}>
        <ActionButton
          label={HOME_TEXT.newStudy}
          onPress={() => router.push('/capture')}
          variant="primary"
        />
      </View>
      <Text style={[type.caption, styles.centered, { color: theme.textLow }]}>
        {HOME_TEXT.newStudyHint}
      </Text>
    </View>
  );
}

/**
 * El resumen y los recientes.
 *
 * MIENTRAS SE LEE EL DISCO NO SE ENSENA NADA, por lo mismo que en el historial:
 * un «todavia no hay estudios» en los primeros fotogramas mentiria a quien tiene
 * cuatro. Sin estudios tampoco hay resumen: tres ceros no dicen nada que no diga
 * ya la frase de los recientes.
 */
function HomeStudies() {
  const router = useRouter();
  const hasHydrated = useQueueHydrated();
  const studies = useUploadQueue((state) => state.studies);
  const byStudy = useAnalyses((state) => state.byStudy);

  if (!hasHydrated) {
    return null;
  }

  return (
    <>
      {studies.length === 0 ? null : (
        <HomeSection title={HOME_TEXT.summaryTitle}>
          <StudySummary
            counts={studyCounts(studies, byStudy)}
            onPress={() => router.navigate('/history')}
          />
        </HomeSection>
      )}
      <RecentStudies studies={studies} onSeeAll={() => router.navigate('/history')} />
    </>
  );
}

/**
 * Los ultimos estudios, del mas reciente al mas antiguo.
 *
 * Son las filas del historial y no una version reducida: el mismo estado, la misma
 * causa si fallo, el mismo gesto de eliminar. Un estudio no puede verse de dos
 * maneras segun la pestana desde la que se mire.
 */
function RecentStudies({
  studies,
  onSeeAll,
}: {
  readonly studies: readonly QueuedStudy[];
  readonly onSeeAll: () => void;
}) {
  const theme = useTheme();
  const recent = studies.slice(-RECENT_LIMIT).reverse();
  const hasMore = studies.length > RECENT_LIMIT;

  return (
    <HomeSection
      title={HOME_TEXT.recentTitle}
      action={hasMore ? <SeeAllLink onPress={onSeeAll} /> : null}
    >
      {recent.length === 0 ? (
        <Text style={[type.body, { color: theme.textLow }]}>{HOME_TEXT.recentEmpty}</Text>
      ) : (
        <View style={styles.rows}>
          {recent.map((study) => (
            <StudyListRow key={study.id} study={study} />
          ))}
        </View>
      )}
    </HomeSection>
  );
}

/** Rotulo de bloque en micro-etiqueta y, a la derecha, su enlace si lo tiene. */
function HomeSection({
  title,
  action = null,
  children,
}: {
  readonly title: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[type.eyebrow, { color: theme.textLow }]}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

/** "Ver todo": lleva al historial y acusa el dedo como el resto de controles. */
function SeeAllLink({ onPress }: { readonly onPress: () => void }) {
  const theme = useTheme();
  const press = usePressMotion();

  return (
    <AnimatedPressable
      accessibilityRole="link"
      accessibilityLabel={HOME_TEXT.recentAll}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.link, press.style]}
    >
      <Text style={[type.caption, styles.linkLabel, { color: theme.textHigh }]}>
        {HOME_TEXT.recentAll}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gap.lg, gap: gap.xl },
  newStudy: { gap: gap.sm },
  row: { flexDirection: 'row' },
  centered: { textAlign: 'center' },
  section: { gap: gap.sm },
  // El mismo hueco entre filas que en el historial.
  rows: { gap: gap.md },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Area tactil de 44 puntos que no empuja el rotulo: el margen negativo le
  // devuelve al bloque lo que el enlace crece por encima y por debajo del texto.
  link: {
    minHeight: size.touchTarget,
    justifyContent: 'center',
    paddingLeft: gap.lg,
    marginVertical: -gap.md,
  },
  linkLabel: { fontFamily: 'Inter_500Medium' },
});
