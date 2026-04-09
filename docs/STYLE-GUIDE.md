# Style Guide

## Design direction

Quiet gallery space. Warm neutrals inspired by museum exhibition standards (Tate white-cube logic, Getty neutral viewing environment). Never pure white, never aggressive brightness.

## Color tokens (`:root` in base.css)

| Token          | Value                      | Use                              |
|---------------|----------------------------|----------------------------------|
| `--gallery-bg` | `#F3F0EA`                  | General page background          |
| `--stage-bg`   | `#E8DDC9`                  | Museum wall behind paintings     |
| `--focus-bg`   | `#2B2925`                  | Dark stage for single works      |
| `--text`       | `#1F1E1B`                  | Primary text (warm near-black)   |
| `--text-muted` | `#635F5D`                  | Secondary text (4.5:1 on gallery-bg) |
| `--silver`     | `#BFBAB8`                  | Borders, separators              |
| `--charcoal`   | `#403E3D`                  | Hover/active states              |
| `--ink`        | `#0D0D0D`                  | Strong emphasis                  |
| `--wood-bg`    | `#2d160f`                  | Carousel museum wall             |

**Cream series** (carousel warm text): `--cream` through `--cream-04` at opacity stops 100/95/92/75/70/65/50/30/4.

**White series** (dark backgrounds): `--white-90` through `--white-10` at opacity stops 90/70/60/55/40/25/12/10.

## Motion tokens

| Token              | Value   |
|-------------------|---------|
| `--duration-fast`  | 0.15s   |
| `--duration-base`  | 0.3s    |
| `--duration-slow`  | 0.5s    |
| `--duration-reveal` | 0.8s   |
| `--ease-standard`  | `cubic-bezier(0.25, 0.1, 0.25, 1)` |

## Z-index scale

`--z-grain` (50) through `--z-skip-link` (10000):

grain 50, back-to-top 900, mobile-menu 999, nav 1000, hamburger 1001, progress 1002, modal 5000, detail 6000, flip-clone 6500, bid-modal 7000, fullscreen 8000, loader 9999, skip-link 10000.

## Typography

- **Display**: Cormorant Garamond, weights 300 and 400
- **Body**: Inter, weights 300 and 400
- Fonts self-hosted in `assets/fonts/` (woff2 + ttf)

## Spacing

Fluid scaling via `clamp()` throughout. No fixed spacing scale.
