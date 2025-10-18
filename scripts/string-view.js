/**
 * StringView class for displaying and editing the raw cubestring
 * Provides a text-based interface for advanced users
 */

export class StringView {
    constructor(cubeState) {
        if (!cubeState) {
            throw new Error('CubeState instance is required');
        }

        this.cubeState = cubeState;
        this.container = null;
        this.isEditing = false;
        this.changeListenerId = null;

        // Listen for cube state changes
        this.setupChangeListener();

        console.log('StringView initialized');
    }

    /**
     * Set up listener for cube state changes
     */
    setupChangeListener() {
        this.changeListenerId = this.cubeState.addChangeListener((event) => {
            // Update the view when cube state changes
            if (event.type === 'cubeStringChanged' || event.type === 'reset') {
                this.update();
            }
        });
    }

    /**
     * Render the string view
     */
    render() {
        const container = document.getElementById('cube-visualization');
        if (!container) {
            console.error('Cube visualization container not found');
            return;
        }

        this.container = container;
        container.innerHTML = '';

        const stringViewContainer = document.createElement('div');
        stringViewContainer.className = 'string-view';
        stringViewContainer.innerHTML = `
            <div class="string-view__header">
                <h3 class="string-view__title">Cubestring Editor</h3>
                <p class="string-view__description">
                    View and edit the raw 54-character cubestring representation
                </p>
            </div>

            <div class="string-view__content">
                <div class="string-view__display">
                    <label class="string-view__label">Current Cubestring:</label>
                    <div class="string-view__string" id="cubestring-display">
                        ${this.formatCubestring(this.cubeState.cubestring)}
                    </div>
                </div>

                <div class="string-view__editor">
                    <label class="string-view__label" for="cubestring-input">Edit Cubestring:</label>
                    <textarea 
                        class="string-view__input" 
                        id="cubestring-input"
                        placeholder="Enter 54-character cubestring (U, R, F, D, L, B)"
                        maxlength="54"
                        spellcheck="false"
                    >${this.cubeState.cubestring}</textarea>
                    <div class="string-view__char-count">
                        <span id="char-count">${this.cubeState.cubestring.length}</span> / 54 characters
                    </div>
                </div>

                <div class="string-view__actions">
                    <button class="string-view__btn string-view__btn--apply" id="apply-cubestring">
                        Apply Changes
                    </button>
                    <button class="string-view__btn string-view__btn--copy" id="copy-cubestring">
                        Copy to Clipboard
                    </button>
                    <button class="string-view__btn string-view__btn--reset" id="reset-cubestring">
                        Reset to Current
                    </button>
                </div>

                <div class="string-view__validation" id="validation-message"></div>

                <div class="string-view__legend">
                    <h4 class="string-view__legend-title">Format Guide:</h4>
                    <div class="string-view__legend-grid">
                        <div class="string-view__legend-item">
                            <span class="string-view__legend-char string-view__legend-char--u">U</span>
                            <span class="string-view__legend-text">White (Up)</span>
                        </div>
                        <div class="string-view__legend-item">
                            <span class="string-view__legend-char string-view__legend-char--r">R</span>
                            <span class="string-view__legend-text">Red (Right)</span>
                        </div>
                        <div class="string-view__legend-item">
                            <span class="string-view__legend-char string-view__legend-char--f">F</span>
                            <span class="string-view__legend-text">Green (Front)</span>
                        </div>
                        <div class="string-view__legend-item">
                            <span class="string-view__legend-char string-view__legend-char--d">D</span>
                            <span class="string-view__legend-text">Yellow (Down)</span>
                        </div>
                        <div class="string-view__legend-item">
                            <span class="string-view__legend-char string-view__legend-char--l">L</span>
                            <span class="string-view__legend-text">Orange (Left)</span>
                        </div>
                        <div class="string-view__legend-item">
                            <span class="string-view__legend-char string-view__legend-char--b">B</span>
                            <span class="string-view__legend-text">Blue (Back)</span>
                        </div>
                    </div>
                    <p class="string-view__legend-note">
                        <strong>Face Order:</strong> Up (0-8), Right (9-17), Front (18-26), Down (27-35), Left (36-44), Back (45-53)
                    </p>
                </div>
            </div>
        `;

        container.appendChild(stringViewContainer);
        this.attachEventListeners();
    }

    /**
     * Format cubestring with face separators for readability
     */
    formatCubestring(cubestring) {
        if (!cubestring || cubestring.length !== 54) {
            return cubestring;
        }

        const faces = [
            cubestring.substring(0, 9),   // U
            cubestring.substring(9, 18),  // R
            cubestring.substring(18, 27), // F
            cubestring.substring(27, 36), // D
            cubestring.substring(36, 45), // L
            cubestring.substring(45, 54)  // B
        ];

        return faces.map((face, index) => {
            const faceNames = ['U', 'R', 'F', 'D', 'L', 'B'];
            const coloredChars = face.split('').map(char =>
                `<span class="string-view__char string-view__char--${char.toLowerCase()}">${char}</span>`
            ).join('');
            return `<span class="string-view__face-group" data-face="${faceNames[index]}">${coloredChars}</span>`;
        }).join('<span class="string-view__separator">|</span>');
    }

    /**
     * Attach event listeners to interactive elements
     */
    attachEventListeners() {
        const input = document.getElementById('cubestring-input');
        const applyBtn = document.getElementById('apply-cubestring');
        const copyBtn = document.getElementById('copy-cubestring');
        const resetBtn = document.getElementById('reset-cubestring');
        const charCount = document.getElementById('char-count');

        if (input) {
            input.addEventListener('input', (e) => {
                const value = e.target.value.toUpperCase();
                e.target.value = value;

                if (charCount) {
                    charCount.textContent = value.length;
                }

                this.validateInput(value);
            });

            // Track when user is editing
            input.addEventListener('focus', () => {
                this.isEditing = true;
            });

            input.addEventListener('blur', () => {
                // Delay to allow apply button click to register
                setTimeout(() => {
                    this.isEditing = false;
                }, 200);
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyChanges());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetInput());
        }
    }

    /**
     * Validate cubestring input
     */
    validateInput(value) {
        const validationMessage = document.getElementById('validation-message');
        if (!validationMessage) return;

        validationMessage.innerHTML = '';
        validationMessage.className = 'string-view__validation';

        if (value.length === 0) {
            return;
        }

        if (value.length !== 54) {
            this.showValidationMessage('error', `Invalid length: ${value.length} characters (need 54)`);
            return;
        }

        const validChars = ['U', 'R', 'F', 'D', 'L', 'B'];
        const invalidChars = value.split('').filter(char => !validChars.includes(char));

        if (invalidChars.length > 0) {
            const unique = [...new Set(invalidChars)].join(', ');
            this.showValidationMessage('error', `Invalid characters: ${unique}`);
            return;
        }

        // Count each color
        const counts = {};
        validChars.forEach(char => {
            counts[char] = (value.match(new RegExp(char, 'g')) || []).length;
        });

        const invalidCounts = Object.entries(counts).filter(([char, count]) => count !== 9);
        if (invalidCounts.length > 0) {
            const details = invalidCounts.map(([char, count]) => `${char}:${count}`).join(', ');
            this.showValidationMessage('warning', `Each color should appear exactly 9 times (${details})`);
            return;
        }

        this.showValidationMessage('success', 'Valid cubestring format ✓');
    }

    /**
     * Show validation message
     */
    showValidationMessage(type, message) {
        const validationMessage = document.getElementById('validation-message');
        if (!validationMessage) return;

        validationMessage.className = `string-view__validation string-view__validation--${type}`;
        validationMessage.textContent = message;
    }

    /**
     * Apply cubestring changes
     */
    applyChanges() {
        const input = document.getElementById('cubestring-input');
        if (!input) return;

        const newCubestring = input.value.toUpperCase().trim();

        // Validate before applying
        if (newCubestring.length !== 54) {
            this.showValidationMessage('error', 'Cannot apply: cubestring must be exactly 54 characters');
            return;
        }

        const validChars = ['U', 'R', 'F', 'D', 'L', 'B'];
        const invalidChars = newCubestring.split('').filter(char => !validChars.includes(char));

        if (invalidChars.length > 0) {
            this.showValidationMessage('error', 'Cannot apply: cubestring contains invalid characters');
            return;
        }

        // Apply the new cubestring
        try {
            this.cubeState.cubestring = newCubestring;

            // Update the display
            const display = document.getElementById('cubestring-display');
            if (display) {
                display.innerHTML = this.formatCubestring(newCubestring);
            }

            this.showValidationMessage('success', 'Cubestring applied successfully! Switch to 3D or Net view to see changes.');

            console.log('Cubestring updated:', newCubestring);
        } catch (error) {
            this.showValidationMessage('error', `Failed to apply: ${error.message}`);
            console.error('Error applying cubestring:', error);
        }
    }

    /**
     * Copy cubestring to clipboard
     */
    async copyToClipboard() {
        const input = document.getElementById('cubestring-input');
        if (!input) return;

        const cubestring = input.value;

        try {
            await navigator.clipboard.writeText(cubestring);
            this.showValidationMessage('success', 'Copied to clipboard!');

            // Clear message after 2 seconds
            setTimeout(() => {
                const validationMessage = document.getElementById('validation-message');
                if (validationMessage) {
                    validationMessage.innerHTML = '';
                }
            }, 2000);
        } catch (error) {
            // Fallback for older browsers
            input.select();
            document.execCommand('copy');
            this.showValidationMessage('success', 'Copied to clipboard!');
        }
    }

    /**
     * Reset input to current cubestring
     */
    resetInput() {
        const input = document.getElementById('cubestring-input');
        const charCount = document.getElementById('char-count');

        if (input) {
            input.value = this.cubeState.cubestring;

            if (charCount) {
                charCount.textContent = this.cubeState.cubestring.length;
            }

            this.showValidationMessage('success', 'Reset to current cubestring');

            // Clear message after 2 seconds
            setTimeout(() => {
                const validationMessage = document.getElementById('validation-message');
                if (validationMessage) {
                    validationMessage.innerHTML = '';
                }
            }, 2000);
        }
    }

    /**
     * Update the view when cubestring changes externally
     */
    update() {
        const display = document.getElementById('cubestring-display');
        const input = document.getElementById('cubestring-input');
        const charCount = document.getElementById('char-count');
        const validationMessage = document.getElementById('validation-message');

        if (display) {
            display.innerHTML = this.formatCubestring(this.cubeState.cubestring);
        }

        if (input && !this.isEditing) {
            input.value = this.cubeState.cubestring;
        }

        if (charCount) {
            charCount.textContent = this.cubeState.cubestring.length;
        }

        // Clear validation message when updated externally
        if (validationMessage && !this.isEditing) {
            validationMessage.innerHTML = '';
            validationMessage.className = 'string-view__validation';
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Remove change listener
        if (this.changeListenerId !== null) {
            this.cubeState.removeChangeListener(this.changeListenerId);
            this.changeListenerId = null;
        }

        console.log('StringView destroyed');
    }
}
