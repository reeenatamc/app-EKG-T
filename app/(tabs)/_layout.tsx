import { Tabs } from 'expo-router/js-tabs';

import { useQueueDrain } from '@/capture/useQueueDrain';

/**
 * Grupo de pestanas de la aplicacion.
 *
 * EL ROUTER NO DIBUJA BARRA. `tabBar` devuelve null a proposito: la barra la
 * monta cada pantalla del grupo por la prop `chrome` de `Background`, porque su
 * sitio en el arbol es lo que decide si su vidrio desenfoca algo. Montada desde
 * aqui quedaba por encima de `Background`, sin objetivo de desenfoque, y
 * expo-blur caia en silencio a «sin desenfoque». Ver `AppTabBar` y D-18.
 *
 * LA TRANSICION ENTRE PESTANAS ES UN FUNDIDO, y antes no habia ninguna: el
 * valor por defecto de este navegador es `animation: 'none'`, o sea que las tres
 * pantallas se sustituian de un fotograma al siguiente. Ese corte seco es la
 * mitad de la sensacion de que la aplicacion «va a saltos».
 *
 * TIENE UN COSTE QUE HAY QUE MEDIR. Durante el fundido las dos pantallas estan
 * montadas, y cada una monta su propia barra de vidrio: son dos pasadas de
 * desenfoque en vez de una, justo por encima del presupuesto de §3, durante los
 * milisegundos de la transicion. Es reversible en una palabra —`'none'`— y esta
 * pendiente de comprobar en el Redmi con el `FpsMeter` del playground.
 *
 * Aqui se engancha el vaciado de la cola de subida. Es el sitio correcto
 * porque es el primer punto del arbol que solo existe con sesion abierta: por
 * encima estan el acceso y la introduccion, y no tiene sentido intentar enviar
 * estudios de alguien que todavia no ha entrado.
 *
 * @returns El navegador de pestanas.
 */
export default function TabsLayout() {
  useQueueDrain();

  return (
    <Tabs screenOptions={{ headerShown: false, animation: 'fade' }} tabBar={() => null}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
