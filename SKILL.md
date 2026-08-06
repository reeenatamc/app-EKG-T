---
name: bioglass-rn
description: Design system for React Native electrocardiography apps — glass surfaces, Skia mesh backgrounds, bento layout, and a palette derived from ECG paper and vital-signs monitors. Use when building any screen, component, or navigation surface for an ECG capture, digitization, monitoring, or cardiac-health mobile app. Covers design tokens in TypeScript, expo-blur and Skia recipes, waveform rendering, Reanimated motion, accessibility fallbacks, and the clinical safety rules that override any styling choice.
---

# BioGlass RN — glass aesthetics for ECG apps in React Native

## The thesis

Glass floats; data doesn't. Everything ambient — background, tab bar, headers, context cards — is translucent and blurred. Everything clinical — trace, heart rate, intervals, alarms — is opaque, sharp, and maximum contrast.

That tension *is* the system. Without it this is just a pretty background; with it, the interface communicates hierarchy without a single label: **if you can see through it, it isn't diagnostic.**

**Why pink belongs here.** ECG paper has a red-pink grid on cream. There's no formal color standard for it, but the grid is reddish nearly everywhere. The soft rose palette isn't a trend bolted onto a medical subject — it's the subject's own material.

---

## 0. What React Native does not have

Read this before writing anything. Half of the failures in this system come from someone assuming a CSS behavior exists.

| Web concept | RN reality | What to use |
|---|---|---|
| `backdrop-filter: blur()` | Doesn't exist | `expo-blur` `<BlurView>` |
| `filter: blur()` on an element | Doesn't exist | `<Image blurRadius>` for images, Skia `BlurMask` for vectors |
| `radial-gradient` | Doesn't exist | Skia `<RadialGradient>` |
| CSS variables | Don't exist | `tokens.ts` + a theme context |
| `inset` box-shadow (specular edge) | Doesn't exist | An absolutely-positioned 1px `<View>` |
| `em` units | Don't exist | Absolute numbers — compute them |
| `line-height: 0.92` | Multiplier not supported | `lineHeight` in px |
| `@supports` | Doesn't exist | Runtime capability checks |
| `prefers-reduced-transparency` | **iOS only** | See §7 — Android needs an in-app setting |
| CSS Grid | Doesn't exist | Flexbox composition |
| Contrast devtools | Don't exist | Design so it can't fail — see §7 |

Two of these deserve emphasis because they are the ones people get wrong:

**`fontVariant: ['tabular-nums']` is unreliable on Android.** Don't depend on it. Use a genuinely monospaced face for every clinical numeral so equal digit width is a property of the font, not of a style flag.

**`isReduceTransparencyEnabled()` always returns `false` on Android.** So the accessibility fallback cannot be automatic there. Ship an explicit "Reduce transparency" switch in Settings and OR it with the system value.

---

## 1. The six layers

Every screen composes these, in this z-order:

| # | Layer | Implementation | Rule |
|---|-------|----------------|------|
| 0 | Canvas | Root `<View backgroundColor>` | Never `#FFF`, never `#000` |
| 1 | Aurora | Skia radial mesh (§4) | No linear gradients |
| 2 | Signal bloom | Skia blurred beat path (§8) | The signature. One per screen |
| 3 | Grid | Skia 1mm/5mm lines, 4–8% opacity | Texture, not information |
| 4 | Glass | `<BlurView>` cards and chrome | **Max 2 on screen** (see §5) |
| 5 | Data | Opaque `<View>` | No blur. No exceptions |

Layers 1–3 live in **one persistent Skia `<Canvas>`** mounted at the screen root with `StyleSheet.absoluteFill` and `pointerEvents="none"`. One canvas per screen — never one per card.

> **Amendment 2026-07-29 — "every screen" is now "every entry screen".** Layers 1–3 belong to the screens a person passes *through*: splash, onboarding, and the five access screens. The screens they *work in* — the tab group, settings, the study detail, the capture flow — sit on a flat canvas with no Skia at all. The reason is measured: on a contact sheet of the twelve shipped screens the aurora was the strongest element on every one of them, and dropping it to 42% helped without fixing it. A decorative mesh behind a list of studies competes with the list; behind a four-field form it competes with nothing and does its job, which is to give the product a character before the work starts.
>
> Two consequences worth carrying. **The flat canvas is the extreme of the ramp, not the mid-tone** — pure bone in light, deep plum in dark — because a flat sheet is not resting on a shadowed desk, it *is* the sheet. In light that makes canvas and surface the same value, so a card is defined by its hairline edge alone (1.82:1 measured); you cannot be lighter than the lightest bone, and that is a real limit rather than an oversight.
>
> And a trap: **layer 0 must be painted inside the blur target, not only on its parent.** Android photographs the target's own drawing; where nothing paints, it photographs transparent and the glass averages it with black. With the mesh present this never surfaced because the mesh painted the whole canvas. Without it, the tab bar rendered `#CBC9C7` — a grey that is in no palette. Recorded in `src/design/README.md` as D-20.

---

## 2. Tokens

Every color, size, radius, and duration in the app comes from here. A literal hex anywhere else is a bug.

```ts
// src/design/tokens.ts
export const paperLight = {
  canvas:    '#FDF6F3',  // warm cream ground
  surface:   '#FFFBF9',  // opaque surface for numerals
  ink:       '#1A1420',  // violet near-black — the trace
  gridFine:  '#F6C9C0',  // 1 mm
  gridBold:  '#E88F84',  // 5 mm
  textHigh:  '#241A2B',
  textLow:   '#6E5D74',
} as const;

// Paper, darkened — not a monitor. Same chromatic family: plum ground,
// muted rose grid, light ink. Never phosphor green. See §12.8.
export const paperDark = {
  canvas:    '#171019',
  surface:   '#241A29',
  ink:       '#F4EAF2',  // the trace inverts with the theme
  gridFine:  '#5A3F4E',
  gridBold:  '#7C5462',
  textHigh:  '#F4EAF2',
  textLow:   '#B4A0B6',
} as const;

// RESERVED — defined but absent from the UI. See the amendment below.
export const monitor = {
  canvas:    '#07090C',
  surface:   '#11151B',
  textHigh:  '#E8EEF2',
  textLow:   '#7C8A96',
} as const;

export const aurora = {
  rose:      '#FF8FA3',
  salmon:    '#FFB49B',
  lilac:     '#C79BE8',  // the "T wave" — repolarization, calm
  mist:      '#F3E4F7',
} as const;

// Per-parameter trace colors. This is monitor convention, not decoration.
export const trace = {
  ecg:       '#3DF57E',  // phosphor green — ECG, always
  spo2:      '#34D5F5',  // cyan
  resp:      '#F5D93D',  // yellow
  abp:       '#FF5C7A',  // red-pink
} as const;

// RESERVED — see the hard rule below.
export const semantic = {
  alarmHigh:   '#FF2D3E',  // critical  — immediate response
  alarmMedium: '#FFC53D',  // warning   — prompt response
  alarmLow:    '#4CC9F0',  // advisory  — informational
  ok:          '#3DF57E',
} as const;

export const radius = { pill: 999, card: 28, tile: 20, chip: 12 } as const;
export const gap    = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const motion = { micro: 200, card: 350, screen: 500 } as const;
```

The semantic tier follows the IEC 60601-1-8 alarm priority hierarchy every patient monitor shares.

> **Hard rule.** `semantic.*` never appears as decoration, brand accent, pressed state, border, or illustration fill. A red "Save" button is an invented alarm. For decorative accents use `aurora.*` — chromatically adjacent, never saturated to alarm level.

> **Amendment 2026-07-29 — the identity is carmine, bone and plum.** This section previously derived everything from a warm-cream ground with a rose accent, and put the brand accent inside `aurora.*` — so `aurora.rose` was simultaneously the background haze and the fill of every control in the app. Two things were measured and both were bad. First, `aurora.rose` against `semantic.alarmHigh` is **1.70:1**: the only thing separating "brand button" from "critical alarm" was hue saturation, which is exactly the confusion §12 exists to prevent. Second, `surface` against `canvas` was **1.04:1**, meaning a card had no edge of its own — its shape was being drawn by whatever aurora blob happened to sit behind it.
>
> The palette now starts from three named values and derives the rest:
>
> ```ts
> export const identity = {
>   carmine: '#9E1B32',  // the brand. The heart is red; ECG paper is printed red
>   bone:    '#FCF8F4',  // warm white, never #FFFFFF — no paper is pure white
>   plum:    '#171019',  // structural: light-theme ink, dark-theme ground, both shadows
> } as const;
> ```
>
> Three consequences to carry forward. **`brand.*` is the accent, `aurora.*` is atmosphere and never leaves the canvas** — enforced by a static test, not by discipline. **The light canvas is darker than the light surface**, which is the physical relation (a sheet rests on something, and that something is in shadow) and the only way a card gets an edge without adding chrome; every opaque surface also carries a hairline `edge` token. **Deep carmine against alarm red is now 2.15:1 and, more importantly, far darker** — at a glance carmine reads as ink and alarm red reads as a warning light. The rest of that separation is size, and it is codified as §12.9. Recorded in `src/design/README.md` as D-18.

### One identity, two themes

**Paper is the identity of the app, not one option of two.** The subject is a cream sheet with a rose grid, photographed in daylight; the whole palette descends from it. Ship `paperLight` and `paperDark`, expose light / dark / system in Settings, and default from `useColorScheme()`.

`paperDark` is Paper darkened, never Monitor: same chromatic family, plum ground, muted rose grid, light ink. `monitor` and `trace` stay defined but **reserved** — they wake up the day the app handles a live signal, such as a wearable or real-time capture. That day phosphor green will be honest, because the signal will genuinely come from a sensor.

> **Amendment 2026-07-29.** This section previously shipped Paper and Monitor as two interchangeable modes. Monitor was designed for live telemetry, and this app does not do telemetry: it captures, digitizes and reviews. Keeping it as a user-facing mode also created a data-honesty problem, now codified in §12.8. Monitor is retained rather than deleted because it is well defined and will be wanted later. Recorded in `src/design/README.md` as D-8.

### Electrode colors

Only on the electrode-placement screen, and always beside the lead abbreviation — color alone is not enough, and the two standards conflict:

- **AHA** (US): RA white, LA black, RL green, LL red, V brown.
- **IEC** (international): RA red, LA yellow, RL black, LL green, V brown.

Let the user pick the standard. This is the one place in the app where red may not mean alarm, which is exactly why the label is mandatory.

---

## 3. Glass

```tsx
// src/design/Glass.tsx
import { BlurView } from 'expo-blur';
import { View, StyleSheet, Platform } from 'react-native';

export function GlassCard({ children, style }: Props) {
  const flat = useReducedTransparency();          // §7
  if (flat) return <View style={[s.base, s.flat, style]}>{children}</View>;

  return (
    <BlurView
      intensity={40}
      tint="light"
      blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      blurTarget={blurTarget}                 {/* Android only — see amendment */}
      style={[s.base, style]}
    >
      <View pointerEvents="none" style={s.tint} />
      <View pointerEvents="none" style={s.specular} />
      {children}
    </BlurView>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    overflow: 'hidden',                 // required or Android ignores the radius
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderCurve: 'continuous',          // iOS squircle; ignored elsewhere
    ...Platform.select({
      ios: {
        shadowColor: '#5A283C', shadowOpacity: 0.10,
        shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
    }),
  },
  tint:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.42)' },
  specular: { position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              backgroundColor: 'rgba(255,255,255,0.8)' },
  flat:     { backgroundColor: paper.canvas, borderColor: paper.gridBold },
});
```

> **Amendment 2026-07-29.** This sample previously passed `experimentalBlurMethod` and no target. On expo-blur 57 that prop is deprecated, and `dimezisBlurView` without a `blurTarget` **silently falls back to no blur at all** — the card still paints its tint, so the failure is invisible in a screenshot and only shows up in the console. Android now requires naming the view to blur: wrap the background layers in `<BlurTargetView ref={…}>` and hand that ref to every glass surface on the screen. Consequence worth knowing: Android glass blurs *the designated target*, not an arbitrary backdrop, so glass can only blur the background layer — never another card stacked under it. Implementation in `src/design/blurTarget.ts`.

> **Amendment 2026-07-29 — the blur target must contain the scrolling content, and the glass must sit above it.** The previous amendment fixed *how* to name a target. It did not say *what* to put in it, and the obvious reading — wrap the background layers — produces glass that technically blurs and visibly does nothing. Two failures were measured on device.
>
> First, **where the glass mounts decides whether it blurs at all.** The tab bar was mounted from the route group's `tabBar` prop, which puts it *above* the screen's background provider in the React tree, so the target resolved to `null` and expo-blur fell back to no blur — the silent failure of the amendment above, hit again from a different direction. Floating chrome is now mounted from inside the screen, through a `chrome` slot on `Background`, and reads the active route instead of receiving navigator props.
>
> Second, and more fundamental: **a target that holds only the background has nothing to show.** The background is a soft mesh that barely moves; blurring it is indistinguishable from tinting it. The target now holds the background layers *and* the content, and the glass is a sibling painted above that target. Content passes under the glass as you scroll, which is the only state in which the effect is legible at all — judge it on video, never on a still.
>
> The cost is real and it lands on contrast. What can pass under the glass is no longer a mesh; it is a full-width block of ink or carmine. Measured against that worst case, the `0.42` tint below left the tab-bar labels at **3.67:1**. Tints are now `0.55` light and `0.68` dark, which holds every composite above 4.5:1. So the floor below is amended: **the tint floor is a function of what the target contains.** If the target holds content, 0.30 is not enough — measure the worst block that can pass beneath and set the tint from that. Figures in §2 of `src/design/README.md`; recorded as D-18.

Non-negotiable parameters:

- **`intensity`:** 30–50 for cards, 55–75 for floating chrome. Above 80 it reads as milky plastic and costs real frames.
- **Tint opacity:** never below `0.30` behind text — and higher when the blur target contains content, per the amendment above. Glass at 10% is a legibility bug wearing an aesthetic costume.
- **`overflow: 'hidden'`** on every BlurView, or Android renders a square blur under your rounded card.
- **The tint `<View>` is not optional.** `BlurView` alone gives you no control over the composite the text sits on. The tint is what makes contrast predictable.
- **The specular line** simulates light from above. One light direction app-wide.
- **Shadows split by platform.** iOS `shadow*` and Android `elevation` are not the same primitive; declare both or the card floats on one OS and sits flat on the other.
- **Concentric radii:** an `r=28` card holding a child with 12px padding gives that child `r=16`.

### Budget

**Two BlurViews on screen, maximum.** The web guidance says three; Android's blur is heavier and this is a scrolling app. Never put a BlurView inside a list row — the tab bar and one hero card is the entire budget. If the history list drops frames, cut glass before you cut content.

---

## 4. The aurora — Skia radial mesh

A linear gradient reads as template instantly, and `expo-linear-gradient` cannot do radial. Use Skia.

```tsx
import { Canvas, Group, Paint, Blur, Rect, RadialGradient, vec }
  from '@shopify/react-native-skia';

export function Aurora({ w, h }: { w: number; h: number }) {
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group layer={<Paint><Blur blur={14} /></Paint>}>
        <Rect x={0} y={0} width={w} height={h} color={paper.canvas} />
        <Blob w={w} h={h} cx={0.18} cy={0.12} r={0.60} color={aurora.rose} />
        <Blob w={w} h={h} cx={0.82} cy={0.22} r={0.55} color={aurora.salmon} />
        <Blob w={w} h={h} cx={0.50} cy={0.88} r={0.70} color={aurora.lilac} />
        <Blob w={w} h={h} cx={0.92} cy={0.72} r={0.45} color={aurora.mist} />
      </Group>
    </Canvas>
  );
}

const Blob = ({ w, h, cx, cy, r, color }: BlobProps) => (
  <Rect x={0} y={0} width={w} height={h}>
    <RadialGradient
      c={vec(w * cx, h * cy)}
      r={w * r}
      colors={[color, `${color}00`]}   // 8-digit hex: opaque → fully transparent
    />
  </Rect>
);
```

Mesh rules:

- **Four or five blobs.** Fewer reads as a gradient; more turns to gray mud.
- **None centered, none the same size.** The irregularity is what makes it organic.
- **Two hue families max** (rose-salmon + lilac). A third kills the atmosphere.
- **The `Group layer` blur is what fuses the seams.** Without it you see banding rings between blobs. It must wrap the group — a `<Blur>` sibling does nothing.
- **Static, not animated.** A breathing background costs frames forever and earns nothing.
- In Monitor mode drop the blobs to 12–18% opacity over the near-black. Atmosphere, never competition for the phosphor trace.

*Optional:* `expo-mesh-gradient` wraps iOS 18's native `MeshGradient` and looks superb, but it's iOS-only. If you use it, keep the Skia version as the Android path — don't ship two different backgrounds by accident.

> **Amendment 2026-07-29 — the mesh was winning, and one blob has a job.** On a contact sheet of the twelve shipped screens the aurora was the strongest element on every one of them. It beat the content: the app read as a wallpaper with an interface stuck on top, and eleven of twelve screens were indistinguishable at thumbnail size. Atmosphere sits behind content or it is not atmosphere.
>
> Three changes. **Opacity drops in both themes**, not just the dark one — 0.42 light and 0.50 dark; the "in Monitor mode" carve-out below was the only attenuation the spec asked for, and light needed it more. **Three blobs, not four or five** — at 0.42 the fourth contributed nothing but murk, so the "four or five" floor above holds only at full strength. And **one blob is positioned deliberately, not organically**: the most saturated of the three is anchored in the band where the floating chrome sits, because per the §3 amendment the glass now blurs content and a blur over a flat region has nothing to show. Chromatic variation under the glass is a requirement, not a happy accident.
>
> Related, in §8: **the diffuse beat now takes a single theme-driven colour** instead of the salmon-rose-lilac gradient. That gradient was the same three colours as the aurora blobs directly behind it, so the signature element of the system was painted the colour of its own background and could not be seen. It is a shadow over bone and a glow over plum, so it always separates from what is beneath it. Recorded as D-18.

---

## 5. The three blurs

They are three different mechanisms. Conflating them is the most common failure.

| Blur | RN mechanism | Blurs | Where |
|---|---|---|---|
| **Backdrop** | `<BlurView>` | what's behind | glass cards, tab bar |
| **Element** | `<Image blurRadius>` / Skia `BlurMask` | the thing itself | anonymized avatars, ambient media, the signal bloom |
| **Structural** | Skia radial mesh | color, no object | the aurora |

Element blur has exactly three legitimate uses in a clinical app. Blur must mean something.

```tsx
// 1. Anonymization — the most honest use
<Image source={patient} blurRadius={12} />

// 2. Ambient media — scale up, or the blur eats the edges into a halo
<Image source={hero} blurRadius={20} style={{ transform: [{ scale: 1.06 }] }} />

// 3. Depth of field — 3–4 px max, beyond that it looks broken
<View style={{ opacity: 0.7 }}>{inactiveTile}</View>
```

`blurRadius` is a prop on RN's core `<Image>` and on `expo-image`, works on both platforms, and is far cheaper than routing an image through Skia. Use it.

Anonymization caveat: blur is a *visual* signal, not data privacy. Anonymize on the server.

**Never blur** a trace, a numeral, a lead label, an interval value, or an alarm state. Not at 1px, not "while loading." For loading, use an opaque skeleton.

---

## 6. Typography

Three roles, three faces. Never fewer than two. Load with `expo-font` and hold the splash until they're ready — no font flash.

```ts
export const type = {
  display: { fontFamily: 'BricolageGrotesque_800ExtraBold',
             fontSize: 44, lineHeight: 40, letterSpacing: -1.3 },
  h1:      { fontFamily: 'Inter_500Medium', fontSize: 24, lineHeight: 30 },
  body:    { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  vital:   { fontFamily: 'JetBrainsMono_500Medium',
             fontSize: 64, lineHeight: 64, letterSpacing: -1 },
  data:    { fontFamily: 'JetBrainsMono_400Regular', fontSize: 15, lineHeight: 20 },
} as const;
```

- **`lineHeight` is absolute px in RN.** The web spec's `0.92` multiplier on 44px becomes `40`. Compute, don't copy.
- **`letterSpacing` is px, not em.** `-0.03em` at 44px is `-1.3`.
- **Every clinical numeral uses `type.vital` or `type.data`** — a monospaced face. Not `fontVariant`. In a monospace, equal digit width is structural, so a heart rate going 78 → 81 doesn't make digits jump. That jitter is real noise on a screen glanced at from across a room.
- **Vital numerals break the scale on purpose** (56–96px). Their size *is* their hierarchy.
- **Never `allowFontScaling={false}`** on body text. If Dynamic Type breaks your layout, the layout is wrong.

> **Amendment 2026-07-29 — a face that nobody uses is dead weight, and this scale was almost entirely unused.** A per-screen audit of the twelve shipped screens found `display` on **1 of 12** (the splash, which lasts about 800 ms), `vital` on **0 of 12**, and `data` on **2 of 12** — where all three strings it rendered were *prose*: an email address, a role name, a language name. Meanwhile the actual figures, the six-digit verification code and the study identifier, were set in Inter. The scale existed; the rule "every clinical numeral is monospaced" was being applied exactly backwards, and ~980 KB of fonts shipped for it.
>
> Three rules replace the good intentions:
>
> - **Every main screen opens with a real display headline** — three or four words, and it is the only place the app raises its voice. A screen that starts in body copy reads as a form, not a product; that was the single strongest finding of the audit, visible at contact-sheet size across eleven of twelve screens.
> - **Monospace is figures and identifiers only, never prose.** Verification codes, study identifiers, timestamps, calibration values. If it is a sentence it is Inter, whatever it is about.
> - **A fourth role, `eyebrow`** — monospace, 11 px, uppercase, tracked +1.6 — exists because the instrument labels things that way (`II`, `aVR`, `V1`). It is only allowed when it carries information, such as a step counter or a record identifier. Repeating the screen's own name in it is decoration.
>
> All three are checked by a static test that fails if any role in `type` has zero consumers, so a face cannot quietly stop earning its kilobytes again. Recorded as D-18.

Display faces: Bricolage Grotesque 800, or Inter Display. Hero headline only, four words max, once per screen.

> **Amendment 2026-07-29.** This section previously specified Archivo Expanded 800. There is no `@expo-google-fonts/archivo-expanded` package, and `@expo-google-fonts/archivo` ships no Expanded instance, so the face was not installable in an Expo project. Bricolage Grotesque — already listed here as an accepted display face — is now the primary. Rationale and the discarded alternative are recorded in `src/design/README.md`.

**The bloom on a headline** (glow fusing type into the background) is a Skia text effect, not `textShadow` — RN's `textShadow*` is a hard drop shadow and looks wrong. If Skia text is too much work for the payoff, skip the bloom. Never put it on a clinical number: glow costs measurable contrast.

---

## 7. Accessibility — build it in, don't bolt it on

```ts
// src/design/a11y.ts
export function useReducedTransparency() {
  const [system, setSystem] = useState(false);
  const manual = useSettings(s => s.reduceTransparency);  // Settings switch
  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setSystem);
    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged', setSystem);
    return () => sub.remove();
  }, []);
  return system || manual;   // Android always reports false — the switch carries it
}
```

For motion, Reanimated ships `useReducedMotion()`. Use it; don't roll your own.

**Contrast without devtools.** You cannot sample a composite on device, so design so it cannot fail: every text run inside a glass card sits on the tint `<View>` at ≥0.30 opacity, and every clinical numeral sits on a fully opaque surface. Verify the fixed pairs (ink on tint, ink on canvas, white on each alarm color) once in a contrast checker and store the result in `src/design/README.md`. That's the audit trail your report needs.

Also non-negotiable:

- **Touch targets ≥ 44×44.** Used with gloves, in a hurry.
- **`accessibilityLabel` on every control**, `accessibilityRole` on every pressable.
- **Never color alone.** Every alarm carries icon + text + color. Roughly 8% of men have red-green deficiency, and red and green are the two poles of this system.
- **The Skia background gets `pointerEvents="none"` and `accessibilityElementsHidden`.** It's decoration; screen readers must not walk it.
- **Floating glass chrome respects `useSafeAreaInsets()`** — a tab bar that covers the home indicator isn't a design choice.

---

## 8. The signature element — the diffuse signal

This is what keeps the app from being "another dashboard with blur on it." The aurora supplies atmosphere; this supplies meaning. The patient's own trace, scaled up and blurred until it becomes ambience.

```tsx
import { Path, Skia, BlurMask, LinearGradient, vec } from '@shopify/react-native-skia';

const BEAT = Skia.Path.MakeFromSVGString(
  'M0,200 L180,200 L200,190 L220,210 L240,200 L300,200 ' +
  'L310,120 L325,300 L340,120 L360,200 L440,200 ' +
  'L470,160 L510,200 L1200,200'
)!;

<Path path={BEAT} style="stroke" strokeWidth={34} strokeCap="round" opacity={0.55}>
  <LinearGradient start={vec(0, 0)} end={vec(1200, 0)}
    colors={[aurora.salmon, aurora.rose, aurora.lilac]} />
  <BlurMask blur={48} style="normal" />
</Path>
```

That path is a real heartbeat: baseline, P wave (the small bump), QRS complex (the tall narrow spike), T wave (the broad closing curve). Anatomical honesty is the difference between designing *about* the subject and designing *from* it.

Build the `Skia.Path` once at module scope. Rebuilding it per render is the kind of waste that shows up as scroll jank later.

Place it on layer 2, inside the same background canvas, never behind critical numerals.

---

## 9. Rendering the real trace

The digitized signal is roughly 12 leads × 5000 samples. This is not the same object as the decorative bloom and must not be treated like one.

- **Skia, always.** SVG in RN cannot survive zoom and pan at this point count.
- **Decimate before drawing.** Draw at most ~2 points per horizontal pixel; more is invisible and costs frames.
- **Build the `SkPath` in a `useMemo`** keyed on the lead and the visible window — never inside the render body.
- **Gestures on the UI thread** via `react-native-gesture-handler` + Reanimated shared values. Never `setState` on pan.
- **The trace never sits on glass.** Opaque surface, always.
- **The measuring grid is real data.** If the user measures intervals against it, it must be calibrated: 1 mm = 0.04 s horizontally, 1 mm = 0.1 mV vertically, at 25 mm/s. The ambient grid of layer 3 is texture — deliberately unaligned, 4–8% opacity. Two different objects; don't let them share a component.
- **Gaps are meaningful.** A 3×4 printout only carries 2.5 s per grid lead, so the series has real holes. Break the path at gaps — never interpolate across them. A straight line through missing data is a lie about the patient.

---

## 10. Bento layout

RN has no CSS Grid. Compose with flexbox: a column of rows, each row a `flexDirection: 'row'` with `gap` and `flex` weights, tiles sized by `aspectRatio`.

```
┌───────────────┐   1. Exactly one hero module. In an ECG app it's
│  HERO  (2×1)  │      always the trace. ≥40% of usable height.
│   the trace   │   2. Three tile sizes max per screen.
├───────┬───────┤   3. One tile = one idea. No competing metrics.
│ 1×1   │ 1×1   │   4. Constant gap: 12 phone, 16 tablet. Never varies
├───────┼───────┤      inside one grid.
│ 1×2   │ 1×2   │   5. The trace tile is never glass.
└───────┴───────┘   6. Order by descending clinical urgency, not looks.
```

Use `gap` on the container (RN 0.71+) rather than margins on children — margins on the last child are the classic source of a lopsided grid.

---

## 11. Motion

```ts
import { withSpring, withTiming, Easing } from 'react-native-reanimated';

export const spring = { damping: 18, stiffness: 180, mass: 0.9 };
export const ease   = (d: number) =>
  withTiming(1, { duration: d, easing: Easing.bezier(0.32, 0.72, 0, 1) });
```

- **Durations:** 200ms micro-interaction, 350ms card transition, 500ms screen change.
- **Animate `transform` and `opacity` only.** Animating layout properties re-runs Yoga every frame.
- **One continuous animation in the whole app**, and it's the ECG sweep during live capture. Everything else responds to a gesture.
- **Alarms and results appear instantly.** An alarm that enters on a 400ms animation is an alarm that arrives late.
- **Every animation checks `useReducedMotion()`** and falls back to the end state, not to a shorter animation.
- Reanimated layout animations (`FadeIn`, `SlideInDown`) are fine for list items. `LayoutAnimation` from RN core is not — it fights Reanimated.

---

## 12. Clinical guardrails

These override every styling decision, including mine.

1. **No vital sign on glass.** HR, intervals, ST, SpO₂ → opaque surface.
2. **Alarms are not glass.** Fully opaque, dark ink text (`paper.ink`), solid border, no animation.

   > **Amendment 2026-07-29.** This rule previously specified *white* text. Measured against this palette, white fails §7's 4.5:1 minimum on every alarm colour — `alarmHigh` 3.69:1, `alarmMedium` 1.58:1, `alarmLow` 1.92:1, `ok` 1.44:1 — because all four are high-luminance. `paper.ink` passes on all four: 4.89, 11.42, 9.37 and 12.50 respectively. §7's contrast floor is a clinical guardrail and outranks a styling default, so the text colour changed rather than the palette. Full measurements in `src/design/README.md`.
3. **Never color alone** — icon + text + color, always.
4. **Never interpolate across missing samples.** Break the path.
5. **A measuring grid is calibrated or it doesn't exist.**
6. **Any data must stay legible with glass off.** If turning on reduced transparency costs the screen its hierarchy, the hierarchy was built on the effect and was built wrong.
7. **Interpretation output is a ranking, never a binary verdict**, until per-class thresholds are calibrated. And if the analysis used a rhythm-only pathway, the UI says plainly that it does not evaluate morphology or ischemia. Omitting that is misleading.
8. **Phosphor green never renders a signal digitized from paper.** A trace recovered from a printed ECG was drawn in black ink on a rose grid. Painting it `trace.ecg` dresses it as live telemetry and misrepresents where the data came from — the same class of lie this section exists to prevent. Use `paperLight.ink` or `paperDark.ink`, which invert with the theme. `trace.*` is reserved for a signal that genuinely arrives from a sensor. *(Added 2026-07-29 with the amendment in §2.)*
9. **Red is separated by size, not by shade.** The brand is carmine and the alarm hierarchy is red; on a screen that has both, hue alone cannot carry the difference. So the rule is geometric and runs both ways:

   - **Deep brand carmine fills large surfaces only** — the full-width primary action, the hero module, the identity. It never fills a small element that reads as *state*: not a selected option, not an active dot, not a switch track, not a selection border. State is carried by ink; an ink/ground inversion is unambiguous and spends nothing.
   - **Alarm red occupies small surfaces only**, always with an icon and text beside it, and is **never a large background**. A full-width alarm red turns the whole screen into the alarm.

   Both halves are enforced statically rather than by memory. `brand.carmine` is readable only from an enumerated list of large-surface modules; `semantic.*` only from an enumerated list, and where it does fill a background that style must also declare a bounded `width` or `height` from `size.*`. A static test cannot measure geometry — what it can do is make adding a module to either list a deliberate act, which is exactly the moment to ask whether the surface is really large. Tests in `src/design/palette.test.ts`; recorded as D-18. *(Added 2026-07-29.)*

---

## 13. Anti-patterns

| Don't | Why |
|---|---|
| `semantic.*` as a brand accent | Corrupts the alarm vocabulary |
| `<BlurView>` inside a `FlatList` row | Guaranteed scroll jank on Android |
| `expo-linear-gradient` for the background | Linear gradients read as template |
| A Skia `<Canvas>` per card | One canvas per screen — full stop |
| `intensity` above 80 | Milky plastic, and it costs frames |
| Rebuilding `SkPath` in render | Allocation per frame |
| `fontVariant: ['tabular-nums']` as the plan | Unreliable on Android; use a mono face |
| Glow or `textShadow` on the trace | All QRS morphology is diagnostic; glow fattens it |
| Phosphor green in Paper mode | Green belongs to the monitor; mixing breaks both codes |
| Heart emoji as iconography | Line icons from the instrument's vocabulary |
| A blur target that holds only the background | Blurring a soft static mesh is indistinguishable from tinting it |
| Floating chrome mounted above the screen's background provider | The target resolves to `null` and Android silently stops blurring |
| The same accent doing brand *and* atmosphere | The app ends up speaking with the voice of a decorative blob |
| `surface` within ~1.1:1 of `canvas` | The card has no edge; its shape gets drawn by whatever is behind it |
| A typographic role with zero consumers | Kilobytes in the bundle for nothing — a test should fail on it |
| Monospace on prose, proportional on figures | Backwards; the constant digit width is the whole point |
| A two-tier ambient grid | Reads as countable, and §12.5 says a measuring grid is calibrated or it doesn't exist |
| Judging glass from a screenshot | A still cannot distinguish a tint from a blur. Record the scroll |

---

## 14. Pre-merge checklist

- [ ] Zero color, size, radius, or duration literals outside `tokens.ts`
- [ ] At most two `<BlurView>` instances mounted per screen
- [ ] Every `<BlurView>` has `overflow: 'hidden'` and a tint layer ≥ 0.30
- [ ] One Skia `<Canvas>` per screen, `pointerEvents="none"`, hidden from a11y
- [ ] Every clinical numeral uses a monospaced face on an opaque surface
- [ ] `useReducedMotion()` and `useReducedTransparency()` actually branch behavior
- [ ] Android reduced-transparency reachable through the Settings switch
- [ ] Shadows declared for both iOS and Android
- [ ] Trace path memoized, decimated, and broken at gaps
- [ ] Exactly one hero module, and it's the trace
- [ ] `semantic.*` appears only in semantic states
- [ ] The §8 signature draws a real beat, with P, QRS, and T
- [ ] Scroll holds 60fps on a mid-range Android device
- [ ] Every main screen opens with a display headline (§6 amendment)
- [ ] Every figure and identifier is monospaced; no prose is (§6 amendment)
- [ ] Brand carmine fills only large surfaces; alarm red only small ones (§12.9)
- [ ] Every opaque surface has an edge of its own, measured against its ground
- [ ] The blur target contains the scrolling content, and the glass sits above it (§3 amendment)
- [ ] Glass tint measured against the worst block that can pass beneath it, not against the mesh
- [ ] Judged on video of a real scroll, in both themes — a still cannot tell tint from blur
- [ ] And the Chanel rule: take one accessory off before leaving the house

---

## Kickoff prompt

> Build `<screen>` with BioGlass RN. `<Paper|Monitor>` mode. Six layers per §1 in one Skia canvas. Hero = the ECG trace on an opaque surface. Bento with three tile sizes max. Glass only on chrome and one context card. `semantic.*` reserved for alarms. Tokens from `tokens.ts` — no literals. Monospaced numerals. Both accessibility hooks branching. Motion: transform and opacity only, reduced-motion respected.
