import { CONFIG, getApiUrl } from './config.js';

/**
 * CubeState class for managing Rubik's cube state
 * Handles cube state storage, color management, and change notifications
 */

class CubeState {
    constructor() {
        // API Configuration (from centralized config)
        this.API_BASE_URL = CONFIG.API_BASE_URL;
        
        // Standard Rubik's cube colors (hex values for display)
        // Includes both display notation (W,Y,R,O,B,G) and cubestring notation (U,R,F,D,L,B)
        this.COLORS = {
            W: '#FFFFFF', // White
            Y: '#FFFF00', // Yellow
            R: '#FF0000', // Red
            O: '#FFA500', // Orange
            B: '#0000FF', // Blue
            G: '#00FF00', // Green
            // Cubestring notation (backend format)
            U: '#FFFFFF', // Up face - White
            D: '#FFFF00', // Down face - Yellow
            F: '#00FF00', // Front face - Green
            L: '#FFA500', // Left face - Orange
            // R already defined above as Red
            // B already defined above as Blue
        };

        // Backend color mappings - will be loaded from API
        this.BACKEND_COLOR_TO_CUBE = null;
        this.CUBE_TO_BACKEND_COLOR = null;
        this.mappingsLoaded = false;

        // Load color mappings from backend
        this.loadColorMappings();

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
        this.changeListeners = [];
        this.currentView = '3d';
        this.editMode = false;

        // Cubestring - single source of truth for cube state
        // Format: 54 characters using backend COLOR_TO_CUBE notation (U, R, F, D, L, B)
        // Face order: Up (0-8), Right (9-17), Front (18-26), Down (27-35), Left (36-44), Back (45-53)
        // Solved state: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
        this.cubestring = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

        // Face range constants matching backend format
        // Maps face names to their start and end positions in the cubestring
        this.FACE_RANGES = {
            top: { start: 0, end: 9, char: 'U' },      // Up face (positions 0-8)
            right: { start: 9, end: 18, char: 'R' },   // Right face (positions 9-17)
            front: { start: 18, end: 27, char: 'F' },  // Front face (positions 18-26)
            bottom: { start: 27, end: 36, char: 'D' }, // Down face (positions 27-35)
            left: { start: 36, end: 45, char: 'L' },   // Left face (positions 36-44)
            back: { start: 45, end: 54, char: 'B' }    // Back face (positions 45-53)
        };

        // Solved cubestring constant using backend format
        // Format: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
        this.SOLVED_CUBESTRING = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

        // Initialize with solved state
        this.initializeSolvedState();
    }

    /**
     * Load color mappings from backend API
     */
    async loadColorMappings() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/color-mappings`);
            if (!response.ok) {
                throw new Error(`Failed to load color mappings: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                this.BACKEND_COLOR_TO_CUBE = data.color_to_cube;
                this.CUBE_TO_BACKEND_COLOR = data.cube_to_color;
                this.mappingsLoaded = true;
                console.log('✅ Color mappings loaded from backend');
            } else {
                throw new Error('Backend returned unsuccessful response');
            }
        } catch (error) {
            console.error('⚠️ Failed to load color mappings from backend:', error);
            console.log('Using fallback color mappings');
            // Fallback mappings if API is unavailable
            this.BACKEND_COLOR_TO_CUBE = {
                'White': 'U',   // Up face
                'Red': 'R',     // Right face
                'Green': 'F',   // Front face
                'Yellow': 'D',  // Down face
                'Orange': 'L',  // Left face
                'Blue': 'B',    // Back face
                'Unknown': 'U'  // Default to white/up
            };
            this.CUBE_TO_BACKEND_COLOR = {
                'U': 'White',   // Up face
                'R': 'Red',     // Right face
                'F': 'Green',   // Front face
                'D': 'Yellow',  // Down face
                'L': 'Orange',  // Left face
                'B': 'Blue'     // Back face
            };
            this.mappingsLoaded = true;
        }
    }

    /**
     * Initialize cube to solved state
     */
    initializeSolvedState() {
        // Set cubestring to solved state using backend COLOR_TO_CUBE format
        this.cubestring = this.SOLVED_CUBESTRING;
        this.notifyChange('initialized');
    }

    /**
     * Get the current cubestring
     * @returns {string} 54-character cubestring in backend COLOR_TO_CUBE format
     */
    getCubestring() {
        return this.cubestring;
    }

    /**
     * Set the cubestring
     * @param {string} cubestring - 54-character cubestring in backend COLOR_TO_CUBE format
     * @throws {Error} If cubestring is invalid
     */
    setCubestring(cubestring) {
        if (!this.isValidCubestring(cubestring)) {
            throw new Error('Invalid cubestring format');
        }

        this.cubestring = cubestring;
        this.notifyChange('cubestringUpdated', {
            cubestring: cubestring
        });
    }

    /**
     * Convert string position (0-53) to face coordinates
     * @param {number} position - Position in cubestring (0-53)
     * @returns {Object} Object with {face, row, col} properties
     * @throws {Error} If position is out of range
     */
    stringPositionToFaceCoords(position) {
        // Validate position range
        if (!Number.isInteger(position) || position < 0 || position > 53) {
            throw new Error(`Invalid position: ${position}. Position must be between 0 and 53.`);
        }

        // Determine which face based on position ranges
        let face, faceStart;

        if (position >= 0 && position < 9) {
            face = 'top';
            faceStart = 0;
        } else if (position >= 9 && position < 18) {
            face = 'right';
            faceStart = 9;
        } else if (position >= 18 && position < 27) {
            face = 'front';
            faceStart = 18;
        } else if (position >= 27 && position < 36) {
            face = 'bottom';
            faceStart = 27;
        } else if (position >= 36 && position < 45) {
            face = 'left';
            faceStart = 36;
        } else { // position >= 45 && position < 54
            face = 'back';
            faceStart = 45;
        }

        // Calculate row and col within the face
        const offset = position - faceStart;
        const row = Math.floor(offset / 3);
        const col = offset % 3;

        return { face, row, col };
    }

    /**
     * Convert face coordinates to string position (0-53)
     * @param {string} face - Face name (top, right, front, bottom, left, back)
     * @param {number} row - Row index (0-2)
     * @param {number} col - Column index (0-2)
     * @returns {number} Position in cubestring (0-53)
     * @throws {Error} If face name is invalid or row/col are out of range
     */
    faceCoordsToStringPosition(face, row, col) {
        // Validate face name
        if (!this.FACE_RANGES[face]) {
            throw new Error(`Invalid face name: ${face}. Valid faces are: top, right, front, bottom, left, back.`);
        }

        // Validate row and col ranges
        if (!Number.isInteger(row) || row < 0 || row > 2) {
            throw new Error(`Invalid row: ${row}. Row must be between 0 and 2.`);
        }
        if (!Number.isInteger(col) || col < 0 || col > 2) {
            throw new Error(`Invalid col: ${col}. Column must be between 0 and 2.`);
        }

        // Get face start position
        const faceStart = this.FACE_RANGES[face].start;

        // Calculate position as face_start + (row * 3 + col)
        const position = faceStart + (row * 3 + col);

        return position;
    }

    /**
     * Extract a 9-character face substring from cubestring
     * @param {string} cubestring - Full 54-character cubestring
     * @param {string} face - Face name (top, right, front, bottom, left, back)
     * @returns {string} 9-character face substring
     * @throws {Error} If face name is invalid
     */
    extractFaceString(cubestring, face) {
        // Validate face name
        if (!this.FACE_RANGES[face]) {
            throw new Error(`Invalid face name: ${face}. Valid faces are: top, right, front, bottom, left, back.`);
        }

        // Get face range
        const { start, end } = this.FACE_RANGES[face];

        // Return substring
        return cubestring.substring(start, end);
    }

    /**
     * Update a face in the cubestring
     * @param {string} cubestring - Current 54-character cubestring
     * @param {string} face - Face name (top, right, front, bottom, left, back)
     * @param {string} faceString - 9-character face string to insert
     * @returns {string} Updated cubestring
     * @throws {Error} If face name is invalid or faceString is not 9 characters
     */
    updateFaceInString(cubestring, face, faceString) {
        // Validate face name
        if (!this.FACE_RANGES[face]) {
            throw new Error(`Invalid face name: ${face}. Valid faces are: top, right, front, bottom, left, back.`);
        }

        // Validate faceString length
        if (!faceString || faceString.length !== 9) {
            throw new Error(`Invalid faceString: must be exactly 9 characters, got ${faceString ? faceString.length : 0}.`);
        }

        // Get face range
        const { start, end } = this.FACE_RANGES[face];

        // Replace substring and return new cubestring
        return cubestring.substring(0, start) + faceString + cubestring.substring(end);
    }

    /**
     * Get color at a specific string position
     * @param {number} position - Position in cubestring (0-53)
     * @returns {string} Color character at that position
     * @throws {Error} If position is out of range
     */
    getStickerFromString(position) {
        // Validate position range
        if (!Number.isInteger(position) || position < 0 || position > 53) {
            throw new Error(`Invalid position: ${position}. Position must be between 0 and 53.`);
        }

        return this.cubestring[position];
    }

    /**
     * Set color at a specific string position
     * @param {number} position - Position in cubestring (0-53)
     * @param {string} color - Color character to set (U, R, F, D, L, B)
     * @returns {void}
     * @throws {Error} If position is out of range or color is invalid
     */
    setStickerInString(position, color) {
        // Validate position range
        if (!Number.isInteger(position) || position < 0 || position > 53) {
            throw new Error(`Invalid position: ${position}. Position must be between 0 and 53.`);
        }

        // Validate color
        const validColors = ['U', 'R', 'F', 'D', 'L', 'B'];
        if (!validColors.includes(color)) {
            throw new Error(`Invalid color: ${color}. Valid colors are: U, R, F, D, L, B.`);
        }

        // Update cubestring
        this.cubestring = this.cubestring.substring(0, position) + color + this.cubestring.substring(position + 1);

        // Notify change
        const coords = this.stringPositionToFaceCoords(position);
        this.notifyChange('stickerUpdated', {
            position: position,
            face: coords.face,
            row: coords.row,
            col: coords.col,
            color: color
        });
    }

    /**
     * Validate cubestring format
     * Checks for valid backend COLOR_TO_CUBE notation (U, R, F, D, L, B)
     * @param {string} cubestring - Cubestring to validate
     * @returns {boolean} Whether the cubestring is valid
     */
    isValidCubestring(cubestring) {
        // Check if cubestring exists and is a string
        if (!cubestring || typeof cubestring !== 'string') {
            return false;
        }

        // Check length - must be exactly 54 characters
        if (cubestring.length !== 54) {
            return false;
        }

        // Valid characters in backend COLOR_TO_CUBE format
        const validChars = ['U', 'R', 'F', 'D', 'L', 'B'];

        // Check that all characters are valid
        for (let i = 0; i < cubestring.length; i++) {
            if (!validChars.includes(cubestring[i])) {
                return false;
            }
        }

        // Count occurrences of each color
        const colorCounts = {};
        for (const char of cubestring) {
            colorCounts[char] = (colorCounts[char] || 0) + 1;
        }

        // Each color must appear exactly 9 times (9 stickers per face)
        for (const color of validChars) {
            if (colorCounts[color] !== 9) {
                return false;
            }
        }

        return true;
    }

    /**
     * Convert 3x3 color array to 9-character string
     * Flattens array in row-major order (left-to-right, top-to-bottom)
     * @param {Array} colorArray - 3x3 array of color characters
     * @returns {string} 9-character string
     * @throws {Error} If array structure is invalid
     */
    colorArrayToString(colorArray) {
        // Validate input is an array
        if (!Array.isArray(colorArray)) {
            throw new Error('Invalid input: colorArray must be an array');
        }

        // Validate array has exactly 3 rows
        if (colorArray.length !== 3) {
            throw new Error(`Invalid array structure: expected 3 rows, got ${colorArray.length}`);
        }

        // Validate each row is an array with exactly 3 columns
        for (let i = 0; i < colorArray.length; i++) {
            if (!Array.isArray(colorArray[i])) {
                throw new Error(`Invalid array structure: row ${i} is not an array`);
            }
            if (colorArray[i].length !== 3) {
                throw new Error(`Invalid array structure: row ${i} has ${colorArray[i].length} columns, expected 3`);
            }
        }

        // Flatten array in row-major order
        let result = '';
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                result += colorArray[row][col];
            }
        }

        return result;
    }

    /**
     * Convert 9-character string to 3x3 color array
     * Splits string into 3 rows of 3 characters each
     * @param {string} faceString - 9-character string
     * @returns {Array} 3x3 array of color characters
     * @throws {Error} If string length is invalid
     */
    stringToColorArray(faceString) {
        // Validate input is a string
        if (typeof faceString !== 'string') {
            throw new Error('Invalid input: faceString must be a string');
        }

        // Validate string length
        if (faceString.length !== 9) {
            throw new Error(`Invalid string length: expected 9 characters, got ${faceString.length}`);
        }

        // Split string into 3 rows of 3 characters each
        const result = [];
        for (let row = 0; row < 3; row++) {
            const rowArray = [];
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                rowArray.push(faceString[index]);
            }
            result.push(rowArray);
        }

        return result;
    }

    /**
     * Get colors for a specific face
     * Extracts face from cubestring and returns as 3x3 array for backward compatibility
     * @param {string} facePosition - Face position (front, back, left, right, top, bottom)
     * @returns {Array} 3x3 array of color keys
     */
    getFaceColors(facePosition) {
        if (!this.isValidFacePosition(facePosition)) {
            throw new Error(`Invalid face position: ${facePosition}`);
        }

        // Extract 9-character face string from cubestring
        const faceString = this.extractFaceString(this.cubestring, facePosition);
        
        // Convert to 3x3 array format for backward compatibility
        return this.stringToColorArray(faceString);
    }

    /**
     * Set colors for a specific face
     * Modifies cubestring using the provided 3x3 color array
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

        // Convert 3x3 array to 9-character string
        const faceString = this.colorArrayToString(colors);
        
        // Update the face in the cubestring
        this.cubestring = this.updateFaceInString(this.cubestring, facePosition, faceString);

        // Trigger change notifications with cubestring data
        this.notifyChange('faceUpdated', {
            face: facePosition,
            colors: colors,
            cubestring: this.cubestring
        });
    }

    /**
     * Get color of a specific sticker
     * Reads from cubestring using position mapping
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

        // Convert face coordinates to string position
        const position = this.faceCoordsToStringPosition(facePosition, row, col);
        
        // Get color from cubestring
        return this.getStickerFromString(position);
    }

    /**
     * Set color of a specific sticker
     * Modifies cubestring using position mapping
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

        // Convert face coordinates to string position
        const position = this.faceCoordsToStringPosition(facePosition, row, col);
        
        // Set color in cubestring (this also triggers notification)
        this.setStickerInString(position, color);
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
     * Includes cubestring in exported state
     * @returns {Object} Complete cube state
     */
    getState() {
        return {
            cubestring: this.cubestring,
            currentView: this.currentView,
            editMode: this.editMode,
            timestamp: Date.now()
        };
    }

    /**
     * Set complete cube state from serializable object
     * Restores cubestring and other state properties
     * @param {Object} state - Complete cube state
     */
    setState(state) {
        if (!state || typeof state !== 'object') {
            throw new Error('Invalid state object');
        }

        // Restore cubestring if present
        if (state.cubestring) {
            if (!this.isValidCubestring(state.cubestring)) {
                throw new Error('Invalid cubestring in state object');
            }
            this.cubestring = state.cubestring;
        }

        // Set view mode
        if (state.currentView) {
            this.setCurrentView(state.currentView);
        }

        // Set edit mode
        if (typeof state.editMode === 'boolean') {
            this.setEditMode(state.editMode);
        }

        this.notifyChange('stateRestored', {
            cubestring: this.cubestring
        });
    }

    /**
     * Reset cube to solved state
     * Sets cubestring to solved state and triggers appropriate change notifications
     */
    reset() {
        // Set cubestring to solved state
        this.cubestring = this.SOLVED_CUBESTRING;
        
        // Reset edit mode but preserve current view
        this.setEditMode(false);

        // Trigger change notifications
        this.notifyChange('reset', { 
            cubestring: this.cubestring,
            state: this.getState() 
        });
    }

    /**
     * Import cube state from backend cube string format
     * Sets cubestring directly from the provided string
     * @param {string} cubeString - 54-character cube string (UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB)
     */
    importFromCubeString(cubeString) {
        if (!cubeString || cubeString.length !== 54) {
            throw new Error('Invalid cube string: must be exactly 54 characters');
        }

        console.log('Importing cube string:', cubeString);

        // Validate cubestring format
        if (!this.isValidCubestring(cubeString)) {
            throw new Error('Invalid cube string format');
        }

        // Set cubestring directly
        this.cubestring = cubeString;

        this.notifyChange('cubeStringImported', {
            cubeString: cubeString,
            cubestring: this.cubestring
        });

        console.log('Cube string imported successfully');
    }

    /**
     * Ensure color mappings are loaded before using them
     * @returns {Promise<void>}
     */
    async ensureMappingsLoaded() {
        if (!this.mappingsLoaded) {
            await this.loadColorMappings();
        }
    }

    /**
     * Import cube state from backend color array format
     * Placeholder - will be reimplemented with cubestring
     * @param {Array} colorArray - Array of 54 color names from backend
     */
    async importFromBackendColors(colorArray) {
        if (!Array.isArray(colorArray) || colorArray.length !== 54) {
            throw new Error('Invalid color array: must be array of 54 color names');
        }

        console.log('Importing backend colors:', colorArray.length, 'colors');

        // Ensure mappings are loaded
        await this.ensureMappingsLoaded();

        // Convert backend color names to cube notation
        const cubeString = colorArray.map(colorName =>
            this.BACKEND_COLOR_TO_CUBE[colorName] || 'W'
        ).join('');

        // Use the cube string import method
        this.importFromCubeString(cubeString);

        this.notifyChange('backendColorsImported', {
            colorArray: colorArray,
            cubeString: cubeString
        });

        console.log('Backend colors imported successfully');
    }

    /**
     * Import cube state from backend JSON format
     * Placeholder - will be reimplemented with cubestring
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
            backendData: backendData
        });

        console.log('Backend data imported successfully');
    }



    /**
     * Export current cube state as cube string
     * Returns cubestring directly
     * @returns {string} 54-character cube string
     */
    exportToCubeString() {
        return this.cubestring;
    }

    /**
     * Export current cube state as backend color array
     * Placeholder - will be reimplemented with cubestring
     * @returns {Promise<Array>} Array of 54 backend color names
     */
    async exportToBackendColors() {
        // Ensure mappings are loaded
        await this.ensureMappingsLoaded();

        const cubeString = this.exportToCubeString();
        return cubeString.split('').map(cubeKey =>
            this.CUBE_TO_BACKEND_COLOR[cubeKey] || 'White'
        );
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
     * Placeholder - will be reimplemented with cubestring
     * @returns {boolean} Whether the cube is solved
     */
    isSolved() {
        // Placeholder - will be implemented with cubestring validation
        return false;
    }

    /**
     * Validate cube state integrity with detailed error reporting
     * Validates cubestring format and optionally checks with backend
     * @param {boolean} useBackend - Whether to use backend validation (default: false)
     * @returns {Promise<Object>} Validation result with isValid flag and details
     */
    async isValidState(useBackend = false) {
        const errors = [];
        const warnings = [];
        
        // Basic cubestring validation
        const cubestring = this.getCubestring();
        
        // Check 1: Cubestring exists
        if (!cubestring) {
            errors.push({
                type: 'missing_cubestring',
                message: 'Cubestring is null or undefined',
                severity: 'error'
            });
            return {
                isValid: false,
                errors: errors,
                warnings: warnings,
                colorCounts: {},
                details: 'Cubestring is missing'
            };
        }
        
        // Check 2: Length validation
        if (cubestring.length !== 54) {
            errors.push({
                type: 'invalid_length',
                message: `Cubestring must be exactly 54 characters, got ${cubestring.length}`,
                severity: 'error',
                expected: 54,
                actual: cubestring.length
            });
        }
        
        // Check 3: Character validation
        const validChars = ['U', 'R', 'F', 'D', 'L', 'B'];
        const invalidPositions = [];
        for (let i = 0; i < cubestring.length; i++) {
            const char = cubestring[i];
            if (!validChars.includes(char)) {
                invalidPositions.push({
                    position: i,
                    character: char,
                    face: this.stringPositionToFaceCoords(i).face
                });
            }
        }
        
        if (invalidPositions.length > 0) {
            errors.push({
                type: 'invalid_characters',
                message: `Found ${invalidPositions.length} invalid character(s). Valid characters are: U, R, F, D, L, B`,
                severity: 'error',
                invalidPositions: invalidPositions,
                suggestion: 'Replace invalid characters with valid cube notation (U, R, F, D, L, B)'
            });
        }
        
        // Check 4: Color distribution validation
        const colorCounts = {};
        for (const char of cubestring) {
            colorCounts[char] = (colorCounts[char] || 0) + 1;
        }
        
        const distributionErrors = [];
        for (const color of validChars) {
            const count = colorCounts[color] || 0;
            if (count !== 9) {
                distributionErrors.push({
                    color: color,
                    expected: 9,
                    actual: count,
                    difference: count - 9
                });
            }
        }
        
        if (distributionErrors.length > 0) {
            errors.push({
                type: 'invalid_distribution',
                message: 'Each color must appear exactly 9 times (one face)',
                severity: 'error',
                distributionErrors: distributionErrors,
                colorCounts: colorCounts,
                suggestion: 'Ensure each face has exactly 9 stickers of the same color family'
            });
        }
        
        // Check 5: Center pieces validation (optional warning)
        const centerPositions = [4, 13, 22, 31, 40, 49]; // Center of each face
        const centerColors = centerPositions.map(pos => cubestring[pos]);
        const uniqueCenters = new Set(centerColors);
        
        if (uniqueCenters.size !== 6) {
            warnings.push({
                type: 'duplicate_centers',
                message: 'Center pieces should be unique (one of each color)',
                severity: 'warning',
                centerColors: centerColors,
                uniqueCount: uniqueCenters.size
            });
        }
        
        // If backend validation is requested and no basic errors found
        if (useBackend && errors.length === 0) {
            try {
                const backendValidation = await this.validateWithBackend(cubestring);
                if (!backendValidation.isValid) {
                    errors.push({
                        type: 'backend_validation_failed',
                        message: 'Cube state is not physically valid',
                        severity: 'error',
                        details: backendValidation.details || 'The cube configuration is impossible in reality. This usually means the colors were captured incorrectly.',
                        suggestion: 'Try recapturing the cube faces or manually editing the colors to fix the issue.'
                    });
                }
                
                // Add backend warnings if any
                if (backendValidation.warnings) {
                    warnings.push(...backendValidation.warnings);
                }
            } catch (error) {
                warnings.push({
                    type: 'backend_unavailable',
                    message: 'Could not connect to backend validation service',
                    severity: 'warning',
                    details: error.message,
                    suggestion: 'Ensure the backend server is running at http://localhost:5000'
                });
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            colorCounts: colorCounts,
            details: errors.length === 0 ? 'Cubestring is valid' : `Found ${errors.length} error(s)`,
            cubestring: cubestring
        };
    }

    /**
     * Validate cubestring with backend API
     * @param {string} cubestring - Cubestring to validate
     * @returns {Promise<Object>} Backend validation result
     */
    async validateWithBackend(cubestring) {
        try {
            // Ensure color mappings are loaded
            await this.ensureMappingsLoaded();
            
            // Convert cubestring to color array for backend
            const colorArray = [];
            for (let i = 0; i < cubestring.length; i++) {
                const char = cubestring[i];
                const colorName = this.CUBE_TO_BACKEND_COLOR[char] || 'Unknown';
                colorArray.push(colorName);
            }
            
            const response = await fetch(`${this.API_BASE_URL}/api/validate-cube`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cube_state: colorArray,
                    cube_string: cubestring
                })
            });
            
            if (!response.ok) {
                throw new Error(`Backend validation failed: ${response.status}`);
            }
            
            const result = await response.json();
            return {
                isValid: result.is_valid || false,
                details: result.message || result.error,
                warnings: result.warnings || []
            };
            
        } catch (error) {
            console.error('Backend validation error:', error);
            throw error;
        }
    }

    /**
     * Perform comprehensive cube state validation
     * Validates cubestring and checks if cube is solved
     * @param {boolean} useBackend - Whether to use backend validation (default: false)
     * @returns {Promise<Object>} Complete validation result
     */
    async validateCube(useBackend = false) {
        const validation = await this.isValidState(useBackend);
        
        // Check if cube is in solved state
        const isSolved = this.cubestring === this.SOLVED_CUBESTRING;
        
        return {
            isValid: validation.isValid,
            isSolved: isSolved,
            errors: validation.errors,
            warnings: validation.warnings,
            colorCounts: validation.colorCounts,
            details: validation.details,
            cubestring: this.cubestring
        };
    }

    /**
     * Get cube statistics
     * Returns statistics about the current cube state
     * @returns {Promise<Object>} Statistics about the current cube state
     */
    async getStatistics() {
        const validation = await this.validateCube(false);

        return {
            isValid: validation.isValid,
            isSolved: validation.isSolved,
            totalStickers: 54,
            currentView: this.currentView,
            editMode: this.editMode,
            errors: validation.errors,
            warnings: validation.warnings,
            colorCounts: validation.colorCounts
        };
    }

    /**
     * Create a backup of the current state
     * Creates a backup with cubestring and validation info
     * @returns {Promise<Object>} Backup state object
     */
    async createBackup() {
        const validation = await this.validateCube(false);
        
        return {
            timestamp: Date.now(),
            state: this.getState(),
            validation: validation,
            cubestring: this.cubestring
        };
    }

    /**
     * Restore from a backup
     * Restores cube state from a backup object
     * @param {Object} backup - Backup object created by createBackup()
     */
    restoreFromBackup(backup) {
        if (!backup || !backup.state) {
            throw new Error('Invalid backup object');
        }

        this.setState(backup.state);
        this.notifyChange('backupRestored', {
            backup: backup,
            cubestring: this.cubestring
        });
    }
}

export { CubeState };