import { useEffect, useState } from 'react';

/**
 * Lo minimo que necesita saberse de un almacen persistido para esperarlo.
 *
 * Se declara aqui en vez de importar el tipo de zustand para que este modulo no
 * dependa de la forma interna del middleware: lo unico que se usa son dos
 * metodos.
 */
interface PersistedStore {
  readonly persist: {
    readonly hasHydrated: () => boolean;
    readonly onFinishHydration: (listener: () => void) => () => void;
  };
}

/**
 * Indica si un almacen ya se leyo del disco.
 *
 * POR QUE HACE FALTA PREGUNTARLO. `persist` rehidrata de forma asincrona: entre
 * el primer render y la llegada del disco, el almacen tiene sus valores por
 * defecto. Pintar en esos fotogramas no es pintar «todavia nada», es pintar una
 * respuesta equivocada —«no hay estudios» cuando hay cuatro guardados— y
 * corregirla despues. Un parpadeo que dice lo contrario de la verdad se lee como
 * una averia.
 *
 * El estado inicial se lee de forma sincrona porque la hidratacion puede haber
 * terminado antes de que el componente se monte, y en ese caso el suscriptor no
 * volveria a dispararse nunca.
 *
 * @param store Almacen persistido a vigilar.
 * @returns Cierto cuando la hidratacion ha terminado.
 */
export function useStoreHydrated(store: PersistedStore): boolean {
  const [isHydrated, setIsHydrated] = useState(() => store.persist.hasHydrated());

  useEffect(() => {
    return store.persist.onFinishHydration(() => setIsHydrated(true));
  }, [store]);

  return isHydrated;
}
