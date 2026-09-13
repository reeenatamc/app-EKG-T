/**
 * Genera los iconos de la aplicacion a partir del corazon del arranque. Ver D-27.
 *
 *   node scripts/render-brand-art.mjs                 escribe assets/*.png
 *   node scripts/render-brand-art.mjs --preview DIR   ademas, vistas previas en DIR
 *
 * MISMO DIBUJO QUE LA PANTALLA. La geometria, los colores y el guion salen de
 * `src/design/heartArt.ts` y `src/design/heartTimeline.ts`, que tambien importa
 * `SplashHeart`. El motor es Skia: CanvasKit, que ya instala
 * @shopify/react-native-skia, a traves de la misma API `Skia.*` que usa la
 * aplicacion en web. Nada se descarga y el resultado es reproducible.
 *
 * Requiere Node 23.6 o posterior, que ejecuta TypeScript sin compilar.
 */
import { Buffer } from 'node:buffer';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'package.json'));

// El alias `@/` de tsconfig, para importar los modulos de diseno tal cual.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      return nextResolve(
        pathToFileURL(join(ROOT, 'src', `${specifier.slice(2)}.ts`)).href,
        context,
      );
    }
    return nextResolve(specifier, context);
  },
});

const art = await import('../src/design/heartArt.ts');
const beat = await import('../src/design/heartTimeline.ts');
const { identity, paperDark, paperLight } = await import('../src/design/tokens.ts');

const CanvasKit = await require('canvaskit-wasm')();
const { JsiSkApi } = require('@shopify/react-native-skia/lib/commonjs/skia/web');
const {
  BlendMode,
  BlurStyle,
  ClipOp,
  PaintStyle,
  StrokeCap,
  StrokeJoin,
  TileMode,
} = require('@shopify/react-native-skia/lib/commonjs/skia/types');
const Skia = JsiSkApi(CanvasKit);

const HEART = Skia.Path.MakeFromSVGString(art.HEART_SVG);
const TRACE = Skia.Path.MakeFromSVGString(art.HEART_TRACE_SVG);

// ---------------------------------------------------------------------------
// Dibujo. Cada capa replica una capa de SplashHeart, en el mismo orden.
// ---------------------------------------------------------------------------

function fill(color) {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  return paint;
}

function stroke(color, width) {
  const paint = fill(color);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  return paint;
}

function radial(cx, cy, r, colors, positions) {
  const paint = fill(identity.bone);
  paint.setShader(
    Skia.Shader.MakeRadialGradient(
      Skia.Point(cx, cy),
      r,
      colors.map((color) => Skia.Color(color)),
      [...positions],
      TileMode.Clamp,
    ),
  );
  return paint;
}

/** Un ovalo difuminado: circulo con degradado, girado y achatado. */
function glow(canvas, spec, { dx = 0, scaleX = 1, opacity = 1 } = {}) {
  const paint = radial(0, 0, spec.r, spec.colors, spec.positions);
  paint.setAlphaf(opacity);
  canvas.save();
  canvas.translate(spec.cx + dx, spec.cy);
  canvas.rotate((spec.angle * 180) / Math.PI, 0, 0);
  canvas.scale(scaleX, spec.squash);
  canvas.drawCircle(0, 0, spec.r, paint);
  canvas.restore();
}

function aroundPivot(canvas, sx, sy) {
  canvas.translate(art.HEART_PIVOT.x, art.HEART_PIVOT.y);
  canvas.scale(sx, sy);
  canvas.translate(-art.HEART_PIVOT.x, -art.HEART_PIVOT.y);
}

function drawAmbient(canvas, t, isDark, traceColor) {
  const { shadow, glow: halo } = art.heartAmbient(isDark);
  glow(canvas, shadow, { scaleX: beat.shadowScaleX(t), opacity: beat.shadowOpacity(t) });
  glow(canvas, halo, { opacity: beat.glowOpacity(t) });
  const wave = beat.ripple(t);
  if (wave.opacity > 0) {
    canvas.save();
    aroundPivot(canvas, wave.scale, wave.scale);
    const paint = stroke(traceColor, art.HEART_RIPPLE_WIDTH);
    paint.setAlphaf(wave.opacity);
    canvas.drawPath(HEART, paint);
    canvas.restore();
  }
}

function drawBody(canvas, t) {
  const shift = beat.glintShift(t) * art.HEART_GLINT_DRIFT;
  const body = art.HEART_BODY;
  canvas.save();
  aroundPivot(canvas, beat.turnScaleX(t), 1);
  canvas.drawPath(HEART, radial(body.cx + shift / 2, body.cy, body.r, body.colors, body.positions));
  canvas.clipPath(HEART, ClipOp.Intersect, true);
  glow(canvas, art.HEART_BOUNCE, { dx: -shift / 2 });
  glow(canvas, art.HEART_SHEEN, { dx: shift });
  glow(canvas, art.HEART_SPARK, { dx: shift });
  canvas.restore();
}

function drawInnerTrace(canvas, layout, t) {
  const inner = layout.innerTrace;
  const paint = stroke(art.HEART_TRACE_INK, art.TRACE_STROKE / layout.trace.scale);
  paint.setMaskFilter(
    Skia.MaskFilter.MakeBlur(BlurStyle.Solid, art.TRACE_GLOW / layout.trace.scale, true),
  );
  canvas.save();
  canvas.clipPath(HEART, ClipOp.Intersect, true);
  canvas.translate(inner.x, inner.y);
  canvas.scale(inner.scale, inner.scale);
  canvas.drawPath(Skia.Path.Trim(TRACE, 0, beat.traceEnd(t), false), paint);
  canvas.restore();
}

/**
 * La escena completa en el instante `t`.
 *
 * @param options.outerTrace Falso para omitir el trazo fuera del corazon.
 */
function drawScene(canvas, layout, t, { isDark, traceColor, outerTrace = true }) {
  const { figure, trace } = layout;
  const end = beat.traceEnd(t);
  if (outerTrace && end > 0) {
    canvas.save();
    canvas.translate(0, trace.translateY);
    canvas.scale(trace.scale, trace.scale);
    canvas.drawPath(
      Skia.Path.Trim(TRACE, 0, end, false),
      stroke(traceColor, art.TRACE_STROKE / trace.scale),
    );
    canvas.restore();
  }
  canvas.save();
  canvas.translate(figure.left, figure.top);
  canvas.scale(figure.scale, figure.scale);
  drawAmbient(canvas, t, isDark, traceColor);
  const scale = beat.beatScale(t);
  aroundPivot(canvas, scale, scale);
  drawBody(canvas, t);
  if (end > 0) drawInnerTrace(canvas, layout, t);
  canvas.restore();
}

// ---------------------------------------------------------------------------
// Composiciones
// ---------------------------------------------------------------------------

/** Escena cuadrada para iconos: el corazon ocupa `ratio` del lado. */
function squareLayout(side, ratio) {
  const scale = (side * ratio) / art.HEART_BOX;
  const left = (side - art.HEART_BOX * scale) / 2;
  const top = side / 2 - 520 * scale;
  const traceScale = side / 1200;
  const translateY = top + art.HEART_PIVOT.y * scale - 200 * traceScale;
  return {
    figure: { left, top, scale },
    trace: { translateY, scale: traceScale },
    innerTrace: { x: -left / scale, y: (translateY - top) / scale, scale: traceScale / scale },
  };
}

function plumGround(canvas, side) {
  canvas.drawRect(Skia.XYWHRect(0, 0, side, side), fill(identity.plum));
  const paint = radial(
    side / 2,
    side * 0.42,
    side * 0.72,
    [paperDark.surface, identity.plum],
    [0, 1],
  );
  canvas.drawRect(Skia.XYWHRect(0, 0, side, side), paint);
}

function render(width, height, draw) {
  const surface = Skia.Surface.Make(width, height);
  draw(surface.getCanvas());
  surface.flush();
  return surface.makeImageSnapshot().readPixels(0, 0, {
    width,
    height,
    colorType: 4, // RGBA_8888
    alphaType: 3, // Unpremul
  });
}

const DARK_ICON = { isDark: true, traceColor: paperDark.bloom };

const ASSETS = {
  'icon.png': { side: 1024, opaque: true, draw: iconDraw(1024, 0.6) },
  'favicon.png': { side: 96, opaque: true, draw: iconDraw(96, 0.64) },
  'android-icon-background.png': { side: 1024, opaque: true, draw: (c) => plumGround(c, 1024) },
  'android-icon-foreground.png': {
    side: 1024,
    opaque: false,
    draw: (c) => drawScene(c, squareLayout(1024, 0.46), 1, { ...DARK_ICON, outerTrace: false }),
  },
  'android-icon-monochrome.png': { side: 1024, opaque: false, draw: monochromeDraw },
  'splash-icon.png': {
    side: 512,
    opaque: false,
    draw: (c) =>
      drawScene(c, squareLayout(512, 0.72), 1, {
        isDark: false,
        traceColor: paperLight.bloom,
        outerTrace: false,
      }),
  },
  'splash-icon-dark.png': {
    side: 512,
    opaque: false,
    draw: (c) => drawScene(c, squareLayout(512, 0.72), 1, { ...DARK_ICON, outerTrace: false }),
  },
};

function iconDraw(side, ratio) {
  return (canvas) => {
    plumGround(canvas, side);
    drawScene(canvas, squareLayout(side, ratio), 1, DARK_ICON);
  };
}

/** Silueta de un solo color con el trazo calado. Android solo lee el alfa. */
function monochromeDraw(canvas) {
  const layout = squareLayout(1024, 0.46);
  canvas.save();
  canvas.translate(layout.figure.left, layout.figure.top);
  canvas.scale(layout.figure.scale, layout.figure.scale);
  canvas.drawPath(HEART, fill(identity.bone));
  const inner = layout.innerTrace;
  // Mas grueso que en color: calado, un trazo fino se cierra a tamano de lanzador.
  const paint = stroke(identity.bone, (art.TRACE_STROKE * 2.5) / layout.trace.scale);
  paint.setBlendMode(BlendMode.Clear);
  canvas.translate(inner.x, inner.y);
  canvas.scale(inner.scale, inner.scale);
  canvas.drawPath(TRACE, paint);
  canvas.restore();
}

// ---------------------------------------------------------------------------
// Vistas previas: el arranque en un telefono de 390 x 844 puntos, a 2x.
// ---------------------------------------------------------------------------

const PHONE = { width: 390, height: 844, density: 2, gap: 24, titleSize: 44, titleLine: 42 };

function phoneFrame(t, isDark) {
  const theme = isDark ? paperDark : paperLight;
  const layout = art.heartSceneLayout(PHONE.width);
  const block = layout.height + PHONE.gap + PHONE.titleLine;
  const top = (PHONE.height - block) / 2;
  return (canvas) => {
    canvas.scale(PHONE.density, PHONE.density);
    canvas.drawRect(Skia.XYWHRect(0, 0, PHONE.width, PHONE.height), fill(theme.canvas));
    canvas.save();
    canvas.translate(0, top);
    drawScene(canvas, layout, t, { isDark, traceColor: theme.bloom });
    canvas.restore();
    drawTitle(canvas, theme.textHigh, top + layout.height + PHONE.gap + PHONE.titleSize * 0.8);
  };
}

function drawTitle(canvas, color, baseline) {
  const bytes = readFileSync(
    require.resolve('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  );
  const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(
    Skia.Data.fromBytes(new Uint8Array(bytes)),
  );
  const font = Skia.Font(typeface, PHONE.titleSize);
  const paint = fill(color);
  const text = 'EKG Reader';
  canvas.drawText(text, (PHONE.width - font.getTextWidth(text, paint)) / 2, baseline, paint, font);
}

function previews(dir) {
  const peak = 0.035;
  const frames = {
    '1-inicio': 0,
    '2-giro': 0.12,
    '3-lub': beat.lubAt() + peak,
    '4-dub': beat.dubAt() + peak,
    '5-final': 1,
  };
  const w = PHONE.width * PHONE.density;
  const h = PHONE.height * PHONE.density;
  for (const [name, t] of Object.entries(frames)) {
    for (const isDark of [false, true]) {
      const file = join(dir, `splash-${name}-${isDark ? 'oscuro' : 'claro'}.png`);
      writeFileSync(file, png(w, h, render(w, h, phoneFrame(t, isDark)), true));
    }
  }
}

// ---------------------------------------------------------------------------
// PNG sin dependencias. RGB cuando es opaco: App Store rechaza un icono con alfa.
// ---------------------------------------------------------------------------

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(width, height, rgba, opaque) {
  const channels = opaque ? 3 : 4;
  const raw = Buffer.alloc((width * channels + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * channels + 1);
    for (let x = 0; x < width; x += 1) {
      for (let c = 0; c < channels; c += 1) {
        raw[row + 1 + x * channels + c] = rgba[(y * width + x) * 4 + c];
      }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, opaque ? 2 : 6, 0, 0, 0], 8);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------

const assetsDir = join(ROOT, 'assets');
for (const [name, { side, opaque, draw }] of Object.entries(ASSETS)) {
  writeFileSync(join(assetsDir, name), png(side, side, render(side, side, draw), opaque));
  console.warn(`assets/${name}`);
}

const previewAt = process.argv.indexOf('--preview');
if (previewAt !== -1) {
  const dir = resolve(process.argv[previewAt + 1] ?? 'preview');
  mkdirSync(dir, { recursive: true });
  for (const name of ['icon.png', 'android-icon-foreground.png', 'splash-icon-dark.png']) {
    writeFileSync(join(dir, name), readFileSync(join(assetsDir, name)));
  }
  previews(dir);
  console.warn(`vistas previas en ${dir}`);
}
