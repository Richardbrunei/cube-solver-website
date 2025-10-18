# Design Document: 3D Cube Rotation

## Overview

This design implements interactive 3D rotation for the Rubik's cube visualization using mouse drag interactions. The solution extends the existing `CubeRenderer` class with rotation state management, drag event handling, and a dedicated reset button for returning to the default viewing angle. The implementation maintains the existing architecture patterns while adding smooth, responsive rotation controls.

## Architecture

### Component Structure

```
CubeRenderer (Extended)
├── Rotation State Management
│   ├── rotationX: number (degrees)
│   ├── rotationY: number (degrees)
│   ├── isDragging: boolean
│   ├── dragStartX: number (pixels)
│   ├── dragStartY: number (pixels)
│   ├── dragStartRotationX: number (degrees)
│   └── dragStartRotationY: number (degrees)
├── Drag Event Handlers
│   ├── handleMouseDown()
│   ├── handleMouseMove()
│   ├── handleMouseUp()
│   └── handleMouseLeave()
├── Rotation Methods
│   ├── updateRotation()
│   ├── applyRotation()
│   ├── resetRotation()
│   └── setRotation()
└── UI Components
    └── Rotation Reset Button
        ├── Button Element
        ├── Visibility Logic
        └── Click Handler
```

### Integration Points

1. **CubeRenderer Class**: All rotation functionality is encapsulated within the existing `CubeRenderer` class
2. **CSS Transforms**: Leverages existing CSS 3D transform infrastructure
3. **Event System**: Uses existing custom event pattern for rotation state changes
4. **View Controller**: Coordinates with `ViewController` for view switching and state preservation

## Components and Interfaces

### 1. Rotation State Properties

Added to `CubeRenderer` class:

```javascript
class CubeRenderer {
    constructor(containerId, cubeState) {
        // ... existing properties ...
        
        // Rotation state
        this.rotationX = -15;  // Default X rotation (degrees)
        this.rotationY = 25;   // Default Y rotation (degrees)
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartRotationX = 0;
        this.dragStartRotationY = 0;
        this.rotationSensitivity = 0.4;  // Degrees per pixel
        
        // Rotation UI elements
        this.rotationResetButton = null;
        
        // Bound event handlers for cleanup
        this.boundMouseDown = null;
        this.boundMouseMove = null;
        this.boundMouseUp = null;
        this.boundMouseLeave = null;
    }
}
```

### 2. Drag Event Handlers

```javascript
/**
 * Handle mouse down event - start drag tracking
 */
handleMouseDown(event) {
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    // Only in 3D view
    if (this.currentView !== '3d') return;
    
    // Prevent default to avoid text selection
    event.preventDefault();
    
    // Start drag tracking
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartRotationX = this.rotationX;
    this.dragStartRotationY = this.rotationY;
    
    // Update cursor
    document.body.style.cursor = 'grabbing';
    
    // Disable hover effects during drag
    const cubeElement = this.container.querySelector('.cube-3d');
    if (cubeElement) {
        cubeElement.style.transition = 'none';
    }
}

/**
 * Handle mouse move event - update rotation
 */
handleMouseMove(event) {
    if (!this.isDragging) return;
    
    // Calculate mouse delta
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    
    // Update rotation based on delta
    this.rotationY = this.dragStartRotationY + (deltaX * this.rotationSensitivity);
    this.rotationX = this.dragStartRotationX - (deltaY * this.rotationSensitivity);
    
    // Apply rotation
    this.applyRotation();
    
    // Update reset button visibility
    this.updateResetButtonVisibility();
}

/**
 * Handle mouse up event - stop drag tracking
 */
handleMouseUp(event) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Restore cursor
    document.body.style.cursor = '';
    
    // Re-enable hover effects
    const cubeElement = this.container.querySelector('.cube-3d');
    if (cubeElement) {
        cubeElement.style.transition = 'transform 0.5s ease';
    }
    
    // Emit rotation change event
    this.emitEvent('rotationChanged', {
        rotationX: this.rotationX,
        rotationY: this.rotationY
    });
}

/**
 * Handle mouse leave event - cancel drag if active
 */
handleMouseLeave(event) {
    if (this.isDragging) {
        this.handleMouseUp(event);
    }
}
```

### 3. Rotation Methods

```javascript
/**
 * Apply current rotation to cube element
 */
applyRotation() {
    const cubeElement = this.container.querySelector('.cube-3d');
    if (!cubeElement) return;
    
    const transform = `rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg)`;
    cubeElement.style.transform = transform;
}

/**
 * Reset rotation to default angles with animation
 */
resetRotation() {
    const cubeElement = this.container.querySelector('.cube-3d');
    if (!cubeElement) return;
    
    // Enable transition for smooth animation
    cubeElement.style.transition = 'transform 0.5s ease';
    
    // Reset to default angles
    this.rotationX = -15;
    this.rotationY = 25;
    
    // Apply rotation
    this.applyRotation();
    
    // Update reset button visibility
    this.updateResetButtonVisibility();
    
    // Emit event
    this.emitEvent('rotationReset', {
        rotationX: this.rotationX,
        rotationY: this.rotationY
    });
}

/**
 * Set rotation to specific angles
 * @param {number} x - X rotation in degrees
 * @param {number} y - Y rotation in degrees
 * @param {boolean} animate - Whether to animate the transition
 */
setRotation(x, y, animate = true) {
    const cubeElement = this.container.querySelector('.cube-3d');
    if (!cubeElement) return;
    
    // Set transition based on animate parameter
    cubeElement.style.transition = animate ? 'transform 0.5s ease' : 'none';
    
    // Update rotation state
    this.rotationX = x;
    this.rotationY = y;
    
    // Apply rotation
    this.applyRotation();
    
    // Update reset button visibility
    this.updateResetButtonVisibility();
}

/**
 * Get current rotation angles
 * @returns {Object} Current rotation {x, y}
 */
getRotation() {
    return {
        x: this.rotationX,
        y: this.rotationY
    };
}
```

### 4. Rotation Reset Button

```javascript
/**
 * Create rotation reset button
 */
createRotationResetButton() {
    const button = document.createElement('button');
    button.className = 'rotation-reset-btn';
    button.innerHTML = '↻';  // Circular arrow icon
    button.title = 'Reset View';
    button.setAttribute('aria-label', 'Reset cube rotation to default view');
    
    // Style the button
    button.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 32px;
        height: 32px;
        border: 2px solid #667eea;
        background: rgba(255, 255, 255, 0.9);
        color: #667eea;
        border-radius: 50%;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    `;
    
    // Add hover effect
    button.addEventListener('mouseenter', () => {
        button.style.background = '#667eea';
        button.style.color = 'white';
        button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(255, 255, 255, 0.9)';
        button.style.color = '#667eea';
        button.style.transform = 'scale(1)';
    });
    
    // Add click handler
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetRotation();
    });
    
    return button;
}

/**
 * Update reset button visibility based on rotation state
 */
updateResetButtonVisibility() {
    if (!this.rotationResetButton) return;
    
    const defaultX = -15;
    const defaultY = 25;
    const threshold = 5;  // degrees
    
    // Check if rotation differs from default
    const isDifferent = 
        Math.abs(this.rotationX - defaultX) > threshold ||
        Math.abs(this.rotationY - defaultY) > threshold;
    
    // Show/hide button
    this.rotationResetButton.style.display = isDifferent ? 'flex' : 'none';
}
```

## Data Models

### Rotation State

```typescript
interface RotationState {
    rotationX: number;        // X-axis rotation in degrees
    rotationY: number;        // Y-axis rotation in degrees
    isDragging: boolean;      // Whether user is currently dragging
    dragStartX: number;       // Mouse X position at drag start
    dragStartY: number;       // Mouse Y position at drag start
    dragStartRotationX: number;  // Rotation X at drag start
    dragStartRotationY: number;  // Rotation Y at drag start
}
```

### Rotation Events

```typescript
interface RotationChangedEvent {
    type: 'rotationChanged';
    data: {
        rotationX: number;
        rotationY: number;
    };
}

interface RotationResetEvent {
    type: 'rotationReset';
    data: {
        rotationX: number;
        rotationY: number;
    };
}
```

## Error Handling

### Drag Event Errors

1. **Missing Cube Element**
   - Check for cube element existence before applying transforms
   - Gracefully handle null references
   - Log warnings for debugging

2. **Event Listener Cleanup**
   - Store bound event handlers for proper cleanup
   - Remove listeners in `destroy()` method
   - Prevent memory leaks

3. **Invalid Rotation Values**
   - Validate rotation angles before applying
   - Clamp values to reasonable ranges if needed
   - Handle NaN or undefined values

### View Switching

1. **Rotation State Preservation**
   - Store rotation state when switching to net view
   - Restore rotation state when returning to 3D view
   - Handle rapid view switching gracefully

2. **Button State Synchronization**
   - Update reset button visibility on view change
   - Hide reset button in net view
   - Show reset button in 3D view if rotation differs from default

## Testing Strategy

### Unit Tests (Optional)

1. **Rotation State Management**
   - Test rotation angle calculations
   - Test drag delta to rotation conversion
   - Test rotation state preservation

2. **Event Handlers**
   - Test mouse down/move/up sequence
   - Test drag cancellation on mouse leave
   - Test event listener cleanup

3. **Reset Functionality**
   - Test reset to default angles
   - Test reset button visibility logic
   - Test animation timing

### Integration Tests (Optional)

1. **View Switching**
   - Test rotation preservation across view changes
   - Test reset button visibility in different views
   - Test interaction with other cube features

2. **User Interactions**
   - Test drag-to-rotate workflow
   - Test reset button click
   - Test cursor changes during drag

### Manual Testing

1. **Rotation Smoothness**
   - Verify smooth rotation during drag
   - Check for visual stuttering or lag
   - Test with rapid mouse movements

2. **Reset Button**
   - Verify button appears when rotated
   - Verify button hides at default rotation
   - Test button hover and click interactions

3. **Cross-Browser Compatibility**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify CSS 3D transforms work correctly
   - Check cursor changes and hover effects

4. **Sticker Interactivity**
   - Verify stickers remain clickable during rotation
   - Test color editing while cube is rotated
   - Ensure rotation doesn't interfere with other features

## Implementation Notes

### CSS Cursor Management

The implementation uses dynamic cursor changes to provide visual feedback:

- **Default**: `cursor: grab` on cube hover (via CSS)
- **Dragging**: `cursor: grabbing` on document body during drag
- **Reset**: Restore default cursor on drag end

### Performance Considerations

1. **Transform Updates**: Use `requestAnimationFrame` if performance issues arise
2. **Event Throttling**: Consider throttling mouse move events for lower-end devices
3. **Transition Disabling**: Disable CSS transitions during drag for immediate feedback

### Accessibility

1. **Keyboard Support**: Consider adding keyboard controls for rotation (arrow keys)
2. **Screen Readers**: Provide ARIA labels for reset button
3. **Focus Management**: Ensure reset button is keyboard accessible

### Browser Compatibility

- **CSS 3D Transforms**: Supported in all modern browsers
- **Mouse Events**: Standard DOM events with broad support
- **Pointer Events**: Consider using Pointer Events API for touch device support in future

## Design Decisions and Rationales

### 1. Encapsulation in CubeRenderer

**Decision**: Implement all rotation functionality within the `CubeRenderer` class.

**Rationale**: 
- Maintains single responsibility for 3D visualization
- Keeps rotation state close to rendering logic
- Simplifies state management and cleanup
- Follows existing architecture patterns

### 2. Mouse-Based Interaction

**Decision**: Use mouse drag for rotation control.

**Rationale**:
- Intuitive and familiar interaction pattern
- Provides direct manipulation feel
- Easy to implement with standard DOM events
- Can be extended to touch events later

### 3. Rotation Sensitivity

**Decision**: Use 0.4 degrees per pixel of mouse movement.

**Rationale**:
- Provides responsive but not overly sensitive control
- Allows precise positioning with reasonable mouse movement
- Can be adjusted based on user feedback
- Balances speed and precision

### 4. Reset Button Visibility

**Decision**: Show reset button only when rotation differs from default by >5 degrees.

**Rationale**:
- Reduces UI clutter when not needed
- Provides clear indication that cube is rotated
- 5-degree threshold prevents flickering near default position
- Encourages exploration while providing easy return

### 5. Inline Button Styling

**Decision**: Create reset button with inline styles rather than CSS classes.

**Rationale**:
- Button is dynamically created by JavaScript
- Keeps button styling self-contained
- Avoids CSS file modifications
- Easier to maintain button-specific styles

### 6. Rotation State Preservation

**Decision**: Preserve rotation angles when switching between views.

**Rationale**:
- Maintains user's preferred viewing angle
- Provides consistent experience across view switches
- Avoids jarring reset when returning to 3D view
- Respects user's interaction history

## Future Enhancements

1. **Touch Support**: Add touch event handlers for mobile devices
2. **Momentum**: Implement momentum/inertia for more natural feel
3. **Keyboard Controls**: Add arrow key support for accessibility
4. **Rotation Presets**: Provide buttons for common viewing angles
5. **Auto-Rotation**: Optional auto-rotation mode for demonstrations
6. **Rotation Limits**: Optional constraints on rotation angles
7. **Multi-Touch**: Support pinch-to-zoom and two-finger rotation on touch devices
