/**
 * ValidationButton class for handling cube validation UI
 * Provides validation button and results modal
 */

export class ValidationButton {
    constructor(cubeState) {
        this.cubeState = cubeState;
        this.validateBtn = null;
        this.modal = null;
        this.resultsContainer = null;
        this.isValidating = false;
        
        this.init();
    }

    /**
     * Initialize validation button
     */
    init() {
        this.validateBtn = document.getElementById('validate-btn');
        this.modal = document.getElementById('validation-modal');
        this.resultsContainer = document.getElementById('validation-results');
        
        if (!this.validateBtn || !this.modal || !this.resultsContainer) {
            console.error('Validation UI elements not found');
            return;
        }
        
        this.setupEventListeners();
        console.log('ValidationButton initialized');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Validate button click
        this.validateBtn.addEventListener('click', () => {
            this.handleValidateClick();
        });
        
        // Close button
        const closeBtn = document.getElementById('validation-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        // OK button
        const okBtn = document.getElementById('validation-ok-btn');
        if (okBtn) {
            okBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        // Overlay click to close
        const overlay = this.modal.querySelector('.validation-modal__overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.hideModal();
            }
        });
    }

    /**
     * Handle validate button click
     */
    async handleValidateClick() {
        if (this.isValidating) {
            return;
        }
        
        this.isValidating = true;
        this.validateBtn.disabled = true;
        this.validateBtn.innerHTML = '<span class="btn-icon">⏳</span> Validating...';
        
        try {
            // Perform validation using backend
            const validation = await this.cubeState.validateCube(true);
            
            // Display results
            this.displayResults(validation);
            this.showModal();
            
        } catch (error) {
            console.error('Validation error:', error);
            this.displayError(error.message);
            this.showModal();
        } finally {
            this.isValidating = false;
            this.validateBtn.disabled = false;
            this.validateBtn.innerHTML = '<span class="btn-icon">✓</span> Validate';
        }
    }

    /**
     * Display validation results
     * @param {Object} validation - Validation result object
     */
    displayResults(validation) {
        const { isValid, isSolved, errors, warnings, colorCounts, cubestring } = validation;
        
        let html = '';
        
        // Overall status
        if (isValid && isSolved) {
            html += `
                <div class="validation-status validation-status--success">
                    <div class="validation-status__icon">✓</div>
                    <div class="validation-status__text">
                        <strong>Perfect!</strong> Your cube is valid and solved!
                    </div>
                </div>
            `;
        } else if (isValid) {
            html += `
                <div class="validation-status validation-status--valid">
                    <div class="validation-status__icon">✓</div>
                    <div class="validation-status__text">
                        <strong>Valid Cube</strong> - The cube state is valid but not solved.
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="validation-status validation-status--error">
                    <div class="validation-status__icon">✗</div>
                    <div class="validation-status__text">
                        <strong>Invalid Cube</strong> - Found ${errors.length} error(s).
                    </div>
                </div>
            `;
        }
        
        // Cubestring info
        html += `
            <div class="validation-section">
                <h4 class="validation-section__title">Cubestring</h4>
                <div class="validation-cubestring">
                    <code>${this.formatCubestring(cubestring)}</code>
                </div>
            </div>
        `;
        
        // Color counts
        html += `
            <div class="validation-section">
                <h4 class="validation-section__title">Color Distribution</h4>
                <div class="validation-color-counts">
                    ${this.renderColorCounts(colorCounts)}
                </div>
            </div>
        `;
        
        // Errors
        if (errors && errors.length > 0) {
            html += `
                <div class="validation-section">
                    <h4 class="validation-section__title">Errors (${errors.length})</h4>
                    <div class="validation-errors">
                        ${errors.map(error => this.renderError(error)).join('')}
                    </div>
                </div>
            `;
        }
        
        // Warnings
        if (warnings && warnings.length > 0) {
            html += `
                <div class="validation-section">
                    <h4 class="validation-section__title">Warnings (${warnings.length})</h4>
                    <div class="validation-warnings">
                        ${warnings.map(warning => this.renderWarning(warning)).join('')}
                    </div>
                </div>
            `;
        }
        
        this.resultsContainer.innerHTML = html;
    }

    /**
     * Format cubestring for display
     * @param {string} cubestring - Cubestring to format
     * @returns {string} Formatted HTML
     */
    formatCubestring(cubestring) {
        if (!cubestring) return 'N/A';
        
        // Split into faces (9 chars each)
        const faces = [];
        for (let i = 0; i < cubestring.length; i += 9) {
            faces.push(cubestring.substring(i, i + 9));
        }
        
        return faces.join(' ');
    }

    /**
     * Render color counts
     * @param {Object} colorCounts - Color count object
     * @returns {string} HTML string
     */
    renderColorCounts(colorCounts) {
        const colorNames = {
            'U': 'White (U)',
            'R': 'Red (R)',
            'F': 'Green (F)',
            'D': 'Yellow (D)',
            'L': 'Orange (L)',
            'B': 'Blue (B)'
        };
        
        const colors = ['U', 'R', 'F', 'D', 'L', 'B'];
        
        return colors.map(color => {
            const count = colorCounts[color] || 0;
            const isValid = count === 9;
            const statusClass = isValid ? 'valid' : 'invalid';
            
            return `
                <div class="color-count color-count--${statusClass}">
                    <span class="color-count__label">${colorNames[color]}</span>
                    <span class="color-count__value">${count}/9</span>
                    <span class="color-count__icon">${isValid ? '✓' : '✗'}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Render error message
     * @param {Object} error - Error object
     * @returns {string} HTML string
     */
    renderError(error) {
        let detailsHtml = '';
        
        // Add specific details based on error type
        if (error.invalidPositions && error.invalidPositions.length > 0) {
            const positions = error.invalidPositions.slice(0, 5); // Show first 5
            detailsHtml += `
                <div class="error-details">
                    <strong>Invalid positions:</strong>
                    <ul>
                        ${positions.map(p => `
                            <li>Position ${p.position} (${p.face} face): '${p.character}'</li>
                        `).join('')}
                    </ul>
                    ${error.invalidPositions.length > 5 ? `<p>...and ${error.invalidPositions.length - 5} more</p>` : ''}
                </div>
            `;
        }
        
        if (error.distributionErrors && error.distributionErrors.length > 0) {
            detailsHtml += `
                <div class="error-details">
                    <strong>Distribution issues:</strong>
                    <ul>
                        ${error.distributionErrors.map(d => `
                            <li>${d.color}: ${d.actual} (expected 9, ${d.difference > 0 ? '+' : ''}${d.difference})</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (error.suggestion) {
            detailsHtml += `
                <div class="error-suggestion">
                    <strong>💡 Suggestion:</strong> ${error.suggestion}
                </div>
            `;
        }
        
        return `
            <div class="validation-error">
                <div class="validation-error__header">
                    <span class="validation-error__icon">✗</span>
                    <span class="validation-error__message">${error.message}</span>
                </div>
                ${detailsHtml}
            </div>
        `;
    }

    /**
     * Render warning message
     * @param {Object} warning - Warning object
     * @returns {string} HTML string
     */
    renderWarning(warning) {
        let detailsHtml = '';
        
        if (warning.centerColors) {
            detailsHtml += `
                <div class="warning-details">
                    <strong>Center colors:</strong> ${warning.centerColors.join(', ')}
                </div>
            `;
        }
        
        return `
            <div class="validation-warning">
                <div class="validation-warning__header">
                    <span class="validation-warning__icon">⚠</span>
                    <span class="validation-warning__message">${warning.message}</span>
                </div>
                ${detailsHtml}
            </div>
        `;
    }

    /**
     * Display error message
     * @param {string} message - Error message
     */
    displayError(message) {
        this.resultsContainer.innerHTML = `
            <div class="validation-status validation-status--error">
                <div class="validation-status__icon">✗</div>
                <div class="validation-status__text">
                    <strong>Validation Error</strong><br>
                    ${message}
                </div>
            </div>
        `;
    }

    /**
     * Show validation modal
     */
    showModal() {
        if (this.modal) {
            this.modal.style.display = 'block';
            setTimeout(() => {
                this.modal.classList.add('validation-modal--show');
            }, 10);
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide validation modal
     */
    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('validation-modal--show');
            setTimeout(() => {
                this.modal.style.display = 'none';
            }, 300);
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    }
}
