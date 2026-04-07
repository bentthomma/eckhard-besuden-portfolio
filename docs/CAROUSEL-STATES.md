# Carousel Animation States

## Overview

The homepage carousel (`home-carousel.js`) shows paintings on a gallery wood wall with physical fly-in/fly-out animations.

## Animation Phases

### Entry (first painting appears)
1. Image starts off-screen right (200vw+), scale 1.1, rotation 0.7deg
2. Flies in over 1.6s (power3.out) — decelerates like being carried
3. Shadow transitions: flying → lifted → resting
4. Lands on wall: scale settles to 1.0, rotation to 0 (0.8s, power2.inOut)

### Transition (next/prev painting)
1. **Lift-off** (0-1.0s): Current painting scales to 1.05, shadow expands
2. **Fly-out** (1.0-2.3s): Accelerates off-screen (power3.in)
3. **Empty wall** (2.3-2.6s): 300ms stillness — museum-quality pacing
4. **Fly-in** (2.6-4.2s): New painting enters from opposite side
5. **Landing** (4.2-5.0s): Settles on wall, shadow tightens
Total: ~5 seconds per transition

### Shadow States
- **Resting**: `var(--shadow-image)` — flush against wall
- **Lifted**: `filter: drop-shadow(0 28px 80px rgba(0,0,0,0.32))` — hovering
- **Flying**: `filter: drop-shadow(0 34px 100px rgba(0,0,0,0.42))` — in transit

## Controls
- **Desktop**: Arrow keys (Left/Right)
- **Mobile**: Swipe left/right (50px threshold)
- **Autoplay**: 10s interval, pauses on hover/focus/visibility
- **Pause button**: Toggles autoplay, shows play/pause icon

## Scroll Integration
- **Desktop**: Wheel state machine locks at carousel section
- **Mobile**: Rubber-band scroll lock (120px escape threshold)
- Nav hides when carousel is active
- `HomeCarousel.enter()` triggers first painting fly-in
- `HomeCarousel.resetEntry()` allows re-entry after exit

## Accessibility
- Images have `tabindex="0"`, `role="button"`, `aria-label`
- Respects `prefers-reduced-motion` (instant transitions)
- Pause button available for autoplay control
