import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { HOME_TEXT } from '@/constants/shellText';
import { cardShadow } from '@/design/elevation';
import { brand, gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

interface HomeHeroProps {
  /** Fecha larga ya compuesta, para la micro-etiqueta de la tarjeta. */
  readonly dateLabel: string;
}

/** Tarjeta principal en carmín, con acción clara sobre una superficie opaca. */
export function HomeHero({ dateLabel }: HomeHeroProps) {
  const router = useRouter();

  return (
    <View style={[styles.card, cardShadow]}>
      <Text style={[type.caption, { color: brand.onCarmineLow }]}>{dateLabel}</Text>
      <Text style={[type.section, { color: brand.onCarmine }]}>{HOME_TEXT.heroTitle}</Text>
      <Text style={[type.caption, { color: brand.onCarmineLow }]}>{HOME_TEXT.newStudyHint}</Text>
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
    backgroundColor: brand.carmine,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    padding: gap.lg,
    gap: gap.sm,
  },
  row: { flexDirection: 'row', marginTop: gap.xs },
});
