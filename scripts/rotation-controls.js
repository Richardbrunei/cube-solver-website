/**
 * RotationControls - Manages cube rotation buttons
 * Provides UI controls for rotating cube faces
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
            const cubestring = this.cubeState.getCubestring();
            const newCubestring = this.applyMove(cubestring, move);
            this.cubeState.setCubestring(newCubestring);
            
            // Visual feedback
            this.showRotationFeedback(move);
        } catch (error) {
            console.error('Rotation error:', error);
        }
    }

    /**
     * Apply a single move to a cubestring
     * @param {string} cubestring - Current cubestring
     * @param {string} move - Move to apply
     * @returns {string} New cubestring after move
     */
    applyMove(cubestring, move) {
        const chars = cubestring.split('');
        
        // Define rotation mappings for each move
        // Format: [source_index, target_index, ...]
        const moves = {
            'U': this.getURotation(),
            'U\'': this.getUPrimeRotation(),
            'R': this.getRRotation(),
            'R\'': this.getRPrimeRotation(),
            'F': this.getFRotation(),
            'F\'': this.getFPrimeRotation(),
            'D': this.getDRotation(),
            'D\'': this.getDPrimeRotation(),
            'L': this.getLRotation(),
            'L\'': this.getLPrimeRotation(),
            'B': this.getBRotation(),
            'B\'': this.getBPrimeRotation()
        };

        const mapping = moves[move];
        if (!mapping) {
            throw new Error(`Unknown move: ${move}`);
        }

        // Apply the rotation mapping
        const newChars = [...chars];
        for (let i = 0; i < mapping.length; i += 2) {
            newChars[mapping[i + 1]] = chars[mapping[i]];
        }

        return newChars.join('');
    }

    /**
     * Get rotation mapping for U (Up clockwise)
     */
    getURotation() {
        return [
            // Rotate U face clockwise
            0,2, 1,5, 2,8, 3,1, 5,7, 6,0, 7,3, 8,6,
            // Move edge pieces
            18,9, 19,10, 20,11,  // F top -> R top
            9,45, 10,46, 11,47,  // R top -> B top
            45,36, 46,37, 47,38, // B top -> L top
            36,18, 37,19, 38,20  // L top -> F top
        ];
    }

    /**
     * Get rotation mapping for U' (Up counter-clockwise)
     */
    getUPrimeRotation() {
        return [
            // Rotate U face counter-clockwise
            0,6, 1,3, 2,0, 3,7, 5,1, 6,8, 7,5, 8,2,
            // Move edge pieces
            18,36, 19,37, 20,38, // F top -> L top
            36,45, 37,46, 38,47, // L top -> B top
            45,9, 46,10, 47,11,  // B top -> R top
            9,18, 10,19, 11,20   // R top -> F top
        ];
    }

    /**
     * Get rotation mapping for R (Right clockwise)
     */
    getRRotation() {
        return [
            // Rotate R face clockwise
            9,15, 10,12, 11,9, 12,16, 14,10, 15,17, 16,14, 17,11,
            // Move edge pieces
            2,20, 5,23, 8,26,    // U right -> F right
            20,29, 23,32, 26,35, // F right -> D right
            29,47, 32,50, 35,53, // D right -> B left
            47,2, 50,5, 53,8     // B left -> U right
        ];
    }

    /**
     * Get rotation mapping for R' (Right counter-clockwise)
     */
    getRPrimeRotation() {
        return [
            // Rotate R face counter-clockwise
            9,11, 10,14, 11,17, 12,10, 14,16, 15,9, 16,12, 17,15,
            // Move edge pieces
            2,47, 5,50, 8,53,    // U right -> B left
            47,29, 50,32, 53,35, // B left -> D right
            29,20, 32,23, 35,26, // D right -> F right
            20,2, 23,5, 26,8     // F right -> U right
        ];
    }

    /**
     * Get rotation mapping for F (Front clockwise)
     */
    getFRotation() {
        return [
            // Rotate F face clockwise
            18,24, 19,21, 20,18, 21,25, 23,19, 24,26, 25,23, 26,20,
            // Move edge pieces
            6,11, 7,14, 8,17,    // U bottom -> R left
            11,27, 14,28, 17,29, // R left -> D top
            27,44, 28,41, 29,38, // D top -> L right
            44,6, 41,7, 38,8     // L right -> U bottom
        ];
    }

    /**
     * Get rotation mapping for F' (Front counter-clockwise)
     */
    getFPrimeRotation() {
        return [
            // Rotate F face counter-clockwise
            18,20, 19,23, 20,26, 21,19, 23,25, 24,18, 25,21, 26,24,
            // Move edge pieces
            6,44, 7,41, 8,38,    // U bottom -> L right
            44,27, 41,28, 38,29, // L right -> D top
            27,11, 28,14, 29,17, // D top -> R left
            11,6, 14,7, 17,8     // R left -> U bottom
        ];
    }

    /**
     * Get rotation mapping for D (Down clockwise)
     */
    getDRotation() {
        return [
            // Rotate D face clockwise
            27,33, 28,30, 29,27, 30,34, 32,28, 33,35, 34,32, 35,29,
            // Move edge pieces
            24,15, 25,16, 26,17, // F bottom -> R bottom
            15,51, 16,52, 17,53, // R bottom -> B bottom
            51,42, 52,43, 53,44, // B bottom -> L bottom
            42,24, 43,25, 44,26  // L bottom -> F bottom
        ];
    }

    /**
     * Get rotation mapping for D' (Down counter-clockwise)
     */
    getDPrimeRotation() {
        return [
            // Rotate D face counter-clockwise
            27,29, 28,32, 29,35, 30,28, 32,34, 33,27, 34,30, 35,33,
            // Move edge pieces
            24,42, 25,43, 26,44, // F bottom -> L bottom
            42,51, 43,52, 44,53, // L bottom -> B bottom
            51,15, 52,16, 53,17, // B bottom -> R bottom
            15,24, 16,25, 17,26  // R bottom -> F bottom
        ];
    }

    /**
     * Get rotation mapping for L (Left clockwise)
     */
    getLRotation() {
        return [
            // Rotate L face clockwise
            36,42, 37,39, 38,36, 39,43, 41,37, 42,44, 43,41, 44,38,
            // Move edge pieces
            0,45, 3,48, 6,51,    // U left -> B right
            45,27, 48,30, 51,33, // B right -> D left
            27,18, 30,21, 33,24, // D left -> F left
            18,0, 21,3, 24,6     // F left -> U left
        ];
    }

    /**
     * Get rotation mapping for L' (Left counter-clockwise)
     */
    getLPrimeRotation() {
        return [
            // Rotate L face counter-clockwise
            36,38, 37,41, 38,44, 39,37, 41,43, 42,36, 43,39, 44,42,
            // Move edge pieces
            0,18, 3,21, 6,24,    // U left -> F left
            18,27, 21,30, 24,33, // F left -> D left
            27,45, 30,48, 33,51, // D left -> B right
            45,0, 48,3, 51,6     // B right -> U left
        ];
    }

    /**
     * Get rotation mapping for B (Back clockwise)
     */
    getBRotation() {
        return [
            // Rotate B face clockwise
            45,51, 46,48, 47,45, 48,52, 50,46, 51,53, 52,50, 53,47,
            // Move edge pieces
            0,9, 1,12, 2,15,     // U top -> R right
            9,35, 12,34, 15,33,  // R right -> D bottom
            35,42, 34,39, 33,36, // D bottom -> L left
            42,0, 39,1, 36,2     // L left -> U top
        ];
    }

    /**
     * Get rotation mapping for B' (Back counter-clockwise)
     */
    getBPrimeRotation() {
        return [
            // Rotate B face counter-clockwise
            45,47, 46,50, 47,53, 48,46, 50,52, 51,45, 52,48, 53,51,
            // Move edge pieces
            0,42, 1,39, 2,36,    // U top -> L left
            42,35, 39,34, 36,33, // L left -> D bottom
            35,9, 34,12, 33,15,  // D bottom -> R right
            9,0, 12,1, 15,2      // R right -> U top
        ];
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
