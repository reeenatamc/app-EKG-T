import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { useQueueHydrated, useUploadQueue } from '@/capture/uploadQueue';
import { ActionButton } from '@/components/ActionButton';
import { AppTabBar } from '@/components/AppTabBar';
import { BentoTile } from '@/components/BentoTile';
import { ScreenHeader } from '@/components/ScreenHeader';
import { HOME_TEXT } from '@/constants/shellText';
import { Background } from '@/design/Background';
import { gap, tinted } from '@/design/tokens';
import { type } from '@/design/type';
import { longDate, welcomeLine } from '@/shell/greeting';
import { describePending, describeSaved } from '@/shell/queueSummary';

/** Hueco bajo el scroll para que la barra de pestanas flotante no tape contenido. */
const TAB_BAR_CLEARANCE = 96;

/**
 * Inicio, en rejilla bento (§10).
 *
 * ABRE SALUDANDO, con la fecha larga encima. El titular era «Del papel a la
 * señal», la tesis del producto, y se retira de aqui sin perderse: el modulo hero
 * dice literalmente «Fotografia un electrocardiograma», o sea que la tesis sigue
 * en pantalla y ahora esta pegada a la accion que la ejecuta, que es mejor sitio.
 * A cambio, la primera linea que se lee al abrir habla de quien abre.
 *
 * La fecha va en la micro-etiqueta porque es un dato real y monoespaciado, que es
 * exactamente para lo que existe ese rol (§6).
 *
 * Un unico modulo hero —la captura, que es la accion que da sentido a la
 * aplicacion— y tres tamanos de tile como maximo. Los modulos van ordenados por
 * urgencia, no por estetica: primero capturar, luego lo que esta en proceso,
 * despues lo reciente, y al final el aviso clinico.
 *
 * Ningun tile es de vidrio: la barra de pestanas ya gasta una de las dos
 * superficies que permite §3. Y la barra se monta AQUI, por la prop `chrome` de
 * `Background`, no desde el router: es lo que le da un objetivo de desenfoque que
 * contiene el contenido que se desplaza. Ver `AppTabBar` y D-18.
 *
 * @returns La pantalla de inicio.
 */
export function HomeScreen() {
  const insets = useSafeAreaInsets();
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
        <ScreenHeader title={welcomeLine(session, now)} eyebrow={longDate(now)} />
        <HomeModules />
      </ScrollView>
    </Background>
  );
}

/**
 * Los modulos del bento, ordenados por urgencia y no por estetica: primero
 * capturar, luego lo que esta en proceso, despues lo reciente y al final el
 * aviso clinico.
 *
 * EL HERO ES LA SUPERFICIE DE CARMIN de esta pantalla, y la unica. Es la mas
 * grande, asi que cumple la regla de tamano de §12.9; su boton se invierte a
 * hueso porque carmin sobre carmin no seria un boton.
 */
function HomeModules() {
  const router = useRouter();

  return (
    <>
      <BentoTile size="hero" tone="brand" title={HOME_TEXT.heroTitle} body={HOME_TEXT.heroBody}>
        <ActionButton
          label={HOME_TEXT.heroAction}
          onPress={() => router.push('/capture')}
          variant="onBrand"
        />
      </BentoTile>

      <StatusModules />

      <BentoTile
        size="wide"
        tone="tinted"
        title={HOME_TEXT.noticeTitle}
        body={HOME_TEXT.noticeBody}
      />
    </>
  );
}

/**
 * Los dos modulos de estado, uno al lado del otro.
 *
 * LOS TRES COMPARTEN TONO. Se probo con uno distinto por modulo y la pantalla se
 * convertia en un muestrario: cuatro colores compitiendo y ninguno mandando. Con
 * un unico vino suavizado detras, el hero es lo unico saturado y la jerarquia
 * se lee sola.
 */
function StatusModules() {
  const hasHydrated = useQueueHydrated();
  const studies = useUploadQueue((state) => state.studies);
  const pendingCount = studies.filter((study) => study.status !== 'uploaded').length;
  const latest = studies[studies.length - 1];

  return (
    <View style={styles.row}>
      <BentoTile
        size="half"
        tone="tinted"
        title={HOME_TEXT.pendingTitle}
        body={describePending(hasHydrated, pendingCount)}
      />
      <BentoTile
        size="half"
        tone="tinted"
        title={HOME_TEXT.recentTitle}
        body={describeSaved(hasHydrated, studies.length)}
      >
        {/*
          EL ULTIMO ESTUDIO, DE VERDAD. Este modulo decia "Todavia ninguno" fijo
          mientras el historial mostraba cuatro: una interfaz que miente sobre lo
          que hay guardado. El identificador va en monoespaciada porque es un
          identificador (§6).
        */}
        {!hasHydrated || latest === undefined ? null : (
          <Text style={[type.data, { color: tinted.body }]} numberOfLines={1}>
            {latest.metadata.anonymousId}
          </Text>
        )}
      </BentoTile>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gap.lg, gap: gap.md },
  row: { flexDirection: 'row', gap: gap.md },
});
