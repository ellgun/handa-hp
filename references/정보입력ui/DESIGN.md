---
name: Vivid Clarity
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#464652'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#777683'
  outline-variant: '#c7c5d4'
  surface-tint: '#5053b4'
  primary: '#040061'
  on-primary: '#ffffff'
  primary-container: '#1a1a80'
  on-primary-container: '#868aee'
  inverse-primary: '#c0c1ff'
  secondary: '#a33e00'
  on-secondary: '#ffffff'
  secondary-container: '#fe6500'
  on-secondary-container: '#541d00'
  tertiary: '#15181b'
  on-tertiary: '#ffffff'
  tertiary-container: '#292d2f'
  on-tertiary-container: '#919497'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#05006c'
  on-primary-fixed-variant: '#383a9b'
  secondary-fixed: '#ffdbcd'
  secondary-fixed-dim: '#ffb596'
  on-secondary-fixed: '#360f00'
  on-secondary-fixed-variant: '#7c2e00'
  tertiary-fixed: '#e0e3e6'
  tertiary-fixed-dim: '#c4c7ca'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#44474a'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  label-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 40px
---

## Brand & Style
The design system prioritizes absolute legibility and friendly authority to serve 40-60s small business owners. The personality is "The Dependable Expert"—combining a playful "Pop" aesthetic with high-contrast, professional structure.

The visual style is a hybrid of **High-Contrast Bold** and **Modern Corporate**. It utilizes large-scale interface elements to reduce cognitive load and accidental taps. The emotional response is one of confidence and ease; the UI feels like a high-quality physical tool rather than a complex software suite. 

Key attributes:
- **Vivid & Bold:** No muted tones; colors are purposeful and energetic.
- **Approachable:** Generous rounded corners and thick stroke weights.
- **Hyper-Legible:** Large font sizes and high-contrast ratios (WCAG AAA focused).

## Colors
The palette is built for maximum distinction. 

- **Primary (Deep Navy):** Used for primary text, iconography, and structural headers. It provides the "Expert" foundation.
- **Secondary (Vibrant Orange):** The "Pop" color. Reserved strictly for calls-to-action, status indicators, and active highlights.
- **Surface:** A crisp white background with ultra-light gray (#F2F4F7) for secondary containers to maintain a clean, organized layout.
- **Success/Error:** Use a vibrant emerald green and a bold crimson, maintaining the same saturation levels as the primary orange.

## Typography
We use **Be Vietnam Pro** for its contemporary, open apertures and high x-height, which significantly improves readability for aging eyes. 

- **Sizing:** Minimum body size is 18px. Avoid sizes below 16px.
- **Weight:** Use Bold (700) or ExtraBold (800) for all headings to create a clear information hierarchy.
- **Contrast:** Ensure all text on white backgrounds remains Deep Navy (#1A1A80) or pure Black (#111111) for maximum clarity.

## Layout & Spacing
The layout follows a **Fluid Grid** model with high internal padding to prevent "crowded" interfaces.

- **Touch Targets:** All interactive elements (buttons, inputs) must have a minimum height of 56px to accommodate varied motor skills.
- **Mobile:** 1-column layout with 24px side margins. 
- **Desktop:** 12-column grid, centered with a max-width of 1200px.
- **Rhythm:** Use an 8px base unit. Vertical spacing between different sections should be generous (40px+) to clearly delineate tasks.

## Elevation & Depth
This design system avoids complex shadows in favor of **Tonal Layers** and **Bold Outlines**. 

- **Depth:** Surfaces use a 1px solid border (#E5E7EB) or a very subtle, large-radius ambient shadow (0px 10px 30px rgba(26, 26, 128, 0.05)) to suggest elevation without creating visual "mud."
- **Interaction:** On tap/click, elements should visually depress (scale 0.98) or change background color to a slightly darker tint to provide immediate tactile feedback.

## Shapes
We use **Rounded (2)** logic but push towards `rounded-2xl` (1.5rem / 24px) for primary containers and buttons.

- **Cards:** Use 24px corners to feel friendly and modern.
- **Form Inputs:** Use 16px corners to balance between "expert tool" and "approachable service."
- **Icons:** Use thick, rounded line caps (2px minimum stroke width) to match the typography weight.

## Components
- **Buttons:** Primary buttons use a Vibrant Orange background with White text. Secondary buttons use a Deep Navy outline (2px) with Navy text. Height is fixed at 56px or 64px.
- **Inputs:** Large text (20px), thick borders (2px), and clear floating labels. Ensure the "Active" state uses the Vibrant Orange border.
- **Cards:** White background with a subtle Deep Navy border (1px, 10% opacity). Cards should have high internal padding (24px).
- **Chips/Badges:** Use high-saturation backgrounds with white text for status (e.g., "In Progress" in Navy, "Action Required" in Orange).
- **Iconography:** Playful, "thick-line" icons. Use Orange for emphasis icons (diagnostics/tools) and Navy for utility icons (navigation/settings).
- **Progress Bars:** Thick (12px), using the Orange for the "fill" to clearly show completion status.