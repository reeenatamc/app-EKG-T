import { LightSensor } from 'expo-sensors';
import { useEffect, useState } from 'react';

/**
 * Luz ambiente durante la captura.
 *
 * Por que importa: con poca luz el sensor sube la ganancia, y el ruido que
 * introduce tiene el mismo grosor que el trazo. Tambien alarga la exposicion,
 * asi que el pulso de la mano se convierte en una foto movida.
 *
 * DOS LIMITACIONES, y se dicen aqui porque cambian como hay que leer el aviso.
 *
 * La primera es de plataforma: el sensor de luz solo existe en Android. En iOS
 * este gancho devuelve siempre no disponible y el aviso de poca luz aparece
 * unicamente en la revision, medido sobre la foto ya tomada.
 *
 * La segunda es fisica: el sensor mira hacia el mismo lado que la pantalla, o
 * sea hacia el techo mientras se fotografia una mesa. Mide la luz de la sala,
 * no la que llega al papel, y no se entera de que el propio telefono le esta
 * dando sombra al registro. Sirve para avisar antes de disparar; quien decide
 * de verdad es el analisis de la foto, que mide lo que si acabo entrando.
 */

/**
 * Iluminancia por debajo de la cual se avisa, en lux.
 *
 * Una oficina bien iluminada ronda los 400 lux y un pasillo de hospital de
 * noche baja de 100. El umbral se pone donde la exposicion empieza a alargarse
 * lo suficiente como para que el pulso se note.
 */
const DIM_THRESHOLD_LUX = 150;

/** Cada cuanto se consulta. La luz de una sala no cambia deprisa. */
const UPDATE_INTERVAL_MS = 500;

export interface AmbientLight {
  /** Iluminancia en lux, o null si no hay sensor. */
  readonly lux: number | null;
  /** Cierto cuando hay poca luz para fotografiar papel. */
  readonly isDim: boolean;
}

/**
 * Sigue la luz ambiente mientras la camara esta abierta.
 *
 * @returns La iluminancia y si es insuficiente.
 */
export function useAmbientLight(): AmbientLight {
  const [lux, setLux] = useState<number | null>(null);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    void LightSensor.isAvailableAsync().then((available) => {
      if (cancelled || !available) {
        return;
      }
      LightSensor.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscription = LightSensor.addListener((measurement) => {
        setLux(measurement.illuminance);
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  // Sin sensor no se avisa: un aviso permanente en iOS por no poder medir seria
  // ruido, y el usuario aprenderia a ignorarlo tambien en Android.
  return { lux, isDim: lux !== null && lux < DIM_THRESHOLD_LUX };
}
