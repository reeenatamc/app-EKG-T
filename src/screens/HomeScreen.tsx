import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import type { QueuedStudy } from '@/capture/study';
import { studyCounts } from '@/capture/studyState';
import { useQueueHydrated, useUploadQueue } from '@/capture/uploadQueue';
import { AppTabBar } from '@/components/AppTabBar';
import { HomeHero } from '@/components/HomeHero';
import { StudyListRow } from '@/components/StudyListRow';
import { StudySummary } from '@/components/StudySummary';
import { HOME_TEXT } from '@/constants/shellText';
import { Background } from '@/design/Background';
import { cardShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';
import { useAnalyses } from '@/ecg/analyses';
import { accountLine, displayNameFrom, greetingFor, longDate } from '@/shell/greeting';

/** Hueco bajo el scroll para que la barra de pestanas flotante no tape contenido. */
const TAB_BAR_CLEARANCE = 96;

/** Cuantos estudios recientes caben en el inicio. El resto, en el historial. */
const RECENT_LIMIT = 3;

/** Lado del circulo con la inicial del usuario. */
const AVATAR_SIDE = 48;

/**
 * Inicio.
 *
 * De arriba abajo: quien abre la aplicacion, la tarjeta destacada con la accion
 * principal, el resumen de estudios y los recientes. El aviso
 * clinico queda como nota al pie.
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

  // La hora se lee al renderizar y no se guarda en estado: nadie deja el inicio
  // abierto cruzando la medianoche.
  const now = new Date();

  return (
    <Background atmosphere={false} chrome={<AppTabBar />}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + gap.lg, paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
        ]}
      >
        <HomeHeader now={now} />
        <HomeHero dateLabel={longDate(now)} />
        <HomeStudies />
        <Text style={[type.caption, { color: theme.textLow }]}>{HOME_TEXT.notice}</Text>
      </ScrollView>
    </Background>
  );
}

/**
 * Cabecera: circulo con la inicial, saludo y, debajo, nombre y rol.
 *
 * Inicial y no foto: la cuenta no guarda imagen del usuario y no hace falta otro
 * dato personal en el telefono.
 */
function HomeHeader({ now }: { readonly now: Date }) {
  const theme = useTheme();
  const session = useSession((state) => state.session);
  const initial = displayNameFrom(session)?.charAt(0) ?? '·';

  return (
    <View style={styles.header}>
      <View style={[styles.avatar, { backgroundColor: theme.canvas }]}>
        <Text style={[type.body, styles.avatarLabel, { color: theme.textHigh }]}>{initial}</Text>
      </View>
      <View style={styles.headerText}>
        <Text style={[type.caption, { color: theme.textLow }]}>{greetingFor(now)}</Text>
        <Text style={[type.body, styles.name, { color: theme.textHigh }]} numberOfLines={1}>
          {accountLine(session)}
        </Text>
      </View>
    </View>
  );
}

/**
 * El resumen y los recientes.
 *
 * MIENTRAS SE LEE EL DISCO NO SE ENSENA NADA: un «todavia no hay estudios» en los
 * primeros fotogramas mentiria a quien tiene cuatro.
 */
function HomeStudies() {
  const router = useRouter();
  const theme = useTheme();
  const hasHydrated = useQueueHydrated();
  const studies = useUploadQueue((state) => state.studies);
  const byStudy = useAnalyses((state) => state.byStudy);

  if (!hasHydrated) {
    return null;
  }

  return (
    <>
      {studies.length === 0 ? null : (
        <View style={[styles.card, { backgroundColor: theme.surface }, cardShadow]}>
          <Text style={[type.eyebrow, { color: theme.textLow }]}>{HOME_TEXT.summaryTitle}</Text>
          <StudySummary
            counts={studyCounts(studies, byStudy)}
            onPress={() => router.navigate('/history')}
          />
        </View>
      )}
      <RecentStudies studies={studies} onSeeAll={() => router.navigate('/history')} />
    </>
  );
}

/**
 * Los ultimos estudios, del mas reciente al mas antiguo.
 *
 * Son las filas del historial y no una version reducida: un estudio no puede
 * verse de dos maneras segun la pestana desde la que se mire.
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
  content: { paddingHorizontal: gap.lg, gap: gap.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: gap.md },
  avatar: {
    width: AVATAR_SIDE,
    height: AVATAR_SIDE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontFamily: 'Inter_500Medium' },
  headerText: { flex: 1 },
  name: { fontFamily: 'Inter_500Medium' },
  card: { borderRadius: radius.tile, padding: gap.lg, gap: gap.xs },
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
