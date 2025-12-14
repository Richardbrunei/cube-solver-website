/**
 * CubeRenderer class for 3D Rubik's cube visualization
 * Handles rendering the cube in both 3D and net views with CSS transforms
 */

import { CubeState } from './cube-state.js';

class CubeRenderer {
    constructor(containerId, cubeState, options = {}) {
        // Support both string ID and HTMLElement for container
        if (typeof containerId === 'string') {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                throw new Error(`Container element with id '${containerId}' not found`);
            }
        } else if (containerId instanceof HTMLElement) {
            this.container = containerId;
        } else {
            throw new Error('containerId must be a string ID or HTMLElement');
        }

        this.cubeState = cubeState;
        if (!(cubeState instanceof CubeState)) {
            throw new Error('cubeState must be an instance of CubeState');
        }

        // Animation renderer options
        this.isAnimationRenderer = options.isAnimationRenderer || false;

        // Renderer state
        this.currentView = '3d';
        this.isInteractive = !this.isAnimationRenderer; // Animation renderers start non-interactive
        this.selectedFace = null;
        this.selectedSticker = null;

        // Rotation state
        this.rotationX = -15;  // Default X rotation (degrees)
        this.rotationY = 25;   // Default Y rotation (degrees)
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartRotationX = 0;
        this.dragStartRotationY = 0;
        this.dragYDirection = 1;  // Y rotation direction at drag start (1 or -1)
        this.rotationSensitivity = 0.4;  // Degrees per pixel
        
        // Rotation UI elements
        this.rotationResetButton = null;
        
        // Bound event handlers for cleanup
        this.boundMouseDown = null;
        this.boundMouseMove = null;
        this.boundMouseUp = null;
        this.boundTouchStart = null;
        this.boundTouchMove = null;
        this.boundTouchEnd = null;

        // Face mapping for 3D transforms
        this.faceTransforms = {
            front: 'translateZ(100px)',
            back: 'rotateY(180deg) translateZ(100px)',
            right: 'rotateY(90deg) translateZ(100px)',
            left: 'rotateY(-90deg) translateZ(100px)',
            top: 'rotateX(90deg) translateZ(100px)',
            bottom: 'rotateX(-90deg) translateZ(100px)'
        };

        // Net layout positions
        this.netPositions = {
            top: { gridColumn: '2', gridRow: '1' },
            left: { gridColumn: '1', gridRow: '2' },
            front: { gridColumn: '2', gridRow: '2' },
            right: { gridColumn: '3', gridRow: '2' },
            back: { gridColumn: '4', gridRow: '2' },
            bottom: { gridColumn: '2', gridRow: '3' }
        };

        // Color mapping
        this.colorClasses = {
            W: 'white',
            Y: 'yellow', 
            R: 'red',
            O: 'orange',
            B: 'blue',
            G: 'green'
        };

        // Initialize renderer
        this.init();
    }

    /**
     * Initialize the renderer
     */
    init() {
        // Set up container
        this.setupContainer();

        // Only listen to state changes if not an animation renderer
        if (!this.isAnimationRenderer) {
            // Bind the state change handler to maintain context
            this.boundStateChangeHandler = this.handleStateChange.bind(this);
            
            // Listen for cube state changes
            this.cubeState.addChangeListener(this.boundStateChangeHandler);
        }

        // Render initial view
        this.render3DView();
    }

    /**
     * Set up the container element
     */
    setupContainer() {
        this.container.classList.add('cube-renderer');
        this.container.style.perspective = '1000px';
        this.container.style.perspectiveOrigin = 'center center';
    }

    /**
     * Render the cube in 3D view
     */
    render3DView() {
        this.currentView = '3d';
        
        // Store current rotation state before re-rendering
        const savedRotationX = this.rotationX;
        const savedRotationY = this.rotationY;
        
        // Clear container
        this.container.innerHTML = '';

        // Create 3D cube container
        // Width/height are set via CSS classes to support responsive sizing
        const cubeElement = document.createElement('div');
        cubeElement.className = 'cube-3d';
        cubeElement.style.cssText = `
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.5s ease;
            margin: 0 auto;
            cursor: grab;
        `;

        // Create all six faces
        const facePositions = this.cubeState.getAllFacePositions();
        facePositions.forEach(facePosition => {
            const faceElement = this.create3DFace(facePosition);
            cubeElement.appendChild(faceElement);
        });

        this.container.appendChild(cubeElement);

        // Apply stored rotation using applyRotation
        this.rotationX = savedRotationX;
        this.rotationY = savedRotationY;
        this.applyRotation();

        // Only add rotation controls if not an animation renderer
        if (!this.isAnimationRenderer) {
            // Bind and attach mouse event listeners for drag-to-rotate
            this.boundMouseDown = this.handleMouseDown.bind(this);
            this.boundMouseMove = this.handleMouseMove.bind(this);
            this.boundMouseUp = this.handleMouseUp.bind(this);
            
            cubeElement.addEventListener('mousedown', this.boundMouseDown);
            document.addEventListener('mousemove', this.boundMouseMove);
            document.addEventListener('mouseup', this.boundMouseUp);

            // Bind and attach touch event listeners for mobile rotation
            this.boundTouchStart = this.handleTouchStart.bind(this);
            this.boundTouchMove = this.handleTouchMove.bind(this);
            this.boundTouchEnd = this.handleTouchEnd.bind(this);
            
            cubeElement.addEventListener('touchstart', this.boundTouchStart, { passive: false });
            cubeElement.addEventListener('touchmove', this.boundTouchMove, { passive: false });
            cubeElement.addEventListener('touchend', this.boundTouchEnd);
            cubeElement.addEventListener('touchcancel', this.boundTouchEnd);

            // Create and append rotation reset button to container
            this.rotationResetButton = this.createRotationResetButton();
            this.container.appendChild(this.rotationResetButton);
            
            // Update reset button visibility
            this.updateResetButtonVisibility();
        }

        // Add hover effect (without hardcoded rotation values)
        cubeElement.addEventListener('mouseenter', () => {
            if (!this.isDragging) {
                const currentTransform = cubeElement.style.transform;
                cubeElement.style.transform = currentTransform + ' scale(1.05)';
            }
        });

        cubeElement.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                this.applyRotation();
            }
        });
    }

    /**
     * Create a 3D face element
     * @param {string} facePosition - Position of the face (front, back, etc.)
     * @returns {HTMLElement} Face element
     */
    create3DFace(facePosition) {
        const faceElement = document.createElement('div');
        faceElement.className = `cube-face cube-face--${facePosition}`;
        faceElement.dataset.face = facePosition;

        // Apply base styles only - transform is handled by CSS classes
        // This allows responsive CSS media queries to set appropriate translateZ values
        // for different screen sizes (100px desktop, 90px tablet, 80px mobile, etc.)
        faceElement.style.cssText = `
            position: absolute;
            border: 2px solid #333;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 2px;
            padding: 4px;
            background: #333;
        `;

        // Get face colors from cube state
        const faceColors = this.cubeState.getFaceColors(facePosition);

        // Add face-level hover effects for better interactivity
        faceElement.addEventListener('mouseenter', () => {
            if (this.isInteractive) {
                faceElement.style.boxShadow = '0 0 0 2px rgba(40, 167, 69, 0.5)';
            }
        });

        faceElement.addEventListener('mouseleave', () => {
            if (!faceElement.classList.contains('highlighted')) {
                faceElement.style.boxShadow = '';
            }
        });

        // Create stickers for this face
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const stickerElement = this.create3DSticker(
                    facePosition, 
                    row, 
                    col, 
                    faceColors[row][col]
                );
                faceElement.appendChild(stickerElement);
            }
        }

        return faceElement;
    }

    /**
     * Create a 3D sticker element
     * @param {string} facePosition - Face position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} color - Color key
     * @returns {HTMLElement} Sticker element
     */
    create3DSticker(facePosition, row, col, color) {
        const stickerElement = document.createElement('div');
        const colorClass = this.colorClasses[color] || 'white';
        
        stickerElement.className = `cube-sticker cube-sticker--${colorClass}`;
        stickerElement.dataset.face = facePosition;
        stickerElement.dataset.row = row;
        stickerElement.dataset.col = col;
        stickerElement.dataset.color = color;

        // Apply sticker styling
        stickerElement.style.cssText = `
            background-color: ${this.cubeState.COLORS[color]};
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
            color: ${this.getTextColor(color)};
        `;

        // Add hover effect
        stickerElement.addEventListener('mouseenter', () => {
            if (this.isInteractive) {
                stickerElement.style.transform = 'scale(1.1)';
                stickerElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            }
        });

        stickerElement.addEventListener('mouseleave', () => {
            if (!stickerElement.classList.contains('selected')) {
                stickerElement.style.transform = '';
                stickerElement.style.boxShadow = '';
            }
        });

        // Add click handler for interactivity (only if not animation renderer)
        if (!this.isAnimationRenderer) {
            stickerElement.addEventListener('click', (e) => {
                this.handleStickerClick(e, facePosition, row, col);
            });
            
            // Add touch support for mobile devices
            stickerElement.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent click event from firing
                this.handleStickerClick(e, facePosition, row, col);
            });
        }

        return stickerElement;
    }

    /**
     * Render the cube in net view
     */
    renderNetView() {
        this.currentView = 'net';
        
        // Clear container
        this.container.innerHTML = '';

        // Create net container
        const netElement = document.createElement('div');
        netElement.className = 'cube-net';
        netElement.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 80px);
            grid-template-rows: repeat(3, 80px);
            gap: 4px;
            justify-content: center;
            margin: 0 auto;
        `;

        // Create all six faces in net layout
        const facePositions = this.cubeState.getAllFacePositions();
        facePositions.forEach(facePosition => {
            const faceElement = this.createNetFace(facePosition);
            netElement.appendChild(faceElement);
        });

        this.container.appendChild(netElement);
        
        // Hide rotation reset button in net view
        if (this.rotationResetButton) {
            this.rotationResetButton.style.display = 'none';
        }
    }

    /**
     * Create a net face element
     * @param {string} facePosition - Position of the face
     * @returns {HTMLElement} Face element
     */
    createNetFace(facePosition) {
        const faceElement = document.createElement('div');
        faceElement.className = `net-face net-face--${facePosition}`;
        faceElement.dataset.face = facePosition;

        // Apply net positioning
        const position = this.netPositions[facePosition];
        faceElement.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 2px;
            padding: 2px;
            background: #333;
            border: 2px solid #333;
            border-radius: 4px;
            grid-column: ${position.gridColumn};
            grid-row: ${position.gridRow};
        `;

        // Get face colors from cube state
        const faceColors = this.cubeState.getFaceColors(facePosition);

        // Add face-level hover effects for better interactivity
        faceElement.addEventListener('mouseenter', () => {
            if (this.isInteractive) {
                faceElement.style.boxShadow = '0 0 0 2px rgba(40, 167, 69, 0.5)';
            }
        });

        faceElement.addEventListener('mouseleave', () => {
            if (!faceElement.classList.contains('highlighted')) {
                faceElement.style.boxShadow = '';
            }
        });

        // Create stickers for this face
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const stickerElement = this.createNetSticker(
                    facePosition, 
                    row, 
                    col, 
                    faceColors[row][col]
                );
                faceElement.appendChild(stickerElement);
            }
        }

        return faceElement;
    }

    /**
     * Create a net sticker element
     * @param {string} facePosition - Face position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} color - Color key
     * @returns {HTMLElement} Sticker element
     */
    createNetSticker(facePosition, row, col, color) {
        const stickerElement = document.createElement('div');
        const colorClass = this.colorClasses[color] || 'white';
        
        stickerElement.className = `net-sticker net-sticker--${colorClass}`;
        stickerElement.dataset.face = facePosition;
        stickerElement.dataset.row = row;
        stickerElement.dataset.col = col;
        stickerElement.dataset.color = color;

        // Apply sticker styling
        stickerElement.style.cssText = `
            background-color: ${this.cubeState.COLORS[color]};
            border: 1px solid #ddd;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.6rem;
            font-weight: bold;
            color: ${this.getTextColor(color)};
        `;

        // Add hover effect
        stickerElement.addEventListener('mouseenter', () => {
            if (this.isInteractive) {
                stickerElement.style.transform = 'scale(1.2)';
                stickerElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                stickerElement.style.zIndex = '10';
                stickerElement.style.position = 'relative';
            }
        });

        stickerElement.addEventListener('mouseleave', () => {
            if (!stickerElement.classList.contains('selected')) {
                stickerElement.style.transform = '';
                stickerElement.style.boxShadow = '';
                stickerElement.style.zIndex = '';
                stickerElement.style.position = '';
            }
        });

        // Add click handler for interactivity (only if not animation renderer)
        if (!this.isAnimationRenderer) {
            stickerElement.addEventListener('click', (e) => {
                this.handleStickerClick(e, facePosition, row, col);
            });
            
            // Add touch support for mobile devices
            stickerElement.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent click event from firing
                this.handleStickerClick(e, facePosition, row, col);
            });
        }

        return stickerElement;
    }

    /**
     * Render the cube in string view
     */
    renderStringView() {
        this.currentView = 'string';
        
        // Import StringView dynamically if not already loaded
        if (!this.stringView) {
            import('./string-view.js').then(module => {
                const StringView = module.StringView;
                this.stringView = new StringView(this.cubeState);
                this.stringView.render();
            }).catch(error => {
                console.error('Failed to load StringView:', error);
            });
        } else {
            this.stringView.render();
        }
        
        // Hide rotation reset button in string view
        if (this.rotationResetButton) {
            this.rotationResetButton.style.display = 'none';
        }
    }

    /**
     * Get appropriate text color for a background color
     * @param {string} colorKey - Color key
     * @returns {string} Text color
     */
    getTextColor(colorKey) {
        // Use dark text for light backgrounds, light text for dark backgrounds
        const lightBackgrounds = ['W', 'Y', 'O', 'G'];
        return lightBackgrounds.includes(colorKey) ? '#333' : '#fff';
    }

    /**
     * Handle sticker click events
     * @param {Event} event - Click event
     * @param {string} facePosition - Face position
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    handleStickerClick(event, facePosition, row, col) {
        if (!this.isInteractive) {
            console.log('Cube is not interactive - click ignored');
            return;
        }

        console.log(`Sticker clicked: ${facePosition} [${row}, ${col}]`);

        // Clear previous selection
        this.clearSelection();

        // Select this sticker
        this.selectedFace = facePosition;
        this.selectedSticker = { row, col };

        // Add selected styling
        event.target.classList.add('selected');
        event.target.style.boxShadow = '0 0 0 3px #007bff';
        event.target.style.transform = this.currentView === '3d' ? 'scale(1.1)' : 'scale(1.2)';

        // Emit selection event
        this.emitEvent('stickerSelected', {
            face: facePosition,
            row: row,
            col: col,
            color: this.cubeState.getStickerColor(facePosition, row, col)
        });
    }

    /**
     * Clear current selection
     */
    clearSelection() {
        const selectedElements = this.container.querySelectorAll('.selected');
        selectedElements.forEach(element => {
            element.classList.remove('selected');
            element.style.boxShadow = '';
            element.style.transform = '';
            element.style.zIndex = '';
            element.style.position = '';
        });

        this.selectedFace = null;
        this.selectedSticker = null;
    }

    /**
     * Update face colors when cube state changes
     * @param {string} facePosition - Face position
     * @param {Array} colors - 3x3 color array
     */
    updateFaceColors(facePosition, colors) {
        const faceElement = this.container.querySelector(`[data-face="${facePosition}"]`);
        if (!faceElement) {
            return;
        }

        // Add face-level transition effect
        faceElement.style.transition = 'all 0.4s ease';
        
        // Update each sticker in the face with staggered animation
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const stickerSelector = `[data-face="${facePosition}"][data-row="${row}"][data-col="${col}"]`;
                const stickerElement = this.container.querySelector(stickerSelector);
                
                if (stickerElement) {
                    const newColor = colors[row][col];
                    const colorClass = this.colorClasses[newColor] || 'white';
                    
                    // Add staggered delay for smooth wave effect
                    const delay = (row * 3 + col) * 50; // 50ms delay between each sticker
                    
                    setTimeout(() => {
                        // Add smooth transition
                        stickerElement.style.transition = 'all 0.3s ease';
                        
                        // Update color class
                        stickerElement.className = stickerElement.className.replace(
                            /cube-sticker--\w+|net-sticker--\w+/g, 
                            `${this.currentView === '3d' ? 'cube' : 'net'}-sticker--${colorClass}`
                        );
                        
                        // Update background color and text color
                        stickerElement.style.backgroundColor = this.cubeState.COLORS[newColor];
                        stickerElement.style.color = this.getTextColor(newColor);
                        stickerElement.dataset.color = newColor;
                        
                        // Brief scale effect to indicate change
                        stickerElement.style.transform = this.currentView === '3d' ? 'scale(1.1)' : 'scale(1.2)';
                        
                        setTimeout(() => {
                            if (!stickerElement.classList.contains('selected')) {
                                stickerElement.style.transform = '';
                            }
                        }, 200);
                    }, delay);
                }
            }
        }
    }

    /**
     * Highlight a specific face
     * @param {string} facePosition - Face position to highlight
     */
    highlightFace(facePosition) {
        // Clear previous highlights
        this.clearHighlights();

        const faceElement = this.container.querySelector(`[data-face="${facePosition}"]`);
        if (faceElement) {
            faceElement.classList.add('highlighted');
            faceElement.style.boxShadow = '0 0 0 4px #28a745';
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        const highlightedElements = this.container.querySelectorAll('.highlighted');
        highlightedElements.forEach(element => {
            element.classList.remove('highlighted');
            element.style.boxShadow = '';
        });
    }

    /**
     * Enable interactive mode
     */
    enableInteraction() {
        this.isInteractive = true;
        this.container.classList.add('interactive');
        
        // Update cursor styles
        const stickers = this.container.querySelectorAll('.cube-sticker, .net-sticker');
        stickers.forEach(sticker => {
            sticker.style.cursor = 'pointer';
        });
    }

    /**
     * Disable interactive mode
     */
    disableInteraction() {
        this.isInteractive = false;
        this.container.classList.remove('interactive');
        this.clearSelection();
        
        // Reset cursor styles
        const stickers = this.container.querySelectorAll('.cube-sticker, .net-sticker');
        stickers.forEach(sticker => {
            sticker.style.cursor = 'default';
        });
    }

    /**
     * Set interaction mode (enable/disable sticker clicks)
     * @param {boolean} enabled - Whether interactions should be enabled
     */
    setInteractionMode(enabled) {
        if (enabled) {
            this.enableInteraction();
        } else {
            this.disableInteraction();
        }
    }

    /**
     * Render cube from an arbitrary cubestring without modifying CubeState
     * Used for animation to display virtual cube states
     * @param {string} cubestring - 54-character cubestring to render
     * @param {boolean} animated - Whether to add animation transition classes
     */
    renderFromCubestring(cubestring, animated = false) {
        if (!cubestring || cubestring.length !== 54) {
            console.error('Invalid cubestring provided to renderFromCubestring');
            return;
        }

        // Convert cubestring to face colors
        const faceColors = this._cubestringToFaceColors(cubestring);

        // Update all stickers with the new colors
        Object.keys(faceColors).forEach(facePosition => {
            const colors = faceColors[facePosition];
            this._updateFaceColorsFromArray(facePosition, colors, animated);
        });
    }

    /**
     * Convert cubestring to face colors object
     * @param {string} cubestring - 54-character cubestring
     * @returns {Object} Face colors object
     * @private
     */
    _cubestringToFaceColors(cubestring) {
        // Face order in cubestring: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
        const faceMapping = {
            top: cubestring.substring(0, 9),
            right: cubestring.substring(9, 18),
            front: cubestring.substring(18, 27),
            bottom: cubestring.substring(27, 36),
            left: cubestring.substring(36, 45),
            back: cubestring.substring(45, 54)
        };

        const faceColors = {};
        Object.keys(faceMapping).forEach(facePosition => {
            const faceString = faceMapping[facePosition];
            const colors = [];
            for (let row = 0; row < 3; row++) {
                colors[row] = [];
                for (let col = 0; col < 3; col++) {
                    const index = row * 3 + col;
                    colors[row][col] = faceString[index];
                }
            }
            faceColors[facePosition] = colors;
        });

        return faceColors;
    }

    /**
     * Update face colors from a 2D array with optional animation
     * @param {string} facePosition - Face position
     * @param {Array} colors - 3x3 color array
     * @param {boolean} animated - Whether to add animation classes
     * @private
     */
    _updateFaceColorsFromArray(facePosition, colors, animated = false) {
        const faceElement = this.container.querySelector(`[data-face="${facePosition}"]`);
        if (!faceElement) {
            return;
        }

        // Update each sticker in the face
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const stickerSelector = `[data-face="${facePosition}"][data-row="${row}"][data-col="${col}"]`;
                const stickerElement = this.container.querySelector(stickerSelector);
                
                if (stickerElement) {
                    const newColor = colors[row][col];
                    const colorClass = this.colorClasses[newColor] || 'white';
                    
                    // Add animation class if requested
                    if (animated) {
                        stickerElement.classList.add('animating');
                    }
                    
                    // Update color class
                    stickerElement.className = stickerElement.className.replace(
                        /cube-sticker--\w+|net-sticker--\w+/g, 
                        `${this.currentView === '3d' ? 'cube' : 'net'}-sticker--${colorClass}`
                    );
                    
                    // Ensure animating class is preserved if added
                    if (animated && !stickerElement.classList.contains('animating')) {
                        stickerElement.classList.add('animating');
                    }
                    
                    // Update background color and text color
                    stickerElement.style.backgroundColor = this.cubeState.COLORS[newColor];
                    stickerElement.style.color = this.getTextColor(newColor);
                    stickerElement.dataset.color = newColor;
                }
            }
        }
    }

    /**
     * Get current view type
     * @returns {string} Current view ('3d' or 'net')
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Get selected sticker information
     * @returns {Object|null} Selected sticker info or null
     */
    getSelectedSticker() {
        if (!this.selectedFace || !this.selectedSticker) {
            return null;
        }

        return {
            face: this.selectedFace,
            row: this.selectedSticker.row,
            col: this.selectedSticker.col,
            color: this.cubeState.getStickerColor(
                this.selectedFace, 
                this.selectedSticker.row, 
                this.selectedSticker.col
            )
        };
    }

    /**
     * Handle cube state changes
     * @param {Object} event - State change event
     */
    handleStateChange(event) {
        switch (event.type) {
            case 'faceUpdated':
                this.updateFaceColors(event.data.face, event.data.colors);
                break;
            
            case 'stickerUpdated':
                this.updateStickerColor(
                    event.data.face, 
                    event.data.row, 
                    event.data.col, 
                    event.data.color
                );
                break;
            
            case 'viewChanged':
                if (event.data.view !== this.currentView) {
                    if (event.data.view === '3d') {
                        this.render3DView();
                    } else if (event.data.view === 'net') {
                        this.renderNetView();
                    } else if (event.data.view === 'string') {
                        this.renderStringView();
                    }
                }
                break;
            
            case 'reset':
            case 'stateRestored':
                // Re-render current view
                if (this.currentView === '3d') {
                    this.render3DView();
                } else if (this.currentView === 'net') {
                    this.renderNetView();
                } else if (this.currentView === 'string') {
                    this.renderStringView();
                }
                break;
        }
    }

    /**
     * Update a single sticker color
     * @param {string} facePosition - Face position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} color - New color
     */
    updateStickerColor(facePosition, row, col, color) {
        const stickerSelector = `[data-face="${facePosition}"][data-row="${row}"][data-col="${col}"]`;
        const stickerElement = this.container.querySelector(stickerSelector);
        
        if (stickerElement) {
            const colorClass = this.colorClasses[color] || 'white';
            
            // Add smooth color transition effect
            stickerElement.style.transition = 'all 0.3s ease';
            
            // Briefly scale up to indicate change
            stickerElement.style.transform = this.currentView === '3d' ? 'scale(1.2)' : 'scale(1.3)';
            
            // Update color class
            stickerElement.className = stickerElement.className.replace(
                /cube-sticker--\w+|net-sticker--\w+/g, 
                `${this.currentView === '3d' ? 'cube' : 'net'}-sticker--${colorClass}`
            );
            
            // Update background color and text color
            stickerElement.style.backgroundColor = this.cubeState.COLORS[color];
            stickerElement.style.color = this.getTextColor(color);
            stickerElement.dataset.color = color;
            
            // Reset scale after animation
            setTimeout(() => {
                if (!stickerElement.classList.contains('selected')) {
                    stickerElement.style.transform = '';
                }
            }, 300);
        }
    }

    /**
     * Handle mouse down event - start drag tracking
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseDown(event) {
        // Only handle left mouse button
        if (event.button !== 0) return;
        
        // Only in 3D view
        if (this.currentView !== '3d') return;
        
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
        const cubeElement = this.container.querySelector('.cube-3d');
        if (cubeElement) {
            cubeElement.style.transition = 'none';
        }
    }

    /**
     * Handle mouse move event - update rotation
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event) {
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
        this.applyRotation();
        
        // Update reset button visibility
        this.updateResetButtonVisibility();
    }

    /**
     * Handle mouse up event - stop drag tracking
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseUp(event) {
        if (!this.isDragging) return;
        
        // Reset isDragging flag
        this.isDragging = false;
        
        // Restore default cursor
        document.body.style.cursor = '';
        
        // Re-enable cube hover transition
        const cubeElement = this.container.querySelector('.cube-3d');
        if (cubeElement) {
            cubeElement.style.transition = 'transform 0.5s ease';
        }
        
        // Emit rotationChanged custom event
        this.emitEvent('rotationChanged', {
            rotationX: this.rotationX,
            rotationY: this.rotationY
        });
    }

    /**
     * Handle touch start event - start drag tracking for mobile
     * @param {TouchEvent} event - Touch event
     */
    handleTouchStart(event) {
        // Only in 3D view
        if (this.currentView !== '3d') return;
        
        // Only handle single touch
        if (event.touches.length !== 1) return;
        
        // Prevent default to avoid scrolling and zooming
        event.preventDefault();
        
        const touch = event.touches[0];
        
        // Start drag tracking
        this.isDragging = true;
        this.dragStartX = touch.clientX;
        this.dragStartY = touch.clientY;
        this.dragStartRotationX = this.rotationX;
        this.dragStartRotationY = this.rotationY;
        
        // Calculate Y direction at drag start based on current orientation
        let normalizedX = ((this.rotationX % 360) + 360) % 360;
        if (normalizedX > 180) normalizedX -= 360;
        
        const isUpsideDown = normalizedX > 90 || normalizedX < -90;
        this.dragYDirection = isUpsideDown ? -1 : 1;
        
        // Disable transition during drag
        const cubeElement = this.container.querySelector('.cube-3d');
        if (cubeElement) {
            cubeElement.style.transition = 'none';
        }
    }

    /**
     * Handle touch move event - update rotation for mobile
     * @param {TouchEvent} event - Touch event
     */
    handleTouchMove(event) {
        if (!this.isDragging) return;
        
        // Only handle single touch
        if (event.touches.length !== 1) return;
        
        // Prevent default to avoid scrolling
        event.preventDefault();
        
        const touch = event.touches[0];
        
        // Calculate touch delta from drag start position
        const deltaX = touch.clientX - this.dragStartX;
        const deltaY = touch.clientY - this.dragStartY;
        
        // Update X rotation (vertical drag)
        this.rotationX = this.dragStartRotationX - (deltaY * this.rotationSensitivity);
        
        // Update Y rotation (horizontal drag)
        this.rotationY = this.dragStartRotationY + (deltaX * this.rotationSensitivity * this.dragYDirection);
        
        // Apply rotation to cube element
        this.applyRotation();
        
        // Update reset button visibility
        this.updateResetButtonVisibility();
    }

    /**
     * Handle touch end event - stop drag tracking for mobile
     * @param {TouchEvent} event - Touch event
     */
    handleTouchEnd(event) {
        if (!this.isDragging) return;
        
        // Reset isDragging flag
        this.isDragging = false;
        
        // Re-enable cube transition
        const cubeElement = this.container.querySelector('.cube-3d');
        if (cubeElement) {
            cubeElement.style.transition = 'transform 0.5s ease';
        }
        
        // Emit rotationChanged custom event
        this.emitEvent('rotationChanged', {
            rotationX: this.rotationX,
            rotationY: this.rotationY
        });
    }



    /**
     * Apply current rotation to cube element
     */
    applyRotation() {
        const cubeElement = this.container.querySelector('.cube-3d');
        if (!cubeElement) return;
        
        const transform = `rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg)`;
        cubeElement.style.transform = transform;
    }

    /**
     * Reset rotation to default angles with animation
     */
    resetRotation() {
        const cubeElement = this.container.querySelector('.cube-3d');
        if (!cubeElement) return;
        
        // Enable transition for smooth animation
        cubeElement.style.transition = 'transform 0.5s ease';
        
        // Reset to default angles
        this.rotationX = -15;
        this.rotationY = 25;
        
        // Apply rotation
        this.applyRotation();
        
        // Update reset button visibility
        this.updateResetButtonVisibility();
        
        // Emit rotationReset custom event
        this.emitEvent('rotationReset', {
            rotationX: this.rotationX,
            rotationY: this.rotationY
        });
    }

    /**
     * Set rotation to specific angles
     * @param {number} x - X rotation in degrees
     * @param {number} y - Y rotation in degrees
     * @param {boolean} animate - Whether to animate the transition
     */
    setRotation(x, y, animate = true) {
        const cubeElement = this.container.querySelector('.cube-3d');
        if (!cubeElement) return;
        
        // Set transition based on animate parameter
        cubeElement.style.transition = animate ? 'transform 0.5s ease' : 'none';
        
        // Update rotation state
        this.rotationX = x;
        this.rotationY = y;
        
        // Apply rotation
        this.applyRotation();
        
        // Update reset button visibility
        this.updateResetButtonVisibility();
    }

    /**
     * Get current rotation angles
     * @returns {Object} Current rotation {x, y}
     */
    getRotation() {
        return {
            x: this.rotationX,
            y: this.rotationY
        };
    }

    /**
     * Create rotation reset button
     * @returns {HTMLElement} Button element
     */
    createRotationResetButton() {
        const button = document.createElement('button');
        button.className = 'rotation-reset-btn';
        button.innerHTML = '↻';  // Circular arrow icon
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
        
        // Add mouseenter hover effect
        button.addEventListener('mouseenter', () => {
            button.style.background = '#667eea';
            button.style.color = 'white';
            button.style.transform = 'scale(1.1)';
        });
        
        // Add mouseleave hover effect
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(255, 255, 255, 0.9)';
            button.style.color = '#667eea';
            button.style.transform = 'scale(1)';
        });
        
        // Add click handler that calls resetRotation
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.resetRotation();
        });
        
        return button;
    }

    /**
     * Update reset button visibility based on rotation state
     */
    updateResetButtonVisibility() {
        if (!this.rotationResetButton) return;
        
        const defaultX = -15;
        const defaultY = 25;
        const threshold = 5;  // degrees
        
        // Check if rotation differs from default
        const isDifferent = 
            Math.abs(this.rotationX - defaultX) > threshold ||
            Math.abs(this.rotationY - defaultY) > threshold;
        
        // Show/hide button
        this.rotationResetButton.style.display = isDifferent ? 'flex' : 'none';
    }

    /**
     * Emit custom events
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     */
    emitEvent(eventType, data) {
        const event = new CustomEvent(`cubeRenderer:${eventType}`, {
            detail: data
        });
        this.container.dispatchEvent(event);
    }

    /**
     * Add event listener for renderer events
     * @param {string} eventType - Event type (without prefix)
     * @param {Function} callback - Event callback
     */
    addEventListener(eventType, callback) {
        this.container.addEventListener(`cubeRenderer:${eventType}`, callback);
    }

    /**
     * Remove event listener for renderer events
     * @param {string} eventType - Event type (without prefix)
     * @param {Function} callback - Event callback
     */
    removeEventListener(eventType, callback) {
        this.container.removeEventListener(`cubeRenderer:${eventType}`, callback);
    }

    /**
     * Destroy the renderer and clean up resources
     */
    destroy() {
        // Remove event listeners (only if not animation renderer)
        if (!this.isAnimationRenderer && this.boundStateChangeHandler) {
            this.cubeState.removeChangeListener(this.boundStateChangeHandler);
        }
        
        // Remove mouse event listeners using bound handler references
        if (this.boundMouseDown) {
            const cubeElement = this.container.querySelector('.cube-3d');
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
        
        // Remove touch event listeners
        if (this.boundTouchStart || this.boundTouchMove || this.boundTouchEnd) {
            const cubeElement = this.container.querySelector('.cube-3d');
            if (cubeElement) {
                if (this.boundTouchStart) {
                    cubeElement.removeEventListener('touchstart', this.boundTouchStart);
                }
                if (this.boundTouchMove) {
                    cubeElement.removeEventListener('touchmove', this.boundTouchMove);
                }
                if (this.boundTouchEnd) {
                    cubeElement.removeEventListener('touchend', this.boundTouchEnd);
                    cubeElement.removeEventListener('touchcancel', this.boundTouchEnd);
                }
            }
        }
        
        // Remove rotation reset button from DOM
        if (this.rotationResetButton && this.rotationResetButton.parentNode) {
            this.rotationResetButton.parentNode.removeChild(this.rotationResetButton);
        }
        
        // Restore default cursor if dragging was active
        if (this.isDragging) {
            document.body.style.cursor = '';
        }
        
        // Reset rotation state properties
        this.rotationX = -15;
        this.rotationY = 25;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartRotationX = 0;
        this.dragStartRotationY = 0;
        this.dragYDirection = 1;
        this.rotationResetButton = null;
        this.boundMouseDown = null;
        this.boundMouseMove = null;
        this.boundMouseUp = null;
        this.boundTouchStart = null;
        this.boundTouchMove = null;
        this.boundTouchEnd = null;
        
        // Clean up string view
        if (this.stringView && typeof this.stringView.destroy === 'function') {
            this.stringView.destroy();
            this.stringView = null;
        }
        
        // Clear container
        this.container.innerHTML = '';
        this.container.className = '';
        this.container.style.cssText = '';
        
        // Reset state
        this.selectedFace = null;
        this.selectedSticker = null;
        this.isInteractive = false;
    }
}

export { CubeRenderer };