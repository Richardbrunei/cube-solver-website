/**
 * CubeState class for managing Rubik's cube state
 * Handles cube state storage, color management, and change notifications
 */

class CubeState {
    constructor() {
        // Standard Rubik's cube colors (hex values for display)
        this.COLORS = {
            W: '#FFFFFF', // White
            Y: '#FFFF00', // Yellow
            R: '#FF0000', // Red
            O: '#FFA500', // Orange
            B: '#0000FF', // Blue
            G: '#00FF00'  // Green
        };

        // Backend color name to cube notation mapping (from backend)
        this.BACKEND_COLOR_TO_CUBE = {
            'White': 'W',
            'Yellow': 'Y',
            'Red': 'R',
            'Orange': 'O',
            'Blue': 'B',
            'Green': 'G',
            'Unknown': 'W'  // Default unknown colors to white
        };

        // Cube notation to backend color name mapping
        this.CUBE_TO_BACKEND_COLOR = {
            'W': 'White',
            'Y': 'Yellow',
            'R': 'Red',
            'O': 'Orange',
            'B': 'Blue',
            'G': 'Green',
            'U': 'White',  // Backend uses U for Up (White)
            'D': 'Yellow', // Backend uses D for Down (Yellow)
            'F': 'Green',  // Backend uses F for Front (Green)
            'L': 'Orange', // Backend uses L for Left (Orange)
            'R': 'Red',    // Backend uses R for Right (Red)
            'B': 'Blue',   // Backend uses B for Back (Blue)
            'X': 'White'   // Unknown/invalid positions default to white
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

        // Cube string to face mapping (54-character string layout)
        // Standard cube string format: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
        // U=Up(White), R=Right(Red), F=Front(Green), D=Down(Yellow), L=Left(Orange), B=Back(Blue)
        this.CUBE_STRING_FACE_MAPPING = {
            // Each face has 9 stickers (3x3), indexed 0-53 in the cube string
            'top': { start: 0, end: 9 },      // U face: positions 0-8
            'right': { start: 9, end: 18 },   // R face: positions 9-17
            'front': { start: 18, end: 27 },  // F face: positions 18-26
            'bottom': { start: 27, end: 36 }, // D face: positions 27-35
            'left': { start: 36, end: 45 },   // L face: positions 36-44
            'back': { start: 45, end: 54 }    // B face: positions 45-53
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
     * Import cube state from backend cube string format
     * @param {string} cubeString - 54-character cube string (UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB)
     */
    importFromCubeString(cubeString) {
        if (!cubeString || cubeString.length !== 54) {
            throw new Error('Invalid cube string: must be exactly 54 characters');
        }

        console.log('Importing cube string:', cubeString);

        // Convert cube string to face arrays
        Object.entries(this.CUBE_STRING_FACE_MAPPING).forEach(([facePosition, mapping]) => {
            const faceString = cubeString.substring(mapping.start, mapping.end);
            const faceColors = this.convertStringToFaceArray(faceString);
            this.faces[facePosition] = faceColors;
        });

        this.notifyChange('cubeStringImported', {
            cubeString: cubeString,
            state: this.getState()
        });

        console.log('Cube string imported successfully');
    }

    /**
     * Import cube state from backend color array format
     * @param {Array} colorArray - Array of 54 color names from backend
     */
    importFromBackendColors(colorArray) {
        if (!Array.isArray(colorArray) || colorArray.length !== 54) {
            throw new Error('Invalid color array: must be array of 54 color names');
        }

        console.log('Importing backend colors:', colorArray.length, 'colors');

        // Convert backend color names to cube notation
        const cubeString = colorArray.map(colorName =>
            this.BACKEND_COLOR_TO_CUBE[colorName] || 'W'
        ).join('');

        // Use the cube string import method
        this.importFromCubeString(cubeString);

        this.notifyChange('backendColorsImported', {
            colorArray: colorArray,
            cubeString: cubeString,
            state: this.getState()
        });

        console.log('Backend colors imported successfully');
    }

    /**
     * Import cube state from backend JSON format
     * @param {Object} backendData - Backend cube state JSON object
     */
    importFromBackendData(backendData) {
        if (!backendData) {
            throw new Error('Invalid backend data: data is null or undefined');
        }

        console.log('Importing backend data:', backendData);

        // Try cube_string first (preferred format)
        if (backendData.cube_string && backendData.cube_string.length === 54) {
            this.importFromCubeString(backendData.cube_string);
        }
        // Fallback to cube_state array
        else if (backendData.cube_state && Array.isArray(backendData.cube_state)) {
            this.importFromBackendColors(backendData.cube_state);
        }
        else {
            throw new Error('Invalid backend data: no valid cube_string or cube_state found');
        }

        // Store additional metadata if available
        if (backendData.timestamp) {
            this.lastImportTimestamp = backendData.timestamp;
        }
        if (typeof backendData.is_valid === 'boolean') {
            this.lastImportValid = backendData.is_valid;
        }

        this.notifyChange('backendDataImported', {
            backendData: backendData,
            state: this.getState()
        });

        console.log('Backend data imported successfully');
    }

    /**
     * Convert a 9-character string to a 3x3 face array
     * @param {string} faceString - 9-character string representing a face
     * @returns {Array} 3x3 array of color keys
     */
    convertStringToFaceArray(faceString) {
        if (faceString.length !== 9) {
            throw new Error('Face string must be exactly 9 characters');
        }

        const faceArray = [];
        for (let row = 0; row < 3; row++) {
            const rowArray = [];
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                const cubeNotation = faceString[index];
                // Convert backend notation to our internal notation
                const colorKey = this.CUBE_TO_BACKEND_COLOR[cubeNotation] ?
                    this.convertBackendColorToCubeKey(this.CUBE_TO_BACKEND_COLOR[cubeNotation]) : 'W';
                rowArray.push(colorKey);
            }
            faceArray.push(rowArray);
        }

        return faceArray;
    }

    /**
     * Convert backend color name to internal cube key
     * @param {string} backendColor - Backend color name (e.g., 'White', 'Red')
     * @returns {string} Internal color key (e.g., 'W', 'R')
     */
    convertBackendColorToCubeKey(backendColor) {
        return this.BACKEND_COLOR_TO_CUBE[backendColor] || 'W';
    }

    /**
     * Export current cube state as cube string
     * @returns {string} 54-character cube string
     */
    exportToCubeString() {
        let cubeString = '';

        // Build cube string in the standard order: U R F D L B
        Object.entries(this.CUBE_STRING_FACE_MAPPING).forEach(([facePosition, mapping]) => {
            const faceColors = this.getFaceColors(facePosition);
            const faceString = this.convertFaceArrayToString(faceColors);
            cubeString += faceString;
        });

        return cubeString;
    }

    /**
     * Export current cube state as backend color array
     * @returns {Array} Array of 54 backend color names
     */
    exportToBackendColors() {
        const cubeString = this.exportToCubeString();
        return cubeString.split('').map(cubeKey =>
            this.CUBE_TO_BACKEND_COLOR[cubeKey] || 'White'
        );
    }

    /**
     * Convert a 3x3 face array to a 9-character string
     * @param {Array} faceArray - 3x3 array of color keys
     * @returns {string} 9-character string
     */
    convertFaceArrayToString(faceArray) {
        let faceString = '';
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const colorKey = faceArray[row][col];
                // Convert internal color key to backend notation
                const backendColor = this.CUBE_TO_BACKEND_COLOR[colorKey] || 'White';
                const cubeNotation = this.BACKEND_COLOR_TO_CUBE[backendColor] || 'W';
                faceString += cubeNotation;
            }
        }
        return faceString;
    }

    /**
     * Fetch and import cube state from backend API
     * @returns {Promise<boolean>} Success status
     */
    async fetchFromBackend() {
        try {
            console.log('Fetching cube state from backend...');

            const response = await fetch('/web_output/cube_state.json');
            if (!response.ok) {
                throw new Error(`Backend request failed: ${response.status}`);
            }

            const backendData = await response.json();
            this.importFromBackendData(backendData);

            console.log('Successfully fetched and imported cube state from backend');
            return true;

        } catch (error) {
            console.error('Failed to fetch cube state from backend:', error);
            this.notifyChange('backendFetchError', { error: error.message });
            return false;
        }
    }

    /**
     * Start polling backend for cube state updates
     * @param {number} intervalMs - Polling interval in milliseconds (default: 1000)
     */
    startBackendPolling(intervalMs = 1000) {
        if (this.backendPollingInterval) {
            this.stopBackendPolling();
        }

        console.log(`Starting backend polling every ${intervalMs}ms`);

        this.backendPollingInterval = setInterval(async () => {
            try {
                const success = await this.fetchFromBackend();
                if (success) {
                    this.notifyChange('backendPollingUpdate', {
                        timestamp: Date.now(),
                        state: this.getState()
                    });
                }
            } catch (error) {
                console.error('Backend polling error:', error);
            }
        }, intervalMs);

        this.notifyChange('backendPollingStarted', { intervalMs: intervalMs });
    }

    /**
     * Stop polling backend for updates
     */
    stopBackendPolling() {
        if (this.backendPollingInterval) {
            clearInterval(this.backendPollingInterval);
            this.backendPollingInterval = null;
            console.log('Backend polling stopped');
            this.notifyChange('backendPollingStopped', {});
        }
    }

    /**
     * Get backend integration status
     * @returns {Object} Status information
     */
    getBackendStatus() {
        return {
            isPolling: !!this.backendPollingInterval,
            lastImportTimestamp: this.lastImportTimestamp || null,
            lastImportValid: this.lastImportValid || null,
            supportedFormats: ['cube_string', 'cube_state', 'backend_data']
        };
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