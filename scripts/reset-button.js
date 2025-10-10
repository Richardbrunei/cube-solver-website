/**
 * ResetButton class for resetting the Rubik's cube to its solved state
 * Provides a user-accessible reset functionality with visual feedback
 */

import { CubeState } from './cube-state.js';
import { CubeRenderer } from './cube-renderer.js';

class ResetButton {
    constructor(cubeState, cubeRenderer) {
        if (!(cubeState instanceof CubeState)) {
            throw new Error('cubeState must be an instance of CubeState');
        }

        if (!(cubeRenderer instanceof CubeRenderer)) {
            throw new Error('cubeRenderer must be an instance of CubeRenderer');
        }

        this.cubeState = cubeState;
        this.cubeRenderer = cubeRenderer;
        this.buttonElement = null;
        this.isResetting = false;

        // Initialize the reset button
        this.init();
    }

    /**
     * Initialize the reset button
     */
    init() {
        this.render();
        this.setupEventListeners();
        console.log('ResetButton initialized');
    }

    /**
     * Render the reset button in the controls section
     */
    render() {
        // Find existing reset button in HTML
        this.buttonElement = document.getElementById('reset-btn');
        
        if (!this.buttonElement) {
            console.error('Reset button not found in HTML');
            return;
        }

        console.log('Reset button found and initialized');
    }

    /**
     * Set up event listeners for the reset button
     */
    setupEventListeners() {
        if (!this.buttonElement) {
            console.error('Button element not found');
            return;
        }

        // Add click event listener
        this.buttonElement.addEventListener('click', (event) => {
            this.handleResetClick(event);
        });

        // Add hover effects for better UX
        this.buttonElement.addEventListener('mouseenter', () => {
            if (!this.isResetting) {
                this.buttonElement.style.transform = 'translateY(-2px) scale(1.02)';
            }
        });

        this.buttonElement.addEventListener('mouseleave', () => {
            if (!this.isResetting) {
                this.buttonElement.style.transform = '';
            }
        });

        console.log('Reset button event listeners set up');
    }

    /**
     * Handle reset button click
     * @param {Event} event - Click event
     */
    async handleResetClick(event) {
        event.preventDefault();

        if (this.isResetting) {
            console.log('Reset already in progress');
            return;
        }

        console.log('Reset button clicked');

        try {
            // Show confirmation if cube is not in solved state
            if (!this.cubeState.isSolved()) {
                const confirmed = await this.showResetConfirmation();
                if (!confirmed) {
                    console.log('Reset cancelled by user');
                    return;
                }
            }

            // Execute the reset
            await this.executeReset();

        } catch (error) {
            console.error('Error during reset:', error);
            this.showResetError('Failed to reset cube. Please try again.');
        }
    }

    /**
     * Show reset confirmation dialog
     * @returns {Promise<boolean>} Whether user confirmed the reset
     */
    showResetConfirmation() {
        return new Promise((resolve) => {
            // Create confirmation modal
            const modal = document.createElement('div');
            modal.className = 'reset-confirmation-modal';
            
            modal.innerHTML = `
                <div class="reset-confirmation-modal__overlay"></div>
                <div class="reset-confirmation-modal__content">
                    <div class="reset-confirmation-modal__header">
                        <h3 class="reset-confirmation-modal__title">🔄 Reset Cube</h3>
                    </div>
                    <div class="reset-confirmation-modal__body">
                        <p class="reset-confirmation-modal__message">
                            Are you sure you want to reset the cube to its solved state? 
                            This will undo all current color changes.
                        </p>
                    </div>
                    <div class="reset-confirmation-modal__footer">
                        <button class="reset-confirmation-modal__confirm" type="button">Reset Cube</button>
                        <button class="reset-confirmation-modal__cancel" type="button">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Show modal with animation
            setTimeout(() => {
                modal.classList.add('reset-confirmation-modal--show');
            }, 10);
            
            // Handle buttons
            const closeModal = (confirmed) => {
                modal.classList.remove('reset-confirmation-modal--show');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
                resolve(confirmed);
            };
            
            modal.querySelector('.reset-confirmation-modal__confirm').addEventListener('click', () => {
                closeModal(true);
            });
            
            modal.querySelector('.reset-confirmation-modal__cancel').addEventListener('click', () => {
                closeModal(false);
            });
            
            modal.querySelector('.reset-confirmation-modal__overlay').addEventListener('click', () => {
                closeModal(false);
            });

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleEscape);
                    closeModal(false);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    /**
     * Execute the reset operation with visual feedback
     */
    async executeReset() {
        console.log('Executing cube reset...');
        
        // Set resetting state
        this.isResetting = true;
        this.updateButtonState('resetting');

        try {
            // Add a small delay for better UX (shows the loading state)
            await new Promise(resolve => setTimeout(resolve, 200));

            // Reset the cube state
            this.cubeState.reset();

            // Show success feedback
            this.showResetSuccess();

            // Update button state
            this.updateButtonState('success');

            // Reset button state after animation
            setTimeout(() => {
                this.updateButtonState('normal');
                this.isResetting = false;
            }, 2000);

            console.log('Cube reset completed successfully');

        } catch (error) {
            console.error('Error executing reset:', error);
            this.updateButtonState('error');
            
            // Reset button state after error display
            setTimeout(() => {
                this.updateButtonState('normal');
                this.isResetting = false;
            }, 3000);
            
            throw error;
        }
    }

    /**
     * Update button visual state
     * @param {string} state - Button state ('normal', 'resetting', 'success', 'error')
     */
    updateButtonState(state) {
        if (!this.buttonElement) return;

        // Remove all state classes
        this.buttonElement.classList.remove(
            'reset-btn--resetting', 
            'reset-btn--success', 
            'reset-btn--error'
        );

        // Update button content and style based on state
        switch (state) {
            case 'resetting':
                this.buttonElement.classList.add('reset-btn--resetting');
                this.buttonElement.innerHTML = `
                    <span class="btn-icon btn-icon--spinning">🔄</span>
                    Resetting...
                `;
                this.buttonElement.disabled = true;
                break;

            case 'success':
                this.buttonElement.classList.add('reset-btn--success');
                this.buttonElement.innerHTML = `
                    <span class="btn-icon">✅</span>
                    Reset Complete!
                `;
                this.buttonElement.disabled = true;
                break;

            case 'error':
                this.buttonElement.classList.add('reset-btn--error');
                this.buttonElement.innerHTML = `
                    <span class="btn-icon">❌</span>
                    Reset Failed
                `;
                this.buttonElement.disabled = true;
                break;

            case 'normal':
            default:
                this.buttonElement.innerHTML = `
                    <span class="btn-icon">🔄</span>
                    Reset Cube
                `;
                this.buttonElement.disabled = false;
                break;
        }
    }

    /**
     * Show reset success notification
     */
    showResetSuccess() {
        this.showNotification('success', 'Cube Reset Complete!', 'The cube has been reset to its solved state.');
    }

    /**
     * Show reset error notification
     * @param {string} message - Error message
     */
    showResetError(message) {
        this.showNotification('error', 'Reset Failed', message);
    }

    /**
     * Show notification
     * @param {string} type - Notification type ('success', 'error', 'info')
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     */
    showNotification(type, title, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `reset-notification reset-notification--${type}`;
        
        notification.innerHTML = `
            <div class="reset-notification__content">
                <div class="reset-notification__title">${title}</div>
                <div class="reset-notification__message">${message}</div>
            </div>
            <button class="reset-notification__close" type="button">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('reset-notification--show');
        }, 10);
        
        // Auto-hide after 3 seconds
        const autoHideTimeout = setTimeout(() => {
            this.hideNotification(notification);
        }, 3000);
        
        // Handle close button
        notification.querySelector('.reset-notification__close').addEventListener('click', () => {
            clearTimeout(autoHideTimeout);
            this.hideNotification(notification);
        });
    }

    /**
     * Hide notification
     * @param {HTMLElement} notification - Notification element
     */
    hideNotification(notification) {
        notification.classList.remove('reset-notification--show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Check if cube is currently in solved state
     * @returns {boolean} Whether cube is solved
     */
    isCubeSolved() {
        return this.cubeState.isSolved();
    }

    /**
     * Enable the reset button
     */
    enable() {
        if (this.buttonElement && !this.isResetting) {
            this.buttonElement.disabled = false;
            this.buttonElement.style.opacity = '1';
            this.buttonElement.style.cursor = 'pointer';
        }
    }

    /**
     * Disable the reset button
     */
    disable() {
        if (this.buttonElement) {
            this.buttonElement.disabled = true;
            this.buttonElement.style.opacity = '0.6';
            this.buttonElement.style.cursor = 'not-allowed';
        }
    }

    /**
     * Get reset button element
     * @returns {HTMLElement|null} Button element
     */
    getButtonElement() {
        return this.buttonElement;
    }

    /**
     * Check if reset is currently in progress
     * @returns {boolean} Whether reset is in progress
     */
    isResetInProgress() {
        return this.isResetting;
    }

    /**
     * Destroy the reset button and clean up resources
     */
    destroy() {
        // Remove button from DOM
        if (this.buttonElement && this.buttonElement.parentNode) {
            this.buttonElement.parentNode.removeChild(this.buttonElement);
        }

        // Clean up references
        this.buttonElement = null;
        this.cubeState = null;
        this.cubeRenderer = null;
        this.isResetting = false;

        console.log('ResetButton destroyed');
    }
}

export { ResetButton };