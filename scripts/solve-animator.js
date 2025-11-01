/**
 * SolveAnimator - Manages animation playback of Rubik's cube solutions
 * 
 * This module handles:
 * - Full-screen modal lifecycle management
 * - Animation state machine (idle, playing, paused, completed)
 * - Virtual cube state for animation visualization
 * - Dedicated animation renderer instance
 * - Move sequence execution with timing control
 * - Playback controls (play, pause, step, speed, reset)
 */

export class SolveAnimator {
  constructor() {
    // Modal management
    this.modal = null; // Modal element reference
    
    // Animation renderer management
    this.animationRenderer = null; // Dedicated CubeRenderer instance for animation
    this.animationContainer = null; // Container element in modal for the cube
    
    // State machine properties
    this.animationState = 'idle'; // idle, playing, paused, completed
    
    // Virtual cube state management
    this.originalCubestring = null; // Original cube state before animation
    this.virtualCubestring = null; // Current virtual state during animation
    
    // Move sequence storage and tracking
    this.moveSequence = []; // Array of move notations (e.g., ['R', 'U', "R'", 'D2'])
    this.currentMoveIndex = 0; // Current position in move sequence
    
    // Speed settings (in milliseconds)
    this.speed = 'normal'; // Current speed setting
    this.speedDurations = {
      slow: 800,
      normal: 500,
      fast: 300
    };
    
    // Animation timing control
    this.animationTimeout = null; // Reference to setTimeout for animation scheduling
    
    // Debouncing control for rapid inputs
    this.lastControlAction = 0; // Timestamp of last control action
    this.controlDebounceMs = 100; // Minimum time between control actions
    
    // Error state tracking
    this.hasError = false; // Flag to track if an error occurred
    this.errorMessage = null; // Store error message for display
  }

  /**
   * Initialize and start animation with solution moves
   * @param {Array<string>} moveSequence - Array of move notations
   * @param {string} currentCubestring - Current cube state to animate from
   */
  async startAnimation(moveSequence, currentCubestring) {
    try {
      // Validate inputs
      if (!this._validateMoveSequence(moveSequence)) {
        throw new Error('Invalid move sequence provided');
      }
      
      if (!this._validateCubestring(currentCubestring)) {
        throw new Error('Invalid cubestring provided');
      }
      
      // Store move sequence and original state
      this.moveSequence = moveSequence;
      this.originalCubestring = currentCubestring;
      this.virtualCubestring = currentCubestring;
      this.currentMoveIndex = 0;
      this.animationState = 'paused'; // Start paused, user clicks play
      this.hasError = false;
      this.errorMessage = null;
      
      // Create and open modal
      this._createModal();
      this._openModal();
      
      // Create animation renderer in modal
      const container = this.modal.querySelector('#animation-cube-container');
      await this._createAnimationRenderer(container);
      
      // Initialize UI
      this._updateVisualization();
      this._highlightCurrentMove();
      this._updateButtonStates();
      
      // Emit started event
      this._emitStateChange('animation:started');
    } catch (error) {
      console.error('Failed to start animation:', error);
      this._handleError(error);
      
      // Cleanup if modal was created
      if (this.modal) {
        this.close();
      }
      
      // Show user-friendly error message
      this._showErrorNotification('Failed to start animation: ' + error.message);
    }
  }

  /**
   * Start or resume animation playback
   */
  play() {
    // Debounce rapid control inputs
    if (!this._checkDebounce()) {
      return;
    }
    
    // Don't play if in error state
    if (this.hasError) {
      console.warn('Cannot play animation: error state');
      return;
    }
    
    if (this.animationState === 'completed') {
      return; // Don't play if already completed
    }
    
    try {
      this.animationState = 'playing';
      this._updateButtonStates();
      this._emitStateChange('animation:resumed');
      
      // Start playing from current position
      this._scheduleNextMove();
    } catch (error) {
      console.error('Error during play:', error);
      this._handleError(error);
    }
  }

  /**
   * Pause animation playback
   */
  pause() {
    // Debounce rapid control inputs
    if (!this._checkDebounce()) {
      return;
    }
    
    try {
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
      }
      
      this.animationState = 'paused';
      this._updateButtonStates();
      this._emitStateChange('animation:paused');
    } catch (error) {
      console.error('Error during pause:', error);
      this._handleError(error);
    }
  }

  /**
   * Advance one move forward
   */
  stepForward() {
    // Debounce rapid control inputs
    if (!this._checkDebounce()) {
      return;
    }
    
    // Don't step if in error state
    if (this.hasError) {
      console.warn('Cannot step forward: error state');
      return;
    }
    
    try {
      // Pause any ongoing animation
      this.pause();
      
      // Check if we can step forward
      if (this.currentMoveIndex >= this.moveSequence.length) {
        return;
      }
      
      // Apply the current move
      const move = this.moveSequence[this.currentMoveIndex];
      this._applyMove(move);
      this.currentMoveIndex++;
      
      // Update visualization and UI
      this._updateVisualization();
      this._highlightCurrentMove();
      this._updateButtonStates();
      
      // Check if completed
      if (this.currentMoveIndex >= this.moveSequence.length) {
        this.animationState = 'completed';
        this._showCompletionIndicator();
        this._emitStateChange('animation:completed');
      } else {
        this._emitStateChange('animation:step');
      }
    } catch (error) {
      console.error('Error during step forward:', error);
      this._handleError(error);
    }
  }

  /**
   * Go back one move
   */
  stepBackward() {
    // Debounce rapid control inputs
    if (!this._checkDebounce()) {
      return;
    }
    
    // Don't step if in error state
    if (this.hasError) {
      console.warn('Cannot step backward: error state');
      return;
    }
    
    try {
      // Pause any ongoing animation
      this.pause();
      
      // Check if we can step backward
      if (this.currentMoveIndex <= 0) {
        return;
      }
      
      // Rebuild virtual state from scratch up to previous move
      this.virtualCubestring = this.originalCubestring;
      this.currentMoveIndex--;
      
      for (let i = 0; i < this.currentMoveIndex; i++) {
        this._applyMove(this.moveSequence[i]);
      }
      
      // Update visualization and UI
      this._updateVisualization();
      this._highlightCurrentMove();
      this._updateButtonStates();
      
      // Hide completion indicator if it was showing
      const indicator = this.modal?.querySelector('#completion-indicator');
      if (indicator) {
        indicator.style.display = 'none';
      }
      
      // Reset state from completed if needed
      if (this.animationState === 'completed') {
        this.animationState = 'paused';
      }
      
      this._emitStateChange('animation:step');
    } catch (error) {
      console.error('Error during step backward:', error);
      this._handleError(error);
    }
  }

  /**
   * Reset animation to beginning and restore original virtual state
   */
  reset() {
    // Debounce rapid control inputs
    if (!this._checkDebounce()) {
      return;
    }
    
    try {
      // Clear any pending timeouts
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
      }
      
      // Reset to beginning
      this.currentMoveIndex = 0;
      this.virtualCubestring = this.originalCubestring;
      
      // Clear error state on reset
      this.hasError = false;
      this.errorMessage = null;
      this._hideErrorNotification();
      
      // Update visualization
      this._updateVisualization();
      this._highlightCurrentMove();
      this._updateButtonStates();
      
      // Hide completion indicator if visible
      const indicator = this.modal?.querySelector('#completion-indicator');
      if (indicator) {
        indicator.style.display = 'none';
      }
      
      // Update state
      this.animationState = 'paused';
      this._emitStateChange('animation:reset');
    } catch (error) {
      console.error('Error during reset:', error);
      this._handleError(error);
    }
  }

  /**
   * Adjust animation speed
   * @param {string} speed - Speed setting ('slow', 'normal', 'fast')
   */
  setSpeed(speed) {
    if (!this.speedDurations[speed]) {
      console.warn(`Invalid speed setting: ${speed}`);
      return;
    }
    
    this.speed = speed;
    
    // If currently playing, restart the timer with new speed
    if (this.animationState === 'playing') {
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
      }
      this._scheduleNextMove();
    }
  }

  /**
   * Exit animation mode, cleanup renderer, and close modal
   */
  close() {
    try {
      // Clear any pending timeouts
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
      }
      
      // Cleanup renderer
      this._cleanupRenderer();
      
      // Close and remove modal
      this._closeModal();
      
      // Reset state
      this.animationState = 'idle';
      this.moveSequence = [];
      this.currentMoveIndex = 0;
      this.originalCubestring = null;
      this.virtualCubestring = null;
      this.hasError = false;
      this.errorMessage = null;
      
      this._emitStateChange('animation:closed');
    } catch (error) {
      console.error('Error during close:', error);
      // Still try to cleanup even if there's an error
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
      this.animationRenderer = null;
    }
  }

  /**
   * Create full-screen modal overlay HTML structure
   * @private
   */
  _createModal() {
    const modal = document.createElement('div');
    modal.id = 'animation-modal';
    modal.className = 'animation-modal';
    
    modal.innerHTML = `
      <!-- Backdrop for dimming background -->
      <div class="animation-modal-backdrop"></div>
      
      <!-- Modal content container -->
      <div class="animation-modal-content">
        <!-- Close button in top-right corner -->
        <button class="animation-modal-close" title="Close (ESC)">✕</button>
        
        <!-- Dedicated 3D cube container for animation -->
        <div id="animation-cube-container" class="animation-cube-container">
          <!-- CubeRenderer will inject 3D cube here -->
        </div>
        
        <!-- Animation controls below the cube -->
        <div class="animation-controls">
          <div class="animation-progress">
            <span class="current-move-display">Move <span id="current-move-num">0</span> of <span id="total-moves">${this.moveSequence.length}</span></span>
            <span class="current-move-notation" id="current-move-text">-</span>
            <span class="completion-indicator" id="completion-indicator" style="display:none;">✓ Complete!</span>
          </div>
          
          <div class="playback-buttons">
            <button id="reset-btn" class="control-btn" title="Reset to Start">⏮⏮</button>
            <button id="step-backward-btn" class="control-btn" title="Previous Move">⏮</button>
            <button id="play-btn" class="control-btn primary" title="Play">▶</button>
            <button id="pause-btn" class="control-btn primary" title="Pause" style="display:none;">⏸</button>
            <button id="step-forward-btn" class="control-btn" title="Next Move">⏭</button>
          </div>
          
          <div class="speed-control">
            <label>Speed:</label>
            <select id="animation-speed">
              <option value="slow">Slow (800ms)</option>
              <option value="normal" selected>Normal (500ms)</option>
              <option value="fast">Fast (300ms)</option>
            </select>
          </div>
        </div>
      </div>
    `;
    
    this.modal = modal;
    
    // Wire up event handlers
    const closeBtn = modal.querySelector('.animation-modal-close');
    closeBtn.addEventListener('click', () => this.close());
    
    const backdrop = modal.querySelector('.animation-modal-backdrop');
    backdrop.addEventListener('click', (e) => this._handleBackdropClick(e));
    
    const playBtn = modal.querySelector('#play-btn');
    playBtn.addEventListener('click', () => this.play());
    
    const pauseBtn = modal.querySelector('#pause-btn');
    pauseBtn.addEventListener('click', () => this.pause());
    
    const stepForwardBtn = modal.querySelector('#step-forward-btn');
    stepForwardBtn.addEventListener('click', () => this.stepForward());
    
    const stepBackwardBtn = modal.querySelector('#step-backward-btn');
    stepBackwardBtn.addEventListener('click', () => this.stepBackward());
    
    const resetBtn = modal.querySelector('#reset-btn');
    resetBtn.addEventListener('click', () => this.reset());
    
    const speedSelect = modal.querySelector('#animation-speed');
    speedSelect.addEventListener('change', (e) => this.setSpeed(e.target.value));
  }

  /**
   * Display modal and add to DOM
   * @private
   */
  _openModal() {
    // Add modal to DOM
    document.body.appendChild(this.modal);
    
    // Add ESC key listener
    this.boundEscKeyHandler = (e) => this._handleEscKey(e);
    document.addEventListener('keydown', this.boundEscKeyHandler);
    
    // Trigger reflow to enable CSS transition
    this.modal.offsetHeight;
    
    // Add active class for fade-in animation
    this.modal.classList.add('active');
  }

  /**
   * Hide and remove modal from DOM
   * @private
   */
  _closeModal() {
    if (!this.modal) {
      return;
    }
    
    // Remove ESC key listener
    if (this.boundEscKeyHandler) {
      document.removeEventListener('keydown', this.boundEscKeyHandler);
      this.boundEscKeyHandler = null;
    }
    
    // Remove active class for fade-out animation
    this.modal.classList.remove('active');
    
    // Wait for transition to complete before removing from DOM
    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
    }, 300); // Match CSS transition duration
  }

  /**
   * Create dedicated CubeRenderer instance for animation
   * @param {HTMLElement} container - Container element for the renderer
   * @private
   */
  async _createAnimationRenderer(container) {
    try {
      if (!container) {
        throw new Error('Container element not found for animation renderer');
      }
      
      // Import CubeRenderer and CubeState
      const { CubeRenderer } = await import('./cube-renderer.js');
      const { CubeState } = await import('./cube-state.js');
      
      if (!CubeRenderer || !CubeState) {
        throw new Error('Failed to import required modules');
      }
      
      // Create a temporary CubeState instance for the animation renderer
      // This is needed because CubeRenderer expects a CubeState instance
      const tempCubeState = new CubeState();
      tempCubeState.cubestring = this.virtualCubestring;
      
      // Create renderer with animation options
      this.animationRenderer = new CubeRenderer(container, tempCubeState, {
        isAnimationRenderer: true
      });
      
      if (!this.animationRenderer) {
        throw new Error('Failed to create animation renderer');
      }
      
      this.animationContainer = container;
    } catch (error) {
      console.error('Failed to create animation renderer:', error);
      throw new Error('Renderer creation failed: ' + error.message);
    }
  }

  /**
   * Apply single move to virtual cube state
   * @param {string} moveNotation - Move notation (e.g., 'R', "R'", 'R2')
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
      console.error(`Failed to apply move "${moveNotation}":`, error);
      throw new Error(`Invalid move notation: ${moveNotation}`);
    }
  }

  /**
   * Update animation renderer with current virtual state
   * @private
   */
  _updateVisualization() {
    try {
      if (!this.animationRenderer) {
        console.warn('Animation renderer not available for visualization update');
        return;
      }
      
      if (!this.virtualCubestring) {
        console.warn('Virtual cubestring not available for visualization update');
        return;
      }
      
      // Use renderFromCubestring to update the animation cube
      this.animationRenderer.renderFromCubestring(this.virtualCubestring, true);
    } catch (error) {
      console.error('Failed to update visualization:', error);
      // Don't throw - visualization errors shouldn't stop the animation
    }
  }

  /**
   * Update UI to highlight current move in solution display
   * @private
   */
  _highlightCurrentMove() {
    if (!this.modal) {
      return;
    }
    
    // Update move number display in animation modal
    const moveNumDisplay = this.modal.querySelector('#current-move-num');
    if (moveNumDisplay) {
      moveNumDisplay.textContent = this.currentMoveIndex;
    }
    
    // Update total moves display in animation modal
    const totalMovesDisplay = this.modal.querySelector('#total-moves');
    if (totalMovesDisplay) {
      totalMovesDisplay.textContent = this.moveSequence.length;
    }
    
    // Update current move notation in animation modal
    const moveTextDisplay = this.modal.querySelector('#current-move-text');
    if (moveTextDisplay) {
      if (this.currentMoveIndex > 0 && this.currentMoveIndex <= this.moveSequence.length) {
        moveTextDisplay.textContent = this.moveSequence[this.currentMoveIndex - 1];
      } else if (this.currentMoveIndex === 0) {
        moveTextDisplay.textContent = '-';
      } else {
        moveTextDisplay.textContent = 'Complete';
      }
    }
    
    // Highlight current move in the solve popup solution display
    this._highlightMoveInSolutionDisplay();
  }
  
  /**
   * Highlight the current move in the solve popup solution display
   * @private
   */
  _highlightMoveInSolutionDisplay() {
    // Find the solve results container in the solve popup (not the animation modal)
    const solveResults = document.getElementById('solve-results');
    if (!solveResults) {
      return;
    }
    
    // Find all move spans in the solution display
    const moveSpans = solveResults.querySelectorAll('.move');
    if (moveSpans.length === 0) {
      return;
    }
    
    // Remove 'active' class from all moves
    moveSpans.forEach(span => {
      span.classList.remove('active');
    });
    
    // Add 'active' class to the current move
    // currentMoveIndex represents the next move to be applied (0-based)
    // So we highlight the move at currentMoveIndex - 1 (the last applied move)
    if (this.currentMoveIndex > 0 && this.currentMoveIndex <= this.moveSequence.length) {
      const currentMoveSpan = solveResults.querySelector(`.move[data-move-index="${this.currentMoveIndex - 1}"]`);
      if (currentMoveSpan) {
        currentMoveSpan.classList.add('active');
        
        // Scroll the highlighted move into view if needed
        currentMoveSpan.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }

  /**
   * Display completion message/indicator
   * @private
   */
  _showCompletionIndicator() {
    const indicator = this.modal?.querySelector('#completion-indicator');
    if (indicator) {
      indicator.style.display = 'inline';
      // Auto-hide after 3 seconds
      setTimeout(() => {
        if (indicator) {
          indicator.style.display = 'none';
        }
      }, 3000);
    }
  }

  /**
   * Calculate animation duration based on current speed setting
   * @returns {number} Duration in milliseconds
   * @private
   */
  _getAnimationDuration() {
    return this.speedDurations[this.speed];
  }

  /**
   * Emit custom event for animation state changes
   * @param {string} eventName - Name of the event to emit
   * @param {Object} detail - Event detail data
   * @private
   */
  _emitStateChange(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: {
        ...detail,
        state: this.animationState,
        currentMoveIndex: this.currentMoveIndex,
        totalMoves: this.moveSequence.length
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Destroy animation renderer and cleanup resources
   * @private
   */
  _cleanupRenderer() {
    try {
      if (this.animationRenderer) {
        // Call destroy method if it exists
        if (typeof this.animationRenderer.destroy === 'function') {
          this.animationRenderer.destroy();
        }
        this.animationRenderer = null;
      }
      this.animationContainer = null;
    } catch (error) {
      console.error('Error during renderer cleanup:', error);
      // Force cleanup even if there's an error
      this.animationRenderer = null;
      this.animationContainer = null;
    }
  }

  /**
   * Get current animation state (for testing)
   * @returns {string} Current animation state
   */
  getState() {
    return this.animationState;
  }

  /**
   * Handle ESC key press to close modal
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  _handleEscKey(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  /**
   * Handle backdrop click to close modal
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleBackdropClick(event) {
    if (event.target.classList.contains('animation-modal-backdrop')) {
      this.close();
    }
  }

  /**
   * Schedule next move in animation sequence
   * @private
   */
  _scheduleNextMove() {
    try {
      // Check if we've reached the end
      if (this.currentMoveIndex >= this.moveSequence.length) {
        this.animationState = 'completed';
        this._showCompletionIndicator();
        this._updateButtonStates();
        this._emitStateChange('animation:completed');
        return;
      }
      
      const duration = this._getAnimationDuration();
      
      this.animationTimeout = setTimeout(() => {
        try {
          if (this.animationState !== 'playing') {
            return; // Animation was paused
          }
          
          // Apply the current move
          const move = this.moveSequence[this.currentMoveIndex];
          this._applyMove(move);
          this.currentMoveIndex++;
          
          // Update visualization and UI
          this._updateVisualization();
          this._highlightCurrentMove();
          this._updateButtonStates();
          this._emitStateChange('animation:step');
          
          // Schedule next move
          this._scheduleNextMove();
        } catch (error) {
          console.error('Error during animation step:', error);
          this._handleError(error);
          this.pause(); // Stop animation on error
        }
      }, duration);
    } catch (error) {
      console.error('Error scheduling next move:', error);
      this._handleError(error);
      this.pause();
    }
  }

  /**
   * Parse move notation into components
   * @param {string} notation - Move notation (e.g., 'R', "R'", 'R2')
   * @returns {Object} Parsed move object with face, direction, and turns
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
   * Apply rotation transformation to cubestring
   * @param {string} cubestring - Current cube state
   * @param {string} face - Face to rotate (R, L, U, D, F, B)
   * @param {string} direction - Rotation direction ('clockwise' or 'counterclockwise')
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
   * Rotate the 9 stickers of a face clockwise
   * @param {Array} cube - Cube array (54 characters)
   * @param {number} start - Starting position of the face
   * @private
   */
  _rotateFaceStickers(cube, start) {
    const temp = [
      cube[start + 0], cube[start + 1], cube[start + 2],
      cube[start + 3], cube[start + 5],
      cube[start + 6], cube[start + 7], cube[start + 8]
    ];
    
    cube[start + 0] = temp[5];
    cube[start + 1] = temp[3];
    cube[start + 2] = temp[0];
    cube[start + 3] = temp[6];
    cube[start + 5] = temp[1];
    cube[start + 6] = temp[7];
    cube[start + 7] = temp[4];
    cube[start + 8] = temp[2];
  }

  /**
   * Update button states based on current animation state
   * @private
   */
  _updateButtonStates() {
    if (!this.modal) {
      return;
    }
    
    const playBtn = this.modal.querySelector('#play-btn');
    const pauseBtn = this.modal.querySelector('#pause-btn');
    const stepBackBtn = this.modal.querySelector('#step-backward-btn');
    const stepForwardBtn = this.modal.querySelector('#step-forward-btn');
    const resetBtn = this.modal.querySelector('#reset-btn');
    
    // Play/Pause button visibility based on animation state
    if (this.animationState === 'playing') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
    } else {
      playBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
    }
    
    // Disable step backward and reset at first move
    const atStart = this.currentMoveIndex === 0;
    stepBackBtn.disabled = atStart;
    resetBtn.disabled = atStart;
    
    // Disable step forward at last move
    const atEnd = this.currentMoveIndex >= this.moveSequence.length;
    stepForwardBtn.disabled = atEnd;
    
    // Disable play button if at end or completed
    if (atEnd || this.animationState === 'completed') {
      playBtn.disabled = true;
    } else {
      playBtn.disabled = false;
    }
    
    // Disable all controls if in error state
    if (this.hasError) {
      if (playBtn) playBtn.disabled = true;
      if (pauseBtn) pauseBtn.disabled = true;
      if (stepForwardBtn) stepForwardBtn.disabled = true;
      if (stepBackwardBtn) stepBackwardBtn.disabled = true;
      // Keep reset enabled to allow recovery
    }
  }

  /**
   * Validate move sequence before starting animation
   * @param {Array<string>} moveSequence - Array of move notations
   * @returns {boolean} True if valid, false otherwise
   * @private
   */
  _validateMoveSequence(moveSequence) {
    if (!Array.isArray(moveSequence)) {
      console.error('Move sequence must be an array');
      return false;
    }
    
    if (moveSequence.length === 0) {
      console.error('Move sequence cannot be empty');
      return false;
    }
    
    // Validate each move notation
    const validFaces = ['R', 'L', 'U', 'D', 'F', 'B'];
    const validModifiers = ['', "'", '2'];
    
    for (let i = 0; i < moveSequence.length; i++) {
      const move = moveSequence[i];
      
      if (typeof move !== 'string' || move.length === 0) {
        console.error(`Invalid move at index ${i}: must be a non-empty string`);
        return false;
      }
      
      const face = move[0].toUpperCase();
      if (!validFaces.includes(face)) {
        console.error(`Invalid face in move "${move}" at index ${i}`);
        return false;
      }
      
      const modifier = move.slice(1);
      if (!validModifiers.includes(modifier)) {
        console.error(`Invalid modifier in move "${move}" at index ${i}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate cubestring format
   * @param {string} cubestring - Cubestring to validate
   * @returns {boolean} True if valid, false otherwise
   * @private
   */
  _validateCubestring(cubestring) {
    if (typeof cubestring !== 'string') {
      console.error('Cubestring must be a string');
      return false;
    }
    
    if (cubestring.length !== 54) {
      console.error(`Cubestring must be 54 characters, got ${cubestring.length}`);
      return false;
    }
    
    // Validate that it contains only valid face letters
    const validChars = ['U', 'R', 'F', 'D', 'L', 'B'];
    for (let i = 0; i < cubestring.length; i++) {
      if (!validChars.includes(cubestring[i])) {
        console.error(`Invalid character "${cubestring[i]}" at position ${i}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check debounce timing for rapid control inputs
   * @returns {boolean} True if action should proceed, false if debounced
   * @private
   */
  _checkDebounce() {
    const now = Date.now();
    if (now - this.lastControlAction < this.controlDebounceMs) {
      // Too soon, debounce this action
      return false;
    }
    this.lastControlAction = now;
    return true;
  }

  /**
   * Handle errors during animation
   * @param {Error} error - Error object
   * @private
   */
  _handleError(error) {
    this.hasError = true;
    this.errorMessage = error.message || 'An unknown error occurred';
    
    // Pause animation if playing
    if (this.animationState === 'playing') {
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
      }
      this.animationState = 'paused';
    }
    
    // Update UI to reflect error state
    this._updateButtonStates();
    
    // Show error notification in modal
    this._showErrorNotification(this.errorMessage);
    
    // Emit error event
    this._emitStateChange('animation:error', { error: this.errorMessage });
  }

  /**
   * Show error notification in modal
   * @param {string} message - Error message to display
   * @private
   */
  _showErrorNotification(message) {
    if (!this.modal) {
      // If modal doesn't exist, show browser alert
      alert('Animation Error: ' + message);
      return;
    }
    
    // Check if error notification already exists
    let errorNotification = this.modal.querySelector('.animation-error-notification');
    
    if (!errorNotification) {
      // Create error notification element
      errorNotification = document.createElement('div');
      errorNotification.className = 'animation-error-notification';
      
      const modalContent = this.modal.querySelector('.animation-modal-content');
      if (modalContent) {
        modalContent.insertBefore(errorNotification, modalContent.firstChild);
      }
    }
    
    errorNotification.textContent = '⚠️ Error: ' + message;
    errorNotification.style.display = 'block';
  }

  /**
   * Hide error notification in modal
   * @private
   */
  _hideErrorNotification() {
    if (!this.modal) {
      return;
    }
    
    const errorNotification = this.modal.querySelector('.animation-error-notification');
    if (errorNotification) {
      errorNotification.style.display = 'none';
    }
  }
}
