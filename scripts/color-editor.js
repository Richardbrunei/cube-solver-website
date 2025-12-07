/**
 * ColorEditor class for handling manual color editing functionality
 * Allows users to manually edit cube sticker colors by clicking stickers and selecting colors
 */

export class ColorEditor {
    constructor(cubeState, cubeRenderer) {
        this.cubeState = cubeState;
        this.cubeRenderer = cubeRenderer;
        this.isEditMode = false;
        this.selectedColor = null;
        
        // Available colors for editing (using backend notation: U, R, F, D, L, B)
        this.availableColors = ['U', 'R', 'F', 'D', 'L', 'B'];
        
        // Color display names (backend notation to display name)
        this.colorNames = {
            'U': 'White',
            'R': 'Red',
            'F': 'Green',
            'D': 'Yellow',
            'L': 'Orange',
            'B': 'Blue'
        };
        
        this.init();
    }

    /**
     * Initialize color editor
     */
    init() {
        this.setupEventListeners();
        this.createColorPalette();
        console.log('ColorEditor initialized');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for sticker selection events from renderer
        this.cubeRenderer.addEventListener('stickerSelected', (event) => {
            if (this.isEditMode) {
                this.handleStickerSelection(event.detail);
            }
        });
    }

    /**
     * Create color palette UI
     */
    createColorPalette() {
        console.log('Creating color palette...');
        
        // Check if palette already exists
        let palette = document.getElementById('color-palette');
        
        if (!palette) {
            console.log('Palette does not exist, creating new one');
            palette = document.createElement('div');
            palette.id = 'color-palette';
            palette.className = 'color-palette';
            palette.style.display = 'none';
            palette.setAttribute('role', 'toolbar');
            palette.setAttribute('aria-label', 'Color selection palette');
            
            // Create palette header
            const header = document.createElement('div');
            header.className = 'color-palette__header';
            header.innerHTML = '<h3>Select Color</h3>';
            
            // Create close button for mobile
            const closeBtn = document.createElement('button');
            closeBtn.className = 'color-palette__close-btn';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', 'Close color palette');
            closeBtn.setAttribute('type', 'button');
            closeBtn.addEventListener('click', () => {
                this.hidePalette();
            });
            header.appendChild(closeBtn);
            
            palette.appendChild(header);
            
            // Create color buttons container
            const colorsContainer = document.createElement('div');
            colorsContainer.className = 'color-palette__colors';
            colorsContainer.setAttribute('role', 'group');
            colorsContainer.setAttribute('aria-label', 'Color buttons');
            
            // Create a button for each color
            this.availableColors.forEach((color, index) => {
                console.log(`Creating button for color: ${color} (${this.colorNames[color]})`);
                
                const colorBtn = document.createElement('button');
                colorBtn.className = 'color-palette__color-btn';
                colorBtn.dataset.color = color;
                colorBtn.style.backgroundColor = this.cubeState.COLORS[color];
                colorBtn.title = this.colorNames[color];
                colorBtn.setAttribute('aria-label', `Select ${this.colorNames[color]} color`);
                colorBtn.setAttribute('aria-pressed', 'false');
                colorBtn.setAttribute('type', 'button');
                
                // Set tabindex for keyboard navigation (first button is tabbable)
                colorBtn.setAttribute('tabindex', index === 0 ? '0' : '-1');
                
                console.log(`Button background color: ${this.cubeState.COLORS[color]}`);
                
                // Add color label
                const label = document.createElement('span');
                label.className = 'color-palette__color-label';
                label.textContent = this.colorNames[color];
                label.setAttribute('aria-hidden', 'true'); // Hide from screen readers since button has aria-label
                colorBtn.appendChild(label);
                
                // Add click handler
                colorBtn.addEventListener('click', (e) => {
                    console.log(`🖱️ Button clicked: ${color} (${this.colorNames[color]})`);
                    console.log('Event target:', e.target);
                    console.log('Current target:', e.currentTarget);
                    this.selectColor(color);
                });
                
                // Add keyboard navigation handler
                colorBtn.addEventListener('keydown', (e) => {
                    this.handleColorButtonKeydown(e, colorBtn);
                });
                
                console.log(`✅ Button created and click handler attached for ${color}`);
                
                colorsContainer.appendChild(colorBtn);
            });
            
            palette.appendChild(colorsContainer);
            
            // Create info text for color selection guidance
            const infoText = document.createElement('div');
            infoText.className = 'color-palette__info';
            infoText.id = 'color-palette-info';
            infoText.textContent = 'Select a color';
            palette.appendChild(infoText);
            
            // Create aria-live region for color selection announcements
            const liveRegion = document.createElement('div');
            liveRegion.id = 'color-palette-live-region';
            liveRegion.className = 'color-palette__live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.setAttribute('role', 'status');
            palette.appendChild(liveRegion);
            
            // Add to document
            console.log('Appending palette to body');
            document.body.appendChild(palette);
            console.log('Palette appended, checking if in DOM:', document.body.contains(palette));
        } else {
            console.log('Palette already exists in DOM');
        }
        
        this.palette = palette;
        console.log('Color palette created successfully');
        console.log('Available colors:', this.availableColors);
        console.log('Palette element:', this.palette);
    }

    /**
     * Enable edit mode
     */
    enableEditMode() {
        this.isEditMode = true;
        this.selectedColor = null; // Ensure no color is pre-selected (Requirement 3.5)
        console.log('Edit mode enabled');
        console.log('Palette exists:', !!this.palette);
        console.log('Palette element:', this.palette);
        this.showColorPalette();
        this.updatePaletteUI(); // Update UI to reflect no selection
    }

    /**
     * Disable edit mode
     */
    disableEditMode() {
        this.isEditMode = false;
        this.selectedColor = null; // Clear selected color (Requirements 1.5, 5.5)
        this.hideColorPalette(); // Hide palette (Requirements 1.5, 5.5)
        this.cubeRenderer.clearSelection();
        console.log('Edit mode disabled');
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode() {
        if (this.isEditMode) {
            this.disableEditMode(); // Properly cleanup state
        } else {
            this.enableEditMode(); // Properly initialize state
        }
    }

    /**
     * Show color palette
     */
    showColorPalette() {
        console.log('showColorPalette called');
        console.log('Palette:', this.palette);
        
        if (this.palette) {
            console.log('Setting palette display to block');
            this.palette.style.display = 'block';
            console.log('Palette display:', this.palette.style.display);
            console.log('Palette in DOM:', document.body.contains(this.palette));
            
            setTimeout(() => {
                this.palette.classList.add('color-palette--visible');
                console.log('Added visible class');
                console.log('Palette classes:', this.palette.className);
            }, 10);
        } else {
            console.error('❌ Palette is null or undefined!');
        }
    }

    /**
     * Hide color palette
     */
    hideColorPalette() {
        if (this.palette) {
            this.palette.classList.remove('color-palette--visible');
            setTimeout(() => {
                this.palette.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Handle keyboard navigation for color buttons
     * @param {KeyboardEvent} event - Keyboard event
     * @param {HTMLElement} currentButton - Currently focused button
     */
    handleColorButtonKeydown(event, currentButton) {
        const colorButtons = Array.from(this.palette.querySelectorAll('.color-palette__color-btn'));
        const currentIndex = colorButtons.indexOf(currentButton);
        let targetIndex = currentIndex;
        
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                targetIndex = (currentIndex + 1) % colorButtons.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                targetIndex = (currentIndex - 1 + colorButtons.length) % colorButtons.length;
                break;
            case 'Home':
                event.preventDefault();
                targetIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                targetIndex = colorButtons.length - 1;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                // Trigger click on the current button
                currentButton.click();
                return;
            default:
                return;
        }
        
        // Update tabindex and focus
        colorButtons.forEach((btn, index) => {
            btn.setAttribute('tabindex', index === targetIndex ? '0' : '-1');
        });
        colorButtons[targetIndex].focus();
    }

    /**
     * Select a color from the palette (with toggle behavior)
     * @param {string} color - Color code (U, R, F, D, L, B)
     */
    selectColor(color) {
        console.log('selectColor called with:', color);
        console.log('Color name:', this.colorNames[color]);
        
        // Validate color selection
        if (!this.availableColors.includes(color)) {
            console.error(`Invalid color selection: ${color}. Valid colors are:`, this.availableColors);
            return;
        }
        
        // Toggle behavior: if clicking the already selected color, deselect it
        if (this.selectedColor === color) {
            console.log('Color already selected, deselecting');
            this.deselectColor();
            return;
        }
        
        this.selectedColor = color;
        
        // Update palette UI to show selected color
        this.updatePaletteUI();
        
        // Announce color selection to screen readers
        this.announceColorSelection(color);
        
        console.log(`✅ Color selected: ${this.colorNames[color]}`);
    }

    /**
     * Handle sticker selection from renderer
     * @param {Object} stickerInfo - Sticker information {face, row, col, color}
     */
    handleStickerSelection(stickerInfo) {
        console.log('Sticker selected for editing:', stickerInfo);
        
        // Guard: Return early if no color is selected (no-op behavior)
        if (!this.selectedColor) {
            console.log('No color selected, ignoring sticker click');
            return;
        }
        
        // Validate sticker information
        if (!stickerInfo || typeof stickerInfo !== 'object') {
            console.error('Invalid sticker information: must be an object');
            return;
        }
        
        // Validate required properties
        if (!stickerInfo.face || typeof stickerInfo.row !== 'number' || typeof stickerInfo.col !== 'number') {
            console.error('Invalid sticker information: missing or invalid face, row, or col properties', stickerInfo);
            return;
        }
        
        // Apply color to the sticker
        this.applyColorToSticker(stickerInfo);
    }

    /**
     * Apply the selected color to a sticker
     * @param {Object} stickerInfo - Sticker information {face, row, col, color}
     */
    applyColorToSticker(stickerInfo) {
        // Guard: Ensure a color is selected
        if (!this.selectedColor) {
            console.warn('Cannot apply color: no color selected');
            return;
        }
        
        const { face, row, col, color: currentColor } = stickerInfo;
        
        // Idempotent check: don't update if the color is the same
        if (currentColor === this.selectedColor) {
            console.log('Color is already set to', this.colorNames[this.selectedColor]);
            return;
        }
        
        console.log(`Applying ${this.colorNames[this.selectedColor]} to sticker ${face} [${row}, ${col}] (was ${this.colorNames[currentColor]})`);
        
        // Error handling for invalid sticker coordinates
        try {
            // Update cubestring via CubeState.setStickerColor()
            // This will automatically trigger renderer updates via change listeners
            // CubeState.setStickerColor() already validates face, row, col, and color
            this.cubeState.setStickerColor(face, row, col, this.selectedColor);
            console.log('✅ Color applied successfully');
        } catch (error) {
            // Handle errors from CubeState validation
            console.error('Failed to apply color to sticker:', error.message);
            console.error('Sticker info:', { face, row, col, selectedColor: this.selectedColor });
            // Don't throw - just log the error and continue
            // This prevents the entire edit mode from breaking due to one bad sticker
        }
        
        // selectedColor persists for next sticker click (don't clear it)
    }
    
    /**
     * Announce color selection to screen readers
     * @param {string} color - Color code (U, R, F, D, L, B)
     */
    announceColorSelection(color) {
        const liveRegion = document.getElementById('color-palette-live-region');
        if (liveRegion) {
            liveRegion.textContent = `${this.colorNames[color]} color selected. Click stickers to paint.`;
        }
    }

    /**
     * Announce color deselection to screen readers
     */
    announceColorDeselection() {
        const liveRegion = document.getElementById('color-palette-live-region');
        if (liveRegion) {
            liveRegion.textContent = 'Color deselected. Select a color to paint stickers.';
        }
    }

    /**
     * Deselect the currently selected color
     */
    deselectColor() {
        console.log('Deselecting color');
        this.selectedColor = null;
        this.updatePaletteUI();
        this.announceColorDeselection();
    }
    
    /**
     * Update the palette UI to reflect current state
     */
    updatePaletteUI() {
        if (!this.palette) return;
        
        // Update color button selection indicators and aria-pressed attributes
        const colorButtons = this.palette.querySelectorAll('.color-palette__color-btn');
        colorButtons.forEach(btn => {
            const isSelected = btn.dataset.color === this.selectedColor;
            
            if (isSelected) {
                btn.classList.add('color-palette__color-btn--selected');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('color-palette__color-btn--selected');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
        
        // Update info text based on selection state
        const infoElement = document.getElementById('color-palette-info');
        if (infoElement) {
            if (this.selectedColor) {
                infoElement.textContent = `Click stickers to paint ${this.colorNames[this.selectedColor]}`;
            } else {
                infoElement.textContent = 'Select a color';
            }
        }
    }

    /**
     * Get current edit mode status
     * @returns {boolean} Whether edit mode is enabled
     */
    isEnabled() {
        return this.isEditMode;
    }
}