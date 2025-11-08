# Cube Solve Animation Design Document (V2)

## Overview

The Cube Solve Animation V2 feature provides a simplified approach to visualizing solution sequences. When a solution is generated, users can open an animation modal that displays the solution text alongside a 3D cube visualization. The animation uses a virtual cubestring (temporary copy) for visualization without modifying the actual CubeState. The system renders the virtual state directly to a cube container in the modal using simple DOM manipulation, avoiding the complexity of multiple renderer instances.

## Architecture

### Component Diagram

```
┌─────────────────┐
│  SolveButton    │
│  (existing)     │
└────────┬────────┘
         │ triggers solve
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Backend API    │─────▶│  Solution Data   │
│  /api/solve     │      │  {moves: [...]}  │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │ AnimationController │◀─── User Controls
                         │    (new module)     │
                         └────────┬────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────────┐
            │   Virtual    │ │   Move   │ │  Animation   │
            │  Cubestring  │ │ Executor │ │    Modal     │
            └──────┬───────┘ └────┬─────┘ └──────┬───────┘
                   │              │               │
                   └──────────────┼───────────────┘
                                  ▼
                         ┌─────────────────┐
                         │  Direct DOM     │
                         │  Rendering      │
                         └─────────────────┘
```

### Key Design Decisions

1. **Virtual Cubestring**: Animation operates on a temporary copy of the cubestring, never modifying CubeState
   - *Rationale*: Ensures main application state remains unchanged; simple and predictable

2. **Direct DOM Rendering**: Render cube stickers directly to the animation container without using CubeRenderer
   - *Rationale*: Simpler than managing multiple renderer instances; avoids CubeRenderer complexity

3. **Animation Modal**: Separate modal for animation with solution text and cube side-by-side
   - *Rationale*: Provides focused animation experience; keeps solve popup simple

4. **Simple Controls**: Basic play, pause, step forward/backward, reset controls
   - *Rationale*: Covers essential use cases without over-engineering

5. **Fixed Animation Speed**: 500ms per move (no speed control in v2)
   - *Rationale*: Simplifies implementation; can add speed control later if needed

6. **Move Transformation Reuse**: Use existing move transformation logic from solve-animator.js
   - *Rationale*: Don't reinvent the wheel; proven logic already exists

## Components and Interfaces

### 1. AnimationController Module (New)

**File**: `scripts/animation-controller.js`

**Responsibilities**:
- Manage animation modal lifecycle (open, close, cleanup)
- Manage animation state machine (idle, playing, paused)
- Maintain virtual cubestring for animation
- Execute move sequence with timing control
- Provide playback controls (play, pause, step, reset)
- Render cube visualization directly to DOM
- Emit events for state changes

**Public Interface**:

```javascript
class AnimationController {
  constructor() {
    this.modal = null; // Modal element
    this.cubeContainer = null; // Cube container in modal
    this.originalCubestring = null; // Starting state
    this.virtualCubestring = null; // Current animation state
    this.moveSequence = []; // Array of moves
    this.currentMoveIndex = 0; // Current position
    this.animationState = 'idle'; // idle, playing, paused
    this.animationTimeout = null; // setTimeout reference
    this.animationDuration = 500; // Fixed 500ms per move
  }

  // Initialize animation with solution moves
  startAnimation(moveSequence, currentCubestring) {
    // Store moves and original state
    // Create and open modal
    // Initialize virtual cubestring
    // Render initial cube state
    // Set up UI
  }

  // Playback controls
  play() { /* Start/resume animation */ }
  pause() { /* Pause animation */ }
  stepForward() { /* Apply next move */ }
  stepBackward() { /* Revert previous move */ }
  reset() { /* Return to beginning */ }
  close() { /* Exit animation, cleanup */ }

  // Internal methods
  _createModal() { /* Create modal HTML */ }
  _openModal() { /* Display modal */ }
  _closeModal() { /* Hide and remove modal */ }
  _renderCube(cubestring) { /* Render cube to DOM */ }
  _applyMove(moveNotation) { /* Apply move to virtual state */ }
  _highlightCurrentMove() { /* Update UI */ }
  _updateButtonStates() { /* Enable/disable buttons */ }
  _scheduleNextMove() { /* Schedule next animation step */ }
  _emitStateChange(eventName) { /* Emit custom event */ }
}
```

**Events Emitted**:
- `animation:started` - Animation begins
- `animation:paused` - Animation paused
- `animation:resumed` - Animation resumed
- `animation:step` - Single step completed
- `animation:reset` - Animation reset to beginning
- `animation:closed` - Animation mode exited

### 2. Animation Modal UI (New)

**Location**: Appended to document body

**HTML Structure**:

```html
<div id="animation-modal-v2" class="animation-modal-v2">
  <div class="animation-modal-v2__backdrop"></div>
  
  <div class="animation-modal-v2__content">
    <button class="animation-modal-v2__close" title="Close (ESC)">✕</button>
    
    <div class="animation-modal-v2__layout">
      <!-- Left side: Solution text -->
      <div class="animation-modal-v2__solution">
        <h3>Solution</h3>
        <div class="animation-modal-v2__moves">
          <!-- Move spans with highlighting -->
        </div>
        <div class="animation-modal-v2__progress">
          Move <span id="anim-move-num">0</span> of <span id="anim-total-moves">20</span>
        </div>
      </div>
      
      <!-- Right side: Animated cube -->
      <div class="animation-modal-v2__cube-section">
        <div id="animation-cube-container-v2" class="animation-cube-container-v2">
          <!-- Cube will be rendered here -->
        </div>
        
        <!-- Playback controls -->
        <div class="animation-modal-v2__controls">
          <button id="anim-reset-btn" class="anim-control-btn" title="Reset">⏮</button>
          <button id="anim-step-back-btn" class="anim-control-btn" title="Previous">⏮</button>
          <button id="anim-play-btn" class="anim-control-btn anim-control-btn--primary" title="Play">▶</button>
          <button id="anim-pause-btn" class="anim-control-btn anim-control-btn--primary" title="Pause" style="display:none;">⏸</button>
          <button id="anim-step-forward-btn" class="anim-control-btn" title="Next">⏭</button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 3. Direct Cube Rendering

**Approach**: Render cube stickers directly to the animation container using simple DOM manipulation.

**Rendering Method**:

```javascript
_renderCube(cubestring) {
  // Clear container
  this.cubeContainer.innerHTML = '';
  
  // Create cube wrapper with 3D perspective
  const cubeWrapper = document.createElement('div');
  cubeWrapper.className = 'anim-cube-3d';
  
  // Define face order and sticker indices
  const faces = [
    { name: 'front', indices: [18, 19, 20, 21, 22, 23, 24, 25, 26] },
    { name: 'back', indices: [45, 46, 47, 48, 49, 50, 51, 52, 53] },
    { name: 'right', indices: [9, 10, 11, 12, 13, 14, 15, 16, 17] },
    { name: 'left', indices: [36, 37, 38, 39, 40, 41, 42, 43, 44] },
    { name: 'top', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    { name: 'bottom', indices: [27, 28, 29, 30, 31, 32, 33, 34, 35] }
  ];
  
  // Create each face
  faces.forEach(face => {
    const faceElement = document.createElement('div');
    faceElement.className = `anim-cube-face anim-cube-face--${face.name}`;
    
    // Create 9 stickers for this face
    face.indices.forEach(index => {
      const sticker = document.createElement('div');
      sticker.className = 'anim-cube-sticker';
      sticker.dataset.index = index;
      
      // Set color based on cubestring
      const colorLetter = cubestring[index];
      sticker.dataset.color = colorLetter;
      sticker.style.backgroundColor = this._getColorHex(colorLetter);
      
      faceElement.appendChild(sticker);
    });
    
    cubeWrapper.appendChild(faceElement);
  });
  
  this.cubeContainer.appendChild(cubeWrapper);
}

_getColorHex(colorLetter) {
  const colors = {
    'U': '#FFFFFF', // White
    'R': '#FF0000', // Red
    'F': '#00FF00', // Green
    'D': '#FFFF00', // Yellow
    'L': '#FFA500', // Orange
    'B': '#0000FF'  // Blue
  };
  return colors[colorLetter] || '#CCCCCC';
}
```

### 4. Move Transformation Logic

**Approach**: Copy the move transformation logic from solve-animator.js

**Key Methods**:

```javascript
_parseMove(notation) {
  const face = notation[0].toUpperCase();
  const modifier = notation.slice(1);
  
  return {
    face: face,
    direction: modifier === "'" ? 'counterclockwise' : 'clockwise',
    turns: modifier === '2' ? 2 : 1
  };
}

_applyMove(moveNotation) {
  const move = this._parseMove(moveNotation);
  
  // Apply the move the specified number of times
  for (let i = 0; i < move.turns; i++) {
    this.virtualCubestring = this._rotateFace(
      this.virtualCubestring,
      move.face,
      move.direction
    );
  }
}

_rotateFace(cubestring, face, direction) {
  // Copy rotation logic from solve-animator.js
  // This handles the actual cubestring transformation
  // Returns new cubestring after rotation
}
```

### 5. Integration with SolveButton (Modified)

**File**: `scripts/solve-button.js`

**Changes Required**:
- Import AnimationController
- Add "View Animation" button to solve results
- Initialize controller when user clicks button
- Pass solution moves and current cubestring to controller

**Modified Interface**:

```javascript
// In displaySolution method
displaySolution(solution, moveCount) {
  // ... existing code to display moves text ...
  
  // Add animation button
  html += `
    <div class="solve-section">
      <h4 class="solve-section__title">Animation</h4>
      <button class="view-animation-btn" id="view-animation-btn">
        <span class="btn-icon">▶</span>
        View Animation
      </button>
    </div>
  `;
  
  this.resultsContainer.innerHTML = html;
  
  // Wire up animation button
  const animBtn = document.getElementById('view-animation-btn');
  animBtn.addEventListener('click', () => this._startAnimation(solution));
}

async _startAnimation(solution) {
  if (!this.animationController) {
    const { AnimationController } = await import('./animation-controller.js');
    this.animationController = new AnimationController();
  }
  
  const moves = solution.trim().split(/\s+/);
  const currentCubestring = this.cubeState.getCubestring();
  
  this.animationController.startAnimation(moves, currentCubestring);
}
```

## Data Models

### Animation State

```javascript
{
  state: 'idle' | 'playing' | 'paused',
  originalCubestring: '54-char string',
  virtualCubestring: '54-char string',
  moveSequence: ['R', 'U', "R'", 'D2', ...],
  currentMoveIndex: 0,
  animationDuration: 500 // Fixed 500ms per move
}
```

### Move Representation

```javascript
{
  notation: 'R',
  face: 'R',
  direction: 'clockwise' | 'counterclockwise',
  turns: 1 | 2
}
```

## Error Handling

### Invalid Move Notation

```javascript
_applyMove(notation) {
  try {
    const move = this._parseMove(notation);
    // ... apply move
  } catch (error) {
    console.error(`Invalid move notation: ${notation}`, error);
    this.pause();
    alert('Invalid move in sequence');
  }
}
```

### Button State Management

```javascript
_updateButtonStates() {
  const playBtn = document.getElementById('anim-play-btn');
  const pauseBtn = document.getElementById('anim-pause-btn');
  const stepBackBtn = document.getElementById('anim-step-back-btn');
  const stepForwardBtn = document.getElementById('anim-step-forward-btn');
  const resetBtn = document.getElementById('anim-reset-btn');
  
  // Play/Pause visibility
  if (this.animationState === 'playing') {
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
  } else {
    playBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
  }
  
  // Disable at boundaries
  const atStart = this.currentMoveIndex === 0;
  stepBackBtn.disabled = atStart;
  resetBtn.disabled = atStart;
  
  const atEnd = this.currentMoveIndex >= this.moveSequence.length;
  stepForwardBtn.disabled = atEnd;
}
```

### Cleanup on Close

```javascript
close() {
  // Clear any pending timeouts
  if (this.animationTimeout) {
    clearTimeout(this.animationTimeout);
    this.animationTimeout = null;
  }
  
  // Close and remove modal
  this._closeModal();
  
  // Reset state
  this.animationState = 'idle';
  this.moveSequence = [];
  this.currentMoveIndex = 0;
  this.originalCubestring = null;
  this.virtualCubestring = null;
  
  this._emitStateChange('animation:closed');
}
```

## CSS Styling

### Animation Modal Styles

**File**: `styles/animation.css` (new file)

```css
/* Modal overlay */
.animation-modal-v2 {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
  display: none;
  justify-content: center;
  align-items: center;
}

.animation-modal-v2.active {
  display: flex;
}

/* Backdrop */
.animation-modal-v2__backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
}

/* Modal content */
.animation-modal-v2__content {
  position: relative;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 2rem;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

/* Close button */
.animation-modal-v2__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.animation-modal-v2__close:hover {
  color: var(--text-primary);
}

/* Layout: solution on left, cube on right */
.animation-modal-v2__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  min-height: 500px;
}

/* Cube container with 3D perspective */
.animation-cube-container-v2 {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;
}

/* 3D cube wrapper */
.anim-cube-3d {
  width: 200px;
  height: 200px;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(-15deg) rotateY(25deg);
}

/* Cube faces */
.anim-cube-face {
  position: absolute;
  width: 200px;
  height: 200px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
}

.anim-cube-face--front { transform: translateZ(100px); }
.anim-cube-face--back { transform: rotateY(180deg) translateZ(100px); }
.anim-cube-face--right { transform: rotateY(90deg) translateZ(100px); }
.anim-cube-face--left { transform: rotateY(-90deg) translateZ(100px); }
.anim-cube-face--top { transform: rotateX(90deg) translateZ(100px); }
.anim-cube-face--bottom { transform: rotateX(-90deg) translateZ(100px); }

/* Stickers */
.anim-cube-sticker {
  border: 1px solid #000;
  transition: background-color 0.5s ease;
}

/* Controls */
.animation-modal-v2__controls {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.anim-control-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: var(--button-bg);
  color: var(--button-text);
  cursor: pointer;
  transition: all 0.2s;
}

.anim-control-btn:hover:not(:disabled) {
  background: var(--button-hover);
  transform: scale(1.05);
}

.anim-control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.anim-control-btn--primary {
  background: var(--accent-color);
  color: white;
}

/* Move highlighting */
.animation-modal-v2__moves .move {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  margin: 0.1rem;
  border-radius: 3px;
  transition: all 0.2s;
}

.animation-modal-v2__moves .move.active {
  background: var(--accent-color);
  color: white;
  font-weight: bold;
}
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Open animation modal from solve popup
- [ ] Verify virtual cubestring is created (not modifying CubeState)
- [ ] Test play button starts animation
- [ ] Test pause button stops animation
- [ ] Test step forward advances one move
- [ ] Test step backward goes back one move
- [ ] Test reset returns to beginning
- [ ] Verify move highlighting updates correctly
- [ ] Verify button states (enabled/disabled) at boundaries
- [ ] Close modal via close button
- [ ] Close modal via ESC key
- [ ] Verify main cube view unchanged after animation
- [ ] Verify CubeState unchanged after animation
- [ ] Test on mobile devices

## Performance Considerations

### Animation Timing

- Use `setTimeout` with `requestAnimationFrame` for smooth transitions
- Fixed 500ms duration per move
- Clear timeouts on pause/close

### Memory Management

- Clear timeouts on cleanup
- Remove event listeners when modal closes
- Discard virtual cubestring after animation
- Remove modal from DOM on close

## Future Enhancements

1. **Speed Control**: Add 0.5x, 1x, 2x speed options
2. **Camera Rotation**: Rotate cube view to show the face being moved
3. **Progress Slider**: Scrub through animation timeline
4. **Export**: Generate GIF or video of solution
5. **Sound Effects**: Audio feedback for each move
