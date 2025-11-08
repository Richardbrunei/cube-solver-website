# Design Document

## Overview

This design enhances the Rubik's cube animation system to deliver smooth, hardware-accelerated animations at 60fps. The approach focuses on leveraging CSS animations and transforms for GPU acceleration, optimizing the rendering pipeline, and implementing intelligent timing coordination between JavaScript state management and CSS visual updates.

The key insight is that the current implementation mixes JavaScript-driven state updates with CSS transitions, which can cause layout thrashing and janky animations. By separating concerns—JavaScript manages logical state while CSS handles all visual transitions—we achieve smoother performance.

## Architecture

### Component Structure

```
AnimationController (JavaScript)
├── State Management (logical cube state)
├── Timing Coordination (requestAnimationFrame)
└── DOM Manipulation (minimal, class-based)

CSS Animation System
├── Face Rotation Animations (@keyframes)
├── Sticker Transitions (color, position)
├── UI Feedback Animations (highlights, shadows)
└── Performance Optimizations (will-change, transform)
```

### Animation Pipeline

1. **Move Initiation**: AnimationController applies CSS class to trigger rotation
2. **GPU Rendering**: Browser handles animation via CSS transforms
3. **Completion Detection**: transitionend event signals move completion
4. **State Update**: Virtual cubestring updates, next move queued
5. **Visual Sync**: DOM reflects new state, ready for next animation

## Components and Interfaces

### 1. Enhanced AnimationController

**Modifications to existing class:**

```javascript
class AnimationController {
  constructor() {
    // Existing properties...
    
    // New properties for smooth animations
    this.isAnimating = false;           // Prevents overlapping animations
    this.animationQueue = [];           // Queue for rapid move sequences
    this.rafId = null;                  // requestAnimationFrame ID
    this.transitionEndHandler = null;   // Event handler reference
  }
  
  // New method: Apply rotation with CSS animation
  _applyMoveWithAnimation(move) {
    // Add rotation class to cube
    // Wait for transitionend event
    // Update virtual state
    // Trigger next move
  }
  
  // New method: Coordinate timing with RAF
  _scheduleNextMoveRAF() {
    // Use requestAnimationFrame for smooth timing
    // Check if animation is complete
    // Queue next move
  }
  
  // Enhanced method: Render with animation classes
  _renderCube(cubestring, animationClass = null) {
    // Apply animation class if provided
    // Update sticker colors with transitions
    // Maintain DOM element references
  }
}
```

### 2. CSS Animation Classes

**New CSS structure:**

```css
/* Face rotation animations */
.anim-cube-face--rotating-cw {
  animation: rotateFaceClockwise 500ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

.anim-cube-face--rotating-ccw {
  animation: rotateFaceCounterClockwise 500ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Sticker transitions */
.anim-cube-sticker {
  transition: background-color 400ms cubic-bezier(0.4, 0.0, 0.2, 1),
              transform 500ms cubic-bezier(0.4, 0.0, 0.2, 1);
  will-change: background-color, transform;
}

/* Performance hints */
.anim-cube-3d {
  will-change: transform;
  transform: translateZ(0); /* Force GPU layer */
}
```

### 3. Rotation Keyframe Animations

**Face-specific rotation animations:**

```css
@keyframes rotateFaceClockwise {
  0% { transform: rotateZ(0deg); }
  100% { transform: rotateZ(90deg); }
}

@keyframes rotateFaceCounterClockwise {
  0% { transform: rotateZ(0deg); }
  100% { transform: rotateZ(-90deg); }
}

/* Sticker movement animations for affected pieces */
@keyframes stickerMoveClockwise {
  0% { transform: translate(0, 0); }
  100% { transform: translate(var(--move-x), var(--move-y)); }
}
```

## Data Models

### Animation State Model

```javascript
{
  animationState: 'idle' | 'playing' | 'paused',
  isAnimating: boolean,              // Currently executing a move
  currentMoveIndex: number,
  moveSequence: string[],
  virtualCubestring: string,
  animationQueue: Move[],            // Queued moves
  timing: {
    moveDuration: 500,               // ms per move
    colorTransition: 400,            // ms for color changes
    modalTransition: 300             // ms for modal open/close
  }
}
```

### Move Animation Model

```javascript
{
  face: 'R' | 'L' | 'U' | 'D' | 'F' | 'B',
  direction: 'clockwise' | 'counterclockwise',
  turns: 1 | 2,
  affectedStickers: number[],        // Indices of stickers that move
  animationClass: string,            // CSS class to apply
  startTime: number,                 // Performance.now() timestamp
  endTime: number
}
```

## Error Handling

### Animation Failure Recovery

1. **Stuck Animation Detection**
   - Set timeout for expected animation duration + 100ms buffer
   - If transitionend doesn't fire, force completion
   - Log warning and continue to next move

2. **Performance Degradation**
   - Monitor frame rate via requestAnimationFrame timing
   - If FPS drops below 30, reduce animation complexity
   - Disable floating animation on low-end devices

3. **State Desynchronization**
   - Validate virtual cubestring after each move
   - If invalid, pause animation and show error
   - Provide "Reset" option to recover

### Error States

```javascript
try {
  await this._applyMoveWithAnimation(move);
} catch (error) {
  console.error('Animation error:', error);
  this.pause();
  this._showErrorMessage('Animation failed. Please reset.');
  this._emitStateChange('animation:error');
}
```

## Testing Strategy

### Performance Testing

1. **Frame Rate Monitoring**
   - Use Chrome DevTools Performance tab
   - Record animation sequence
   - Verify 60fps on desktop, 30fps on mobile
   - Check for layout thrashing (purple bars)

2. **Animation Timing Accuracy**
   - Measure actual duration vs expected 500ms
   - Verify consistent timing across moves
   - Test with long sequences (50+ moves)

3. **Memory Usage**
   - Monitor heap size during animation
   - Verify no memory leaks after modal close
   - Test repeated open/close cycles

### Visual Testing

1. **Smoothness Verification**
   - Record video at 60fps
   - Slow-motion playback to check for stuttering
   - Test on various devices (desktop, tablet, mobile)

2. **Transition Quality**
   - Verify color transitions are smooth
   - Check face rotations complete fully
   - Ensure no visual artifacts or flickering

3. **Cross-Browser Testing**
   - Chrome (primary target)
   - Firefox
   - Safari (iOS and macOS)
   - Edge

### Integration Testing

1. **AnimationController Integration**
   - Test play/pause/step controls during animation
   - Verify state synchronization
   - Test rapid button clicking

2. **Modal Lifecycle**
   - Test animation start from various cube states
   - Verify cleanup on modal close
   - Test ESC key during animation

3. **Edge Cases**
   - Empty move sequence
   - Single move sequence
   - Very long sequence (100+ moves)
   - Rapid open/close of modal

## Implementation Notes

### CSS Transform Strategy

Use `transform` for all animations because it's GPU-accelerated:
- Face rotations: `rotateZ()`
- Cube positioning: `translateZ()`
- Sticker movements: `translate()`

Avoid animating:
- `left`, `top`, `width`, `height` (causes layout)
- `margin`, `padding` (causes layout)
- `box-shadow` (expensive, use sparingly)

### Timing Coordination

Use `requestAnimationFrame` for JavaScript timing:
```javascript
_scheduleNextMoveRAF() {
  this.rafId = requestAnimationFrame((timestamp) => {
    if (this.isAnimating) {
      // Wait for current animation
      this._scheduleNextMoveRAF();
    } else {
      // Start next move
      this._executeNextMove();
    }
  });
}
```

### Mobile Optimization

For devices with limited GPU:
- Reduce cube size (smaller = faster)
- Disable floating animation
- Use simpler easing functions
- Reduce shadow effects

Detect via:
```javascript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### Browser Compatibility

Target modern browsers with CSS animation support:
- Chrome 43+
- Firefox 16+
- Safari 9+
- Edge 12+

Fallback for older browsers:
- Instant state changes (no animation)
- Functional but not smooth

## Performance Targets

- **Desktop**: 60fps sustained during animation
- **Mobile**: 30fps minimum during animation
- **Move Duration**: 500ms ± 10ms accuracy
- **Modal Open**: < 300ms from click to visible
- **Memory**: < 5MB increase during animation
- **CPU**: < 50% single core usage during playback

## Visual Enhancements

### Depth and Lighting

Add subtle visual cues for better 3D perception:
```css
.anim-cube-face {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.anim-cube-sticker {
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}
```

### Move Highlighting

Enhance current move visibility:
```css
.animation-modal-v2__moves .move.active {
  background: #667eea;
  color: white;
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
  transition: all 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### Floating Animation

Subtle idle animation for visual interest:
```css
@keyframes cubeFloat {
  0%, 100% {
    transform: rotateX(-20deg) rotateY(30deg) translateY(0);
  }
  50% {
    transform: rotateX(-20deg) rotateY(30deg) translateY(-10px);
  }
}

.anim-cube-3d {
  animation: cubeFloat 4s ease-in-out infinite;
}
```

## Accessibility Considerations

Respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  .anim-cube-3d {
    animation: none;
  }
  
  .anim-cube-sticker {
    transition-duration: 0.1s;
  }
}
```

Provide alternative for users who prefer instant updates:
- Settings toggle for "Instant animations"
- Reduces all durations to 50ms
- Maintains functionality without smooth transitions
