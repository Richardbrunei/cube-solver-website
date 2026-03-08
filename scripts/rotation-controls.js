/**
 * RotationControls - Manages cube rotation buttons
 * Provides UI controls for rotating cube faces
 * Uses rotation logic from AnimationController for consistency
 */

class RotationControls {
    constructor(cubeState) {
        this.cubeState = cubeState;
        this.container = null;
        
        // Rotation moves in standard cube notation
        this.rotations = [
            { id: 'U', label: 'U', title: 'Rotate Up face clockwise' },
            { id: 'U\'', label: 'U\'', title: 'Rotate Up face counter-clockwise' },
            { id: 'R', label: 'R', title: 'Rotate Right face clockwise' },
            { id: 'R\'', label: 'R\'', title: 'Rotate Right face counter-clockwise' },
            { id: 'F', label: 'F', title: 'Rotate Front face clockwise' },
            { id: 'F\'', label: 'F\'', title: 'Rotate Front face counter-clockwise' },
            { id: 'D', label: 'D', title: 'Rotate Down face clockwise' },
            { id: 'D\'', label: 'D\'', title: 'Rotate Down face counter-clockwise' },
            { id: 'L', label: 'L', title: 'Rotate Left face clockwise' },
            { id: 'L\'', label: 'L\'', title: 'Rotate Left face counter-clockwise' },
            { id: 'B', label: 'B', title: 'Rotate Back face clockwise' },
            { id: 'B\'', label: 'B\'', title: 'Rotate Back face counter-clockwise' }
        ];
    }

    /**
     * Initialize rotation controls
     */
    init() {
        this.createControls();
        this.attachEventListeners();
        this.setupEditModeListener();
    }

    /**
     * Set up listener for edit mode changes
     */
    setupEditModeListener() {
        this.cubeState.addChangeListener((event) => {
            if (event.type === 'editModeChanged') {
                if (event.data.editMode) {
                    this.show();
                } else {
                    this.hide();
                }
            }
        });
    }

    /**
     * Show rotation controls
     */
    show() {
        if (this.container) {
            this.container.classList.add('rotation-controls--visible');
        }
    }

    /**
     * Hide rotation controls
     */
    hide() {
        if (this.container) {
            this.container.classList.remove('rotation-controls--visible');
        }
    }

    /**
     * Create rotation control UI
     */
    createControls() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'rotation-controls';
        this.container.setAttribute('role', 'group');
        this.container.setAttribute('aria-label', 'Cube rotation controls');

        // Create header
        const header = document.createElement('div');
        header.className = 'rotation-controls__header';
        header.innerHTML = '<h3>Rotations</h3>';
        this.container.appendChild(header);

        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'rotation-controls__buttons';

        // Create rotation buttons
        this.rotations.forEach(rotation => {
            const button = document.createElement('button');
            button.className = 'rotation-controls__btn';
            button.dataset.rotation = rotation.id;
            button.textContent = rotation.label;
            button.title = rotation.title;
            button.setAttribute('aria-label', rotation.title);
            buttonsContainer.appendChild(button);
        });

        this.container.appendChild(buttonsContainer);

        // Add to page
        document.querySelector('.cube-container').appendChild(this.container);
    }

    /**
     * Attach event listeners to rotation buttons
     */
    attachEventListeners() {
        const buttons = this.container.querySelectorAll('.rotation-controls__btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const rotation = e.target.dataset.rotation;
                this.performRotation(rotation);
            });
        });
    }

    /**
     * Perform a rotation on the cube
     * @param {string} move - Rotation move in standard notation (U, R, F, D, L, B, U', R', etc.)
     */
    performRotation(move) {
        try {
            console.log(`Performing rotation: ${move}`);
            const cubestring = this.cubeState.getCubestring();
            console.log('Current cubestring:', cubestring);
            const newCubestring = this.applyMove(cubestring, move);
            console.log('New cubestring:', newCubestring);
            this.cubeState.setCubestring(newCubestring);
            
            // Visual feedback
            this.showRotationFeedback(move);
            console.log(`Rotation ${move} completed successfully`);
        } catch (error) {
            console.error('Rotation error:', error);
            alert(`Error performing rotation ${move}: ${error.message}`);
        }
    }

    /**
     * Apply a single move to a cubestring
     * Uses the same rotation logic as AnimationController
     * @param {string} cubestring - Current cubestring
     * @param {string} move - Move to apply (e.g., 'U', 'R', 'F', 'D', 'L', 'B', 'U\'', etc.)
     * @returns {string} New cubestring after move
     */
    applyMove(cubestring, move) {
        // Parse the move
        const parsedMove = this._parseMove(move);
        
        // Apply the rotation the specified number of times
        let result = cubestring;
        for (let i = 0; i < parsedMove.turns; i++) {
            result = this._rotateFace(result, parsedMove.face);
        }
        
        return result;
    }

    /**
     * Parse move notation into face and turns
     * @param {string} moveNotation - Move in standard notation (e.g., 'R', 'U\'', 'F2')
     * @returns {Object} Parsed move with face and turns
     * @private
     */
    _parseMove(moveNotation) {
        const move = { face: '', turns: 1 };
        
        // Extract face (first character)
        move.face = moveNotation[0];
        
        // Check for prime (counterclockwise) or double turn
        if (moveNotation.includes('\'') || moveNotation.includes('\'')) {
            move.turns = 3; // Prime = 3 clockwise turns
        } else if (moveNotation.includes('2')) {
            move.turns = 2; // Double turn
        }
        
        return move;
    }

    /**
     * Convert cubestring to face arrays
     * @param {string} cubestring - 54-character cubestring
     * @returns {Object} Object with U, R, F, D, L, B face arrays
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
     * @param {string} face - Face being rotated (R, L, U, D, F, B)
     * @returns {Object} Edge configuration with cycle and positions
     * @private
     */
    _getEdgePositions(face) {
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
                    U: [6, 7, 8],      // Bottom row
                    L: [8, 5, 2],      // Right column (reversed)
                    D: [2, 1, 0],      // Top row (reversed)
                    R: [0, 3, 6]       // Left column
                }
            },
            'B': {
                cycle: ['U', 'R', 'D', 'L'],
                positions: {
                    U: [0, 1, 2],      // Top row
                    L: [6, 3, 0],      // Left column (reversed)
                    D: [8, 7, 6],      // Bottom row (reversed)
                    R: [2, 5, 8]       // Right column
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
     * Show visual feedback for rotation
     * @param {string} move - Move that was performed
     */
    showRotationFeedback(move) {
        const button = this.container.querySelector(`[data-rotation="${move}"]`);
        if (button) {
            button.classList.add('rotation-controls__btn--active');
            setTimeout(() => {
                button.classList.remove('rotation-controls__btn--active');
            }, 200);
        }
    }

    /**
     * Destroy rotation controls
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export { RotationControls };
