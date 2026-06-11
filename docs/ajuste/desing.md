---
name: Kinetic Analytics
colors:
  surface: "#f7f9fb"
  surface-dim: "#d8dadc"
  surface-bright: "#f7f9fb"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f2f4f6"
  surface-container: "#eceef0"
  surface-container-high: "#e6e8ea"
  surface-container-highest: "#e0e3e5"
  on-surface: "#191c1e"
  on-surface-variant: "#414754"
  inverse-surface: "#2d3133"
  inverse-on-surface: "#eff1f3"
  outline: "#717786"
  outline-variant: "#c1c6d7"
  surface-tint: "#005bc0"
  primary: "#0059bb"
  on-primary: "#ffffff"
  primary-container: "#0070ea"
  on-primary-container: "#fefcff"
  inverse-primary: "#adc7ff"
  secondary: "#006875"
  on-secondary: "#ffffff"
  secondary-container: "#00e3fd"
  on-secondary-container: "#00616d"
  tertiary: "#4f5c76"
  on-tertiary: "#ffffff"
  tertiary-container: "#67758f"
  on-tertiary-container: "#fefcff"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#d8e2ff"
  primary-fixed-dim: "#adc7ff"
  on-primary-fixed: "#001a41"
  on-primary-fixed-variant: "#004493"
  secondary-fixed: "#9cf0ff"
  secondary-fixed-dim: "#00daf3"
  on-secondary-fixed: "#001f24"
  on-secondary-fixed-variant: "#004f58"
  tertiary-fixed: "#d6e3ff"
  tertiary-fixed-dim: "#b9c7e4"
  on-tertiary-fixed: "#0d1c32"
  on-tertiary-fixed-variant: "#39475f"
  background: "#f7f9fb"
  on-background: "#191c1e"
  surface-variant: "#e0e3e5"
typography:
  display-metrics:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: "700"
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: "600"
    lineHeight: 12px
    letterSpacing: 0.05em
  data-table:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: "500"
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 12px
  margin: 20px
---

## Brand & Style

The design system is engineered for high-performance data environments where speed of insight is paramount. The brand personality is **Energetic, High-Tech, and Data-Driven**, balancing the intensity of a command center with the clarity of professional enterprise software.

The visual style is **Corporate Modern with a Tech-Infused Edge**. It utilizes a "Dark Mode First" logic even in light layouts, using deep navy accents to anchor vibrant electric blues. The interface feels "charged"—utilizing subtle glows and high-contrast data points to draw the eye toward critical metrics. The aesthetic is clean and systematic, avoiding decorative elements in favor of functional, high-density information architecture.

## Colors

This color palette is designed to maximize the "pop" of data visualizations against a sterile, professional background.

- **Primary (Electric Blue):** The core action color. Used for primary buttons, active states, and the main data series.
- **Secondary (Cyan):** Used for secondary data series or to indicate "success" and "online" statuses.
- **Tertiary (Deep Navy):** Provides the "High-Tech" foundation. Used for sidebars, headers, and heavy text to create contrast.
- **Highlight (Neon Blue):** A vibrant variant used sparingly for callouts, hover states, or critical "Pulse" metrics.
- **Neutrals:** A range of cool grays (`#F8FAFC` to `#E2E8F0`) ensures the dashboard remains legible and reduces eye strain during long analytical sessions.

## Typography

The typography system prioritizes legibility in high-density layouts. **Inter** is the primary workhorse, chosen for its exceptional readability at small sizes and its neutral, professional tone.

**JetBrains Mono** is introduced as a secondary label font for technical metadata and axis titles, reinforcing the "high-tech" and "developer-grade" nature of the data.

For Power BI "Big Number" (KPI) cards, use the `display-metrics` style with a slightly tighter letter-spacing to give the numbers a cohesive, impactful appearance. Headers should always use a semi-bold weight to maintain hierarchy against dense data tables.

## Layout & Spacing

The layout follows a **Rigid Grid System** designed for maximum information density without visual clutter.

- **The 4px Base:** All spacing must be a multiple of 4. This creates a tight, "instrument-panel" feel.
- **Grid Structure:** Use a 12-column fluid grid for the main dashboard body.
- **Card Containers:** Individual charts should be housed in containers with `md` (16px) internal padding and `gutter` (12px) separation.
- **Density:** To accommodate large datasets, vertical padding in tables and lists should be reduced to `sm` (8px).
- **Responsiveness:** On smaller screens (Tablets), the 12-column grid should collapse to a 6-column grid, and `display-metrics` should scale down to 28px.

## Elevation & Depth

This design system avoids traditional heavy shadows in favor of **Tonal Layering and Low-Contrast Outlines**.

1.  **Background:** The lowest layer is the page background (`#F8FAFC`).
2.  **Surface:** Cards and containers use a pure white background with a subtle 1px border (`#E2E8F0`).
3.  **Active Depth:** Instead of a shadow, an active card or a hovered element should receive a 1px border in `primary_color_hex` or a very soft, diffused blue outer glow (`0px 4px 12px rgba(0, 123, 255, 0.1)`).
4.  **Information Hierarchy:** Use the Deep Navy (`#0A192F`) for global navigation or sidebar elements to create a clear structural "anchor" that sits visually behind or to the side of the data layer.

## Shapes

The shape language is **Soft yet Precise**.

A `0.25rem` (4px) corner radius is the standard for cards, input fields, and buttons. This small radius maintains a professional, "engineered" look while feeling more modern than sharp 90-degree corners.

- **Data Points:** Markers in line charts and scatter plots should be circular.
- **Status Indicators:** Use small circular "pills" for status tags to provide a visual break from the predominantly rectangular grid.

## Components

- **KPI Cards:** Large numeric value in `display-metrics` (Primary Blue), with a small trend indicator (Cyan for up, Slate for neutral) and a `label-caps` category title.
- **Buttons:** Primary buttons are solid `primary_color_hex` with white text. Secondary buttons are "Ghost" style: 1px border of `primary_color_hex` with blue text.
- **Data Tables:** Headers should be Deep Navy with white `body-sm` bold text. Alternate row striping is not required; instead, use thin horizontal dividers (`#F1F5F9`).
- **Charts:** Use a categorical palette starting with Electric Blue, then Cyan, then Deep Navy, then Slate Blue. Avoid using "Red" for anything other than actual negative financial performance or critical errors.
- **Input Fields:** Search bars and slicers should use a light gray background (`#F1F5F9`) with a 4px corner radius and a `primary_color_hex` focus border.
- **Slicers:** Power BI slicers should be styled as "Tiles" for a more app-like feel, using the Primary Blue for selected states.
