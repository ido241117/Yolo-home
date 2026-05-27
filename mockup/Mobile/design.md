---
name: Smart Living Interface
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006e2f'
  on-secondary: '#ffffff'
  secondary-container: '#6bff8f'
  on-secondary-container: '#007432'
  tertiary: '#684000'
  on-tertiary: '#ffffff'
  tertiary-container: '#885500'
  on-tertiary-container: '#ffd4a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  sensor-value:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
---

## Brand & Style

The design system is centered on **Smart Hospitality and Intuitive Control**. It targets modern tenants and property managers who require a seamless, reliable connection to their living environment. 

The visual style is **Modern Corporate with a Friendly Minimalist edge**, heavily inspired by the ergonomics of Apple Home and Nest. It prioritizes clarity, soft tactile feedback, and high-readability. The interface should feel "invisible" until needed, evoking an emotional response of security, calm, and effortless control.

Key characteristics include:
- **High Legibility:** Generous whitespace and clear hierarchy.
- **State-Driven Visuals:** Clear distinction between active (ON) and inactive (OFF) states using color and depth.
- **Friendly Geometry:** Soft corners and fluid transitions to make technology feel approachable rather than industrial.

## Colors

The palette is anchored by a crisp, cool background to ensure UI elements appear lifted and distinct. 

- **Primary (Indigo):** Used for primary actions, active navigation states, and brand-heavy elements.
- **Success/ON (Green):** Specifically reserved for active IoT states (e.g., Lights ON, AC running). When a device is active, use the primary Green for the icon/text and the soft tint for the card background to create a "glowing" effect.
- **Warning & Danger:** Used sparingly for alerts (low battery, disconnected bridge) and critical security states (unlocked door warnings).
- **Neutral:** A range of slate grays is used for secondary text and inactive iconography to maintain a clean hierarchy.

## Typography

This design system utilizes **Inter** for its systematic and highly legible characteristics. The scale is built around a **15px base body size** to accommodate the density of IoT data while remaining accessible.

- **Display & Sensor Values:** Use the `sensor-value` and `display-lg` tokens for environmental data (temperature, humidity) to make them the focal point of cards.
- **Headlines:** Semi-bold weights are used to define room sections and category headers.
- **Labels:** Used for micro-copy like timestamps, battery percentages, and secondary status messages.

## Layout & Spacing

The system follows a **4px/8px modular scale**. 

- **Grid:** A fluid 2-column grid is used for sensor and device cards on mobile devices.
- **Margins:** A standard 20px horizontal margin is applied to the main container to prevent content from touching the screen edges.
- **Card Spacing:** Use 16px (md) gutters between cards in the 2-column grid.
- **Safe Areas:** Ensure the bottom tab bar respects the device's home indicator with a 32px bottom padding.

## Elevation & Depth

This design system uses **Tonal Layers** and **Ambient Shadows** to create a sense of physical space.

1.  **Base Layer:** `#F8FAFC` (Flat).
2.  **Card Layer:** White background with a soft, diffused shadow (`y: 4, blur: 12, color: rgba(0,0,0,0.05)`). This creates a "lifted" effect that feels tactile and clickable.
3.  **Active State:** When a card is "ON," the shadow may slightly increase in spread, or the background shifts to a subtle colored tint to indicate the device is drawing power or active.
4.  **Floating Elements:** Buttons like the "Unlock" action should have a more pronounced shadow to indicate they sit above the primary content grid.

## Shapes

The shape language is **Rounded**, conveying friendliness and modern tech aesthetics.

- **Device Cards:** Use `rounded-lg` (16px) for standard IoT control cards.
- **Action Buttons:** Large primary buttons use `rounded-xl` (24px) or full pill shapes to distinguish them from data-only containers.
- **Segmented Controls:** Inner selection pill should have 2px less radius than the container to maintain optical alignment.

## Components

### Device & Sensor Cards
- **Grid Layout:** 2-column for sensors. Display the large value (e.g., 72°) at the top, followed by the label (e.g., Temp) and a secondary status (e.g., "Normal").
- **Interactive State:** Cards should provide haptic feedback when tapped.

### Door Unlock Button (Momentary Action)
- **Visuals:** Large, high-contrast button (Indigo background). 
- **Interaction:** Requires a "press and hold" or a significant tap with a loading ring animation surrounding the icon to prevent accidental triggers.

### Toggle Switches
- **Scale:** Oversized compared to standard iOS toggles.
- **Color:** Transition from a neutral gray track to a vibrant Green (`#22C55E`) track when active.

### Status Pills
- Small, rounded-full containers used for "Battery Low," "Motion Detected," or "Offline."
- Use secondary colors for background (low opacity) and primary colors for text.

### Segmented Tabs
- Used for switching views (e.g., Day / Week / Month in energy tracking).
- Background should be a light gray (`#F1F5F9`) with a white sliding active state.

### Pulse Animation (Human Presence)
- When "Presence Detected" is active, the icon or a small dot next to the label should have a soft, expanding concentric ring animation (Green tint) to signify real-time monitoring.

### Navigation Bar
- **Icons:** Home, Face (Identity), Alerts, Profile.
- **Style:** Translucent background blur (glassmorphism) with 85% opacity to allow content to scroll behind it beautifully.