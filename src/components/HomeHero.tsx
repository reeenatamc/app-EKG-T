import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { HOME_TEXT } from '@/constants/shellText';
import { cardShadow } from '@/design/elevation';
import { gap, radius, tinted } from '@/design/tokens';
import { type } from '@/design/type';

interface HomeHeroProps {
  /** Fecha larga ya compuesta, para la micro-etiqueta de la tarjeta. */
  readonly dateLabel: string;
}

/**
 * Tarjeta destacada del inicio: la accion de la aplicacion.
 *
 * Usa la superficie de subtarjeta (ciruela) porque es un objeto de color propio
 * en los dos temas y la tinta de encima ya esta medida (12.59:1). El boton va en
 * hueso con etiqueta carmin, que es la variante pensada para fondos oscuros.
 *
 * @param dateLabel Fecha del dia.
 * @returns La tarjeta con el boton de nuevo estudio.
 */
export function HomeHero({ dateLabel }: HomeHeroProps) {
  const router = useRouter();

  return (
    <View style={[styles.card, cardShadow]}>
      <Text style={[type.eyebrow, { color: tinted.body }]}>{dateLabel}</Text>
      <Text style={[type.headline, { color: tinted.title }]}>{HOME_TEXT.heroTitle}</Text>
      <Text style={[type.body, { color: tinted.body }]}>{HOME_TEXT.newStudyHint}</Text>
      <View style={styles.row}>
        <ActionButton
          icon="plus"
          label={HOME_TEXT.newStudy}
          onPress={() => router.push('/capture')}
          variant="onBrand"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tinted.focus,
    borderColor: tinted.edge,
    borderWidth: 1,
    borderRadius: radius.tile,
    padding: gap.xl,
    gap: gap.sm,
  },
  row: { flexDirection: 'row', marginTop: gap.sm },
});
