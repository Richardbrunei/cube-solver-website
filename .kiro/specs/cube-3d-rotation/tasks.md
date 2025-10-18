# Implementation Plan: 3D Cube Rotation

- [x] 1. Add rotation state properties to CubeRenderer class





  - Add rotation state properties (rotationX, rotationY, isDragging, drag tracking variables)
  - Add rotation sensitivity constant (0.4 degrees per pixel)
  - Add bound event handler properties for cleanup
  - Initialize rotation to default values (-15deg X, 25deg Y)
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 7.1_

- [x] 2. Implement drag event handlers






- [x] 2.1 Implement handleMouseDown method

  - Check for left mouse button and 3D view
  - Prevent default browser drag behavior
  - Initialize drag tracking state (isDragging, start positions, start rotations)
  - Update cursor to 'grabbing'
  - Disable cube hover transition during drag
  - _Requirements: 1.1, 2.3, 4.2_


- [x] 2.2 Implement handleMouseMove method





  - Check if dragging is active
  - Calculate mouse movement delta from drag start position
  - Update rotationX and rotationY based on delta and sensitivity
  - Apply rotation to cube element
  - Update reset button visibility
  - _Requirements: 1.2, 1.5, 1.6, 2.1, 2.4_

-

- [x] 2.3 Implement handleMouseUp method




  - Check if dragging is active
  - Reset isDragging flag
  - Restore default cursor
  - Re-enable cube hover transition
  - Emit rotationChanged custom event

  - _Requirements: 1.3, 4.3, 7.3_

- [x] 2.4 Implement handleMouseLeave method




  - Check if dragging is active
  - Call handleMouseUp to cancel drag operation
  - _Requirements: 1.3, 2.3_

-

- [x] 3. Implement rotation control methods




- [x] 3.1 Implement applyRotation method

  - Get cube element from DOM
  - Build CSS transform string with current rotationX and rotationY
  - Apply transform to cube element style
  - _Requirements: 1.4, 2.1_

- [x] 3.2 Implement resetRotation method


  - Get cube element from DOM
  - Enable CSS transition for smooth animation
  - Reset rotationX and rotationY to default values (-15, 25)
  - Call applyRotation to update cube
  - Update reset button visibility
  - Emit rotationReset custom event
  - _Requirements: 5.3, 5.4, 7.3_


- [x] 3.3 Implement setRotation method

  - Accept x, y rotation angles and optional animate parameter
  - Get cube element from DOM
  - Set CSS transition based on animate parameter
  - Update rotationX and rotationY state
  - Call applyRotation to update cube
  - Update reset button visibility
  - _Requirements: 3.3, 5.3, 7.2_


- [x] 3.4 Implement getRotation method

  - Return object with current rotationX and rotationY values
  - _Requirements: 3.3, 7.2_

- [x] 4. Create rotation reset button UI component





- [x] 4.1 Implement createRotationResetButton method


  - Create button element with class 'rotation-reset-btn'
  - Set button content to circular arrow icon (↻)
  - Add title and ARIA label for accessibility
  - Apply inline styles (position, size, colors, border-radius, shadow)
  - Position button at top-right of cube container
  - Set initial display to 'none'
  - Add mouseenter/mouseleave hover effects
  - Add click handler that calls resetRotation
  - Return button element
  - _Requirements: 5.1, 5.2, 5.6, 6.2, 6.3, 6.5_

- [x] 4.2 Implement updateResetButtonVisibility method

  - Check if rotationResetButton exists
  - Define default rotation angles and threshold (5 degrees)
  - Calculate if current rotation differs from default by more than threshold
  - Show button if rotation differs, hide if at default
  - _Requirements: 5.5, 6.4_

- [x] 5. Integrate rotation functionality into render3DView





  - Store current rotation state before re-rendering
  - Call existing render3DView code to create cube structure
  - Get cube element after rendering
  - Apply stored rotation using applyRotation
  - Update cube element cursor style to 'grab'
  - Bind and attach mouse event listeners (mousedown, mousemove, mouseup, mouseleave)
  - Create and append rotation reset button to container
  - Update reset button visibility
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.5, 4.1, 6.1, 7.1_

- [x] 6. Handle rotation state during view switching





  - Modify render3DView to preserve rotation state when re-rendering
  - Modify renderNetView to hide rotation reset button
  - Ensure rotation state is maintained when switching back to 3D view
  - Update reset button visibility after view changes
  - _Requirements: 3.1, 3.2, 3.5, 6.4_

- [x] 7. Update destroy method for cleanup




  - Remove mouse event listeners using bound handler references
  - Remove rotation reset button from DOM
  - Reset rotation state properties
  - Restore default cursor if dragging was active
  - _Requirements: 7.4, 7.5_
- [x] 8. Add CSS styles for rotation reset button









- [x] 8. Add CSS styles for rotation reset button

  - Add .rotation-reset-btn class to cube.css with base styles
  - Add hover state styles for button
  - Add active/pressed state styles
  - Ensure button is visible above cube but doesn't interfere with stickers
  - _Requirements: 5.6, 6.2, 6.3_

- [ ]* 9. Manual testing and refinement
  - Test drag-to-rotate in all directions
  - Verify rotation sensitivity feels natural
  - Test reset button appearance and functionality
  - Verify rotation persists across view switches
  - Test interaction with sticker clicking and color editing
  - Test cursor changes during drag operations
  - Verify smooth animation on reset
  - Test in multiple browsers (Chrome, Firefox, Safari, Edge)
  - _Requirements: All requirements_
