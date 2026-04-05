# Style Guide — Eckhard Besuden

> Aktuelle Referenz: `css/style.css`. Bei Widerspruch gilt immer der Live-Code.

## Farbsystem (3-Tier Museum Architecture)

| Tier | Variable | Hex | Verwendung |
|------|----------|-----|------------|
| Gallery Light | `--gallery-bg` | #F3F0EA | Seiten-Hintergrund, Navigation, About |
| Artwork Stage | `--stage-bg` | #E8DDC9 | Gallery-Section (warmes Parchment) |
| Focus View | `--focus-bg` | #2B2925 | Detail-Panel, Fullscreen |

### Text

| Variable | Hex | Kontrast auf --gallery-bg |
|----------|-----|--------------------------|
| `--text` | #1F1E1B | 16.1:1 (AAA) |
| `--text-muted` | #635F5D | 5.2:1 (AA) |

### Akzente

| Variable | Hex | Verwendung |
|----------|-----|------------|
| `--silver` | #BFBAB8 | Subtile Borders, Separatoren |
| `--charcoal` | #403E3D | Hover, Active States |
| `--ink` | #0D0D0D | Starke Betonung (Skip-Link, Scroll-Progress) |

### Borders

| Variable | Wert |
|----------|------|
| `--border` | rgba(31,30,27,0.08) |
| `--border-strong` | rgba(31,30,27,0.15) |

## Typografie

| Element | Font | Size | Weight | Letter-Spacing |
|---------|------|------|--------|----------------|
| Hero-Titel | Cormorant Garamond | clamp(3rem, 7vw, 6rem) | 300 | 0.18em |
| Section-Titel | Cormorant Garamond | clamp(2rem, 4vw, 3.5rem) | 300 | 0.06em |
| Body | Inter | 1rem (16px) | 400 | 0.01em |
| Nav-Links | Inter | 0.85rem | 400 | 0.15em |
| Captions/Labels | Inter | 0.7rem | 400 | 0.1em |
| Detail-Labels | Inter | 0.65rem | 400 | 0.12em |

### Line-Heights

| Kontext | Wert |
|---------|------|
| Headings | 1.2 |
| Body | 1.7 |
| Captions | 1.5 |

## Spacing

Alle Abstande basieren auf einer 8er-Skala in rem:
`0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3` rem

| Kontext | Wert |
|---------|------|
| Section-Padding | clamp(80px, 12vw, 160px) |
| Container max-width | 1200px |
| Container-Padding | clamp(24px, 5vw, 80px) |
| Grid-Gap (Editorial) | clamp(40px, 6vw, 80px) |
| Gallery-Gap | 0.5rem |
| Button-Padding | 0.75rem 1.75rem |

## Motion

| Kategorie | Duration | Verwendung |
|-----------|----------|------------|
| Fast | 0.3s | Hover-Feedback, kleine Transitions |
| Standard | 0.4s | Button-Hovers, Filter |
| Medium | 0.5s | Nav, Menu, Gallery-Reveals |
| Slow | 0.8s | Detail-Panel, Section-Reveals |
| Very Slow | 1.2s | Clip-Path Reveals, Divider-Draw |

Easing: `ease` fuer Hover, `power2.out` fuer Reveals, `power3.inOut` fuer Fly-Transitions.

## Z-Index Hierarchie

| Layer | z-index | Element |
|-------|---------|---------|
| Skip-Link | 10000 | Accessibility |
| Loader | 9999 | Preloader-Overlay |
| Scroll-Progress | 1002 | Top-Bar (ueber Nav) |
| Grain | 50 | Textur-Overlay (unter allem UI) |
| Fullscreen | 8000 | Bild-Vollansicht |
| Bid-Modal | 7000 | Gebot-Dialog |
| Flip-Clone | 6500 | FLIP-Animation |
| Detail-Panel | 6000 | Werk-Details |
| Modal | 5000 | Datenschutz/Impressum |
| Hamburger | 1001 | Menu-Toggle |
| Nav | 1000 | Navigation |
| Mobile-Menu | 999 | Mobiles Menu |
| Back-to-Top | 900 | Scroll-Button |

## Breakpoints (Desktop-First)

| Breakpoint | Ziel |
|------------|------|
| Base | Desktop (1440px+) |
| max-width: 1024px | Tablet |
| max-width: 768px | Tablet Portrait / Landscape Phone |
| max-width: 480px | Smartphone |
| max-height: 500px + landscape | Landscape Mobile |
| prefers-reduced-motion | Accessibility |
| print | Druckversion |
