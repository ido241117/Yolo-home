---
name: Proton IoT Dashboard
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#b9c7e0'
  on-secondary: '#233144'
  secondary-container: '#3c4a5e'
  on-secondary-container: '#abb9d2'
  tertiary: '#ffb695'
  on-tertiary: '#571f00'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1'
    letterSpacing: '0'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  sidebar_width: 240px
  container_gutter: 24px
  card_padding: 16px
  stack_gap_sm: 8px
  stack_gap_md: 16px
  stack_gap_lg: 24px
---

## Brand & Style

The design system is engineered for high-density information management with a focus on clarity, precision, and a high-performance technical aesthetic. Drawing inspiration from industry-leading developer tools, it utilizes a **Modern Minimalist** approach with a "Dark Mode First" philosophy. 

The visual language communicates reliability and real-time responsiveness. It prioritizes functional efficiency over decorative elements, using subtle tonal shifts and crisp borders to define hierarchy. The emotional response is one of calm control—essential for managing physical hardware and residential logistics. Large amounts of white space (or "dark space") prevent cognitive overload, while vibrant status accents guide the user's attention to critical alerts and system states.

## Colors

This design system uses a deeply saturated palette optimized for low-light environments. The core foundation is built upon three layers of slate: the deep base, the elevated card surface, and the structural border. 

- **Primary (Indigo):** Used for primary actions, active navigation states, and focus indicators.
- **Semantic Accents:** Colors are strictly functional. Green (#22C55E) indicates active power or vacant availability; Amber (#F59E0B) flags maintenance or warnings; Red (#EF4444) signals critical alerts or danger; Blue (#3B82F6) denotes occupancy.
- **Contrast:** Text is rendered in varying shades of grey-white to maintain readability without causing eye strain. Primary headings use near-white, while secondary metadata uses muted slate tones.

## Typography

The design system relies exclusively on **Inter** to achieve a systematic, utilitarian feel. The scale is built around a **14px base (body-md)** to maximize information density while maintaining legibility. 

- **Headlines:** Use tighter letter spacing and heavier weights to create a distinct visual anchor for sections.
- **Labels:** Small, uppercase labels with slight letter spacing are used for metadata, sensor titles, and timestamps to differentiate them from interactive body text.
- **Monospaced Accents:** (Optional) For sensor readings or numerical data (e.g., power consumption), consider using a tabular-num feature setting to ensure vertical alignment in tables.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid model**. 

- **Sidebar:** A fixed 240px left sidebar contains the primary navigation. It uses a condensed vertical stack for icons and labels.
- **Content Area:** A fluid container that fills the remaining viewport. It utilizes a 12-column grid for dashboard widgets and sensor cards.
- **Grid & Gutters:** A standard 24px gutter is maintained between major components. Internal card spacing is set to 16px to maintain a compact, "pro" feel.
- **Responsive Reflow:** On tablet, the sidebar collapses to an icon-only rail (72px). On mobile, the sidebar moves to a bottom navigation bar or a hidden hamburger menu, and all grid columns stack vertically.

## Elevation & Depth

This design system avoids traditional shadows in favor of **Tonal Layering** and **Low-Contrast Outlines**. 

- **Level 0 (Base):** The #0F172A background represents the furthest backplane.
- **Level 1 (Cards/Containers):** Surfaces at #1E293B appear "lifted" not through shadows, but through color contrast against the base.
- **Borders:** Every interactive or containing element is defined by a 1px solid border (#334155). This creates a "blueprint" aesthetic that is synonymous with technical tools like Linear.
- **Hover States:** Elements elevate slightly on hover by lightening the background color (e.g., moving from #1E293B to #2D3A4F) or brightening the border color, rather than increasing shadow spread.

## Shapes

The shape language is **Soft and Precise**. A consistent corner radius of `0.25rem` (4px) is applied to all standard components like buttons, input fields, and small cards. 

Larger containers and dashboard widgets use `rounded-lg` (8px). This subtle rounding maintains the professional, architectural feel of the UI while removing the harshness of 0px corners. Pill shapes are reserved exclusively for status badges and device toggles to distinguish them from structural elements.

## Components

- **Buttons:** Primary buttons use a solid Indigo (#4F46E5) fill. Secondary buttons use a ghost style with a #334155 border and a subtle hover fill.
- **Room Status Badges:** Compact pill shapes with low-opacity backgrounds and high-contrast text. 
    - *Occupied:* Blue text on #3B82F6 (15% opacity).
    - *Vacant:* Green text on #22C55E (15% opacity).
    - *Maintenance:* Amber text on #F59E0B (15% opacity).
- **Device State Pills:** Small, high-contrast indicators. ON uses a solid Green (#22C55E) with white text. OFF uses a muted Slate (#475569) with white text.
- **Sensor Cards:** These cards feature a `label-md` header for the sensor type, a `headline-lg` for the primary value, and a `label-sm` footer for the "last updated" timestamp in a muted grey.
- **Tables:** Headers are sticky with a #1E293B background and a bottom border. Rows feature a subtle background transition on hover (#2D3A4F).
- **Input Fields:** Dark background (#0F172A) with a #334155 border. On focus, the border transitions to Indigo (#4F46E5) with a subtle outer glow.
- **Sidebar Nav:** Icons should be 20px, stroke-based (linear), with active states indicated by an Indigo vertical line on the far left and high-contrast text.