# Style Guide

This document describes the live styling system. If the code and this guide ever diverge, fix the code first and then update this file.

## Design direction

The site should feel like a quiet gallery space:

- warm neutral backgrounds instead of pure white
- restrained dark text instead of pure black
- editorial serif display type with sober sans-serif body copy
- motion that supports focus, not spectacle

## Core tokens

Defined in `css/tokens.css`.

### Color

- `--gallery-bg`
  Main page background.
- `--gallery-bg-soft`
  Soft top wash behind long-form sections.
- `--stage-bg`
  Warmer support tone for editorial sections.
- `--focus-bg`
  Dark overlay background for artwork inspection.
- `--wood-bg`
  Homepage carousel stage background.
- `--text`
  Primary copy color.
- `--text-muted`
  Secondary copy color.
- `--text-soft`
  Labels, metadata, and low-priority UI text.

### Layout

- `--container-pad`
  Global horizontal page padding.
- `--section-space`
  Default vertical section spacing.
- `--section-space-tight`
  Reduced spacing for denser sections.
- `--nav-height`
  Scroll padding anchor offset.

## Typography

- Display headings: `Cormorant Garamond`
- Body and UI copy: `Inter`

Rules:

- Keep serif display sizes large and airy.
- Do not use low opacity to hide readable body copy.
- Labels may be subtle, but not faint.
- Mobile text floors matter more than micro-elegance.

## Spacing

Prefer consistent section rhythm over per-component patching.

- Large sections should read as intentional blocks.
- Dense controls should use smaller internal spacing without collapsing outer breathing room.
- Avoid one-off `top: 93%` style placement logic. If a control needs that much coercion, the layout model is wrong.

## Motion

- Reveals are decorative only.
- Scroll remains native on every device.
- The intro may be cinematic, but it must not trap users for long.
- Overlay motion should be smooth and quiet, not springy or playful.

## Responsive rules

- Desktop and mobile should share the same hierarchy, not different improvisations.
- Mobile controls must remain readable with thumb-safe spacing.
- Large screens should not create dead voids that make sections feel unfinished.

## Review rules

When touching styles:

1. Edit the owning layer, not `responsive.css` first.
2. Add a responsive override only if the base layout is already sound.
3. Remove stale selectors instead of layering new overrides on top.
4. Re-check homepage, gallery, detail overlay, and mobile menu before finishing.
