/**
 * CubeRenderer class for 3D Rubik's cube visualization
 * Handles rendering the cube in both 3D and net views with CSS transforms
 */

import { CubeState } from './cube-state.js';

class CubeRenderer {
    constructor(containerId, cubeState) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }

        this.cubeState = cubeState;
        if (!(cubeState instanceof CubeState)) {
            throw new Error('cubeState must be an instance of CubeState');
        }

        // Renderer state
        this.currentView = '3d';
        this.isInteractive = false;
        this.selectedFace = null;
        this.selectedSticker = null;

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

        // Bind the state change handler to maintain context
        this.boundStateChangeHandler = this.handleStateChange.bind(this);
        
        // Listen for cube state changes
        this.cubeState.addChangeListener(this.boundStateChangeHandler);

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
        this.container.innerHTML = '';

        // Create 3D cube container
        const cubeElement = document.createElement('div');
        cubeElement.className = 'cube-3d';
        cubeElement.style.cssText = `
            width: 200px;
            height: 200px;
            position: relative;
            transform-style: preserve-3d;
            transform: rotateX(-15deg) rotateY(25deg);
            transition: transform 0.5s ease;
            margin: 0 auto;
        `;

        // Create all six faces
        const facePositions = this.cubeState.getAllFacePositions();
        facePositions.forEach(facePosition => {
            const faceElement = this.create3DFace(facePosition);
            cubeElement.appendChild(faceElement);
        });

        this.container.appendChild(cubeElement);

        // Add hover effect
        cubeElement.addEventListener('mouseenter', () => {
            cubeElement.style.transform = 'rotateX(-15deg) rotateY(25deg) scale(1.05)';
        });

        cubeElement.addEventListener('mouseleave', () => {
            cubeElement.style.transform = 'rotateX(-15deg) rotateY(25deg)';
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

        // Apply 3D transform
        faceElement.style.cssText = `
            position: absolute;
            width: 200px;
            height: 200px;
            border: 2px solid #333;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 2px;
            padding: 4px;
            background: #333;
            transform: ${this.faceTransforms[facePosition]};
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

        // Add click handler for interactivity
        stickerElement.addEventListener('click', (e) => {
            this.handleStickerClick(e, facePosition, row, col);
        });

        return stickerElement;
    }

    /**
     * Render the cube in net view
     */
    renderNetView() {
        this.currentView = 'net';
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

        // Add click handler for interactivity
        stickerElement.addEventListener('click', (e) => {
            this.handleStickerClick(e, facePosition, row, col);
        });

        return stickerElement;
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
                    } else {
                        this.renderNetView();
                    }
                }
                break;
            
            case 'reset':
            case 'stateRestored':
                // Re-render current view
                if (this.currentView === '3d') {
                    this.render3DView();
                } else {
                    this.renderNetView();
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
        // Remove event listeners
        if (this.boundStateChangeHandler) {
            this.cubeState.removeChangeListener(this.boundStateChangeHandler);
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