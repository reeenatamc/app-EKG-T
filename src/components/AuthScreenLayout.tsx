import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardLift } from '@/components/KeyboardLift';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Background } from '@/design/Background';
import { gap } from '@/design/tokens';

interface AuthScreenLayoutProps {
  readonly title: string;
  readonly children: ReactNode;
  /** Micro-etiqueta monoespaciada sobre el titular. Solo si informa. */
  readonly eyebrow?: string;
  /**
   * Monta la atmosfera del fondo.
   *
   * Existe por Ajustes, que comparte esta composicion con las pantallas de
   * acceso pero **no** es una de ellas: se llega desde Perfil, o sea que esta
   * dentro del producto, y ahi el lienzo va plano (D-20).
   */
  readonly atmosphere?: boolean;
  /** Acciones fijadas al pie, fuera del scroll. */
  readonly footer?: ReactNode;
  /**
   * Salida de la pantalla, si esta apilada encima de otra.
   *
   * Lo usa Ajustes, que se abre desde Perfil. Las cinco pantallas de acceso no
   * lo pasan: son el arranque de la aplicacion y debajo no hay nada.
   */
  readonly onBack?: () => void;
}

/**
 * Composicion comun de las pantallas de acceso.
 *
 * Aporta el fondo de las capas 0 a 3 y respeta las areas seguras. Ninguna de
 * estas pantallas usa la cabecera de expo-router: el chrome lo define §3 de la
 * especificacion, no el router, y por eso headerShown esta desactivado de forma
 * global en el layout raiz.
 *
 * El titular va en `ScreenHeader`, o sea en display. Antes iba en `type.h1`
 * —Inter 24— y por eso estas cinco pantallas eran indistinguibles entre si en la
 * lamina de contacto de D.1.
 *
 * EL PIE VA DENTRO DEL AJUSTE DE TECLADO, no solo el scroll. Es donde vive el
 * boton de enviar, o sea lo que el teclado tapa primero en iOS.
 *
 * DOS BLOQUES ANCLADOS, no uno pegado arriba. El titular se ancla al borde
 * superior y el cuerpo se empuja hacia abajo, junto a la accion. Es la correccion
 * del segundo hallazgo de la lamina: en cinco pantallas el contenido ocupaba el
 * 25 % de arriba, el boton el 8 % de abajo y el 65 % de en medio era degradado
 * vacio. La silueta era hueca porque el hueco quedaba **despues** de que el
 * contenido se acabara, o sea que se leia como falta. Anclando los dos extremos,
 * el mismo hueco pasa a ser separacion entre dos bloques, el formulario cae donde
 * llega el pulgar, y con el teclado abierto sigue viendose porque el ancla es
 * relativa al alto disponible.
 *
 * @param title Titular de la pantalla.
 * @param children Contenido desplazable.
 * @param eyebrow Micro-etiqueta opcional sobre el titular.
 * @param atmosphere Falso para lienzo plano; lo usa Ajustes.
 * @param footer Acciones fijas al pie, opcionales.
 * @param onBack Salida opcional, solo si la pantalla esta apilada.
 * @returns La pantalla compuesta.
 */
export function AuthScreenLayout({
  title,
  children,
  eyebrow,
  atmosphere = true,
  footer,
  onBack,
}: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <Background atmosphere={atmosphere}>
      <KeyboardLift>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + gap.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title={title} eyebrow={eyebrow} onBack={onBack} />
          <View style={styles.body}>{children}</View>
        </ScrollView>

        {footer === undefined ? null : (
          <View style={[styles.footer, { paddingBottom: insets.bottom + gap.lg }]}>{footer}</View>
        )}
      </KeyboardLift>
    </Background>
  );
}

const styles = StyleSheet.create({
  // flexGrow: 1 es lo que da al contenedor un alto que repartir; sin el,
  // marginTop: 'auto' no tiene contra que empujar y el bloque no se mueve.
  content: { flexGrow: 1, paddingHorizontal: gap.lg, paddingBottom: gap.xl, gap: gap.lg },
  body: { marginTop: 'auto', gap: gap.lg },
  footer: { paddingHorizontal: gap.lg, paddingTop: gap.md, gap: gap.md },
});
