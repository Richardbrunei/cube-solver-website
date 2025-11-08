/**
 * SolveButton class for handling cube solving UI
 * Provides solve button and solution modal
 */

export class SolveButton {
    constructor(cubeState) {
        this.cubeState = cubeState;
        this.solveBtn = null;
        this.modal = null;
        this.resultsContainer = null;
        this.isSolving = false;
        
        // Store current solution for clipboard copy
        this.currentSolutionMoves = null;
        
        // Animation controller (lazy loaded)
        this.animationController = null;
        
        this.init();
    }

    /**
     * Initialize solve button
     */
    init() {
        this.solveBtn = document.getElementById('solve-btn');
        this.modal = document.getElementById('solve-modal');
        this.resultsContainer = document.getElementById('solve-results');
        
        if (!this.solveBtn || !this.modal || !this.resultsContainer) {
            console.error('Solve UI elements not found');
            return;
        }
        
        this.setupEventListeners();
        console.log('SolveButton initialized');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Solve button click
        this.solveBtn.addEventListener('click', () => {
            this.handleSolveClick();
        });
        
        // Close button
        const closeBtn = document.getElementById('solve-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        // OK button
        const okBtn = document.getElementById('solve-ok-btn');
        if (okBtn) {
            okBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        // Copy button
        const copyBtn = document.getElementById('solve-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copySolutionToClipboard();
            });
        }
        
        // Overlay click to close
        const overlay = this.modal.querySelector('.solve-modal__overlay');
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
     * Handle solve button click
     */
    async handleSolveClick() {
        if (this.isSolving) {
            return;
        }
        
        // Pre-validation: check if cube state exists
        const cubestring = this.cubeState.getCubestring();
        if (!cubestring || cubestring.length !== 54) {
            this.displayError('Please set up a cube state first');
            this.showModal();
            return;
        }
        
        // Note: We don't pre-validate here because the backend solver will
        // return appropriate errors if the cube is invalid or unsolvable
        
        this.isSolving = true;
        this.solveBtn.disabled = true;
        this.solveBtn.innerHTML = '<span class="btn-icon">⏳</span> Solving...';
        
        try {
            // Call backend API to solve cube
            const response = await fetch('http://localhost:5000/api/solve-cube', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cubestring: cubestring
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Handle HTTP errors
                throw new Error(data.error || `Server error: ${response.status}`);
            }
            
            if (data.success) {
                // Display solution
                this.displaySolution(data.solution, data.move_count);
                this.showModal();
            } else {
                // Handle API error response
                throw new Error(data.error || 'Failed to solve cube');
            }
            
        } catch (error) {
            console.error('Solve error:', error);
            this.displayError(this.mapErrorToUserMessage(error));
            this.showModal();
        } finally {
            this.isSolving = false;
            this.solveBtn.disabled = false;
            this.solveBtn.innerHTML = '<span class="btn-icon">💡</span> Solve';
        }
    }

    /**
     * Display solution in modal
     * @param {string} solution - Solution moves string
     * @param {number} moveCount - Number of moves
     */
    displaySolution(solution, moveCount) {
        // Store solution for clipboard copy
        this.currentSolution = solution;
        
        let html = '';
        
        // Success status
        html += `
            <div class="solve-status solve-status--success">
                <div class="solve-status__icon">✓</div>
                <div class="solve-status__text">
                    <strong>Solution Found!</strong>
                </div>
            </div>
        `;
        
        // Move count
        html += `
            <div class="solve-section">
                <h4 class="solve-section__title">Move Count</h4>
                <div class="solve-move-count">
                    <span class="solve-move-count__value">${moveCount}</span>
                    <span class="solve-move-count__label">moves</span>
                </div>
            </div>
        `;
        
        // Solution moves
        html += `
            <div class="solve-section">
                <h4 class="solve-section__title">Solution</h4>
                <div class="solve-solution">
                    <code class="solve-solution__moves">${this.formatSolution(solution)}</code>
                </div>
                <div class="solve-solution__help">
                    <p><strong>Notation Guide:</strong></p>
                    <ul>
                        <li><strong>R, L, U, D, F, B</strong> - Clockwise 90° turn</li>
                        <li><strong>R', L', U', D', F', B'</strong> - Counter-clockwise 90° turn</li>
                        <li><strong>R2, L2, U2, D2, F2, B2</strong> - 180° turn</li>
                    </ul>
                </div>
            </div>
        `;
        
        // Animation section
        html += `
            <div class="solve-section">
                <h4 class="solve-section__title">Animation</h4>
                <button class="view-animation-btn" id="view-animation-btn">
                    <span class="btn-icon">▶</span>
                    View Animation
                </button>
            </div>
        `;
        
        this.resultsContainer.innerHTML = html;
        
        // Store solution moves for clipboard copy
        this.currentSolutionMoves = solution.trim().split(/\s+/);
        
        // Wire up animation button
        const animBtn = document.getElementById('view-animation-btn');
        if (animBtn) {
            animBtn.addEventListener('click', () => this._startAnimation(solution));
        }
    }

    /**
     * Format solution for display with move highlighting support
     * @param {string} solution - Solution moves string
     * @returns {string} Formatted solution with HTML spans for each move
     */
    formatSolution(solution) {
        if (!solution) return 'Already solved!';
        
        // Split moves and wrap each in a span for highlighting
        const moves = solution.trim().split(/\s+/);
        
        // Wrap each move in a span with data-move-index attribute
        const wrappedMoves = moves.map((move, index) => {
            return `<span class="move" data-move-index="${index}">${move}</span>`;
        });
        
        // Group moves in sets of 5 for better readability
        const grouped = [];
        for (let i = 0; i < wrappedMoves.length; i += 5) {
            grouped.push(wrappedMoves.slice(i, i + 5).join(' '));
        }
        
        return grouped.join('\n');
    }

    /**
     * Copy solution to clipboard
     */
    async copySolutionToClipboard() {
        if (!this.currentSolution) {
            console.warn('No solution to copy');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.currentSolution);
            
            // Show feedback
            const copyBtn = document.getElementById('solve-copy-btn');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✓ Copied!';
                copyBtn.disabled = true;
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.disabled = false;
                }, 2000);
            }
            
            console.log('Solution copied to clipboard');
        } catch (error) {
            console.error('Failed to copy solution:', error);
            alert('Failed to copy solution to clipboard');
        }
    }

    /**
     * Display error message
     * @param {string} message - Error message
     */
    displayError(message) {
        this.resultsContainer.innerHTML = `
            <div class="solve-status solve-status--error">
                <div class="solve-status__icon">✗</div>
                <div class="solve-status__text">
                    <strong>Cannot Solve Cube</strong><br>
                    ${message}
                </div>
            </div>
        `;
    }

    /**
     * Map error to user-friendly message
     * @param {Error} error - Error object
     * @returns {string} User-friendly error message
     */
    mapErrorToUserMessage(error) {
        const errorMessage = error.message.toLowerCase();
        
        // Network errors
        if (errorMessage.includes('failed to fetch') || errorMessage.includes('network')) {
            return 'Cannot connect to solver service. Please ensure the backend is running.';
        }
        
        // Timeout errors
        if (errorMessage.includes('timeout')) {
            return 'Solve request timed out. Please try again.';
        }
        
        // Invalid cube state errors
        if (errorMessage.includes('invalid cube') || errorMessage.includes('impossible')) {
            return 'This cube configuration cannot be solved. The cube state may be physically impossible.';
        }
        
        // Color distribution errors
        if (errorMessage.includes('color') || errorMessage.includes('distribution')) {
            return 'Invalid color distribution. Each color must appear exactly 9 times.';
        }
        
        // Service unavailable
        if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) {
            return 'Solver service is not available. Please ensure kociemba is installed.';
        }
        
        // Generic server errors
        if (errorMessage.includes('500') || errorMessage.includes('server error')) {
            return 'Solver service error. Please try again or check the console for details.';
        }
        
        // Default: return original error message
        return error.message || 'An unexpected error occurred while solving the cube.';
    }

    /**
     * Show solve modal
     */
    showModal() {
        if (this.modal) {
            this.modal.style.display = 'block';
            setTimeout(() => {
                this.modal.classList.add('solve-modal--show');
            }, 10);
        }
    }

    /**
     * Hide solve modal
     */
    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('solve-modal--show');
            setTimeout(() => {
                this.modal.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Start animation with solution moves
     * @param {string} solution - Solution moves string
     */
    async _startAnimation(solution) {
        try {
            // Lazy load AnimationController
            if (!this.animationController) {
                const { AnimationController } = await import('./animation-controller.js');
                this.animationController = new AnimationController();
            }
            
            // Parse solution string into move array
            const moves = solution.trim().split(/\s+/);
            
            // Get current cubestring
            const currentCubestring = this.cubeState.getCubestring();
            
            // Start animation
            this.animationController.startAnimation(moves, currentCubestring);
            
        } catch (error) {
            console.error('Failed to start animation:', error);
            alert('Failed to start animation. Please check the console for details.');
        }
    }
}
