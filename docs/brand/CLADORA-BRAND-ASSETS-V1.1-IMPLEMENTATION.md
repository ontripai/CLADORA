# CLADORA Brand Asset Implementation

## Official construction

The architectural symbol is the initial **C**. The letters after it are **LADORA**. Never add another typographic C before LADORA.

## Website

- Desktop header: use `web/cladora-logo-primary.svg`, rendered 36–42 px high.
- Mobile header: use the same asset at 28–32 px high.
- Dark navigation: use `web/cladora-logo-reverse.svg`.
- Favicon: use `web/favicon.ico` or the PNG favicon sizes.
- Do not rasterize SVG assets in the application source.

Example:

```tsx
<img
  src="/brand/cladora-logo-primary.svg"
  alt="CLADORA"
  width={200}
  height={40}
  className="h-10 w-auto"
/>
```

## Application

- App-store master: `app/cladora-app-icon-1024.png`.
- PWA: use 192 px and 512 px assets.
- Apple touch icon: use 180 px.
- Compact sidebar and avatar: use `web/cladora-symbol.svg`.

## Clear space

Keep clear space around the horizontal logo equal to at least one-quarter of the symbol height. Do not place the logo against visually busy imagery.

## Minimum size

- Horizontal logo: minimum 120 px wide in digital use.
- Standalone symbol: minimum 24 px.
- Below 24 px, use the dedicated favicon PNG rather than the full wordmark.

## Prohibited treatments

- No additional C before LADORA
- No gradients, glow, bevel, shadow, or 3D effect
- No recoloring outside the approved palette
- No distortion, rotation, or changes to internal geometry
- No low-contrast placement
