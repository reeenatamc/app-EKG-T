import {
  appliedTurn,
  isSideways,
  remainingClockwise,
  turnFromGravity,
  turnRectCounterClockwise,
  turnSize,
} from '@/camera/turn';

/** Gravedad de 9,8 en la direccion pedida, con el signo de expo-sensors. */
const G = 9.8;

describe('turnFromGravity repite la decision de Android', () => {
  // Con el signo de expo-sensors la gravedad apunta hacia el suelo: de pie, `y` es
  // negativa porque el eje `y` de Android va hacia la parte de arriba del telefono.
  // Se comprobo leyendo DeviceMotionModule.kt, que entrega la lectura en crudo
  // menos dos veces la gravedad.
  it('de pie es 0', () => {
    expect(turnFromGravity({ x: 0, y: -G, z: 0 }, 90)).toBe(0);
  });

  it('con el lado derecho arriba es 90', () => {
    expect(turnFromGravity({ x: -G, y: 0, z: 0 }, 0)).toBe(90);
  });

  it('boca abajo es 180', () => {
    expect(turnFromGravity({ x: 0, y: G, z: 0 }, 0)).toBe(180);
  });

  it('con el lado izquierdo arriba es 270', () => {
    expect(turnFromGravity({ x: G, y: 0, z: 0 }, 0)).toBe(270);
  });

  it('CON EL TELEFONO PLANO CONSERVA EL GIRO ANTERIOR', () => {
    // Es la foto de un papel sobre la mesa. El giro que vale es el que tenia al
    // bajarlo, y Android hace lo mismo: no toca la rotacion de la foto.
    expect(turnFromGravity({ x: 0.2, y: -0.3, z: -G }, 90)).toBe(90);
    expect(turnFromGravity({ x: 0, y: 0, z: 0 }, 270)).toBe(270);
  });

  it('decide en cuanto la gravedad en el plano llega a la mitad de la perpendicular', () => {
    // El umbral de Android: x^2 + y^2 >= z^2 / 4, unos 27 grados desde plano.
    expect(turnFromGravity({ x: -4.9, y: 0, z: -9.8 }, 0)).toBe(90);
    expect(turnFromGravity({ x: -4.8, y: 0, z: -9.8 }, 0)).toBe(0);
  });

  it('los cortes caen a 45 grados, como en expo-camera', () => {
    const at = (degrees: number) => {
      // Telefono girado `degrees` en sentido horario visto de frente: a 90 queda
      // con el lado izquierdo arriba, y la gravedad apunta a su lado derecho.
      const radians = (degrees * Math.PI) / 180;
      return { x: G * Math.sin(radians), y: -G * Math.cos(radians), z: 0 };
    };

    expect(turnFromGravity(at(44), 0)).toBe(0);
    expect(turnFromGravity(at(46), 0)).toBe(270);
    expect(turnFromGravity(at(-44), 0)).toBe(0);
    expect(turnFromGravity(at(-46), 0)).toBe(90);
    expect(turnFromGravity(at(180), 0)).toBe(180);
  });
});

describe('girar tamanos y rectangulos', () => {
  const image = { width: 30, height: 40 };
  const rect = { x: 2, y: 5, width: 10, height: 6 };

  it('solo los cuartos impares cambian ancho por alto', () => {
    expect(isSideways(0)).toBe(false);
    expect(isSideways(90)).toBe(true);
    expect(turnSize(image, 90)).toEqual({ width: 40, height: 30 });
    expect(turnSize(image, 180)).toEqual(image);
  });

  it('en antihorario, lo que estaba a la derecha queda arriba', () => {
    // Un punto pegado al borde derecho de la imagen original acaba en y = 0.
    const rightEdge = { x: 20, y: 5, width: 10, height: 6 };

    expect(turnRectCounterClockwise(rightEdge, image, 90).y).toBe(0);
    expect(turnRectCounterClockwise(rect, image, 90)).toEqual({
      x: 5,
      y: 18,
      width: 6,
      height: 10,
    });
  });

  it('cuatro cuartos vuelven al principio', () => {
    let current = rect;
    let size = image;

    for (let step = 0; step < 4; step += 1) {
      current = turnRectCounterClockwise(current, size, 90);
      size = turnSize(size, 90);
    }

    expect(current).toEqual(rect);
  });

  it('270 es tres veces 90 y 180 es dos', () => {
    const twice = turnRectCounterClockwise(
      turnRectCounterClockwise(rect, image, 90),
      turnSize(image, 90),
      90,
    );
    const thrice = turnRectCounterClockwise(twice, image, 90);

    expect(turnRectCounterClockwise(rect, image, 180)).toEqual(twice);
    expect(turnRectCounterClockwise(rect, image, 270)).toEqual(thrice);
  });

  it('el rectangulo girado sigue dentro de la imagen girada', () => {
    for (const turn of [0, 90, 180, 270] as const) {
      const turned = turnRectCounterClockwise(rect, image, turn);
      const size = turnSize(image, turn);

      expect(turned.x).toBeGreaterThanOrEqual(0);
      expect(turned.y).toBeGreaterThanOrEqual(0);
      expect(turned.x + turned.width).toBeLessThanOrEqual(size.width);
      expect(turned.y + turned.height).toBeLessThanOrEqual(size.height);
    }
  });
});

describe('que giro tiene la foto de verdad', () => {
  const portrait = { width: 3000, height: 4000 };
  const landscape = { width: 4000, height: 3000 };

  it('si la forma encaja con lo esperado, se cree lo esperado', () => {
    expect(appliedTurn(90, landscape)).toBe(90);
    expect(appliedTurn(270, landscape)).toBe(270);
    expect(appliedTurn(0, portrait)).toBe(0);
    expect(appliedTurn(180, portrait)).toBe(180);
  });

  it('SI LA FORMA LO CONTRADICE, MANDA LA FORMA', () => {
    // La pantalla creia el telefono en horizontal pero Android no giro la foto
    // (un caso de captura recien creado nace en 0), o al reves.
    expect(appliedTurn(90, portrait)).toBe(0);
    expect(appliedTurn(0, landscape)).toBe(90);
  });

  it('lo que queda por girar es cero cuando Android ya lo hizo', () => {
    expect(remainingClockwise(90, 90)).toBe(0);
    expect(remainingClockwise(270, 270)).toBe(0);
  });

  it('si Android no giro, se gira en antihorario lo que faltaba', () => {
    // Horario de 270 es antihorario de 90: deshace la diferencia.
    expect(remainingClockwise(0, 90)).toBe(270);
    expect(remainingClockwise(0, 270)).toBe(90);
  });
});
