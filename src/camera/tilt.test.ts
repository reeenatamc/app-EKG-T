import { measureTilt, smoothTilt, type TiltReading } from '@/camera/tilt';

/** Magnitud de la gravedad. El valor exacto da igual: la lectura se normaliza. */
const G = 9.81;

/**
 * Gravedad de un telefono girado desde plano hacia de pie.
 *
 * Cero grados es boca arriba sobre la mesa y noventa es de pie en vertical. Sale
 * de girar el vector alrededor del eje X del dispositivo, que es el gesto de
 * levantar el telefono para encarar un papel colgado.
 *
 * @param degrees Grados levantados desde la mesa.
 * @returns El vector que entregaria el sensor.
 */
function raised(degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return { x: 0, y: G * Math.sin(radians), z: G * Math.cos(radians) };
}

describe('measureTilt con el papel en una mesa', () => {
  it('da cero grados con el telefono plano', () => {
    expect(measureTilt({ x: 0, y: 0, z: G })?.degrees).toBeCloseTo(0);
  });

  it('mide cuanto se aparta de la horizontal', () => {
    // Antes se comprobaba con el telefono de canto, que daba 90. Ya no vale como
    // prueba de esta postura: a 90 grados el nivel ha cambiado de pregunta y
    // responde 0, porque de canto es exactamente lo que se busca con el papel en
    // vertical. Se mide dentro de la banda de mesa, que es donde tiene sentido.
    expect(measureTilt(raised(20), 'flat')?.degrees).toBeCloseTo(20);
    expect(measureTilt(raised(50), 'flat')?.degrees).toBeCloseTo(50);
  });

  // Lo que se pregunta es si el plano de la imagen es paralelo al de la mesa,
  // no hacia donde apunta la camara: boca arriba y boca abajo son igual de
  // planos.
  it('no distingue si la camara mira arriba o abajo', () => {
    const up = measureTilt({ x: 0, y: 0, z: G })?.degrees;
    const down = measureTilt({ x: 0, y: 0, z: -G })?.degrees;

    expect(up).toBeCloseTo(down ?? Number.NaN);
  });

  it('no depende de la magnitud del vector', () => {
    const strong = measureTilt({ x: G, y: 0, z: G })?.degrees;
    const weak = measureTilt({ x: 0.5, y: 0, z: 0.5 })?.degrees;

    expect(strong).toBeCloseTo(45);
    expect(weak).toBeCloseTo(45);
  });

  // El punto del nivel sube hacia el lado alto, al reves que la gravedad.
  it('apunta al lado contrario que la gravedad', () => {
    // Inclinado 30 grados hacia un lado, que sigue dentro de la banda de mesa.
    const radians = Math.PI / 6;
    const reading = measureTilt({ x: G * Math.sin(radians), y: 0, z: G * Math.cos(radians) });

    expect(reading?.mode).toBe('flat');
    expect(reading?.x).toBeCloseTo(-Math.sin(radians));
    expect(reading?.y).toBeCloseTo(0);
  });

  it('devuelve null con un vector nulo', () => {
    expect(measureTilt({ x: 0, y: 0, z: 0 })).toBeNull();
  });
});

describe('measureTilt con el papel en vertical', () => {
  it('da cero grados con el telefono de pie', () => {
    // Es el caso que antes marcaba 90 fijos y no dejaba alinearse nunca.
    const reading = measureTilt(raised(90), 'upright');

    expect(reading?.mode).toBe('upright');
    expect(reading?.degrees).toBeCloseTo(0);
  });

  it('mide lo que se aparta de la vertical, no de la mesa', () => {
    expect(measureTilt(raised(80), 'upright')?.degrees).toBeCloseTo(10);
    expect(measureTilt(raised(100), 'upright')?.degrees).toBeCloseTo(10);
  });

  it('da igual si la camara mira al frente o hacia atras', () => {
    // Boca arriba y boca abajo son igual de planos; de pie de frente y de
    // espaldas son igual de verticales.
    const forward = measureTilt(raised(70), 'upright')?.degrees;
    const backward = measureTilt(raised(110), 'upright')?.degrees;

    expect(forward).toBeCloseTo(backward ?? Number.NaN);
  });

  it('el punto se va al borde que se esta inclinando hacia atras', () => {
    // Telefono de pie con la parte de arriba cayendo hacia el papel: el borde
    // que se aleja es el de abajo, asi que ahi va el punto. En el plano de la
    // pantalla eso es la direccion de la gravedad, o sea +y.
    const leaning = measureTilt(raised(75), 'upright');

    expect(leaning?.x).toBeCloseTo(0);
    expect(leaning?.y).toBeGreaterThan(0);

    // Y al pasarse de vertical hacia el otro lado, el punto cruza al de arriba.
    const past = measureTilt(raised(105), 'upright');
    expect(past?.y).toBeLessThan(0);
  });

  it('el punto se mueve de lado a lado con el telefono en apaisado', () => {
    // Misma inclinacion, pero con la gravedad a lo largo del eje X: el error
    // sigue siendo el mismo y el punto tiene que salir por el otro eje, que es
    // donde la muneca corrige. Es lo que hace que la postura sirva en apaisado.
    const landscape = measureTilt({ x: G * Math.cos(0.2), y: 0, z: G * Math.sin(0.2) }, 'upright');

    expect(landscape?.mode).toBe('upright');
    expect(landscape?.y).toBeCloseTo(0);
    expect(landscape?.x).toBeGreaterThan(0);
  });

  it('centra el punto cuando esta bien puesto', () => {
    const reading = measureTilt(raised(90), 'upright');

    expect(Math.hypot(reading?.x ?? 1, reading?.y ?? 1)).toBeCloseTo(0);
  });
});

describe('la postura se deduce sola, con banda muerta', () => {
  it('arranca suponiendo el papel en una mesa', () => {
    expect(measureTilt(raised(0))?.mode).toBe('flat');
  });

  it('no cambia de postura hasta pasar de 55 grados', () => {
    expect(measureTilt(raised(50), 'flat')?.mode).toBe('flat');
    expect(measureTilt(raised(60), 'flat')?.mode).toBe('upright');
  });

  it('no vuelve a mesa hasta bajar de 35 grados', () => {
    expect(measureTilt(raised(40), 'upright')?.mode).toBe('upright');
    expect(measureTilt(raised(30), 'upright')?.mode).toBe('flat');
  });

  it('la banda muerta impide el parpadeo a media altura', () => {
    // A 45 grados, que es el corte natural, la postura depende de la anterior y
    // no de la lectura: es justo lo que evita que el nivel cambie de pregunta
    // varias veces por segundo con el telefono a media altura.
    expect(measureTilt(raised(45), 'flat')?.mode).toBe('flat');
    expect(measureTilt(raised(45), 'upright')?.mode).toBe('upright');
  });
});

describe('smoothTilt', () => {
  it('adopta la primera lectura tal cual', () => {
    const first: TiltReading = { degrees: 12, x: 0.2, y: -0.1, mode: 'flat' };

    expect(smoothTilt(null, first)).toEqual(first);
  });

  it('se acerca a la lectura nueva sin llegar de golpe', () => {
    const smoothed = smoothTilt(
      { degrees: 0, x: 0, y: 0, mode: 'flat' },
      { degrees: 10, x: 1, y: 1, mode: 'flat' },
    );

    expect(smoothed.degrees).toBeGreaterThan(0);
    expect(smoothed.degrees).toBeLessThan(10);
  });

  it('converge al repetir la misma lectura', () => {
    let current: TiltReading = { degrees: 0, x: 0, y: 0, mode: 'flat' };
    const target: TiltReading = { degrees: 10, x: 0, y: 0, mode: 'flat' };

    for (let step = 0; step < 60; step += 1) {
      current = smoothTilt(current, target);
    }

    expect(current.degrees).toBeCloseTo(10, 3);
  });

  it('al cambiar de postura adopta la lectura de golpe', () => {
    // Interpolar entre dos posturas mezclaria dos preguntas distintas y el punto
    // haria un barrido de un par de segundos por posiciones sin significado.
    const previous: TiltReading = { degrees: 40, x: 0.6, y: 0.6, mode: 'flat' };
    const next: TiltReading = { degrees: 2, x: 0, y: 0.03, mode: 'upright' };

    expect(smoothTilt(previous, next)).toEqual(next);
  });
});
