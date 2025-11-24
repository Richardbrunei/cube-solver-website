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
    
    // Core state properties
    this.originalCubestring = null;  // Starting state
    this.virtualCubestring = null;   // Current animation state
    
    // Animation state properties
    this.moveSequence = [];          // Array of moves to animate
    this.currentMoveIndex = 0;       // Current position in sequence
    this.animationState = 'idle';    // State machine: 'idle', 'playing', 'paused'
    
    // Timing properties
    this.animationTimeout = null;    // setTimeout reference for scheduling
    this.animationDuration = 500;    // Fixed 500ms per move
    
    // Rotation state (for drag-to-rotate)
    this.rotationX = -15;            // Default X rotation (degrees)
    this.rotationY = 25;             // Default Y rotation (degrees)
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartRotationX = 0;
    this.dragStartRotationY = 0;
    this.dragYDirection = 1;         // Y rotation direction at drag start (1 or -1)
    this.rotationSensitivity = 0.4;  // Degrees per pixel
    
    // Rotation UI elements
    this.rotationResetButton = null;
    
    // Bound event handlers for cleanup
    this.boundMouseDown = null;
    this.boundMouseMove = null;
    this.boundMouseUp = null;
  }

  /**
   * Initialize animation with solution moves
   * @param {Array<string>} moveSequence - Array of move notations (e.g., ['R', 'U', "R'", 'D2'])
   * @param {string} currentCubestring - Starting cube state (54-character string)
   */
  startAnimation(moveSequence, currentCubestring) {
    // Validate inputs
    if (!Array.isArray(moveSequence) || moveSequence.length === 0) {
      console.error('Invalid moveSequence: must be a non-empty array');
      return;
    }
    
    if (typeof currentCubestring !== 'string' || currentCubestring.length !== 54) {
      console.error('Invalid currentCubestring: must be a 54-character string');
      return;
    }
    
    // Store original cubestring and create virtual copy
    this.originalCubestring = currentCubestring;
    this.virtualCubestring = currentCubestring;
    
    // Store move sequence and reset index
    this.moveSequence = moveSequence;
    this.currentMoveIndex = 0;
    
    // Set animation state to idle
    this.animationState = 'idle';
    
    // Create modal if not exists, then open it
    if (!this.modal) {
      this._createModal();
    }
    this._openModal();
    
    // Populate solution text with moves (wrap in spans with data-move-index)
    const movesContainer = document.getElementById('animation-moves-container');
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
    
    // Update UI (button states, progress display)
    this._updateButtonStates();
    this._highlightCurrentMove();
  }

  /**
   * Start or resume animation playback
   */
  play() {
    // Check not at end
    if (this.currentMoveIndex >= this.moveSequence.length) {
      console.log('Animation already at end');
      return;
    }
    
    // Set state to 'playing'
    this.animationState = 'playing';
    
    // Update buttons
    this._updateButtonStates();
    
    // Emit event
    this._emitStateChange('animation:started');
    
    // Call _scheduleNextMove()
    this._scheduleNextMove();
  }

  /**
   * Pause animation playback
   */
  pause() {
    // Clear timeout
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    
    // Set state to 'paused'
    this.animationState = 'paused';
    
    // Update buttons
    this._updateButtonStates();
    
    // Emit event
    this._emitStateChange('animation:paused');
  }

  /**
   * Advance one move forward
   */
  stepForward() {
    // Check not at end
    if (this.currentMoveIndex >= this.moveSequence.length) {
      console.log('Already at end of sequence');
      return;
    }
    
    // Pause if playing
    if (this.animationState === 'playing') {
      this.pause();
    }
    
    // Apply next move
    const move = this.moveSequence[this.currentMoveIndex];
    this._applyMove(move);
    
    // Increment index
    this.currentMoveIndex++;
    
    // Re-render cube
    this._renderCube(this.virtualCubestring);
    
    // Update UI
    this._updateButtonStates();
    this._highlightCurrentMove();
    
    // Emit event
    this._emitStateChange('animation:step');
  }

  /**
   * Go back one move
   */
  stepBackward() {
    // Check not at start
    if (this.currentMoveIndex === 0) {
      console.log('Already at start of sequence');
      return;
    }
    
    // Pause if playing
    if (this.animationState === 'playing') {
      this.pause();
    }
    
    // Decrement index
    this.currentMoveIndex--;
    
    // Rebuild virtualCubestring from scratch
    this.virtualCubestring = this.originalCubestring;
    for (let i = 0; i < this.currentMoveIndex; i++) {
      this._applyMove(this.moveSequence[i]);
    }
    
    // Re-render cube
    this._renderCube(this.virtualCubestring);
    
    // Update UI
    this._updateButtonStates();
    this._highlightCurrentMove();
    
    // Emit event
    this._emitStateChange('animation:step');
  }

  /**
   * Reset animation to beginning
   */
  reset() {
    // Clear timeout
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    
    // Reset index to 0
    this.currentMoveIndex = 0;
    
    // Restore virtualCubestring to original
    this.virtualCubestring = this.originalCubestring;
    
    // Set state to 'idle'
    this.animationState = 'idle';
    
    // Re-render cube
    this._renderCube(this.virtualCubestring);
    
    // Update UI
    this._updateButtonStates();
    this._highlightCurrentMove();
    
    // Emit event
    this._emitStateChange('animation:reset');
  }

  /**
   * Exit animation and cleanup
   */
  close() {
    // Clear any pending timeouts
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    
    // Remove mouse event listeners
    if (this.boundMouseDown) {
      const cubeElement = this.cubeContainer?.querySelector('.anim-cube-3d');
      if (cubeElement) {
        cubeElement.removeEventListener('mousedown', this.boundMouseDown);
      }
    }
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp);
    }
    
    // Remove rotation reset button from DOM
    if (this.rotationResetButton && this.rotationResetButton.parentNode) {
      this.rotationResetButton.parentNode.removeChild(this.rotationResetButton);
      this.rotationResetButton = null;
    }
    
    // Restore default cursor if dragging was active
    if (this.isDragging) {
      document.body.style.cursor = '';
    }
    
    // Close modal
    this._closeModal();
    
    // Reset all state
    this.animationState = 'idle';
    this.moveSequence = [];
    this.currentMoveIndex = 0;
    
    // Discard virtual cubestring
    this.originalCubestring = null;
    this.virtualCubestring = null;
    
    // Reset rotation state
    this.rotationX = -15;
    this.rotationY = 25;
    this.isDragging = false;
    this.boundMouseDown = null;
    this.boundMouseMove = null;
    this.boundMouseUp = null;
    
    // Emit event
    this._emitStateChange('animation:closed');
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
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'animation-modal-v2__content';

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'animation-modal-v2__close';
    closeBtn.title = 'Close (ESC)';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.close());

    // Create layout container (two-column)
    const layout = document.createElement('div');
    layout.className = 'animation-modal-v2__layout';

    // Left side: Solution text
    const solutionSection = document.createElement('div');
    solutionSection.className = 'animation-modal-v2__solution';
    
    const solutionTitle = document.createElement('h3');
    solutionTitle.textContent = 'Solution';
    
    const movesContainer = document.createElement('div');
    movesContainer.className = 'animation-modal-v2__moves';
    movesContainer.id = 'animation-moves-container';
    
    const progressDisplay = document.createElement('div');
    progressDisplay.className = 'animation-modal-v2__progress';
    progressDisplay.innerHTML = `Move <span id="anim-move-num">0</span> of <span id="anim-total-moves">0</span>`;
    
    solutionSection.appendChild(solutionTitle);
    solutionSection.appendChild(movesContainer);
    solutionSection.appendChild(progressDisplay);

    // Right side: Animated cube
    const cubeSection = document.createElement('div');
    cubeSection.className = 'animation-modal-v2__cube-section';
    
    const cubeContainer = document.createElement('div');
    cubeContainer.id = 'animation-cube-container-v2';
    cubeContainer.className = 'animation-cube-container-v2';
    
    // Playback controls
    const controls = document.createElement('div');
    controls.className = 'animation-modal-v2__controls';
    
    const resetBtn = document.createElement('button');
    resetBtn.id = 'anim-reset-btn';
    resetBtn.className = 'anim-control-btn anim-control-btn--reset';
    resetBtn.title = 'Reset to Start';
    resetBtn.innerHTML = '<span class="btn-icon">↺</span><span class="btn-label">Reset</span>';
    resetBtn.addEventListener('click', () => this.reset());
    
    const stepBackBtn = document.createElement('button');
    stepBackBtn.id = 'anim-step-back-btn';
    stepBackBtn.className = 'anim-control-btn anim-control-btn--step';
    stepBackBtn.title = 'Previous Move';
    stepBackBtn.innerHTML = '<span class="btn-icon">◀</span>';
    stepBackBtn.addEventListener('click', () => this.stepBackward());
    
    const playBtn = document.createElement('button');
    playBtn.id = 'anim-play-btn';
    playBtn.className = 'anim-control-btn anim-control-btn--primary';
    playBtn.title = 'Play Animation';
    playBtn.innerHTML = '<span class="btn-icon">▶</span><span class="btn-label">Play</span>';
    playBtn.addEventListener('click', () => this.play());
    
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'anim-pause-btn';
    pauseBtn.className = 'anim-control-btn anim-control-btn--primary';
    pauseBtn.title = 'Pause Animation';
    pauseBtn.innerHTML = '<span class="btn-icon">⏸</span><span class="btn-label">Pause</span>';
    pauseBtn.style.display = 'none';
    pauseBtn.addEventListener('click', () => this.pause());
    
    const stepForwardBtn = document.createElement('button');
    stepForwardBtn.id = 'anim-step-forward-btn';
    stepForwardBtn.className = 'anim-control-btn anim-control-btn--next';
    stepForwardBtn.title = 'Next Move';
    stepForwardBtn.innerHTML = '<span class="btn-label">Next Move</span><span class="btn-icon">▶</span>';
    stepForwardBtn.addEventListener('click', () => this.stepForward());
    
    controls.appendChild(resetBtn);
    controls.appendChild(stepBackBtn);
    controls.appendChild(playBtn);
    controls.appendChild(pauseBtn);
    controls.appendChild(stepForwardBtn);
    
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

    // Wire up ESC key handler
    this._handleEscKey = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };

    // Wire up backdrop click handler
    backdrop.addEventListener('click', () => this.close());
  }

  /**
   * Display modal
   * @private
   */
  _openModal() {
    if (!this.modal) {
      this._createModal();
    }
    
    // Append to body
    document.body.appendChild(this.modal);
    
    // Add active class (triggers display)
    // Use setTimeout to ensure CSS transition works
    setTimeout(() => {
      this.modal.classList.add('active');
    }, 10);
    
    // Add ESC key listener
    document.addEventListener('keydown', this._handleEscKey);
  }

  /**
   * Hide and remove modal from DOM
   * @private
   */
  _closeModal() {
    if (!this.modal) return;
    
    // Remove active class
    this.modal.classList.remove('active');
    
    // Remove ESC key listener
    document.removeEventListener('keydown', this._handleEscKey);
    
    // Wait for transition, then remove from DOM
    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
    }, 300); // Match CSS transition duration
  }

  /**
   * Render cube visualization to DOM
   * @param {string} cubestring - 54-character cube state
   * @private
   */
  _renderCube(cubestring) {
    if (!this.cubeContainer) {
      console.error('Cube container not found');
      return;
    }
    
    // Store current rotation state before re-rendering
    const savedRotationX = this.rotationX;
    const savedRotationY = this.rotationY;
    
    // Remove only the cube wrapper, preserve reset button
    const existingCube = this.cubeContainer.querySelector('.anim-cube-3d');
    if (existingCube) {
      existingCube.remove();
    }
    
    // Create 3D cube wrapper div with class 'anim-cube-3d'
    const cubeWrapper = document.createElement('div');
    cubeWrapper.className = 'anim-cube-3d';
    cubeWrapper.style.cursor = 'grab';
    
    // Define face data array with face names and their sticker indices
    const faces = [
      { name: 'front', indices: [18, 19, 20, 21, 22, 23, 24, 25, 26] },
      { name: 'back', indices: [45, 46, 47, 48, 49, 50, 51, 52, 53] },
      { name: 'right', indices: [9, 10, 11, 12, 13, 14, 15, 16, 17] },
      { name: 'left', indices: [36, 37, 38, 39, 40, 41, 42, 43, 44] },
      { name: 'top', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { name: 'bottom', indices: [27, 28, 29, 30, 31, 32, 33, 34, 35] }
    ];
    
    // Loop through 6 faces and create face divs
    faces.forEach(face => {
      const faceElement = document.createElement('div');
      faceElement.className = `anim-cube-face anim-cube-face--${face.name}`;
      
      // For each face, create 9 sticker divs with color from cubestring
      face.indices.forEach(index => {
        const sticker = document.createElement('div');
        sticker.className = 'anim-cube-sticker';
        sticker.dataset.index = index;
        
        // Get color letter from cubestring and set color
        const colorLetter = cubestring[index];
        sticker.dataset.color = colorLetter;
        sticker.style.backgroundColor = this._getColorHex(colorLetter);
        
        faceElement.appendChild(sticker);
      });
      
      cubeWrapper.appendChild(faceElement);
    });
    
    // Insert cube wrapper before reset button (if it exists) or just append
    if (this.rotationResetButton) {
      this.cubeContainer.insertBefore(cubeWrapper, this.rotationResetButton);
    } else {
      this.cubeContainer.appendChild(cubeWrapper);
    }
    
    // Apply stored rotation
    this.rotationX = savedRotationX;
    this.rotationY = savedRotationY;
    this._applyRotation();
    
    // Bind and attach mouse event listeners for drag-to-rotate
    this.boundMouseDown = this._handleMouseDown.bind(this);
    this.boundMouseMove = this._handleMouseMove.bind(this);
    this.boundMouseUp = this._handleMouseUp.bind(this);
    
    cubeWrapper.addEventListener('mousedown', this.boundMouseDown);
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
    
    // Create and append rotation reset button if not exists
    if (!this.rotationResetButton) {
      this.rotationResetButton = this._createRotationResetButton();
      this.cubeContainer.appendChild(this.rotationResetButton);
    }
    
    // Update reset button visibility
    this._updateResetButtonVisibility();
  }

  /**
   * Convert color letter to hex color code
   * @param {string} colorLetter - Color letter (U, R, F, D, L, B)
   * @returns {string} Hex color code
   * @private
   */
  _getColorHex(colorLetter) {
    const colors = {
      'U': '#FFFFFF', // White (Up)
      'R': '#FF0000', // Red (Right)
      'F': '#00FF00', // Green (Front)
      'D': '#FFFF00', // Yellow (Down)
      'L': '#FFA500', // Orange (Left)
      'B': '#0000FF'  // Blue (Back)
    };
    return colors[colorLetter] || '#CCCCCC'; // Default gray for invalid colors
  }

  /**
   * Parse move notation into structured format
   * @param {string} notation - Move notation (e.g., 'R', "U'", 'D2')
   * @returns {{face: string, turns: number}} Parsed move object
   * @throws {Error} If notation is invalid
   * @private
   */
  _parseMove(notation) {
    if (!notation || typeof notation !== 'string') {
      throw new Error(`Invalid move notation: ${notation}`);
    }
    
    // Extract face letter (first char) and modifier (rest)
    const face = notation[0].toUpperCase();
    const modifier = notation.slice(1);
    
    // Validate face is one of R, L, U, D, F, B
    const validFaces = ['R', 'L', 'U', 'D', 'F', 'B'];
    if (!validFaces.includes(face)) {
      throw new Error(`Invalid face in move notation: ${notation}. Face must be one of R, L, U, D, F, B`);
    }
    
    // Determine turns based on modifier
    // All rotations are clockwise; counterclockwise = 3 clockwise turns
    let turns = 1;
    
    if (modifier === "'") {
      turns = 3;  // Counterclockwise = 3 clockwise rotations
    } else if (modifier === '2') {
      turns = 2;  // 180° turn
    } else if (modifier === '') {
      turns = 1;  // Single clockwise turn
    } else {
      throw new Error(`Invalid modifier in move notation: ${notation}. Modifier must be empty, ' or 2`);
    }
    
    return { face, turns };
  }

  /**
   * Convert cubestring to face arrays
   * @param {string} cubestring - 54-character cube state
   * @returns {Object} Object with U, R, F, D, L, B face arrays (each 9 elements)
   * @private
   */
  _cubestringToFaces(cubestring) {
    return {
      U: cubestring.slice(0, 9).split(''),    // Up (0-8)
      R: cubestring.slice(9, 18).split(''),   // Right (9-17)
      F: cubestring.slice(18, 27).split(''),  // Front (18-26)
      D: cubestring.slice(27, 36).split(''),  // Down (27-35)
      L: cubestring.slice(36, 45).split(''),  // Left (36-44)
      B: cubestring.slice(45, 54).split('')   // Back (45-53)
    };
  }

  /**
   * Convert face arrays back to cubestring
   * @param {Object} faces - Object with U, R, F, D, L, B face arrays
   * @returns {string} 54-character cubestring
   * @private
   */
  _facesToCubestring(faces) {
    return faces.U.join('') + faces.R.join('') + faces.F.join('') + 
           faces.D.join('') + faces.L.join('') + faces.B.join('');
  }

  /**
   * Rotate a single face array 90 degrees clockwise
   * @param {Array<string>} face - 9-element face array
   * @returns {Array<string>} Rotated face array
   * @private
   */
  _rotateFaceArray(face) {
    // Face layout:
    // 0 1 2
    // 3 4 5
    // 6 7 8
    
    // Clockwise rotation
    return [
      face[6], face[3], face[0],  // Top row
      face[7], face[4], face[1],  // Middle row
      face[8], face[5], face[2]   // Bottom row
    ];
  }

  /**
   * Get edge positions for each face rotation
   * Returns which edges from adjacent faces move during rotation
   * @param {string} face - Face being rotated (R, L, U, D, F, B)
   * @returns {Object} Edge configuration with 'from' arrays for each adjacent face
   * @private
   */
  _getEdgePositions(face) {
    // Each entry defines which indices from each adjacent face are affected
    // Format: { face1: [indices], face2: [indices], face3: [indices], face4: [indices] }
    const edgeConfigs = {
      'R': {
        cycle: ['U', 'F', 'D', 'B'],
        positions: {
          U: [2, 5, 8],      // Right column
          F: [2, 5, 8],      // Right column
          D: [2, 5, 8],      // Right column
          B: [6, 3, 0]       // Left column (reversed)
        }
      },
      'L': {
        cycle: ['U', 'B', 'D', 'F'],
        positions: {
          U: [0, 3, 6],      // Left column
          B: [8, 5, 2],      // Right column (reversed)
          D: [0, 3, 6],      // Left column
          F: [0, 3, 6]       // Left column
        }
      },
      'U': {
        cycle: ['F', 'R', 'B', 'L'],
        positions: {
          F: [0, 1, 2],      // Top row
          R: [0, 1, 2],      // Top row
          B: [0, 1, 2],      // Top row
          L: [0, 1, 2]       // Top row
        }
      },
      'D': {
        cycle: ['F', 'L', 'B', 'R'],
        positions: {
          F: [6, 7, 8],      // Bottom row
          L: [6, 7, 8],      // Bottom row
          B: [6, 7, 8],      // Bottom row
          R: [6, 7, 8]       // Bottom row
        }
      },
      'F': {
        cycle: ['U', 'L', 'D', 'R'],
        positions: {
          U: [6, 7, 8],     // Bottom row
          L: [8, 5, 2],     // Right column (reversed: 44,43,42 in face L)
          D: [2, 1, 0],     // Top row
          R: [0,3,6]        // Left column (reversed: 11,10,9 in face R)
        }
      },
      'B': {
        cycle: ['U', 'R', 'D', 'L'],
        positions: {
          U: [0, 1, 2],      // Top row (reversed)
          L: [0, 3, 6],      // Left column
          D: [8, 7, 6],      // Bottom row
          R: [8, 5, 2]       // Right column (reversed)
        }
      }
    };
    
    return edgeConfigs[face];
  }

  /**
   * Rotate a face of the cube 90 degrees clockwise
   * @param {string} cubestring - Current cube state (54-character string)
   * @param {string} face - Face to rotate (R, L, U, D, F, B)
   * @returns {string} New cubestring after rotation
   * @private
   */
  _rotateFace(cubestring, face) {
    // Convert cubestring to face arrays
    const faces = this._cubestringToFaces(cubestring);
    
    // Rotate the face itself clockwise
    faces[face] = this._rotateFaceArray(faces[face]);
    
    // Get edge configuration for this face
    const edgeConfig = this._getEdgePositions(face);
    const cycle = edgeConfig.cycle;
    const positions = edgeConfig.positions;
    
    // Save the first face's edge stickers
    const temp = positions[cycle[0]].map(i => faces[cycle[0]][i]);
    
    // Clockwise edge cycle: 0 ← 1 ← 2 ← 3 ← temp
    for (let i = 0; i < 3; i++) {
      faces[cycle[0]][positions[cycle[0]][i]] = faces[cycle[1]][positions[cycle[1]][i]];
      faces[cycle[1]][positions[cycle[1]][i]] = faces[cycle[2]][positions[cycle[2]][i]];
      faces[cycle[2]][positions[cycle[2]][i]] = faces[cycle[3]][positions[cycle[3]][i]];
      faces[cycle[3]][positions[cycle[3]][i]] = temp[i];
    }
    
    // Convert face arrays back to cubestring
    return this._facesToCubestring(faces);
  }

  /**
   * Apply a move to the virtual cubestring
   * @param {string} moveNotation - Move notation (e.g., 'R', "U'", 'D2')
   * @private
   */
  _applyMove(moveNotation) {
    try {
      // Parse move using _parseMove()
      const move = this._parseMove(moveNotation);
      
      // Apply rotation to virtualCubestring using _rotateFace()
      // Apply clockwise rotations based on turns count
      // R = 1 turn, R2 = 2 turns, R' = 3 turns (counterclockwise)
      for (let i = 0; i < move.turns; i++) {
        this.virtualCubestring = this._rotateFace(
          this.virtualCubestring,
          move.face
        );
      }
    } catch (error) {
      // Log errors and pause on failure
      console.error(`Error applying move "${moveNotation}":`, error);
      this.pause();
      alert(`Failed to apply move: ${moveNotation}\n${error.message}`);
    }
  }

  /**
   * Update button states based on current animation state and position
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
    
    // Disable buttons at boundaries
    const atStart = this.currentMoveIndex === 0;
    stepBackBtn.disabled = atStart;
    resetBtn.disabled = atStart;
    
    const atEnd = this.currentMoveIndex >= this.moveSequence.length;
    stepForwardBtn.disabled = atEnd;
    playBtn.disabled = atEnd;
  }

  /**
   * Highlight the current move in the solution display
   * @private
   */
  _highlightCurrentMove() {
    // Remove 'active' class from all moves
    const allMoves = document.querySelectorAll('.animation-modal-v2__moves .move');
    allMoves.forEach(move => move.classList.remove('active'));
    
    // Add 'active' class to current move
    if (this.currentMoveIndex > 0 && this.currentMoveIndex <= this.moveSequence.length) {
      const currentMove = document.querySelector(
        `.animation-modal-v2__moves .move[data-move-index="${this.currentMoveIndex - 1}"]`
      );
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
   * Schedule the next move in the animation sequence
   * @private
   */
  _scheduleNextMove() {
    // Check not at end
    if (this.currentMoveIndex >= this.moveSequence.length) {
      this.pause();
      return;
    }
    
    // Apply the next move
    const move = this.moveSequence[this.currentMoveIndex];
    this._applyMove(move);
    
    // Increment index
    this.currentMoveIndex++;
    
    // Re-render cube with new state
    this._renderCube(this.virtualCubestring);
    
    // Update UI
    this._updateButtonStates();
    this._highlightCurrentMove();
    
    // Emit event
    this._emitStateChange('animation:step');
    
    // Schedule next move with setTimeout
    if (this.currentMoveIndex < this.moveSequence.length) {
      this.animationTimeout = setTimeout(() => {
        this._scheduleNextMove();
      }, this.animationDuration);
    } else {
      // Animation complete
      this.pause();
    }
  }

  /**
   * Emit custom event for animation state changes
   * @param {string} eventName - Name of the event to emit
   * @private
   */
  _emitStateChange(eventName) {
    const event = new CustomEvent(eventName, {
      detail: {
        state: this.animationState,
        currentMoveIndex: this.currentMoveIndex,
        totalMoves: this.moveSequence.length,
        virtualCubestring: this.virtualCubestring
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle mouse down event - start drag tracking
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseDown(event) {
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    // Prevent default to avoid text selection and browser drag behavior
    event.preventDefault();
    
    // Start drag tracking
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartRotationX = this.rotationX;
    this.dragStartRotationY = this.rotationY;
    
    // Calculate Y direction at drag start based on current orientation
    // Normalize X rotation to -180 to 180 range
    let normalizedX = ((this.rotationX % 360) + 360) % 360;
    if (normalizedX > 180) normalizedX -= 360;
    
    // Determine if cube is upside down and set Y direction for this drag
    const isUpsideDown = normalizedX > 90 || normalizedX < -90;
    this.dragYDirection = isUpsideDown ? -1 : 1;
    
    // Update cursor to grabbing
    document.body.style.cursor = 'grabbing';
    
    // Disable hover transition during drag
    const cubeElement = this.cubeContainer?.querySelector('.anim-cube-3d');
    if (cubeElement) {
      cubeElement.style.transition = 'none';
    }
  }

  /**
   * Handle mouse move event - update rotation
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseMove(event) {
    if (!this.isDragging) return;
    
    // Calculate mouse delta from drag start position
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    
    // Update X rotation (vertical drag)
    this.rotationX = this.dragStartRotationX - (deltaY * this.rotationSensitivity);
    
    // Update Y rotation (horizontal drag) using the direction set at drag start
    // This prevents the direction from flipping mid-drag when crossing the 90° threshold
    this.rotationY = this.dragStartRotationY + (deltaX * this.rotationSensitivity * this.dragYDirection);
    
    // Apply rotation to cube element
    this._applyRotation();
    
    // Update reset button visibility
    this._updateResetButtonVisibility();
  }

  /**
   * Handle mouse up event - stop drag tracking
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseUp(event) {
    if (!this.isDragging) return;
    
    // Reset isDragging flag
    this.isDragging = false;
    
    // Restore default cursor
    document.body.style.cursor = '';
    
    // Re-enable cube hover transition
    const cubeElement = this.cubeContainer?.querySelector('.anim-cube-3d');
    if (cubeElement) {
      cubeElement.style.transition = 'transform 0.5s ease';
    }
  }

  /**
   * Apply current rotation to cube element
   * @private
   */
  _applyRotation() {
    const cubeElement = this.cubeContainer?.querySelector('.anim-cube-3d');
    if (!cubeElement) return;
    
    const transform = `rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg)`;
    cubeElement.style.transform = transform;
  }

  /**
   * Reset rotation to default angles with animation
   * @private
   */
  _resetRotation() {
    const cubeElement = this.cubeContainer?.querySelector('.anim-cube-3d');
    if (!cubeElement) return;
    
    // Enable transition for smooth animation
    cubeElement.style.transition = 'transform 0.5s ease';
    
    // Reset to default angles
    this.rotationX = -15;
    this.rotationY = 25;
    
    // Apply rotation
    this._applyRotation();
    
    // Update reset button visibility
    this._updateResetButtonVisibility();
  }

  /**
   * Create rotation reset button
   * @returns {HTMLElement} Button element
   * @private
   */
  _createRotationResetButton() {
    const button = document.createElement('button');
    button.className = 'anim-rotation-reset-btn';
    button.innerHTML = '↻';
    button.title = 'Reset View';
    button.setAttribute('aria-label', 'Reset cube rotation to default view');
    
    // Apply inline styles
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
    
    // Add hover effects
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
      this._resetRotation();
    });
    
    return button;
  }

  /**
   * Update reset button visibility based on rotation state
   * @private
   */
  _updateResetButtonVisibility() {
    if (!this.rotationResetButton) return;
    
    const defaultX = -15;
    const defaultY = 25;
    const threshold = 5; // degrees
    
    // Check if rotation differs from default
    const isDifferent = 
      Math.abs(this.rotationX - defaultX) > threshold ||
      Math.abs(this.rotationY - defaultY) > threshold;
    
    // Show/hide button
    this.rotationResetButton.style.display = isDifferent ? 'flex' : 'none';
  }
}
