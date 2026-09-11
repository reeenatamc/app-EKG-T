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
  readonly eyebrow?: string;
  readonly atmosphere?: boolean;
  readonly footer?: ReactNode;
  readonly onBack?: () => void;
}

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
          contentContainerStyle={[styles.content, { paddingTop: insets.top + gap.md }]}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title={title} eyebrow={eyebrow} onBack={onBack} />
          <AuthBody>{children}</AuthBody>
        </ScrollView>
        <AuthFooter footer={footer} bottomInset={insets.bottom} />
      </KeyboardLift>
    </Background>
  );
}

interface AuthBodyProps {
  readonly children: ReactNode;
}

/**
 * El cuerpo del formulario.
 *
 * SIN TARJETA, y esa es la decision. Se probo encerrarlo en un GlassCard y salio
 * mal por dos motivos independientes.
 *
 * El tecnico: el objetivo de desenfoque de esta aplicacion contiene el contenido
 * que se desplaza, y el vidrio se monta fuera de ese objetivo, como hermano
 * —por eso el proveedor del contexto envuelve `chrome` y no `children`—. Una
 * tarjeta de vidrio metida aqui dentro queda dentro de su propio objetivo: se
 * desenfoca a si misma y deja un rectangulo fantasma, y como ademas no recibe el
 * objetivo, expo-blur cae en silencio a un tinte plano. En pantalla eso es una
 * caja gris, no vidrio.
 *
 * El de fondo, que manda sobre el anterior: un campo de entrada sobre vidrio
 * pierde contraste justo cuando hace falta leer lo que se escribe. El vidrio de
 * este sistema es para lo ambiental —la barra de pestanas, el chrome flotante—,
 * no para aquello con lo que se trabaja.
 *
 * Asi que cada campo es su propia superficie opaca sobre la atmosfera, y el
 * caracter cristalino lo pone el fondo, que es donde no estorba.
 */
function AuthBody({ children }: AuthBodyProps) {
  return <View style={styles.body}>{children}</View>;
}

interface AuthFooterProps {
  readonly footer?: ReactNode;
  readonly bottomInset: number;
}

function AuthFooter({ footer, bottomInset }: AuthFooterProps) {
  if (footer === undefined) {
    return null;
  }

  return <View style={[styles.footer, { paddingBottom: bottomInset + gap.md }]}>{footer}</View>;
}

const styles = StyleSheet.create({
  /**
   * TITULAR Y FORMULARIO SON UN SOLO BLOQUE, centrado.
   *
   * Antes el titular se anclaba arriba y el formulario abajo, y entre los dos
   * quedaba media pantalla de malla. La intencion era buena —que el formulario
   * caiga donde llega el pulgar— pero con dos campos el hueco se come mas de la
   * mitad del alto y deja de leerse como aire: se lee como que falta algo. Y con
   * el teclado abierto empujaba la tarjeta fuera de la vista.
   *
   * Centrados, el hueco se reparte arriba y abajo, o sea que pasa a ser margen.
   * El pie sigue fijo al fondo, asi que la accion no se mueve.
   */
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: gap.lg,
    paddingBottom: gap.lg,
    gap: gap.lg,
  },
  body: { gap: gap.lg },
  footer: {
    paddingHorizontal: gap.lg,
    paddingTop: gap.sm,
    gap: gap.sm,
  },
});
