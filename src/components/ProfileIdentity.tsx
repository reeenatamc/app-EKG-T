import { StyleSheet, Text, View } from 'react-native';

import type { Session } from '@/auth/AuthService';
import { FORM_ICON_PATHS, FORM_ICON_VIEWBOX } from '@/components/icons/formIcons';
import { LineIcon } from '@/components/icons/LineIcon';
import { PROFILE_TEXT } from '@/constants/shellText';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';
import { displayNameFrom } from '@/shell/greeting';

/** Lado del circulo de la inicial. */
const MONOGRAM_SIDE = 64;

/**
 * Quien es la cuenta: inicial, nombre, correo y rol.
 *
 * SIN TARJETA. Es la cabecera de la ficha, no un elemento de ella; las tarjetas del
 * perfil son los bloques de abajo, que es donde se toca algo.
 *
 * LA INICIAL Y NO UNA FOTO. La cuenta no tiene foto, y un avatar generico con una
 * silueta dice «aqui falta algo». La inicial, en la tipografia del titular, es un
 * dato que si hay.
 *
 * El rol lleva su icono, el mismo que se eligio al registrarse, porque decide lo
 * que ensena el resto de la aplicacion y conviene reconocerlo sin leerlo.
 *
 * @param session Sesion activa, o null.
 * @returns La cabecera del perfil.
 */
export function ProfileIdentity({ session }: { readonly session: Session | null }) {
  const theme = useTheme();
  const name = displayNameFrom(session);
  const email =
    session === null || session.email === '' ? PROFILE_TEXT.emailMissing : session.email;

  return (
    <View style={styles.identity}>
      <View style={[styles.monogram, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
        <Text style={[type.headline, { color: theme.textHigh }]}>{name?.charAt(0) ?? '·'}</Text>
      </View>
      <View style={styles.text}>
        {name === null ? null : (
          <Text style={[type.h1, { color: theme.textHigh }]} numberOfLines={1}>
            {name}
          </Text>
        )}
        <Text
          style={[type.body, { color: theme.textLow }]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {email}
        </Text>
        <RoleLine isStudent={session?.role === 'student'} />
      </View>
    </View>
  );
}

/** El rol, con su icono delante. */
function RoleLine({ isStudent }: { readonly isStudent: boolean }) {
  const theme = useTheme();

  return (
    <View style={styles.role}>
      <LineIcon
        path={isStudent ? FORM_ICON_PATHS.graduate : FORM_ICON_PATHS.stethoscope}
        color={theme.textLow}
        viewBox={FORM_ICON_VIEWBOX}
        side={size.fieldIcon}
      />
      <Text style={[type.caption, { color: theme.textLow }]}>
        {isStudent ? PROFILE_TEXT.roleStudent : PROFILE_TEXT.roleProfessional}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: gap.lg },
  monogram: {
    width: MONOGRAM_SIDE,
    height: MONOGRAM_SIDE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: size.hairline,
  },
  text: { flex: 1, gap: gap.xs },
  role: { flexDirection: 'row', alignItems: 'center', gap: gap.xs, marginTop: gap.xs },
});
