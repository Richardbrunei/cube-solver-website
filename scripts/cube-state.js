/**
 * CubeState class for managing Rubik's cube state
 * Handles cube state storage, color management, and change notifications
 */

class CubeState {
    constructor() {
        // Standard Rubik's cube colors
        this.COLORS = {
            W: '#FFFFFF', // White
            Y: '#FFFF00', // Yellow
            R: '#FF0000', // Red
            O: '#FFA500', // Orange
            B: '#0000FF', // Blue
            G: '#00FF00'  // Green
        };

        // Face positions in standard cube notation
        this.FACES = {
            FRONT: 'front',   // White center (default)
            BACK: 'back',     // Yellow center
            LEFT: 'left',     // Orange center
            RIGHT: 'right',   // Red center
            TOP: 'top',       // Green center
            BOTTOM: 'bottom'  // Blue center
        };

        // Initialize cube state
        this.faces = {};
        this.changeListeners = [];
        this.currentView = '3d';
        this.editMode = false;

        // Initialize with solved state
        this.initializeSolvedState();
    }

    /**
     * Initialize cube to solved state
     */
    initializeSolvedState() {
        this.faces = {
            [this.FACES.FRONT]: this.createFace('W'),   // White face
            [this.FACES.BACK]: this.createFace('Y'),    // Yellow face
            [this.FACES.LEFT]: this.createFace('O'),    // Orange face
            [this.FACES.RIGHT]: this.createFace('R'),   // Red face
            [this.FACES.TOP]: this.createFace('G'),     // Green face
            [this.FACES.BOTTOM]: this.createFace('B')   // Blue face
        };

        this.notifyChange('initialized');
    }

    /**
     * Create a face with uniform color (3x3 grid)
     * @param {string} color - Color key (W, Y, R, O, B, G)
     * @returns {Array} 3x3 array of colors
     */
    createFace(color) {
        return [
            [color, color, color],
            [color, color, color],
            [color, color, color]
        ];
    }

    /**
     * Get colors for a specific face
     * @param {string} facePosition - Face position (front, back, left, right, top, bottom)
     * @returns {Array} 3x3 array of color keys
     */
    getFaceColors(facePosition) {
        if (!this.isValidFacePosition(facePosition)) {
            throw new Error(`Invalid face position: ${facePosition}`);
        }

        // Return deep copy to prevent external modification
        return this.faces[facePosition].map(row => [...row]);
    }

    /**
     * Set colors for a specific face
     * @param {string} facePosition - Face position
     * @param {Array} colors - 3x3 array of color keys
     */
    setFaceColors(facePosition, colors) {
        if (!this.isValidFacePosition(facePosition)) {
            throw new Error(`Invalid face position: ${facePosition}`);
        }

        if (!this.isValidColorArray(colors)) {
            throw new Error('Invalid color array format');
        }

        // Deep copy to prevent external modification
        this.faces[facePosition] = colors.map(row => [...row]);
        
        this.notifyChange('faceUpdated', { 
            face: facePosition, 
            colors: this.getFaceColors(facePosition) 
        });
    }

    /**
     * Get color of a specific sticker
     * @param {string} facePosition - Face position
     * @param {number} row - Row index (0-2)
     * @param {number} col - Column index (0-2)
     * @returns {string} Color key
     */
    getStickerColor(facePosition, row, col) {
        if (!this.isValidFacePosition(facePosition)) {
            throw new Error(`Invalid face position: ${facePosition}`);
        }

        if (!this.isValidStickerPosition(row, col)) {
            throw new Error(`Invalid sticker position: row ${row}, col ${col}`);
        }

        return this.faces[facePosition][row][col];
    }

    /**
     * Set color of a specific sticker
     * @param {string} facePosition - Face position
     * @param {number} row - Row index (0-2)
     * @param {number} col - Column index (0-2)
     * @param {string} color - Color key
     */
    setStickerColor(facePosition, row, col, color) {
        if (!this.isValidFacePosition(facePosition)) {
            throw new Error(`Invalid face position: ${facePosition}`);
        }

        if (!this.isValidStickerPosition(row, col)) {
            throw new Error(`Invalid sticker position: row ${row}, col ${col}`);
        }

        if (!this.isValidColor(color)) {
            throw new Error(`Invalid color: ${color}`);
        }

        this.faces[facePosition][row][col] = color;
        
        this.notifyChange('stickerUpdated', {
            face: facePosition,
            row: row,
            col: col,
            color: color
        });
    }

    /**
     * Get all face positions
     * @returns {Array} Array of face position strings
     */
    getAllFacePositions() {
        return Object.values(this.FACES);
    }

    /**
     * Get all valid colors
     * @returns {Object} Object mapping color keys to hex values
     */
    getAllColors() {
        return { ...this.COLORS };
    }

    /**
     * Get current view mode
     * @returns {string} Current view ('3d' or 'net')
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Set current view mode
     * @param {string} view - View mode ('3d' or 'net')
     */
    setCurrentView(view) {
        if (view !== '3d' && view !== 'net') {
            throw new Error(`Invalid view mode: ${view}`);
        }

        this.currentView = view;
        this.notifyChange('viewChanged', { view: view });
    }

    /**
     * Get edit mode status
     * @returns {boolean} Whether edit mode is enabled
     */
    isEditMode() {
        return this.editMode;
    }

    /**
     * Set edit mode
     * @param {boolean} enabled - Whether to enable edit mode
     */
    setEditMode(enabled) {
        this.editMode = Boolean(enabled);
        this.notifyChange('editModeChanged', { editMode: this.editMode });
    }

    /**
     * Add a change listener
     * @param {Function} callback - Callback function to call on state changes
     */
    addChangeListener(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Change listener must be a function');
        }

        this.changeListeners.push(callback);
    }

    /**
     * Remove a change listener
     * @param {Function} callback - Callback function to remove
     */
    removeChangeListener(callback) {
        const index = this.changeListeners.indexOf(callback);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    /**
     * Notify all change listeners
     * @param {string} changeType - Type of change
     * @param {Object} data - Additional data about the change
     */
    notifyChange(changeType, data = {}) {
        const changeEvent = {
            type: changeType,
            timestamp: Date.now(),
            data: data
        };

        this.changeListeners.forEach(callback => {
            try {
                callback(changeEvent);
            } catch (error) {
                console.error('Error in change listener:', error);
            }
        });
    }

    /**
     * Validate face position
     * @param {string} facePosition - Face position to validate
     * @returns {boolean} Whether the face position is valid
     */
    isValidFacePosition(facePosition) {
        return Object.values(this.FACES).includes(facePosition);
    }

    /**
     * Validate sticker position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} Whether the sticker position is valid
     */
    isValidStickerPosition(row, col) {
        return Number.isInteger(row) && Number.isInteger(col) && 
               row >= 0 && row <= 2 && col >= 0 && col <= 2;
    }

    /**
     * Validate color
     * @param {string} color - Color key to validate
     * @returns {boolean} Whether the color is valid
     */
    isValidColor(color) {
        return Object.keys(this.COLORS).includes(color);
    }

    /**
     * Validate color array (3x3 grid)
     * @param {Array} colors - Color array to validate
     * @returns {boolean} Whether the color array is valid
     */
    isValidColorArray(colors) {
        if (!Array.isArray(colors) || colors.length !== 3) {
            return false;
        }

        return colors.every(row => {
            if (!Array.isArray(row) || row.length !== 3) {
                return false;
            }
            return row.every(color => this.isValidColor(color));
        });
    }

    /**
     * Get complete cube state as serializable object
     * @returns {Object} Complete cube state
     */
    getState() {
        return {
            faces: this.getAllFacePositions().reduce((state, facePosition) => {
                state[facePosition] = this.getFaceColors(facePosition);
                return state;
            }, {}),
            currentView: this.currentView,
            editMode: this.editMode
        };
    }

    /**
     * Set complete cube state from serializable object
     * @param {Object} state - Complete cube state
     */
    setState(state) {
        if (!state || typeof state !== 'object') {
            throw new Error('Invalid state object');
        }

        // Validate and set faces
        if (state.faces) {
            Object.entries(state.faces).forEach(([facePosition, colors]) => {
                this.setFaceColors(facePosition, colors);
            });
        }

        // Set view mode
        if (state.currentView) {
            this.setCurrentView(state.currentView);
        }

        // Set edit mode
        if (typeof state.editMode === 'boolean') {
            this.setEditMode(state.editMode);
        }

        this.notifyChange('stateRestored', { state: this.getState() });
    }

    /**
     * Reset cube to solved state
     */
    reset() {
        this.initializeSolvedState();
        this.setCurrentView('3d');
        this.setEditMode(false);
        
        this.notifyChange('reset', { state: this.getState() });
    }

    /**
     * Check if the cube is in a solved state
     * @returns {boolean} Whether the cube is solved
     */
    isSolved() {
        const expectedFaces = {
            [this.FACES.FRONT]: 'W',
            [this.FACES.BACK]: 'Y',
            [this.FACES.LEFT]: 'O',
            [this.FACES.RIGHT]: 'R',
            [this.FACES.TOP]: 'G',
            [this.FACES.BOTTOM]: 'B'
        };

        return Object.entries(expectedFaces).every(([facePosition, expectedColor]) => {
            const faceColors = this.faces[facePosition];
            return faceColors.every(row => 
                row.every(color => color === expectedColor)
            );
        });
    }

    /**
     * Validate cube state integrity
     * Checks that each color appears exactly 9 times (once per face)
     * @returns {Object} Validation result with isValid flag and details
     */
    isValidState() {
        const colorCounts = {};
        const expectedCount = 9; // Each color should appear 9 times (3x3 face)
        
        // Initialize color counts
        Object.keys(this.COLORS).forEach(color => {
            colorCounts[color] = 0;
        });

        // Count colors across all faces
        Object.values(this.faces).forEach(face => {
            face.forEach(row => {
                row.forEach(color => {
                    if (colorCounts.hasOwnProperty(color)) {
                        colorCounts[color]++;
                    } else {
                        // Invalid color found
                        return {
                            isValid: false,
                            error: `Invalid color found: ${color}`,
                            colorCounts: colorCounts
                        };
                    }
                });
            });
        });

        // Check if all colors have exactly 9 occurrences
        const invalidColors = Object.entries(colorCounts).filter(
            ([color, count]) => count !== expectedCount
        );

        if (invalidColors.length > 0) {
            return {
                isValid: false,
                error: 'Invalid color distribution',
                details: invalidColors.map(([color, count]) => 
                    `Color ${color}: expected ${expectedCount}, found ${count}`
                ),
                colorCounts: colorCounts
            };
        }

        return {
            isValid: true,
            colorCounts: colorCounts
        };
    }

    /**
     * Validate that all faces are properly defined
     * @returns {Object} Validation result
     */
    validateFaceStructure() {
        const requiredFaces = Object.values(this.FACES);
        const missingFaces = [];
        const invalidFaces = [];

        // Check for missing faces
        requiredFaces.forEach(facePosition => {
            if (!this.faces.hasOwnProperty(facePosition)) {
                missingFaces.push(facePosition);
            } else {
                // Check face structure
                const face = this.faces[facePosition];
                if (!this.isValidColorArray(face)) {
                    invalidFaces.push(facePosition);
                }
            }
        });

        // Check for extra faces
        const extraFaces = Object.keys(this.faces).filter(
            facePosition => !requiredFaces.includes(facePosition)
        );

        const isValid = missingFaces.length === 0 && 
                       invalidFaces.length === 0 && 
                       extraFaces.length === 0;

        return {
            isValid: isValid,
            missingFaces: missingFaces,
            invalidFaces: invalidFaces,
            extraFaces: extraFaces
        };
    }

    /**
     * Perform comprehensive cube state validation
     * @returns {Object} Complete validation result
     */
    validateCube() {
        const faceValidation = this.validateFaceStructure();
        
        if (!faceValidation.isValid) {
            return {
                isValid: false,
                error: 'Invalid face structure',
                details: faceValidation
            };
        }

        const stateValidation = this.isValidState();
        
        return {
            isValid: stateValidation.isValid,
            isSolved: this.isSolved(),
            faceStructure: faceValidation,
            colorDistribution: stateValidation,
            error: stateValidation.error || null
        };
    }

    /**
     * Get cube statistics
     * @returns {Object} Statistics about the current cube state
     */
    getStatistics() {
        const validation = this.validateCube();
        const colorCounts = validation.colorDistribution.colorCounts || {};
        
        return {
            isValid: validation.isValid,
            isSolved: validation.isSolved,
            totalStickers: Object.values(colorCounts).reduce((sum, count) => sum + count, 0),
            colorDistribution: colorCounts,
            currentView: this.currentView,
            editMode: this.editMode,
            faceCount: Object.keys(this.faces).length
        };
    }

    /**
     * Create a backup of the current state
     * @returns {Object} Backup state object
     */
    createBackup() {
        return {
            timestamp: Date.now(),
            state: this.getState(),
            validation: this.validateCube()
        };
    }

    /**
     * Restore from a backup
     * @param {Object} backup - Backup object created by createBackup()
     */
    restoreFromBackup(backup) {
        if (!backup || !backup.state) {
            throw new Error('Invalid backup object');
        }

        this.setState(backup.state);
        this.notifyChange('backupRestored', { 
            backup: backup,
            currentState: this.getState()
        });
    }
}

export { CubeState };