---
name: Liquid Cobalt
colors:
  surface: '#131318'
  surface-dim: '#131318'
  surface-bright: '#39383e'
  surface-container-lowest: '#0e0e13'
  surface-container-low: '#1b1b20'
  surface-container: '#1f1f25'
  surface-container-high: '#2a292f'
  surface-container-highest: '#35343a'
  on-surface: '#e4e1e9'
  on-surface-variant: '#c1c6d4'
  inverse-surface: '#e4e1e9'
  inverse-on-surface: '#303036'
  outline: '#8b919e'
  outline-variant: '#414752'
  surface-tint: '#a5c8ff'
  primary: '#a5c8ff'
  on-primary: '#00315f'
  primary-container: '#1976d2'
  on-primary-container: '#fffdff'
  inverse-primary: '#005faf'
  secondary: '#bac3ff'
  on-secondary: '#15267b'
  secondary-container: '#2f3f92'
  on-secondary-container: '#a3b0ff'
  tertiary: '#ffb688'
  on-tertiary: '#512400'
  tertiary-container: '#ba5b00'
  on-tertiary-container: '#fffeff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a5c8ff'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#004786'
  secondary-fixed: '#dee0ff'
  secondary-fixed-dim: '#bac3ff'
  on-secondary-fixed: '#00105b'
  on-secondary-fixed-variant: '#2f3f92'
  tertiary-fixed: '#ffdbc7'
  tertiary-fixed-dim: '#ffb688'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#733600'
  background: '#131318'
  on-background: '#e4e1e9'
  surface-variant: '#35343a'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

This design system is built for a high-performance utility context, blending the precision of a professional manager with the immersive depth of an iOS-inspired aesthetic. The personality is sophisticated, technical, and fluid. 

The design style utilizes **Glassmorphism** as its core structural principle. By layering translucent surfaces over a deep, obsidian base, the UI establishes a clear sense of z-axis depth. High-contrast "electric" accents provide functional wayfinding, ensuring that the ethereal nature of the glass does not compromise task-oriented efficiency. The emotional response should be one of "command and control" within a premium, frictionless environment.

## Colors

The palette is anchored by a deep obsidian base (`#0A0A0F`) to maximize the luminescence of the glass effects. 

- **Primary:** An electric blue (`#1976D2`) used for critical actions, active states, and primary brand touchpoints.
- **Glass Surfaces:** Constructed using `rgba(255, 255, 255, 0.05)` with a `20px` backdrop blur. 
- **Borders:** Thin, subtle strokes of `rgba(255, 255, 255, 0.1)` define object boundaries without breaking the fluid visual flow.
- **Status Tones:** Success, Failed, Pending, and Received states utilize low-opacity fills (10-15%) paired with high-saturation borders and text to ensure legibility against dark backgrounds.

## Typography

This design system relies exclusively on **Inter** to maintain a systematic, neutral, and highly legible interface. 

Tight letter spacing is applied to larger headlines to mimic the density of modern editorial layouts. Body text maintains standard tracking to ensure readability in data-heavy management views. Labels utilize a slightly heavier weight and increased tracking for better scannability at small sizes. All type should be rendered with `-webkit-font-smoothing: antialiased` to maintain sharpness against the dark background.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a base-4 increment system. 

- **Desktop:** 12-column grid with 24px gutters.
- **Mobile:** Single column with 20px side margins and 16px vertical spacing between cards.

Components should favor dynamic padding to maintain the "liquid" feel. Spacing between related items (like labels and inputs) uses `8px` (sm), while spacing between distinct sections uses `32px` (xl). Horizontal alignment should prioritize a "flush" look with glass containers extending to the margins.

## Elevation & Depth

Depth is communicated through **Translucency and Blur** rather than traditional drop shadows.

- **Level 0 (Base):** Pure `#0A0A0F`.
- **Level 1 (Cards/Containers):** `rgba(255, 255, 255, 0.05)` fill, `20px` backdrop-filter blur.
- **Level 2 (Modals/Popovers):** `rgba(255, 255, 255, 0.08)` fill, `40px` backdrop-filter blur, with a subtle `0px 8px 32px rgba(0, 0, 0, 0.4)` shadow to separate from underlying glass layers.
- **Interactive States:** Hovering over a glass element should trigger a `0.3s ease` transition, increasing the border opacity to `rgba(255, 255, 255, 0.2)` and adding a subtle inner glow using the Primary color at 5% opacity.

## Shapes

The shape language is "Soft-Modern," using variable radii to distinguish between layout containers and interactive controls.

- **Large Containers:** Cards, modals, and main content areas use a `16px` radius to feel approachable and organic.
- **Interactive Controls:** Buttons and input fields use a slightly tighter `12px` radius, providing a distinct "clickable" silhouette.
- **Status Badges:** Small elements use a `6px` radius to maintain structural integrity at small scales.
- **Scrollbars:** Use a width of `6px`, a track color of `transparent`, and a thumb color of `rgba(255, 255, 255, 0.2)` with fully rounded ends.

## Components

### Buttons & Inputs
- **Primary Button:** Solid `#1976D2` fill with white text. On hover, apply a `box-shadow: 0 0 15px rgba(25, 118, 210, 0.4)`.
- **Input Fields:** Glass background with 12px radius. Active state changes border to Primary color.

### Chips & Badges
- **Status Badges:** Utilize a background color at 10% opacity of the status color (e.g., Green for success) and a 1px border at 30% opacity. Text matches the status color for maximum contrast.

### Cards
- **Liquid Card:** Background `rgba(255, 255, 255, 0.05)`, 16px radius, 1px border `rgba(255, 255, 255, 0.1)`. Ensure `backdrop-filter: blur(20px)` is applied to the container, not the content.

### Lists
- Items within a list are separated by a 1px line of `rgba(255, 255, 255, 0.05)`. Active or selected list items receive a subtle glass treatment higher in luminosity than the base card.

### Hover States
- All interactive glass elements must transition smoothly over `0.3s`. The effect should feel like the "glass is catching more light," achieved through slight increases in background opacity and border brightness.