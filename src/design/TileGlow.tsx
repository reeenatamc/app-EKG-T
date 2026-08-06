import { Blur, Canvas, Group, Paint, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

/**
 * Centro del núcleo, en fracción del ancho y del alto.
 *
 * CENTRADO. Con el núcleo descentrado el borde salía más grueso por un lado y la
 * tarjeta se leía torcida; centrado se lee como una viñeta, que es la gramática
 * de un widget de iOS.
 */
const FOCUS = { x: 0.5, y: 0.5 };

/**
 * Radio del foco, en fracción de la diagonal del módulo.
 *
 * Corto a proposito. Con el radio largo la rampa cubria la tarjeta entera y se
 * leia como un degradado; concentrandola en algo menos de la mitad, y con el
 * desenfoque de abajo, se lee como una **mancha de luz**, que es lo que hacen las
 * referencias.
 */
const REACH = 0.52;

/**
 * Desenfoque de la mancha, en fracción de la diagonal.
 *
 * ES LO QUE SEPARA UNA MANCHA DE UN DEGRADADO. Un degradado radial ya es suave,
 * pero tiene centro y direccion; al desenfocarlo pierde el centro y se convierte
 * en luz difusa. Es el mismo recurso que el `Group layer` del aurora en §4, y por
 * el mismo motivo: sin el se ven anillos.
 */
const SOFTEN = 0.09;

interface TileGlowProps {
  readonly width: number;
  readonly height: number;
  /** Color del foco. Es el punto mas saturado, o sea el peor caso de contraste. */
  readonly focus: string;
  /** Color al que cae el degradado hacia los bordes. */
  readonly edge: string;
}

/**
 * Degradado radial que rellena un modulo bento.
 *
 * EL FOCO ESTA DESCENTRADO, por lo mismo que los blobs del aurora en §4: una luz
 * centrada se lee como un degradado y descentrada se lee como luz.
 *
 * DIRECCION. En el modulo de marca el degradado **oscurece** hacia fuera, al
 * reves que la referencia de la que salio la idea: la suya iba de un rosa
 * saturado a un rosa casi blanco, y sobre esa zona palida su tinta clara se
 * quedaba sin contraste. Invirtiendo la direccion se consigue la misma
 * profundidad y el suelo de §7 solo puede mejorar hacia el borde. En los modulos
 * palidos pasa igual: el foco es lo mas cargado que hay, o sea el peor caso, y es
 * el que esta medido en §2 del README.
 *
 * POR QUE ESTO LLEVA UN `<Canvas>` PROPIO, que §13 marca como antipatron. La
 * regla existe por coste: un lienzo por tarjeta en una pantalla que ya tiene el
 * del fondo son dos pasadas de GPU donde deberia haber una. Desde D-20 las
 * pantallas de producto no montan ninguno, asi que estos son los unicos: son
 * cuatro, estan quietos, no se animan y no llevan desenfoque. La excepcion se
 * acepta **midiendo**, no argumentando —la cuenta de fotogramas esta en §3 del
 * README—, y si costara cuadros la salida es una mascara PNG radial tenida con
 * `tintColor`, que da el mismo resultado sin ningun lienzo.
 *
 * @param width Ancho del modulo en puntos.
 * @param height Alto del modulo en puntos.
 * @param focus Color del punto de luz.
 * @param edge Color hacia el que cae.
 * @returns El lienzo con el degradado.
 */
export function TileGlow({ width, height, focus, edge }: TileGlowProps) {
  const diagonal = Math.hypot(width, height);

  return (
    <Canvas
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/*
        El desenfoque va en el `layer` del Group, no como hermano. Es la misma
        leccion de §4: un `<Blur>` suelto no hace nada, y sin el se ven anillos.
      */}
      <Group
        layer={
          <Paint>
            <Blur blur={diagonal * SOFTEN} />
          </Paint>
        }
      >
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width * FOCUS.x, height * FOCUS.y)}
            r={diagonal * REACH}
            colors={[focus, edge]}
          />
        </Rect>
      </Group>
    </Canvas>
  );
}
