/**
 * ViewController class for managing view switching between 3D and net views
 * Handles smooth transitions, state preservation, and view-specific optimizations
 */

export class ViewController {
    constructor(cubeRenderer) {
        if (!cubeRenderer) {
            throw new Error('CubeRenderer instance is required');
        }

        this.cubeRenderer = cubeRenderer;
        this.currentView = '3d'; // Default to 3D view
        this.isTransitioning = false;
        this.viewChangeListeners = [];

        // View-specific settings
        this.viewSettings = {
            '3d': {
                transitionDuration: 300,
                perspective: '1000px',
                optimizations: ['hardware-acceleration', 'transform-optimization'],
                cleanup: ['reset-transforms', 'clear-hover-states']
            },
            'net': {
                transitionDuration: 250,
                perspective: 'none',
                optimizations: ['layout-optimization', 'grid-optimization'],
                cleanup: ['reset-perspective', 'clear-3d-transforms']
            },
            'string': {
                transitionDuration: 250,
                perspective: 'none',
                optimizations: ['layout-optimization'],
                cleanup: ['reset-perspective']
            }
        };

        // State preservation
        this.preservedState = {
            selectedFace: null,
            selectedSticker: null,
            interactionMode: null,
            cubeColors: null
        };

        // Initialize view controller
        this.init();
    }

    /**
     * Initialize the view controller
     */
    init() {
        this.setupViewButtons();
        this.setupTransitionStyles();
        this.setInitialView();

        console.log('ViewController initialized with 3D view');
    }

    /**
     * Set up view switching buttons
     */
    setupViewButtons() {
        const viewButtons = document.querySelectorAll('.view-btn');

        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetView = button.dataset.view;

                if (targetView && targetView !== this.currentView && !this.isTransitioning) {
                    this.switchToView(targetView);
                }
            });
        });

        // Add keyboard support for accessibility
        viewButtons.forEach(button => {
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });
    }

    /**
     * Set up CSS transition styles for smooth view switching
     */
    setupTransitionStyles() {
        const cubeContainer = document.getElementById('cube-visualization');
        if (cubeContainer) {
            cubeContainer.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        }
    }

    /**
     * Set the initial view state
     */
    setInitialView() {
        this.updateViewButtonStates();
        this.applyViewOptimizations('3d');
    }

    /**
     * Switch to 3D view
     */
    switchTo3D() {
        return this.switchToView('3d');
    }

    /**
     * Switch to net view
     */
    switchToNet() {
        return this.switchToView('net');
    }

    /**
     * Switch to string view
     */
    switchToString() {
        return this.switchToView('string');
    }

    /**
     * Switch to specified view with smooth transition
     */
    async switchToView(targetView) {
        if (this.isTransitioning || targetView === this.currentView) {
            return false;
        }

        if (!['3d', 'net', 'string'].includes(targetView)) {
            console.error(`Invalid view type: ${targetView}`);
            return false;
        }

        console.log(`Switching from ${this.currentView} to ${targetView} view`);

        try {
            this.isTransitioning = true;

            // Preserve current state before transition
            this.preserveCurrentState();

            // Notify listeners of view change start
            this.notifyViewChangeListeners('start', targetView);

            // Apply transition effects
            await this.performViewTransition(targetView);

            // Update current view
            const previousView = this.currentView;
            this.currentView = targetView;

            // Update UI states
            this.updateViewButtonStates();

            // Apply view-specific optimizations
            this.applyViewOptimizations(targetView);

            // Clean up previous view optimizations
            this.cleanupViewOptimizations(previousView);

            // Restore preserved state in new view
            this.restorePreservedState();

            // Notify listeners of view change completion
            this.notifyViewChangeListeners('complete', targetView);

            console.log(`Successfully switched to ${targetView} view`);
            return true;

        } catch (error) {
            console.error('Error during view transition:', error);
            this.notifyViewChangeListeners('error', targetView, error);
            return false;
        } finally {
            this.isTransitioning = false;
        }
    }

    /**
     * Perform the actual view transition with smooth effects
     */
    async performViewTransition(targetView) {
        const cubeContainer = document.getElementById('cube-visualization');
        if (!cubeContainer) {
            throw new Error('Cube visualization container not found');
        }

        const settings = this.viewSettings[targetView];

        // Start performance monitoring
        this.monitorPerformance();

        // Fade out current view
        cubeContainer.style.opacity = '0';
        cubeContainer.style.transform = 'scale(0.95)';

        // Wait for fade out
        await this.wait(150);

        // Switch the actual cube view
        if (targetView === '3d') {
            this.cubeRenderer.render3DView();
        } else if (targetView === 'net') {
            this.cubeRenderer.renderNetView();
        } else if (targetView === 'string') {
            this.cubeRenderer.renderStringView();
        }

        // Apply view-specific container styles
        this.applyContainerStyles(targetView);

        // Wait a bit for rendering to complete
        await this.wait(50);

        // Fade in new view
        cubeContainer.style.opacity = '1';
        cubeContainer.style.transform = 'scale(1)';

        // Wait for fade in to complete
        await this.wait(settings.transitionDuration);
    }

    /**
     * Apply view-specific styles to the container
     */
    applyContainerStyles(viewType) {
        const cubeContainer = document.getElementById('cube-visualization');
        if (!cubeContainer) return;

        const settings = this.viewSettings[viewType];

        // Apply perspective settings
        cubeContainer.style.perspective = settings.perspective;

        // Add view-specific CSS classes
        cubeContainer.classList.remove('view-3d', 'view-net', 'view-string');
        cubeContainer.classList.add(`view-${viewType}`);
    }

    /**
     * Update view button active states
     */
    updateViewButtonStates() {
        const viewButtons = document.querySelectorAll('.view-btn');

        viewButtons.forEach(button => {
            const buttonView = button.dataset.view;

            if (buttonView === this.currentView) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            }
        });
    }

    /**
     * Preserve current state before view transition
     */
    preserveCurrentState() {
        try {
            // Preserve cube renderer state
            if (this.cubeRenderer) {
                this.preservedState.selectedFace = this.cubeRenderer.selectedFace;
                this.preservedState.selectedSticker = this.cubeRenderer.selectedSticker;
                this.preservedState.interactionMode = this.cubeRenderer.isInteractive;
            }

            // Preserve cube state colors
            if (this.cubeRenderer && this.cubeRenderer.cubeState) {
                this.preservedState.cubeColors = this.cubeRenderer.cubeState.getAllFaceColors();
            }

            console.log('State preserved for view transition');
        } catch (error) {
            console.warn('Failed to preserve state:', error);
        }
    }

    /**
     * Restore preserved state after view transition
     */
    restorePreservedState() {
        try {
            // Restore cube renderer state
            if (this.cubeRenderer && this.preservedState) {
                if (this.preservedState.selectedFace !== null) {
                    // Restore face selection if applicable in new view
                    this.cubeRenderer.selectedFace = this.preservedState.selectedFace;
                }

                if (this.preservedState.selectedSticker !== null) {
                    // Restore sticker selection if applicable in new view
                    this.cubeRenderer.selectedSticker = this.preservedState.selectedSticker;
                }

                // Restore interaction mode
                if (this.preservedState.interactionMode && !this.cubeRenderer.isInteractive) {
                    this.cubeRenderer.enableInteraction();
                }
            }

            console.log('State restored after view transition');
        } catch (error) {
            console.warn('Failed to restore state:', error);
        }
    }

    /**
     * Apply view-specific optimizations
     */
    applyViewOptimizations(viewType) {
        const settings = this.viewSettings[viewType];
        const cubeContainer = document.getElementById('cube-visualization');

        if (!cubeContainer || !settings.optimizations) return;

        settings.optimizations.forEach(optimization => {
            switch (optimization) {
                case 'hardware-acceleration':
                    cubeContainer.style.transform = cubeContainer.style.transform || 'translateZ(0)';
                    cubeContainer.style.willChange = 'transform, opacity';
                    break;

                case 'transform-optimization':
                    // Enable GPU acceleration for 3D transforms
                    cubeContainer.style.backfaceVisibility = 'hidden';
                    cubeContainer.style.transformStyle = 'preserve-3d';
                    break;

                case 'layout-optimization':
                    cubeContainer.style.willChange = 'auto';
                    cubeContainer.style.contain = 'layout style paint';
                    break;

                case 'grid-optimization':
                    // Optimize for CSS Grid layout in net view
                    cubeContainer.style.contain = 'layout';
                    cubeContainer.style.isolation = 'isolate';
                    break;
            }
        });

        console.log(`Applied ${viewType} view optimizations`);
    }

    /**
     * Clean up optimizations from previous view
     */
    cleanupViewOptimizations(previousViewType) {
        const settings = this.viewSettings[previousViewType];
        const cubeContainer = document.getElementById('cube-visualization');

        if (!cubeContainer || !settings.cleanup) return;

        settings.cleanup.forEach(cleanup => {
            switch (cleanup) {
                case 'reset-transforms':
                    // Clean up 3D transform properties when leaving 3D view
                    if (previousViewType === '3d') {
                        cubeContainer.style.backfaceVisibility = '';
                        cubeContainer.style.transformStyle = '';
                    }
                    break;

                case 'clear-hover-states':
                    // Clear any hover states from previous view
                    const hoverElements = cubeContainer.querySelectorAll(':hover');
                    hoverElements.forEach(el => {
                        el.blur();
                    });
                    break;

                case 'reset-perspective':
                    // Reset perspective when leaving net view
                    if (previousViewType === 'net') {
                        cubeContainer.style.contain = '';
                        cubeContainer.style.isolation = '';
                    }
                    break;

                case 'clear-3d-transforms':
                    // No longer needed - transforms are now handled by CSS classes
                    // which properly respond to media queries for different screen sizes
                    break;
            }
        });

        // Reset will-change property after transition
        setTimeout(() => {
            if (cubeContainer.style.willChange !== 'auto') {
                cubeContainer.style.willChange = 'auto';
            }
        }, 1000);

        console.log(`Cleaned up ${previousViewType} view optimizations`);
    }

    /**
     * Get current view type
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Check if view is currently transitioning
     */
    isViewTransitioning() {
        return this.isTransitioning;
    }

    /**
     * Add listener for view change events
     */
    addViewChangeListener(callback) {
        if (typeof callback === 'function') {
            this.viewChangeListeners.push(callback);
        }
    }

    /**
     * Remove view change listener
     */
    removeViewChangeListener(callback) {
        const index = this.viewChangeListeners.indexOf(callback);
        if (index > -1) {
            this.viewChangeListeners.splice(index, 1);
        }
    }

    /**
     * Notify all view change listeners
     */
    notifyViewChangeListeners(phase, targetView, error = null) {
        this.viewChangeListeners.forEach(callback => {
            try {
                callback({
                    phase,
                    targetView,
                    previousView: phase === 'start' ? this.currentView : null,
                    currentView: this.currentView,
                    error
                });
            } catch (err) {
                console.error('Error in view change listener:', err);
            }
        });
    }

    /**
     * Utility method for creating delays
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Monitor performance and adapt optimizations
     */
    monitorPerformance() {
        if (!window.performance || !window.performance.mark) {
            return;
        }

        const startMark = `view-transition-start-${Date.now()}`;
        const endMark = `view-transition-end-${Date.now()}`;

        performance.mark(startMark);

        // Monitor transition performance
        requestAnimationFrame(() => {
            performance.mark(endMark);

            try {
                performance.measure('view-transition', startMark, endMark);
                const measures = performance.getEntriesByName('view-transition');

                if (measures.length > 0) {
                    const duration = measures[measures.length - 1].duration;
                    console.log(`View transition took ${duration.toFixed(2)}ms`);

                    // Adapt optimizations based on performance
                    if (duration > 500) {
                        console.warn('Slow view transition detected, consider reducing animations');
                        this.adaptOptimizationsForPerformance();
                    }
                }
            } catch (error) {
                console.warn('Performance monitoring failed:', error);
            }
        });
    }

    /**
     * Adapt optimizations for better performance
     */
    adaptOptimizationsForPerformance() {
        // Reduce transition durations for better performance
        this.viewSettings['3d'].transitionDuration = Math.max(200, this.viewSettings['3d'].transitionDuration - 50);
        this.viewSettings['net'].transitionDuration = Math.max(150, this.viewSettings['net'].transitionDuration - 50);

        console.log('Adapted view transition durations for better performance');
    }

    /**
     * Get view controller statistics
     */
    getStatistics() {
        return {
            currentView: this.currentView,
            isTransitioning: this.isTransitioning,
            viewChangeListeners: this.viewChangeListeners.length,
            viewSettings: this.viewSettings,
            preservedState: this.preservedState
        };
    }

    /**
     * Destroy the view controller and clean up resources
     */
    destroy() {
        // Remove event listeners
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });

        // Clear listeners
        this.viewChangeListeners = [];

        // Reset container styles
        const cubeContainer = document.getElementById('cube-visualization');
        if (cubeContainer) {
            cubeContainer.style.transition = '';
            cubeContainer.style.willChange = 'auto';
            cubeContainer.style.contain = '';
            cubeContainer.style.isolation = '';
            cubeContainer.style.backfaceVisibility = '';
            cubeContainer.style.transformStyle = '';
            cubeContainer.classList.remove('view-3d', 'view-net');
        }

        // Clear preserved state
        this.preservedState = {
            selectedFace: null,
            selectedSticker: null,
            interactionMode: null,
            cubeColors: null
        };

        console.log('ViewController destroyed');
    }
}