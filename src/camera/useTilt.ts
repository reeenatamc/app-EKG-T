import { DeviceMotion } from 'expo-sensors';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { measureTilt, smoothTilt, type TiltMode, type TiltReading } from '@/camera/tilt';

/**
 * Inclinacion del telefono respecto al papel.
 *
 * Por que importa: fotografiar en angulo deforma el papel en perspectiva, y la
 * perspectiva comprime los milimetros del borde lejano. Las esquinas
 * arrastrables de la revision permiten corregirla, pero corregir no recupera lo
 * que ya se comprimio: es mejor no inclinarse.
 *
 * La matematica vive en tilt.ts, que es puro y esta probado. Aqui solo queda la
 * suscripcion al sensor y el reparto entre hilo de UI y estado de React.
 *
 * SIRVE PARA LAS DOS POSTURAS. Antes suponia el papel en horizontal —una mesa,
 * un carro, una camilla— y con el telefono de pie el nivel marcaba 90 grados
 * fijos, o sea que un registro sujetado en vertical o pegado a un negatoscopio
 * no llegaba a alinearse nunca. Ahora la postura se deduce de la gravedad y el
 * nivel cambia de pregunta con ella. Ver `TiltMode`.
 *
 * LO QUE SIGUE SIN VERSE, CON EL PAPEL EN VERTICAL: el giro alrededor del propio
 * eje de la gravedad. O sea, acercarse al papel desde la izquierda o desde la
 * derecha en vez de de frente. Eso deforma en perspectiva igual que inclinarse,
 * pero no mueve el vector de gravedad ni un grado, asi que un acelerometro no
 * puede detectarlo por mucho que se le pida. Con el papel en mesa no pasa,
 * porque ahi el eje de la gravedad es el de la camara y los dos giros que
 * importan quedan a la vista. Es una limitacion del sensor, no del calculo, y
 * hace falta decirlo: en vertical el nivel vigila la mitad de los errores.
 */

/** Grados de desviacion por debajo de los cuales se considera alineado. */
const ALIGNED_ENTER_DEGREES = 5;

/**
 * Grados por encima de los cuales se deja de considerar alineado.
 *
 * Es mayor que el umbral de entrada a proposito. Con un solo umbral, un pulso
 * normal cruzandolo haria parpadear la guia entre sus dos estados varias veces
 * por segundo, y el momento firma se convertiria en un estroboscopio.
 */
const ALIGNED_EXIT_DEGREES = 8;

/** Cada cuanto se consulta el sensor. Diez lecturas por segundo bastan para una mano. */
const UPDATE_INTERVAL_MS = 100;

export interface Tilt {
  /**
   * Desviacion respecto a la horizontal, en grados, en el hilo de UI.
   *
   * Es un valor compartido y no estado de React porque cambia diez veces por
   * segundo: como estado provocaria diez renderizados por segundo con la camara
   * en vivo detras.
   */
  readonly degrees: SharedValue<number>;
  /**
   * Hacia donde se inclina, en el plano de la pantalla, entre -1 y 1.
   *
   * Sin direccion el aviso seria inutil: "estas inclinado" no dice hacia que
   * lado hay que corregir, y quien lo lee acaba probando al azar. Con estas dos
   * componentes el indicador puede comportarse como un nivel de burbuja, que se
   * entiende sin instrucciones.
   */
  readonly offsetX: SharedValue<number>;
  readonly offsetY: SharedValue<number>;
  /**
   * Cierto cuando el telefono esta bastante paralelo al papel.
   *
   * Este si es estado de React, porque manda sobre el momento firma y, gracias
   * a la histeresis, cambia pocas veces.
   */
  readonly isAligned: boolean;
  /**
   * Postura deducida, para poder decirla en pantalla.
   *
   * Es estado de React y no valor compartido porque la banda muerta de `tilt.ts`
   * hace que cambie muy pocas veces: hay que decidirse a mover el telefono medio
   * cuadrante para que cambie.
   */
  readonly mode: TiltMode;
  /** Falso si el dispositivo no tiene sensor de movimiento. */
  readonly isAvailable: boolean;
}

/**
 * Sigue la inclinacion del telefono.
 *
 * @returns La inclinacion suavizada y si el encuadre esta alineado.
 */
export function useTilt(): Tilt {
  const degrees = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const [isAligned, setIsAligned] = useState(false);
  const [mode, setMode] = useState<TiltMode>('flat');
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(
    () =>
      subscribeToTilt({ degrees, offsetX, offsetY, setAligned: setIsAligned, setMode }, () =>
        setIsAvailable(true),
      ),
    [degrees, offsetX, offsetY],
  );

  return { degrees, offsetX, offsetY, isAligned, mode, isAvailable };
}

/** Donde va a parar cada lectura suavizada. */
interface TiltSink {
  readonly degrees: SharedValue<number>;
  readonly offsetX: SharedValue<number>;
  readonly offsetY: SharedValue<number>;
  readonly setAligned: Dispatch<SetStateAction<boolean>>;
  readonly setMode: Dispatch<SetStateAction<TiltMode>>;
}

/**
 * Reparte una lectura entre el hilo de UI y el estado de React.
 *
 * Los tres valores continuos van a valores compartidos, que no provocan
 * renderizado. Solo el booleano de alineado cruza a React, y gracias a la
 * histeresis lo hace pocas veces.
 *
 * @param sink Destino de la lectura.
 * @param reading Lectura ya suavizada.
 */
function applyReading(sink: TiltSink, reading: TiltReading): void {
  sink.degrees.value = reading.degrees;
  sink.offsetX.value = reading.x;
  sink.offsetY.value = reading.y;

  sink.setAligned((wasAligned) =>
    wasAligned ? reading.degrees <= ALIGNED_EXIT_DEGREES : reading.degrees < ALIGNED_ENTER_DEGREES,
  );
  sink.setMode(reading.mode);
}

/**
 * Se suscribe al sensor de movimiento mientras exista.
 *
 * @param sink Destino de las lecturas.
 * @param onAvailable Se invoca si el dispositivo tiene sensor.
 * @returns La funcion que cancela la suscripcion.
 */
function subscribeToTilt(sink: TiltSink, onAvailable: () => void): () => void {
  let smoothed: TiltReading | null = null;
  let subscription: { remove: () => void } | null = null;
  let cancelled = false;

  void DeviceMotion.isAvailableAsync().then((available) => {
    if (cancelled || !available) {
      return;
    }
    onAvailable();
    DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);

    subscription = DeviceMotion.addListener((measurement) => {
      // La postura anterior se pasa de vuelta: es lo que da la banda muerta, y
      // mantenerla aqui deja `measureTilt` puro.
      const reading = measureTilt(measurement.accelerationIncludingGravity, smoothed?.mode);
      if (reading !== null) {
        smoothed = smoothTilt(smoothed, reading);
        applyReading(sink, smoothed);
      }
    });
  });

  return () => {
    cancelled = true;
    subscription?.remove();
  };
}
