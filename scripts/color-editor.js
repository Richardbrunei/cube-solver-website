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
        this.selectedSticker = null;
        
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
            
            // Create palette header
            const header = document.createElement('div');
            header.className = 'color-palette__header';
            header.innerHTML = '<h3>Select Color</h3>';
            palette.appendChild(header);
            
            // Create color buttons container
            const colorsContainer = document.createElement('div');
            colorsContainer.className = 'color-palette__colors';
            
            // Create a button for each color
            this.availableColors.forEach(color => {
                console.log(`Creating button for color: ${color} (${this.colorNames[color]})`);
                
                const colorBtn = document.createElement('button');
                colorBtn.className = 'color-palette__color-btn';
                colorBtn.dataset.color = color;
                colorBtn.style.backgroundColor = this.cubeState.COLORS[color];
                colorBtn.title = this.colorNames[color];
                
                console.log(`Button background color: ${this.cubeState.COLORS[color]}`);
                
                // Add color label
                const label = document.createElement('span');
                label.className = 'color-palette__color-label';
                label.textContent = this.colorNames[color];
                colorBtn.appendChild(label);
                
                // Add click handler
                colorBtn.addEventListener('click', (e) => {
                    console.log(`🖱️ Button clicked: ${color} (${this.colorNames[color]})`);
                    console.log('Event target:', e.target);
                    console.log('Current target:', e.currentTarget);
                    this.selectColor(color);
                });
                
                console.log(`✅ Button created and click handler attached for ${color}`);
                
                colorsContainer.appendChild(colorBtn);
            });
            
            palette.appendChild(colorsContainer);
            
            // Create selected sticker info
            const stickerInfo = document.createElement('div');
            stickerInfo.className = 'color-palette__sticker-info';
            stickerInfo.id = 'selected-sticker-info';
            stickerInfo.textContent = 'Click a sticker to edit';
            palette.appendChild(stickerInfo);
            
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
        console.log('Edit mode enabled');
        console.log('Palette exists:', !!this.palette);
        console.log('Palette element:', this.palette);
        this.showColorPalette();
    }

    /**
     * Disable edit mode
     */
    disableEditMode() {
        this.isEditMode = false;
        this.hideColorPalette();
        this.selectedColor = null;
        this.selectedSticker = null;
        this.cubeRenderer.clearSelection();
        console.log('Edit mode disabled');
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode() {
        if (this.isEditMode) {
            this.disableEditMode();
        } else {
            this.enableEditMode();
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
     * Select a color from the palette
     * @param {string} color - Color code (W, Y, R, O, B, G)
     */
    selectColor(color) {
        console.log('selectColor called with:', color);
        console.log('Color name:', this.colorNames[color]);
        
        this.selectedColor = color;
        
        // Update palette UI to show selected color
        const colorButtons = this.palette.querySelectorAll('.color-palette__color-btn');
        console.log('Found color buttons:', colorButtons.length);
        
        colorButtons.forEach(btn => {
            console.log('Button color:', btn.dataset.color);
            if (btn.dataset.color === color) {
                btn.classList.add('color-palette__color-btn--selected');
                console.log('Selected button:', btn.dataset.color);
            } else {
                btn.classList.remove('color-palette__color-btn--selected');
            }
        });
        
        console.log(`✅ Color selected: ${this.colorNames[color]}`);
        
        // If a sticker is already selected, apply the color immediately
        if (this.selectedSticker) {
            console.log('Sticker already selected, applying color immediately');
            this.updateColor();
        } else {
            console.log('No sticker selected yet, waiting for sticker selection');
        }
    }

    /**
     * Handle sticker selection from renderer
     * @param {Object} stickerInfo - Sticker information {face, row, col, color}
     */
    handleStickerSelection(stickerInfo) {
        this.selectedSticker = stickerInfo;
        
        // Update sticker info display
        const stickerInfoElement = document.getElementById('selected-sticker-info');
        if (stickerInfoElement) {
            stickerInfoElement.textContent = `Selected: ${stickerInfo.face} [${stickerInfo.row}, ${stickerInfo.col}] - Current: ${this.colorNames[stickerInfo.color]}`;
        }
        
        console.log('Sticker selected for editing:', stickerInfo);
        
        // If a color is already selected, apply it immediately
        if (this.selectedColor) {
            this.updateColor();
        }
    }

    /**
     * Update the selected sticker with the selected color
     * This is the main method that modifies the cubestring via setStickerColor()
     */
    updateColor() {
        if (!this.selectedSticker || !this.selectedColor) {
            console.warn('Cannot update color: sticker or color not selected');
            return;
        }
        
        const { face, row, col, color: currentColor } = this.selectedSticker;
        
        // Don't update if the color is the same
        if (currentColor === this.selectedColor) {
            console.log('Color is already set to', this.colorNames[this.selectedColor]);
            return;
        }
        
        console.log(`Updating sticker ${face} [${row}, ${col}] from ${this.colorNames[currentColor]} to ${this.colorNames[this.selectedColor]}`);
        
        // Update cubestring via CubeState.setStickerColor()
        // This will automatically trigger renderer updates via change listeners
        this.cubeState.setStickerColor(face, row, col, this.selectedColor);
        
        // Update selected sticker info to reflect the change
        this.selectedSticker.color = this.selectedColor;
        
        const stickerInfoElement = document.getElementById('selected-sticker-info');
        if (stickerInfoElement) {
            stickerInfoElement.textContent = `Updated: ${face} [${row}, ${col}] - Now: ${this.colorNames[this.selectedColor]}`;
        }
        
        // Clear color selection but keep sticker selected
        this.selectedColor = null;
        
        // Clear color button selection
        const colorButtons = this.palette.querySelectorAll('.color-palette__color-btn');
        colorButtons.forEach(btn => {
            btn.classList.remove('color-palette__color-btn--selected');
        });
        
        // Keep the sticker selected so user can change it again
        // Don't clear this.selectedSticker
        // Don't call this.cubeRenderer.clearSelection()
    }

    /**
     * Get current edit mode status
     * @returns {boolean} Whether edit mode is enabled
     */
    isEnabled() {
        return this.isEditMode;
    }
}