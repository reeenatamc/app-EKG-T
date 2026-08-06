import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';

/**
 * Escala tipografica de SKILL.md §6.
 *
 * lineHeight y letterSpacing van en pixeles absolutos: React Native no admite
 * multiplicadores ni unidades em, asi que los valores de la especificacion web
 * estan ya convertidos.
 *
 * QUE HACE CADA FAMILIA, y por que se queda en el paquete.
 *
 * Las tres familias pesan unos 980 KB juntas, asi que cada una tiene que
 * ganarse el sitio. Medido en D.1, ninguna lo hacia: la display aparecia en 1 de
 * 12 pantallas —el splash, que dura 800 ms—, la monoespaciada en 2 de 12 y solo
 * sobre **prosa** (el correo, el rol, el idioma), mientras que las cifras de
 * verdad —el codigo de verificacion, el identificador del estudio— iban en
 * Inter. Justo al reves de lo que dice §6.
 *
 * - **Bricolage 800** es `display`, y ahora abre TODAS las pantallas
 *   principales. Sin titular, una pantalla empieza directamente en cuerpo de
 *   texto y se lee como un formulario, no como un producto.
 * - **Inter** es prosa: titulos de seccion, cuerpo, etiquetas y valores de
 *   texto. Es la unica familia que lleva palabras corrientes.
 * - **JetBrains Mono** es CIFRAS E IDENTIFICADORES, nunca prosa: `vital` para el
 *   codigo de verificacion, `data` para identificadores y fechas, `eyebrow` para
 *   contadores de paso. La anchura constante del digito es estructural, asi que
 *   no se recurre a fontVariant: tabular-nums, que ademas no es fiable en
 *   Android (§0).
 */
export const type = {
  display: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 44,
    lineHeight: 42,
    letterSpacing: -1.3,
  },
  h1: { fontFamily: 'Inter_500Medium', fontSize: 24, lineHeight: 30 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  /**
   * Micro-etiqueta sobre el titular.
   *
   * Monoespaciada y en caja alta porque el vocabulario del instrumento etiqueta
   * asi: las derivaciones de un electrocardiograma se rotulan `II`, `aVR`, `V1`.
   * Solo se usa cuando lleva informacion real —el paso de un proceso, el destino
   * de un codigo—, nunca para repetir el nombre de la pantalla.
   */
  eyebrow: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  vital: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -1,
  },
  data: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 15, lineHeight: 20 },
} as const;

/**
 * Carga las fuentes de la aplicacion.
 *
 * No libera el splash: de eso se ocupa useAppReady, que ademas espera a que las
 * preferencias esten hidratadas. Soltarlo aqui pintaria un fotograma con el
 * tema por defecto antes de saber cual quiere el usuario.
 *
 * Si la carga falla se continua igualmente con las fuentes del sistema: una
 * aplicacion clinica atascada en el splash por un problema tipografico seria
 * peor fallo que una tipografia distinta.
 *
 * @returns Cierto cuando las fuentes estan disponibles.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (error !== null) {
      console.warn('[type] las fuentes no cargaron; se usan las del sistema', error);
    }
  }, [error]);

  return loaded || error !== null;
}
