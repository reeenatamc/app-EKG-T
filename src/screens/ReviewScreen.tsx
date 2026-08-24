import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import type { CapturedPhoto } from '@/camera/capturePhoto';
import { computeContainRect, type Rect, type Size } from '@/camera/framing';
import { rectToQuad, scaleQuad, translateQuadToOrigin, type Quad } from '@/camera/quad';
import { useQuadCorners, type CornerValues } from '@/camera/useQuadCorners';
import { ActionButton } from '@/components/ActionButton';
import { CornerHandles } from '@/components/CornerHandles';
import { Notice } from '@/components/Notice';
import { PerspectivePreview } from '@/components/PerspectivePreview';
import { REVIEW_TEXT } from '@/constants/captureText';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

interface ReviewScreenProps {
  readonly photo: CapturedPhoto;
  /** Cierto mientras se prepara el recorte, para no lanzarlo dos veces. */
  readonly isCropping: boolean;
  /** Cierto si el ultimo intento de recorte no salio. */
  readonly hasCropFailed: boolean;
  readonly onDiscard: () => void;
  /** Recibe las esquinas en pixeles de la foto. */
  readonly onConfirm: (quad: Quad) => void;
}

/**
 * Ajuste del recorte con cuatro esquinas arrastrables.
 *
 * La imagen se apoya sobre superficie opaca, nunca sobre vidrio: es el dato
 * clinico de esta pantalla y §12.1 no admite excepciones. Se muestra completa,
 * sin recortar, porque si el contenedor recortase el usuario no podria llevar
 * una esquina hasta un borde que no ve.
 *
 * @param photo Foto capturada, con el marco original marcado.
 * @param isCropping Cierto mientras se prepara el recorte.
 * @param hasCropFailed Cierto si el ultimo recorte no salio.
 * @param onDiscard Descarta la foto y vuelve a la captura.
 * @param onConfirm Acepta el recorte, con las esquinas en pixeles de la foto.
 * @returns La pantalla de revision.
 */
export function ReviewScreen({
  photo,
  isCropping,
  hasCropFailed,
  onDiscard,
  onConfirm,
}: ReviewScreenProps) {
  const review = useReviewState(photo);

  return (
    <View style={styles.container}>
      <ReviewHeader />

      <CropWorkspace uri={photo.uri} review={review} />

      <ReviewActions
        canContinue={review.isValid && !isCropping}
        hasCropFailed={hasCropFailed}
        onDiscard={onDiscard}
        onConfirm={() => onConfirm(review.readInPhotoPixels())}
        onReset={review.resetCorners}
      />
    </View>
  );
}

/**
 * Las dos vistas del mismo recorte: la foto con las esquinas y la previa ya
 * enderezada.
 *
 * Van juntas porque se leen juntas —se mueve una esquina y se comprueba abajo
 * que la previa mejora— y porque separarlas dejaba a la pantalla con cinco
 * bloques sueltos y sin jerarquia.
 *
 * @param uri Ruta de la foto.
 * @param review Estado de la revision.
 * @returns El area de trabajo del recorte.
 */
function CropWorkspace({ uri, review }: { readonly uri: string; readonly review: ReviewState }) {
  return (
    <>
      <CropStage
        uri={uri}
        corners={review.corners}
        bounds={review.displayed}
        isValid={review.isValid}
        isMeasured={review.container !== null}
        onLayout={review.measure}
        onSettled={review.settle}
      />

      <RectifiedFeedback
        uri={uri}
        quad={review.previewQuad}
        sourceBounds={review.displayed}
        containerWidth={review.container?.width ?? null}
        isValid={review.isValid}
      />
    </>
  );
}

/** Titulo e instruccion de la pantalla. */
function ReviewHeader() {
  const theme = useTheme();

  return (
    <>
      <Text style={[type.h1, { color: theme.textHigh }]}>{REVIEW_TEXT.title}</Text>
      <Text style={[type.caption, { color: theme.textLow }]}>{REVIEW_TEXT.hint}</Text>
    </>
  );
}

interface ReviewState {
  readonly container: Size | null;
  readonly displayed: Rect;
  readonly corners: CornerValues;
  readonly isValid: boolean;
  readonly previewQuad: Quad;
  readonly measure: (event: LayoutChangeEvent) => void;
  readonly settle: () => void;
  readonly resetCorners: () => void;
  /** Las esquinas actuales, ya convertidas a pixeles de la foto. */
  readonly readInPhotoPixels: () => Quad;
}

/**
 * Reune la medida del contenedor, la geometria y las cuatro esquinas.
 *
 * La conversion final a pixeles de la foto vive aqui y no en la pantalla porque
 * es la operacion delicada del modulo: quitar el origen del area dibujada y
 * deshacer la escala, las dos con funciones ya probadas. Equivocarla produce un
 * recorte que no coincide con lo que el usuario vio, que es el mismo fallo que
 * resolvio la captura.
 *
 * @param photo Foto capturada.
 * @returns El estado de la revision y sus acciones.
 */
function useReviewState(photo: CapturedPhoto): ReviewState {
  const [container, setContainer] = useState<Size | null>(null);
  const { displayed, scale, initialRect } = useReviewGeometry(photo, container);
  const { corners, isValid, read, reset } = useQuadCorners(initialRect);
  const [adjusted, setAdjusted] = useState<Quad | null>(null);

  return {
    container,
    displayed,
    corners,
    isValid,
    previewQuad: adjusted ?? rectToQuad(initialRect),
    measure: (event) => setContainer(event.nativeEvent.layout),
    settle: () => setAdjusted(read()),
    resetCorners: () => {
      reset();
      setAdjusted(null);
    },
    readInPhotoPixels: () => scaleQuad(translateQuadToOrigin(read(), displayed), 1 / scale),
  };
}

interface CropStageProps {
  readonly uri: string;
  readonly corners: CornerValues;
  readonly bounds: Rect;
  readonly isValid: boolean;
  /** Falso hasta que onLayout ha medido el contenedor. */
  readonly isMeasured: boolean;
  readonly onLayout: (event: LayoutChangeEvent) => void;
  readonly onSettled: () => void;
}

/**
 * La foto con las cuatro esquinas encima.
 *
 * Las esquinas no se montan hasta que el contenedor esta medido: antes de eso
 * no se sabe donde acaba dibujada la imagen, y colocarlas en el origen las
 * haria saltar visiblemente a su sitio en el primer fotograma.
 */
function CropStage({
  uri,
  corners,
  bounds,
  isValid,
  isMeasured,
  onLayout,
  onSettled,
}: CropStageProps) {
  const theme = useTheme();

  return (
    <View style={[styles.stage, { backgroundColor: theme.surface }]} onLayout={onLayout}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        accessible
        accessibilityLabel={REVIEW_TEXT.imageLabel}
      />
      {isMeasured ? (
        <CornerHandles corners={corners} bounds={bounds} isValid={isValid} onSettled={onSettled} />
      ) : null}
    </View>
  );
}

interface RectifiedFeedbackProps {
  readonly uri: string;
  readonly quad: Quad;
  readonly sourceBounds: Rect;
  /** Nulo hasta que el contenedor esta medido. */
  readonly containerWidth: number | null;
  readonly isValid: boolean;
}

/**
 * Lo que devuelve la pantalla sobre el recorte en curso.
 *
 * Con las esquinas cruzadas no se dibuja la previsualizacion: la homografia de
 * un cuadrilatero cruzado pliega la imagen sobre si misma y lo que saldria seria
 * ilegible. Se dice con palabras lo que ha pasado y como salir de ahi.
 */
function RectifiedFeedback({
  uri,
  quad,
  sourceBounds,
  containerWidth,
  isValid,
}: RectifiedFeedbackProps) {
  const theme = useTheme();

  if (!isValid) {
    return <Text style={[type.caption, { color: theme.textHigh }]}>{REVIEW_TEXT.crossedQuad}</Text>;
  }

  if (containerWidth === null) {
    return null;
  }

  return (
    <PerspectivePreview
      uri={uri}
      quad={quad}
      sourceBounds={sourceBounds}
      availableWidth={containerWidth}
    />
  );
}

interface ReviewActionsProps {
  readonly canContinue: boolean;
  readonly hasCropFailed: boolean;
  readonly onDiscard: () => void;
  readonly onConfirm: () => void;
  readonly onReset: () => void;
}

/**
 * Las tres salidas de la revision.
 *
 * Continuar se deshabilita cuando las esquinas se han cruzado, porque en ese
 * caso no existe un recorte que enviar. No es un juicio sobre la calidad de la
 * foto sino una imposibilidad geometrica: es la unica situacion de todo el
 * modulo en la que se impide avanzar.
 *
 * Tambien queda desactivado mientras el recorte se prepara, que no es lo mismo:
 * ahi no se impide nada, solo se evita que dos toques seguidos lancen dos
 * recortes de la misma foto.
 *
 * EL AVISO DEL RECORTE FALLIDO VIVE AQUI, pegado al boton que no funciono.
 * Puesto arriba de la pantalla habria quedado fuera de vista justo cuando hace
 * falta, porque el dedo y la mirada estan abajo.
 */
function ReviewActions({
  canContinue,
  hasCropFailed,
  onDiscard,
  onConfirm,
  onReset,
}: ReviewActionsProps) {
  return (
    <>
      {hasCropFailed ? (
        <Notice title={REVIEW_TEXT.cropFailure.title} action={REVIEW_TEXT.cropFailure.action} />
      ) : null}

      <View style={styles.actions}>
        <ActionButton label={REVIEW_TEXT.discard} onPress={onDiscard} variant="secondary" />
        <ActionButton
          label={REVIEW_TEXT.continueAction}
          onPress={onConfirm}
          variant="primary"
          disabled={!canContinue}
        />
      </View>
      <ActionButton label={REVIEW_TEXT.reset} onPress={onReset} variant="secondary" />
    </>
  );
}

interface ReviewGeometry {
  /** Region donde acaba dibujada la foto dentro del contenedor. */
  readonly displayed: Rect;
  /** Factor entre pixeles de la foto y puntos de pantalla. */
  readonly scale: number;
  /** Rectangulo de partida de las esquinas, en puntos de pantalla. */
  readonly initialRect: Rect;
}

const EMPTY_RECT: Rect = { x: 0, y: 0, width: 0, height: 0 };

/**
 * Traduce entre pixeles de la foto y puntos de pantalla.
 *
 * Es la misma clase de correspondencia que resolvio la captura, y equivocarla
 * tiene el mismo efecto: un recorte que no coincide con lo que se vio. Por eso
 * se apoya en computeContainRect, que esta probado, en lugar de deducir la
 * escala a ojo.
 *
 * @param photo Foto capturada.
 * @param container Contenedor medido, o null antes del primer diseno.
 * @returns La geometria derivada.
 */
function useReviewGeometry(photo: CapturedPhoto, container: Size | null): ReviewGeometry {
  const { width, height, framedRegion } = photo;

  return useMemo(() => {
    if (container === null) {
      return { displayed: EMPTY_RECT, scale: 1, initialRect: EMPTY_RECT };
    }

    const displayed = computeContainRect(container, { width, height });
    // Un solo factor para los dos ejes: computeContainRect no deforma.
    const scale = displayed.width / width;

    return {
      displayed,
      scale,
      initialRect: {
        x: displayed.x + framedRegion.x * scale,
        y: displayed.y + framedRegion.y * scale,
        width: framedRegion.width * scale,
        height: framedRegion.height * scale,
      },
    };
  }, [container, width, height, framedRegion]);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: gap.lg, gap: gap.md },
  stage: { flex: 1, borderRadius: radius.tile, overflow: 'hidden' },
  actions: { flexDirection: 'row', gap: gap.md },
});
