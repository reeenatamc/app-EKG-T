import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { resolveBack } from '@/shell/navigation';

/**
 * Devuelve la accion de salir de una pantalla apilada.
 *
 * La decision vive en `navigation.ts`, que es puro y esta probado; aqui solo se
 * le pregunta al router si hay pila y se ejecuta lo que responda.
 *
 * @param fallback Ruta a la que caer si se entro directamente a esta pantalla.
 * @returns La accion a enganchar al boton de volver.
 */
export function useGoBack(fallback: string): () => void {
  const router = useRouter();

  return useCallback(() => {
    const intent = resolveBack(router.canGoBack(), fallback);

    if (intent.kind === 'back') {
      router.back();
      return;
    }

    router.replace(intent.route);
  }, [router, fallback]);
}
