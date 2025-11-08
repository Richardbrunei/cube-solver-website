/**
 * AnimationController
 * 
 * Manages the animation modal lifecycle and playback controls for visualizing
 * Rubik's cube solution sequences. Uses a virtual cubestring for animation
 * without modifying the actual CubeState.
 */
export class AnimationController {
  constructor() {
    // Modal elements
    this.modal = null;
    this.cubeContainer = null;
    this._escKeyHandler = null;      // ESC key event handler reference
    
    // Animation state
    this.originalCubestring = null;  // Starting state
    this.virtualCubestring = null;   // Current animation state
    this.moveSequence = [];          // Array of moves to animate
    this.currentMoveIndex = 0;       // Current position in sequence
    
    // State machine: 'idle', 'playing', 'paused'
    this.animationState = 'idle';
    this.isAnimating = false;        // Prevents overlapping animations
    
    // Timing control
    this.animationTimeout = null;    // setTimeout reference for scheduling
    this.rafId = null;               // requestAnimationFrame ID for RAF-based timing
    
    // Event handlers
    this._transitionEndHandler = null; // transitionend event handler reference
    
    // Mobile detection and optimization
    this.isMobile = this._detectMobile();
    this.isLowEndDevice = this._detectLowEndDevice();
    
    // Reduced motion detection and duration adjustment
    this.prefersReducedMotion = this._detectReducedMotion();
    this.animationDuration = this.prefersReducedMotion ? 100 : 500; // 100ms for reduced motion, 500ms normal
    
    // DOM element cache for performance optimization
    this.cachedCubeWrapper = null;   // Cached cube 3D wrapper element
    this.cachedStickers = null;      // Cached array of sticker elements (54 elements)
  }

  /**
   * Initialize animation with solution moves
   * @param {Array<string>} moveSequence - Array of move notations (e.g., ['R', 'U', "R'", 'D2'])
   * @param {string} currentCubestring - Starting cube state (54-character string)
   */
  startAnimation(moveSequence, currentCubestring) {
    try {
      // Validate inputs
      if (!Array.isArray(moveSequence) || moveSequence.length === 0) {
        throw new Error('Invalid move sequence: must be a non-empty array');
      }
      
      if (!currentCubestring || typeof currentCubestring !== 'string' || currentCubestring.length !== 54) {
        throw new Error('Invalid cubestring: must be a 54-character string');
      }
      
      // Validate each move in the sequence
      const validFaces = ['R', 'L', 'U', 'D', 'F', 'B'];
      const validModifiers = ['', "'", '2'];
      
      for (let i = 0; i < moveSequence.length; i++) {
        const move = moveSequence[i];
        if (!move || typeof move !== 'string') {
          throw new Error(`Invalid move at index ${i}: must be a non-empty string`);
        }
        
        const face = move[0].toUpperCase();
        const modifier = move.slice(1);
        
        if (!validFaces.includes(face)) {
          throw new Error(`Invalid move at index ${i}: '${move}' has invalid face '${face}'`);
        }
        
        if (!validModifiers.includes(modifier)) {
          throw new Error(`Invalid move at index ${i}: '${move}' has invalid modifier '${modifier}'`);
        }
      }
    } catch (error) {
      console.error('AnimationController.startAnimation error:', error.message);
      alert(`Cannot start animation: ${error.message}`);
      return;
    }
    
    // Store original cubestring and create virtual copy
    this.originalCubestring = currentCubestring;
    this.virtualCubestring = currentCubestring;
    
    // Store move sequence
    this.moveSequence = moveSequence;
    this.currentMoveIndex = 0;
    
    // Reset animation state
    this.animationState = 'idle';
    
    // Create modal if it doesn't exist
    if (!this.modal) {
      this._createModal();
    }
    
    // Populate solution text with moves
    const movesContainer = document.getElementById('anim-moves-container');
    if (movesContainer) {
      movesContainer.innerHTML = '';
      moveSequence.forEach((move, index) => {
        const moveSpan = document.createElement('span');
        moveSpan.className = 'move';
        moveSpan.dataset.moveIndex = index;
        moveSpan.textContent = move;
        movesContainer.appendChild(moveSpan);
        
        // Add space between moves
        if (index < moveSequence.length - 1) {
          movesContainer.appendChild(document.createTextNode(' '));
        }
      });
    }
    
    // Update total moves display
    const totalMovesSpan = document.getElementById('anim-total-moves');
    if (totalMovesSpan) {
      totalMovesSpan.textContent = moveSequence.length;
    }
    
    // Render initial cube state
    this._renderCube(this.virtualCubestring);
    
    // Open modal
    this._openModal();
    
    // Update UI state
    this._highlightCurrentMove();
    this._updateButtonStates();
  }

  /**
   * Start or resume animation playback
   */
  play() {
    // Can't play if already at the end
    if (this.currentMoveIndex >= this.moveSequence.length) {
      return;
    }
    
    // Update state to playing
    this.animationState = 'playing';
    
    // Update UI
    this._updateButtonStates();
    
    // Emit event
    if (this.currentMoveIndex === 0) {
      this._emitStateChange('animation:started');
    } else {
      this._emitStateChange('animation:resumed');
    }
    
    // Schedule next move
    this._scheduleNextMove();
  }

  /**
   * Pause animation playback
   */
  pause() {
    // Clear any pending timeout
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    
    // Clear any pending RAF
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Update state to paused
    this.animationState = 'paused';
    this.isAnimating = false;
    
    // Update UI
    this._updateButtonStates();
    
    // Emit event
    this._emitStateChange('animation:paused');
  }

  /**
   * Advance one move forward
   */
  stepForward() {
    // Can't step forward if at the end
    if (this.currentMoveIndex >= this.moveSequence.length) {
      return;
    }
    
    // Pause if currently playing
    if (this.animationState === 'playing') {
      this.pause();
    }
    
    try {
      // Apply the next move
      const move = this.moveSequence[this.currentMoveIndex];
      this._applyMove(move);
      this.currentMoveIndex++;
      
      // Re-render cube with new state
      this._renderCube(this.virtualCubestring);
      
      // Update UI
      this._highlightCurrentMove();
      this._updateButtonStates();
      
      // Emit event
      this._emitStateChange('animation:step');
    } catch (error) {
      console.error('AnimationController.stepForward error:', error.message);
      // Error already handled in _applyMove, just log here
    }
  }

  /**
   * Go back one move
   * Rebuilds virtual state from scratch by replaying moves from the beginning
   */
  stepBackward() {
    // Can't step backward if at the start
    if (this.currentMoveIndex === 0) {
      return;
    }
    
    // Pause if currently playing
    if (this.animationState === 'playing') {
      this.pause();
    }
    
    try {
      // Decrement move index
      this.currentMoveIndex--;
      
      // Rebuild virtual state from scratch
      this.virtualCubestring = this.originalCubestring;
      for (let i = 0; i < this.currentMoveIndex; i++) {
        this._applyMove(this.moveSequence[i]);
      }
      
      // Re-render cube with new state
      this._renderCube(this.virtualCubestring);
      
      // Update UI
      this._highlightCurrentMove();
      this._updateButtonStates();
      
      // Emit event
      this._emitStateChange('animation:step');
    } catch (error) {
      console.error('AnimationController.stepBackward error:', error.message);
      // Error already handled in _applyMove, just log here
    }
  }

  /**
   * Reset animation to beginning
   */
  reset() {
    // Clear any pending timeout
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    
    // Clear any pending RAF
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Reset to beginning
    this.currentMoveIndex = 0;
    this.virtualCubestring = this.originalCubestring;
    this.animationState = 'idle';
    this.isAnimating = false;
    
    // Re-render cube with original state
    this._renderCube(this.virtualCubestring);
    
    // Update UI
    this._highlightCurrentMove();
    this._updateButtonStates();
    
    // Emit event
    this._emitStateChange('animation:reset');
  }

  /**
   * Exit animation and cleanup
   */
  close() {
    try {
      // Clear any pending timeouts
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
      }
      
      // Clear any pending RAF
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      
      // Remove transitionend listener
      this._removeTransitionEndListener();
      
      // Close and remove modal
      this._closeModal();
      
      // Reset animation state
      this.animationState = 'idle';
      this.isAnimating = false;
      this.moveSequence = [];
      this.currentMoveIndex = 0;
      
      // Discard virtual cubestring
      this.originalCubestring = null;
      this.virtualCubestring = null;
      
      // Clear cached DOM references
      this.cachedCubeWrapper = null;
      this.cachedStickers = null;
      
      // Emit closed event
      this._emitStateChange('animation:closed');
    } catch (error) {
      console.error('AnimationController.close error:', error.message);
      
      // Ensure cleanup happens even if there's an error
      try {
        if (this.animationTimeout) {
          clearTimeout(this.animationTimeout);
          this.animationTimeout = null;
        }
        
        // Clear any pending RAF
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        
        // Remove transitionend listener
        this._removeTransitionEndListener();
        
        // Force remove modal from DOM if it exists
        if (this.modal && this.modal.parentNode) {
          this.modal.parentNode.removeChild(this.modal);
        }
        
        // Remove ESC key listener
        if (this._escKeyHandler) {
          document.removeEventListener('keydown', this._escKeyHandler);
        }
      } catch (cleanupError) {
        console.error('AnimationController.close cleanup error:', cleanupError.message);
      }
      
      // Reset state regardless of errors
      this.animationState = 'idle';
      this.isAnimating = false;
      this.moveSequence = [];
      this.currentMoveIndex = 0;
      this.originalCubestring = null;
      this.virtualCubestring = null;
      this.cachedCubeWrapper = null;
      this.cachedStickers = null;
    }
  }

  /**
   * Create modal HTML structure
   * @private
   */
  _createModal() {
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'animation-modal-v2';
    modal.className = 'animation-modal-v2';
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'animation-modal-v2__backdrop';
    
    // Create modal content container
    const content = document.createElement('div');
    content.className = 'animation-modal-v2__content';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'animation-modal-v2__close';
    closeBtn.title = 'Close (ESC)';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.close());
    
    // Create two-column layout
    const layout = document.createElement('div');
    layout.className = 'animation-modal-v2__layout';
    
    // Left column: Solution text
    const solutionSection = document.createElement('div');
    solutionSection.className = 'animation-modal-v2__solution';
    
    const solutionTitle = document.createElement('h3');
    solutionTitle.textContent = 'Solution';
    
    const movesContainer = document.createElement('div');
    movesContainer.className = 'animation-modal-v2__moves';
    movesContainer.id = 'anim-moves-container';
    
    const progressDisplay = document.createElement('div');
    progressDisplay.className = 'animation-modal-v2__progress';
    progressDisplay.innerHTML = `Move <span id="anim-move-num">0</span> of <span id="anim-total-moves">0</span>`;
    
    solutionSection.appendChild(solutionTitle);
    solutionSection.appendChild(movesContainer);
    solutionSection.appendChild(progressDisplay);
    
    // Right column: Cube and controls
    const cubeSection = document.createElement('div');
    cubeSection.className = 'animation-modal-v2__cube-section';
    
    // Cube container
    const cubeContainer = document.createElement('div');
    cubeContainer.id = 'animation-cube-container-v2';
    cubeContainer.className = 'animation-cube-container-v2';
    
    // Playback controls
    const controls = document.createElement('div');
    controls.className = 'animation-modal-v2__controls';
    
    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.id = 'anim-reset-btn';
    resetBtn.className = 'anim-control-btn';
    resetBtn.title = 'Reset';
    resetBtn.textContent = '⏮';
    resetBtn.addEventListener('click', () => this.reset());
    
    // Step back button
    const stepBackBtn = document.createElement('button');
    stepBackBtn.id = 'anim-step-back-btn';
    stepBackBtn.className = 'anim-control-btn';
    stepBackBtn.title = 'Previous';
    stepBackBtn.textContent = '⏪';
    stepBackBtn.addEventListener('click', () => this.stepBackward());
    
    // Play button
    const playBtn = document.createElement('button');
    playBtn.id = 'anim-play-btn';
    playBtn.className = 'anim-control-btn anim-control-btn--primary';
    playBtn.title = 'Play';
    playBtn.textContent = '▶';
    playBtn.addEventListener('click', () => this.play());
    
    // Pause button
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'anim-pause-btn';
    pauseBtn.className = 'anim-control-btn anim-control-btn--primary';
    pauseBtn.title = 'Pause';
    pauseBtn.textContent = '⏸';
    pauseBtn.style.display = 'none';
    pauseBtn.addEventListener('click', () => this.pause());
    
    // Step forward button
    const stepForwardBtn = document.createElement('button');
    stepForwardBtn.id = 'anim-step-forward-btn';
    stepForwardBtn.className = 'anim-control-btn';
    stepForwardBtn.title = 'Next';
    stepForwardBtn.textContent = '⏩';
    stepForwardBtn.addEventListener('click', () => this.stepForward());
    
    // Assemble controls
    controls.appendChild(resetBtn);
    controls.appendChild(stepBackBtn);
    controls.appendChild(playBtn);
    controls.appendChild(pauseBtn);
    controls.appendChild(stepForwardBtn);
    
    // Assemble cube section
    cubeSection.appendChild(cubeContainer);
    cubeSection.appendChild(controls);
    
    // Assemble layout
    layout.appendChild(solutionSection);
    layout.appendChild(cubeSection);
    
    // Assemble content
    content.appendChild(closeBtn);
    content.appendChild(layout);
    
    // Assemble modal
    modal.appendChild(backdrop);
    modal.appendChild(content);
    
    // Store references
    this.modal = modal;
    this.cubeContainer = cubeContainer;
    
    // Add ESC key listener
    this._escKeyHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    
    // Add backdrop click listener
    backdrop.addEventListener('click', () => this.close());
    
    return modal;
  }

  /**
   * Display modal
   * @private
   */
  _openModal() {
    try {
      if (!this.modal) {
        throw new Error('Modal not created');
      }
      
      // Add modal to DOM
      document.body.appendChild(this.modal);
      
      // Add ESC key listener
      if (this._escKeyHandler) {
        document.addEventListener('keydown', this._escKeyHandler);
      }
      
      // Force reflow to ensure initial state is rendered before transition
      this.modal.offsetHeight;
      
      // Show modal with active class (triggers CSS transition)
      requestAnimationFrame(() => {
        if (this.modal) {
          this.modal.classList.add('active');
        }
      });
    } catch (error) {
      console.error('AnimationController._openModal error:', error.message);
      alert(`Cannot open animation modal: ${error.message}`);
    }
  }

  /**
   * Hide and remove modal from DOM
   * @private
   */
  _closeModal() {
    try {
      if (!this.modal) {
        return;
      }
      
      // Remove ESC key listener
      if (this._escKeyHandler) {
        document.removeEventListener('keydown', this._escKeyHandler);
      }
      
      // Listen for transition end to remove modal from DOM
      const handleTransitionEnd = (event) => {
        // Only handle transitions on the modal content (not child elements)
        if (event.target !== event.currentTarget) {
          return;
        }
        
        // Remove the event listener
        this.modal.removeEventListener('transitionend', handleTransitionEnd);
        
        // Remove modal from DOM
        if (this.modal && this.modal.parentNode) {
          this.modal.parentNode.removeChild(this.modal);
        }
      };
      
      // Add transitionend listener to modal content
      const modalContent = this.modal.querySelector('.animation-modal-v2__content');
      if (modalContent) {
        modalContent.addEventListener('transitionend', handleTransitionEnd);
      }
      
      // Remove active class (triggers CSS transition)
      this.modal.classList.remove('active');
      
      // Fallback: Remove modal after timeout if transitionend doesn't fire
      setTimeout(() => {
        if (this.modal && this.modal.parentNode) {
          // Remove listener if it's still attached
          if (modalContent) {
            modalContent.removeEventListener('transitionend', handleTransitionEnd);
          }
          this.modal.parentNode.removeChild(this.modal);
        }
      }, 400); // Slightly longer than transition duration as fallback
    } catch (error) {
      console.error('AnimationController._closeModal error:', error.message);
      
      // Force cleanup even if there's an error
      try {
        if (this.modal && this.modal.parentNode) {
          this.modal.parentNode.removeChild(this.modal);
        }
        if (this._escKeyHandler) {
          document.removeEventListener('keydown', this._escKeyHandler);
        }
      } catch (cleanupError) {
        console.error('AnimationController._closeModal cleanup error:', cleanupError.message);
      }
    }
  }

  /**
   * Render cube visualization to DOM
   * @param {string} cubestring - 54-character cube state
   * @private
   */
  _renderCube(cubestring) {
    try {
      if (!this.cubeContainer) {
        throw new Error('Cube container not initialized');
      }
      
      if (!cubestring || typeof cubestring !== 'string' || cubestring.length !== 54) {
        throw new Error('Invalid cubestring for rendering');
      }

      // Check if we need to create the cube structure or can reuse existing
      if (!this.cachedCubeWrapper || !this.cachedStickers) {
        this._createCubeStructure();
      }
      
      // Batch DOM updates by using DocumentFragment or direct updates
      // Update sticker colors by modifying CSS classes instead of inline styles
      this._updateStickerColors(cubestring);
      
      // Set up transitionend listener for animation completion detection
      this._setupTransitionEndListener();
    } catch (error) {
      console.error('AnimationController._renderCube error:', error.message);
      
      // Display error message in cube container
      if (this.cubeContainer) {
        this.cubeContainer.innerHTML = `
          <div style="color: red; text-align: center; padding: 20px;">
            <p>Error rendering cube</p>
            <p style="font-size: 0.9em;">${error.message}</p>
          </div>
        `;
      }
    }
  }

  /**
   * Create the cube DOM structure once and cache references
   * @private
   */
  _createCubeStructure() {
    // Clear container
    this.cubeContainer.innerHTML = '';
    
    // Create cube wrapper with 3D perspective
    const cubeWrapper = document.createElement('div');
    cubeWrapper.className = 'anim-cube-3d';
    
    // Define face order and sticker indices
    // Face order: Up (0-8), Right (9-17), Front (18-26), Down (27-35), Left (36-44), Back (45-53)
    const faces = [
      { name: 'front', indices: [18, 19, 20, 21, 22, 23, 24, 25, 26] },
      { name: 'back', indices: [45, 46, 47, 48, 49, 50, 51, 52, 53] },
      { name: 'right', indices: [9, 10, 11, 12, 13, 14, 15, 16, 17] },
      { name: 'left', indices: [36, 37, 38, 39, 40, 41, 42, 43, 44] },
      { name: 'top', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { name: 'bottom', indices: [27, 28, 29, 30, 31, 32, 33, 34, 35] }
    ];
    
    // Create array to cache sticker elements by their index
    this.cachedStickers = new Array(54);
    
    // Create each face
    faces.forEach(face => {
      const faceElement = document.createElement('div');
      faceElement.className = `anim-cube-face anim-cube-face--${face.name}`;
      
      // Create 9 stickers for this face
      face.indices.forEach(index => {
        const sticker = document.createElement('div');
        sticker.className = 'anim-cube-sticker';
        sticker.dataset.index = index;
        
        // Cache the sticker element
        this.cachedStickers[index] = sticker;
        
        faceElement.appendChild(sticker);
      });
      
      cubeWrapper.appendChild(faceElement);
    });
    
    // Apply mobile-specific optimizations
    this._applyMobileOptimizations(cubeWrapper);
    
    // Cache the cube wrapper
    this.cachedCubeWrapper = cubeWrapper;
    
    // Add to DOM
    this.cubeContainer.appendChild(cubeWrapper);
  }

  /**
   * Update sticker colors using CSS classes for better performance
   * @param {string} cubestring - 54-character cube state
   * @private
   */
  _updateStickerColors(cubestring) {
    // Batch DOM updates by reading all values first, then writing
    const updates = [];
    
    // Read phase: determine what needs to change
    for (let i = 0; i < 54; i++) {
      const sticker = this.cachedStickers[i];
      const newColor = cubestring[i];
      const currentColor = sticker.dataset.color;
      
      if (currentColor !== newColor) {
        updates.push({ sticker, newColor });
      }
    }
    
    // Write phase: apply all changes at once to minimize reflows
    updates.forEach(({ sticker, newColor }) => {
      // Update data attribute
      sticker.dataset.color = newColor;
      
      // Use CSS class instead of inline style for better performance
      // Remove all color classes first
      sticker.classList.remove('color-U', 'color-R', 'color-F', 'color-D', 'color-L', 'color-B');
      
      // Add new color class
      sticker.classList.add(`color-${newColor}`);
      
      // Fallback: set inline style for browsers that don't support the CSS classes
      // This ensures compatibility while still benefiting from batching
      sticker.style.backgroundColor = this._getColorHex(newColor);
    });
  }

  /**
   * Apply a move to the virtual cubestring
   * @param {string} moveNotation - Move notation (e.g., 'R', "U'", 'D2')
   * @private
   */
  _applyMove(moveNotation) {
    try {
      const move = this._parseMove(moveNotation);
      
      // Apply the move the specified number of times
      for (let i = 0; i < move.turns; i++) {
        this.virtualCubestring = this._rotateFace(
          this.virtualCubestring,
          move.face,
          move.direction
        );
      }
    } catch (error) {
      console.error(`AnimationController._applyMove error for move '${moveNotation}':`, error.message);
      
      // Pause animation if playing
      if (this.animationState === 'playing') {
        this.pause();
      }
      
      // Show user-friendly error message
      alert(`Animation error: Invalid move '${moveNotation}'. ${error.message}`);
      
      // Re-throw to allow caller to handle if needed
      throw error;
    }
  }

  /**
   * Parse move notation into face, direction, and turns
   * @param {string} notation - Move notation (e.g., 'R', "U'", 'D2')
   * @returns {Object} Object with face, direction, turns, and notation properties
   * @private
   */
  _parseMove(notation) {
    if (!notation || typeof notation !== 'string') {
      throw new Error('Invalid move notation: must be a non-empty string');
    }

    const face = notation[0].toUpperCase();
    const validFaces = ['R', 'L', 'U', 'D', 'F', 'B'];
    
    if (!validFaces.includes(face)) {
      throw new Error(`Invalid face in move notation: ${face}`);
    }

    const modifier = notation.slice(1);
    let direction = 'clockwise';
    let turns = 1;

    if (modifier === "'") {
      direction = 'counterclockwise';
      turns = 1;
    } else if (modifier === '2') {
      direction = 'clockwise';
      turns = 2;
    } else if (modifier === '') {
      direction = 'clockwise';
      turns = 1;
    } else {
      throw new Error(`Invalid modifier in move notation: ${modifier}`);
    }

    return { face, direction, turns, notation };
  }

  /**
   * Rotate a face on the cube
   * @param {string} cubestring - Current 54-character cubestring
   * @param {string} face - Face to rotate (R, L, U, D, F, B)
   * @param {string} direction - Direction ('clockwise' or 'counterclockwise')
   * @returns {string} New cubestring after rotation
   * @private
   */
  _rotateFace(cubestring, face, direction) {
    const cube = cubestring.split('');

    if (face === 'R') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 9);
        const temp = [cube[2], cube[5], cube[8]];
        cube[2] = cube[53]; cube[5] = cube[50]; cube[8] = cube[47];
        cube[53] = cube[29]; cube[50] = cube[32]; cube[47] = cube[35];
        cube[29] = cube[20]; cube[32] = cube[23]; cube[35] = cube[26];
        cube[20] = temp[0]; cube[23] = temp[1]; cube[26] = temp[2];
      } else {
        // Counterclockwise = 3 clockwise rotations
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'L') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 36);
        const temp = [cube[0], cube[3], cube[6]];
        cube[0] = cube[18]; cube[3] = cube[21]; cube[6] = cube[24];
        cube[18] = cube[27]; cube[21] = cube[30]; cube[24] = cube[33];
        cube[27] = cube[45]; cube[30] = cube[48]; cube[33] = cube[51];
        cube[45] = temp[2]; cube[48] = temp[1]; cube[51] = temp[0];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'U') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 0);
        const temp = [cube[18], cube[19], cube[20]];
        cube[18] = cube[9]; cube[19] = cube[10]; cube[20] = cube[11];
        cube[9] = cube[45]; cube[10] = cube[46]; cube[11] = cube[47];
        cube[45] = cube[36]; cube[46] = cube[37]; cube[47] = cube[38];
        cube[36] = temp[0]; cube[37] = temp[1]; cube[38] = temp[2];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'D') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 27);
        const temp = [cube[24], cube[25], cube[26]];
        cube[24] = cube[42]; cube[25] = cube[43]; cube[26] = cube[44];
        cube[42] = cube[51]; cube[43] = cube[52]; cube[44] = cube[53];
        cube[51] = cube[15]; cube[52] = cube[16]; cube[53] = cube[17];
        cube[15] = temp[0]; cube[16] = temp[1]; cube[17] = temp[2];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'F') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 18);
        const temp = [cube[6], cube[7], cube[8]];
        cube[6] = cube[44]; cube[7] = cube[43]; cube[8] = cube[42];
        cube[44] = cube[27]; cube[43] = cube[28]; cube[42] = cube[29];
        cube[27] = cube[11]; cube[28] = cube[10]; cube[29] = cube[9];
        cube[11] = temp[0]; cube[10] = temp[1]; cube[9] = temp[2];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'B') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 45);
        const temp = [cube[0], cube[1], cube[2]];
        cube[0] = cube[17]; cube[1] = cube[16]; cube[2] = cube[15];
        cube[17] = cube[35]; cube[16] = cube[34]; cube[15] = cube[33];
        cube[35] = cube[36]; cube[34] = cube[37]; cube[33] = cube[38];
        cube[36] = temp[2]; cube[37] = temp[1]; cube[38] = temp[0];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    }

    return cube.join('');
  }

  /**
   * Rotate the stickers on a face clockwise
   * @param {Array} cube - Array of 54 characters representing the cube
   * @param {number} start - Starting index of the face (0, 9, 18, 27, 36, or 45)
   * @private
   */
  _rotateFaceStickers(cube, start) {
    // Store the 8 outer stickers (center at start+4 doesn't move)
    const temp = [
      cube[start + 0], cube[start + 1], cube[start + 2],
      cube[start + 3], cube[start + 5],
      cube[start + 6], cube[start + 7], cube[start + 8]
    ];
    
    // Rotate clockwise: move each sticker to its new position
    cube[start + 0] = temp[5]; // bottom-left -> top-left
    cube[start + 1] = temp[3]; // middle-left -> top-middle
    cube[start + 2] = temp[0]; // top-left -> top-right
    cube[start + 3] = temp[6]; // bottom-middle -> middle-left
    cube[start + 5] = temp[1]; // top-middle -> middle-right
    cube[start + 6] = temp[7]; // bottom-right -> bottom-left
    cube[start + 7] = temp[4]; // middle-right -> bottom-middle
    cube[start + 8] = temp[2]; // top-right -> bottom-right
  }

  /**
   * Update UI to highlight current move
   * @private
   */
  _highlightCurrentMove() {
    // Remove active class from all moves
    const allMoves = document.querySelectorAll('.animation-modal-v2__moves .move');
    allMoves.forEach(move => move.classList.remove('active'));
    
    // Add active class to current move
    if (this.currentMoveIndex > 0 && this.currentMoveIndex <= this.moveSequence.length) {
      const currentMove = document.querySelector(`.animation-modal-v2__moves .move[data-move-index="${this.currentMoveIndex - 1}"]`);
      if (currentMove) {
        currentMove.classList.add('active');
      }
    }
    
    // Update move number display
    const moveNumSpan = document.getElementById('anim-move-num');
    if (moveNumSpan) {
      moveNumSpan.textContent = this.currentMoveIndex;
    }
  }

  /**
   * Update button states (enabled/disabled)
   * @private
   */
  _updateButtonStates() {
    const playBtn = document.getElementById('anim-play-btn');
    const pauseBtn = document.getElementById('anim-pause-btn');
    const stepBackBtn = document.getElementById('anim-step-back-btn');
    const stepForwardBtn = document.getElementById('anim-step-forward-btn');
    const resetBtn = document.getElementById('anim-reset-btn');
    
    if (!playBtn || !pauseBtn || !stepBackBtn || !stepForwardBtn || !resetBtn) {
      return;
    }
    
    // Play/Pause visibility based on animation state
    if (this.animationState === 'playing') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
    } else {
      playBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
    }
    
    // Disable step backward and reset at start
    const atStart = this.currentMoveIndex === 0;
    stepBackBtn.disabled = atStart;
    resetBtn.disabled = atStart;
    
    // Disable step forward at end
    const atEnd = this.currentMoveIndex >= this.moveSequence.length;
    stepForwardBtn.disabled = atEnd;
  }

  /**
   * Schedule next animation step using requestAnimationFrame
   * @private
   */
  _scheduleNextMoveRAF() {
    // Prevent overlapping animations
    if (this.isAnimating) {
      return;
    }
    
    // Clear any existing RAF
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Check if we've reached the end
    if (this.currentMoveIndex >= this.moveSequence.length) {
      this.animationState = 'idle';
      this.isAnimating = false;
      this._updateButtonStates();
      return;
    }
    
    // Set isAnimating flag to prevent overlapping animations
    this.isAnimating = true;
    
    // Store the start time for this move
    const moveStartTime = performance.now();
    
    // Use RAF to wait for the animation duration
    const waitForDuration = (timestamp) => {
      const elapsed = timestamp - moveStartTime;
      
      // If we haven't reached the duration yet, keep waiting
      if (elapsed < this.animationDuration) {
        this.rafId = requestAnimationFrame(waitForDuration);
        return;
      }
      
      // Duration has elapsed, execute the move
      try {
        // Apply the next move
        const move = this.moveSequence[this.currentMoveIndex];
        this._applyMove(move);
        this.currentMoveIndex++;
        
        // Re-render cube with new state
        this._renderCube(this.virtualCubestring);
        
        // Update UI
        this._highlightCurrentMove();
        this._updateButtonStates();
        
        // Emit step event
        this._emitStateChange('animation:step');
        
        // Mark animation as complete
        this.isAnimating = false;
        
        // Schedule next move if still playing
        if (this.animationState === 'playing') {
          this._scheduleNextMoveRAF();
        }
      } catch (error) {
        console.error('AnimationController._scheduleNextMoveRAF error:', error.message);
        
        // Stop animation on error
        this.animationState = 'idle';
        this.isAnimating = false;
        this._updateButtonStates();
        
        // Clear RAF reference
        this.rafId = null;
      }
    };
    
    // Start the RAF loop
    this.rafId = requestAnimationFrame(waitForDuration);
  }

  /**
   * Schedule next animation step
   * @private
   */
  _scheduleNextMove() {
    // Use RAF-based timing instead of setTimeout
    this._scheduleNextMoveRAF();
  }

  /**
   * Emit custom event for animation state changes
   * @param {string} eventName - Event name (e.g., 'animation:started')
   * @private
   */
  _emitStateChange(eventName) {
    const event = new CustomEvent(eventName, {
      detail: {
        state: this.animationState,
        currentMoveIndex: this.currentMoveIndex,
        totalMoves: this.moveSequence.length
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Map color letter to hex color value
   * Colors match the main 3D view for consistency
   * @param {string} colorLetter - Color letter (U, R, F, D, L, B)
   * @returns {string} Hex color code
   * @private
   */
  _getColorHex(colorLetter) {
    const colors = {
      'U': '#ffffff', // White (Up)
      'R': '#FF3333', // Red (Right) - lighter for better visibility
      'F': '#00ff00', // Green (Front)
      'D': '#ffff00', // Yellow (Down)
      'L': '#ffa500', // Orange (Left)
      'B': '#4DA6FF'  // Blue (Back) - lighter for better visibility
    };
    return colors[colorLetter] || '#CCCCCC'; // Default gray for invalid colors
  }

  /**
   * Set up transitionend event listener for animation completion detection
   * @private
   */
  _setupTransitionEndListener() {
    // Remove existing listener if present
    this._removeTransitionEndListener();
    
    // Create new handler
    this._transitionEndHandler = (event) => {
      // Only handle transitions on stickers or cube faces
      if (!event.target.classList.contains('anim-cube-sticker') && 
          !event.target.classList.contains('anim-cube-face')) {
        return;
      }
      
      // Mark animation as complete when transition ends
      if (this.isAnimating) {
        this.isAnimating = false;
        
        // Emit event for animation completion
        this._emitStateChange('animation:transition-complete');
      }
    };
    
    // Add listener to cube container
    if (this.cubeContainer) {
      this.cubeContainer.addEventListener('transitionend', this._transitionEndHandler);
    }
  }

  /**
   * Remove transitionend event listener
   * @private
   */
  _removeTransitionEndListener() {
    if (this._transitionEndHandler && this.cubeContainer) {
      this.cubeContainer.removeEventListener('transitionend', this._transitionEndHandler);
      this._transitionEndHandler = null;
    }
  }

  /**
   * Detect if device is mobile
   * @returns {boolean} True if mobile device
   * @private
   */
  _detectMobile() {
    // Check user agent for mobile indicators
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    
    // Check for touch support
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check screen size (mobile typically < 768px)
    const isSmallScreen = window.innerWidth < 768;
    
    return mobileRegex.test(userAgent) || (hasTouch && isSmallScreen);
  }

  /**
   * Detect if device is low-end (limited GPU/CPU)
   * @returns {boolean} True if low-end device
   * @private
   */
  _detectLowEndDevice() {
    // Check for hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 4;
    
    // Check device memory (if available)
    const memory = navigator.deviceMemory || 4; // GB
    
    // Check if mobile
    const isMobile = this.isMobile;
    
    // Low-end criteria: mobile with <= 2 cores or <= 2GB RAM
    return isMobile && (cores <= 2 || memory <= 2);
  }

  /**
   * Detect if user prefers reduced motion
   * @returns {boolean} True if user prefers reduced motion
   * @private
   */
  _detectReducedMotion() {
    // Check for prefers-reduced-motion media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Listen for changes to the preference
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
        this.animationDuration = this.prefersReducedMotion ? 100 : 500;
        
        // Re-apply optimizations if cube is currently rendered
        const cubeWrapper = this.cubeContainer?.querySelector('.anim-cube-3d');
        if (cubeWrapper) {
          if (this.prefersReducedMotion) {
            cubeWrapper.style.animation = 'none';
          } else if (!this.isMobile) {
            // Re-enable floating animation if not on mobile
            cubeWrapper.style.animation = '';
          }
        }
      });
    }
    
    return mediaQuery.matches;
  }

  /**
   * Apply mobile-specific optimizations to cube wrapper
   * @param {HTMLElement} cubeWrapper - The cube 3D wrapper element
   * @private
   */
  _applyMobileOptimizations(cubeWrapper) {
    if (!cubeWrapper) return;
    
    // Add mobile-specific class for CSS targeting
    if (this.isMobile) {
      cubeWrapper.classList.add('anim-cube-3d--mobile');
    }
    
    // Add low-end device class for additional optimizations
    if (this.isLowEndDevice) {
      cubeWrapper.classList.add('anim-cube-3d--low-end');
    }
    
    // Disable floating animation on mobile for better performance
    if (this.isMobile) {
      cubeWrapper.style.animation = 'none';
    }
    
    // Disable floating animation for reduced motion preference
    if (this.prefersReducedMotion) {
      cubeWrapper.style.animation = 'none';
    }
  }
}
