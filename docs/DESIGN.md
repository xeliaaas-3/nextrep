---
name: High-Velocity Athletic Utility
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#c4c9af'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#8e937b'
  outline-variant: '#444935'
  surface-tint: '#abd619'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c6f33c'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#b8c4ff'
  on-secondary: '#002585'
  secondary-container: '#0337b8'
  on-secondary-container: '#a0b1ff'
  tertiary: '#ffffff'
  on-tertiary: '#452b00'
  tertiary-container: '#ffddb4'
  on-tertiary-container: '#8b5a00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c6f33c'
  primary-fixed-dim: '#abd619'
  on-primary-fixed: '#161f00'
  on-primary-fixed-variant: '#3b4d00'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c4ff'
  on-secondary-fixed: '#001453'
  on-secondary-fixed-variant: '#0337b8'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#ffb955'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  metric-oversized:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  metric-oversized-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

The design system is engineered for elite lifters and disciplined athletes operating under extreme physical exertion. The target persona operates in dim gym lighting, with elevated heart rates, sensory fatigue, chalk-covered fingers, and limited attention spans between taxing sets. The interface prioritizes immediate comprehension and instantaneous execution over lifestyle fluff, social feeds, or superfluous gamification.

The aesthetic fuses **Technical Precision Minimalism** with **High-Contrast Performance Engineering**. It treats every screen not as a content stream, but as an aircraft cockpit or a high-end telemetry display. Structural surfaces are deep, light-absorbing carbon tones, allowing hyper-vibrant functional accents—predominantly Electric Lime—to command instant focus. Every layout adheres to strict ergonomic zones optimized for rapid, one-handed thumb entry while gripping equipment or recovering between sets.

## Colors

The palette is tuned exclusively for high-contrast visibility in variable gym illumination (direct harsh overhead spotlights or dim, subterranean weight rooms). Pure pitch carbon anchors the background to minimize screen glare and conserve battery during prolonged continuous-display sessions.

- **Background Canvas (`#090B0F`):** Deep carbon black. Forms the base for all mobile screens.
- **Surface Level 1 (`#12151B`):** Grouped workout modules, inactive cards, and list containers.
- **Surface Level 2 (`#191D25`):** Interactive inputs, active exercise cards, sheets, and elevated overlays.
- **Border Subtle (`rgba(255, 255, 255, 0.08)`): Crisp structural dividers and component edges; keeps elevation flat yet legible without relying on heavy blur.
- **Primary Electric Lime (`#C7F43D`):** Primary actions, active timers, completed set validation, and focal data metrics.
- **Secondary Electric Blue (`#5C7CFA`):** Analytical trends, progression history, RPE values, and informational metrics.
- **Warm White (`#F5F7FA`):** Primary text and oversized numerical metrics.
- **Slate Grey (`#9298A5`):** Secondary meta-labels, unit indicators (KG/LBS), and inactive placeholders.
- **System Accents:** Success Green (`#43D17A`), Warning Orange (`#FFB547`), Error Coral (`#FF646C`). Used strictly for telemetry, threshold validation, and target warnings.

## Typography

Typography prioritizes glanceability at arm’s length. Primary workout figures—such as active weight, target reps, and rest timers—must be scannable while the device rests on the floor or a bench.

- **Space Grotesk** serves as the headline and data metric face. Its structural geometry, tabular-friendly glyphs, and sharp architectural apexes give numerical outputs a decisive, instrument-grade authority.
- **Geist** provides an uncompromised, hyper-legible body and utility tier. Its neutral, clean shapes guarantee zero cognitive lag when scanning exercise titles, historical notes, and plate tallies.
- **Metric Formatting Rules:** All numerical counters, clocks, weights, and rep trackers must enforce `font-variant-numeric: tabular-nums` to eliminate jitter when digits increment or countdown timers run.
- **Meta Hierarchy:** Small labels (e.g., "SET", "PREV", "KG", "RPE") utilize `label-caps` styled with uppercase transformation and tracking to guarantee legible contrast against data values.

## Layout & Spacing

The layout is built mobile-first with an uncompromising thumb-reach architecture. Key controls cluster strictly within the lower 40% of the viewport to facilitate continuous one-handed operation.

- **Viewport Constraints:** On screens wider than 480px, the active mobile tracker constrains to a centralized 440px utility column to maintain identical physical reach ratios across tablets or desktop logs.
- **Touch-First Guardrails:** All actionable touch points—including checkmarks, step increments, and modal dismissals—enforce a strict minimum physical touch target of **48x48px**, even if the visual element itself is more compact.
- **Stacking Spacing:** Set rows within workout cards use dense `space-sm` vertical spacing to maximize screen efficiency, while logical sections (e.g., between different exercises or circuit blocks) use `space-xl` to prevent mis-taps under fatigue.
- **Fixed System Zones:** The viewport reserves a persistent 56px bottom navigation anchor, floating safe-area padded primary action buttons directly above it.

## Elevation & Depth

Visual hierarchy rejects fuzzy drop shadows and glossy skeuomorphic gradients in favor of sharp **Tonal Layering** paired with **Low-Contrast Micro-Borders**. Gym environments degrade shadow perception; contrast must stem from distinct planar shifts.

- **Level 0 (Canvas Base):** Solid `#090B0F`. Non-interactive background substrate.
- **Level 1 (Card & Module Shells):** Solid `#12151B` enveloped in a continuous `1px solid rgba(255, 255, 255, 0.08)` boundary. No box-shadow.
- **Level 2 (Active/Interactive Containers):** Solid `#191D25` bordered by `1px solid rgba(255, 255, 255, 0.14)`. Used for active set logging rows and expanded inputs.
- **Level 3 (Modals, Action Sheets, and Snackbars):** Solid `#191D25` elevated with a hard technical shadow: `0 8px 24px rgba(0, 0, 0, 0.6)`. Borders step up to `1px solid rgba(255, 255, 255, 0.20)`.
- **Active Set Glow State:** The single currently active set card adopts a hairline border tinted with Electric Lime at 40% opacity (`rgba(199, 244, 61, 0.40)`) and a subtle 12px perimeter glow (`0 0 12px rgba(199, 244, 61, 0.15)`), identifying the live entry zone immediately.

## Shapes

The design system implements a soft, engineered geometry (`roundedness: 1`). Radii stay tight and disciplined (4px base, 8px on cards and buttons) to evoke precision machinery, ballistic gear, and digital instrumentation rather than consumer toy aesthetics.

- **Base Radius (`0.25rem` / 4px):** Stepper buttons, chips, table cell selectors, inline tags.
- **Card & Primary Controls (`0.5rem` / 8px):** Exercise module cards, bottom sheets, main CTA buttons, dynamic dialogs.
- **Full Radius (Pill):** Reserved exclusively for dynamic status pips, rest timer progress tracks, and the offline indicator badge.

## Components

### Buttons
- **Primary ("Log Set", "Finish Workout"):** Solid Electric Lime (`#C7F43D`) fill with pitch carbon text (`#090B0F`), 48px minimum height, weight 700. Instant press state: scale down to 0.98 with an immediate background shift to `#b3de2c`.
- **Secondary / Action ("Add Exercise"):** Surface `#191D25`, `1px solid rgba(255,255,255,0.12)`, Warm White text (`#F5F7FA`). Press state shifts to `rgba(255,255,255,0.06)`.
- **Destructive / Discard:** Surface transparent, text `#FF646C`, border `1px solid rgba(255, 100, 108, 0.2)`. Active state triggers `#FF646C` fill with `#090B0F` text.

### Set Logging Rows & Input Fields
- **Set Row Architecture:** Compact tabular grid consisting of Set Index, Previous Performance reference, Weight Input, Reps Input, and the Validation Check Trigger.
- **Input Fields:** Numerical fields appear as raised `#191D25` blocks with internal `10px 12px` padding. Text is oversized (`headline-sm`), centered, utilizing tabular figures.
- **Steppers:** Flanking `-` and `+` adjustment nodes with distinct 48x48px hit areas for rapid incrementation without opening the software keyboard.
- **Completion Checkbox:** A massive 48x48px target zone housing a 28x28px box. Unchecked: `2px solid rgba(255, 255, 255, 0.16)`. Checked: Solid `#C7F43D` fill with an inset `#090B0F` checkmark icon.

### Exercise Cards
- Stacked modular units on Surface Level 1 (`#12151B`). Header contains exercise title, equipment tag, and quick-overflow actions. Body contains the set table with high-contrast column headers (`label-caps`).
- Top-level status styling flags completed exercises with a subtle left accent edge (`3px solid #43D17A`).

### Rest Timer Bar
- Persistent bottom dock anchored directly above global navigation. Background `#12151B` with an Electric Lime hairline top border. Houses oversized countdown numerals (`metric-oversized-mobile`), inline `+30s` jump buttons, and a continuous horizontal countdown fill line.

### System Indicators & Offline Badging
- **Network Status Pip:** Discrete top-header pill with a pulsing dot indicator (Solid `#43D17A` for synchronized; solid `#FFB547` for offline cache mode).
- **RPE / Intensity Selector:** Segmented horizontal selector bar spanning values 6 through 10, utilizing Secondary Electric Blue (`#5C7CFA`) for selected state confirmation.