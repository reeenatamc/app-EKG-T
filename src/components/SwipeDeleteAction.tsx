import { Pressable, StyleSheet, Text } from 'react-native';

import { FORM_ICON_PATHS, FORM_ICON_VIEWBOX } from '@/components/icons/formIcons';
import { LineIcon } from '@/components/icons/LineIcon';
import { DELETE_STUDY_TEXT } from '@/constants/studyText';
import { brand, gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface SwipeDeleteActionProps {
  readonly onPress: () => void;
}

/**
 * El boton de eliminar que aparece al deslizar una fila del historial.
 *
 * RELLENO DE CARMIN, y esta en la lista blanca de §12.9 por tamano: ocupa el alto
 * entero de la fila, que es una superficie grande y no una pildora. Rojo porque
 * es destructivo, y carmin de marca y no el rojo de alarma, que esta reservado a
 * senales del paciente.
 *
 * NO ELIMINA: pide confirmacion. Quien lo pulsa acaba de deslizar, y deslizar se
 * hace sin querer al desplazar la lista; un borrado sin segunda pregunta costaria
 * una foto que no se puede recuperar.
 *
 * @param onPress Se invoca al pulsarlo, para abrir la confirmacion.
 * @returns El boton revelado por el gesto.
 */
export function SwipeDeleteAction({ onPress }: SwipeDeleteActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={DELETE_STUDY_TEXT.swipeAction}
      onPress={onPress}
      style={styles.action}
    >
      <LineIcon
        path={FORM_ICON_PATHS.trash}
        color={brand.onCarmine}
        viewBox={FORM_ICON_VIEWBOX}
        side={size.fieldIcon}
      />
      <Text style={[type.caption, { color: brand.onCarmine }]}>
        {DELETE_STUDY_TEXT.swipeAction}
      </Text>
    </Pressable>
  );
}

/** Ancho del boton revelado. Lo que hay que deslizar para que quede a la vista. */
export const SWIPE_ACTION_WIDTH = 96;

const styles = StyleSheet.create({
  action: {
    width: SWIPE_ACTION_WIDTH,
    minHeight: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap.xs,
    marginRight: gap.md,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    backgroundColor: brand.carmine,
  },
});
