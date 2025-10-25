/**
 * Main entry point for the Rubik's Cube Interactive application
 * Initializes all components and manages the overall application state
 * 
 * VERSION: 2.0 - Color Editor Fully Implemented
 * Last Updated: Task 8 Complete
 */

console.log('🚀 Loading main.js VERSION 2.0 - Color Editor Implemented');

// Import modules
import { CubeState } from './cube-state.js';
import { CubeRenderer } from './cube-renderer.js';
import { ViewController } from './view-controller.js';
import { CameraCapture } from './camera-capture.js';
// DEPRECATED: CubeImporter is no longer used with frontend camera capture
// import { CubeImporter } from './cube-importer.js';
import { ResetButton } from './reset-button.js';
import { ColorEditor } from './color-editor.js';
import { ValidationButton } from './validation-button.js';
import { SolveButton } from './solve-button.js';

class RubiksCubeApp {
    constructor() {
        this.cubeState = null;
        this.cubeRenderer = null;
        this.viewController = null;
        this.cameraCapture = null;
        this.cubeImporter = null;
        this.resetButton = null;
        this.colorEditor = null;
        this.validationButton = null;
        this.solveButton = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Rubik\'s Cube Interactive...');
            
            // Show loading state
            this.showLoadingState();
            
            // Initialize components (placeholders for now)
            await this.initializeComponents();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Hide loading state and show initial view
            this.hideLoadingState();
            
            this.isInitialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showErrorState('Failed to load application. Please refresh the page.');
        }
    }

    /**
     * Initialize all application components
     */
    async initializeComponents() {
        // Initialize cube state
        this.cubeState = new CubeState();
        console.log('CubeState initialized');

        // Initialize cube renderer
        this.cubeRenderer = new CubeRenderer('cube-visualization', this.cubeState);
        console.log('CubeRenderer initialized');

        // Initialize view controller
        this.viewController = new ViewController(this.cubeRenderer);
        console.log('ViewController initialized');

        // Initialize camera capture
        this.cameraCapture = new CameraCapture(this.cubeState);
        console.log('CameraCapture initialized');

        // DEPRECATED: CubeImporter is no longer needed with frontend camera capture
        // The new workflow uses direct API responses instead of polling web_output/ files
        // this.cubeImporter = new CubeImporter(this.cubeState);
        // this.setupCubeImporter();
        // console.log('CubeImporter initialized');
        this.cubeImporter = null;
        console.log('CubeImporter disabled (deprecated)');

        // Initialize reset button
        this.resetButton = new ResetButton(this.cubeState, this.cubeRenderer);
        console.log('ResetButton initialized');

        // Initialize color editor
        this.colorEditor = new ColorEditor(this.cubeState, this.cubeRenderer);
        console.log('ColorEditor initialized');

        // Initialize validation button
        this.validationButton = new ValidationButton(this.cubeState);
        console.log('ValidationButton initialized');

        // Initialize solve button
        this.solveButton = new SolveButton(this.cubeState);
        console.log('SolveButton initialized');

        // Start backend polling for automatic cube state updates
        this.setupBackendIntegration();

        // Set up view controller event listeners
        this.setupViewControllerEventListeners();

        // Enable interactivity for the 3D cube
        this.cubeRenderer.enableInteraction();
        console.log('Cube interactivity enabled');

        // Set up renderer event listeners
        this.setupRendererEventListeners();
        
        // Simulate loading time for smooth UX
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    /**
     * Set up event listeners for the application
     */
    setupEventListeners() {
        // Header navigation
        this.setupHeaderNavigation();

        // View control buttons are now handled by ViewController
        // The ViewController sets up its own event listeners for view switching

        // Camera button
        const cameraBtn = document.getElementById('camera-btn');
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => {
                this.handleCameraClick();
            });
        }

        // Edit button
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.handleEditClick();
            });
        }

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Set up cube renderer event listeners
     */
    setupRendererEventListeners() {
        if (!this.cubeRenderer) {
            return;
        }

        // Listen for sticker selection events
        this.cubeRenderer.addEventListener('stickerSelected', (event) => {
            console.log('Sticker selected:', event.detail);
            
            // Only demonstrate color cycling if edit mode is NOT enabled
            // When edit mode is enabled, the ColorEditor handles sticker clicks
            if (!this.colorEditor || !this.colorEditor.isEnabled()) {
                // Demonstrate color update functionality
                // Cycle through colors when a sticker is clicked
                this.demonstrateColorUpdate(event.detail);
            }
        });
    }

    /**
     * Set up view controller event listeners
     */
    setupViewControllerEventListeners() {
        if (!this.viewController) {
            return;
        }

        // Listen for view change events
        this.viewController.addViewChangeListener((event) => {
            console.log('View change event:', event);
            
            switch (event.phase) {
                case 'start':
                    this.handleViewChangeStart(event);
                    break;
                case 'complete':
                    this.handleViewChangeComplete(event);
                    break;
                case 'error':
                    this.handleViewChangeError(event);
                    break;
            }
        });
    }

    /**
     * Handle view change start
     */
    handleViewChangeStart(event) {
        console.log(`Starting transition from ${event.previousView} to ${event.targetView}`);
        
        // Disable view buttons during transition
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.7';
        });
    }

    /**
     * Handle view change completion
     */
    handleViewChangeComplete(event) {
        console.log(`Completed transition to ${event.currentView}`);
        
        // Re-enable view buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }

    /**
     * Handle view change error
     */
    handleViewChangeError(event) {
        console.error(`Error during view change to ${event.targetView}:`, event.error);
        
        // Re-enable view buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
        
        // Show error message to user
        this.showPlaceholderMessage(`Failed to switch to ${event.targetView} view. Please try again.`);
    }

    /**
     * Set up header navigation functionality
     */
    setupHeaderNavigation() {
        // Get all header navigation links
        const headerLinks = document.querySelectorAll('.header__link');
        
        // Add click handlers for smooth navigation
        headerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleHeaderNavigation(e);
            });
        });

        // Set active state for current page
        this.setActiveHeaderLink();
    }

    /**
     * Handle header navigation link clicks
     */
    handleHeaderNavigation(event) {
        const link = event.target;
        const href = link.getAttribute('href');
        
        // Add smooth transition effect
        link.style.transform = 'translateY(-2px)';
        
        // Reset transform after a short delay
        setTimeout(() => {
            link.style.transform = '';
        }, 150);

        // Allow default navigation to proceed
        // The browser will handle the actual page navigation
    }

    /**
     * Set active state styling for current page header link
     */
    setActiveHeaderLink() {
        const currentPage = window.location.pathname;
        const headerLinks = document.querySelectorAll('.header__link');
        
        headerLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            
            // Remove any existing active class
            link.classList.remove('header__link--active');
            
            // Check if this link corresponds to the current page
            if (this.isCurrentPage(linkPath, currentPage)) {
                link.classList.add('header__link--active');
            }
        });
    }

    /**
     * Check if a link path corresponds to the current page
     */
    isCurrentPage(linkPath, currentPath) {
        // Handle root path cases
        if (linkPath === 'index.html' && (currentPath === '/' || currentPath.endsWith('/index.html'))) {
            return true;
        }
        
        // Handle about page
        if (linkPath === 'about.html' && currentPath.endsWith('/about.html')) {
            return true;
        }
        
        // Handle direct path matches
        return currentPath.endsWith(linkPath);
    }

    /**
     * Handle view change between 3D and net views
     */
    async handleViewChange(viewType) {
        console.log(`Requesting switch to ${viewType} view`);
        
        // Use view controller for smooth transitions
        if (this.viewController) {
            const success = await this.viewController.switchToView(viewType);
            
            if (success) {
                // Update cube state view
                this.cubeState.setCurrentView(viewType);
                console.log(`Successfully switched to ${viewType} view`);
            } else {
                console.warn(`Failed to switch to ${viewType} view`);
            }
        } else {
            // Fallback to direct renderer calls if view controller not available
            this.fallbackViewChange(viewType);
        }
    }

    /**
     * Fallback view change method (direct renderer calls)
     */
    fallbackViewChange(viewType) {
        console.log(`Using fallback view change to ${viewType}`);
        
        // Update active button state
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewType) {
                btn.classList.add('active');
            }
        });

        // Switch cube view
        if (this.cubeRenderer) {
            if (viewType === '3d') {
                this.cubeRenderer.render3DView();
            } else if (viewType === 'net') {
                this.cubeRenderer.renderNetView();
            }
            
            // Update cube state view
            this.cubeState.setCurrentView(viewType);
        }
    }

    /**
     * DEPRECATED: Set up cube importer for automatic camera integration
     * No longer used with frontend camera capture workflow
     */
    setupCubeImporter() {
        // DEPRECATED: CubeImporter polling is no longer needed
        // The new workflow uses frontend camera capture with direct API responses
        console.log('⚠️ setupCubeImporter called but CubeImporter is deprecated');
        return;
        
        // Legacy code (commented out):
        // if (!this.cubeImporter) return;
        // this.cubeImporter.onStatusUpdate((status) => {
        //     this.handleCameraStatus(status);
        // });
        // this.cubeImporter.startWatching();
        // console.log('🔍 Watching for camera program output...');
    }

    /**
     * Set up backend integration for automatic cube state updates
     */
    setupBackendIntegration() {
        if (!this.cubeState) return;

        console.log('🔗 Setting up backend integration...');

        // Try to fetch initial cube state from backend
        this.cubeState.fetchFromBackend().then(success => {
            if (success) {
                console.log('✅ Initial cube state loaded from backend');
            } else {
                console.log('ℹ️ No initial cube state available from backend');
            }
        });

        // Set up event listeners for backend integration
        this.cubeState.addChangeListener((event) => {
            this.handleBackendStateChange(event);
        });

        console.log('🔗 Backend integration ready');
    }

    /**
     * Handle backend state change events
     */
    handleBackendStateChange(event) {
        switch (event.type) {
            case 'cubeStringImported':
                console.log('📥 Cube string imported from backend:', event.data.cubeString);
                this.showPlaceholderMessage('Cube state updated from backend!');
                break;

            case 'backendColorsImported':
                console.log('📥 Backend colors imported:', event.data.colorArray.length, 'colors');
                this.showPlaceholderMessage('Cube colors updated from camera!');
                break;

            case 'backendDataImported':
                console.log('📥 Backend data imported successfully');
                const { backendData } = event.data;
                const message = `Cube imported: ${backendData.total_stickers || 54} stickers${backendData.is_valid ? ' (Valid)' : ''}`;
                this.showPlaceholderMessage(message);
                break;

            case 'backendFetchError':
                console.warn('⚠️ Backend fetch error:', event.data.error);
                break;

            case 'backendPollingUpdate':
                console.debug('🔄 Backend polling update received');
                break;
        }
    }

    /**
     * DEPRECATED: Handle camera program status updates
     * No longer used with frontend camera capture workflow
     */
    handleCameraStatus(status) {
        // DEPRECATED: Status updates from web_output/ polling are no longer used
        console.log('⚠️ handleCameraStatus called but is deprecated');
        return;
    }

    /**
     * DEPRECATED: Update camera status display in UI
     * No longer used with frontend camera capture workflow
     */
    updateCameraStatusDisplay(statusType, message, progress) {
        // DEPRECATED: Status display for external camera program is no longer used
        console.log('⚠️ updateCameraStatusDisplay called but is deprecated');
        return;
    }

    /**
     * DEPRECATED: Get icon for status type
     * No longer used with frontend camera capture workflow
     */
    getStatusIcon(statusType) {
        // DEPRECATED: Status icons for external camera program are no longer used
        return '📊';
    }

    /**
     * Handle camera button click
     * Opens the frontend camera capture interface
     */
    async handleCameraClick() {
        console.log('Camera button clicked - opening frontend camera capture');
        
        if (this.cameraCapture) {
            // Open the new frontend camera interface
            const success = await this.cameraCapture.openCameraInterface();
            
            if (success) {
                console.log('✅ Camera interface opened successfully');
            } else {
                console.error('❌ Failed to open camera interface');
                this.showPlaceholderMessage('Failed to open camera. Please check camera permissions.');
            }
        } else {
            console.error('❌ CameraCapture not initialized');
            this.showPlaceholderMessage('Camera capture not available');
        }
    }

    /**
     * DEPRECATED: Show instruction modal with detailed message
     * No longer used with frontend camera capture workflow
     */
    showInstructionModal(title, message) {
        // DEPRECATED: Instruction modal for external camera program is no longer used
        console.log('⚠️ showInstructionModal called but is deprecated');
        return;
    }

    /**
     * DEPRECATED: Launch the integrated camera program
     * No longer used with frontend camera capture workflow
     */
    async launchIntegratedCameraProgram() {
        // DEPRECATED: External camera program launch is no longer used
        console.log('⚠️ launchIntegratedCameraProgram called but is deprecated');
        this.showPlaceholderMessage('⚠️ This feature is deprecated. Please use the camera button to open the new camera interface.');
        return;
    }

    /**
     * DEPRECATED: Handle backend import - fetch latest cube state from backend
     * No longer used with frontend camera capture workflow
     */
    async handleBackendImport() {
        // DEPRECATED: Backend import from web_output/ files is no longer used
        console.log('⚠️ handleBackendImport called but is deprecated');
        return;
    }

    /**
     * DEPRECATED: Show import dialog for cube state (fallback method)
     * No longer used with frontend camera capture workflow
     */
    showImportDialog() {
        // DEPRECATED: Manual import dialog is no longer used
        console.log('⚠️ showImportDialog called but is deprecated');
        return;
    }

    /**
     * DEPRECATED: Import cube state from string
     * No longer used with frontend camera capture workflow
     */
    importCubeState(cubeString) {
        // DEPRECATED: Manual cube string import is no longer used
        console.log('⚠️ importCubeState called but is deprecated');
        return;
    }

    /**
     * Handle edit button click
     * VERSION: 2.0 - Full color editor implementation
     */
    handleEditClick() {
        console.log('Edit button clicked - VERSION 2.0');
        console.log('ColorEditor exists:', !!this.colorEditor);
        
        if (this.colorEditor) {
            this.colorEditor.toggleEditMode();
            
            // Update button state
            const editBtn = document.getElementById('edit-btn');
            if (editBtn) {
                if (this.colorEditor.isEnabled()) {
                    editBtn.classList.add('active');
                    this.showPlaceholderMessage('🎨 Edit mode enabled! Click any sticker, then select a color.');
                    console.log('✅ Edit mode ENABLED - Color palette should be visible');
                } else {
                    editBtn.classList.remove('active');
                    this.showPlaceholderMessage('Edit mode disabled');
                    console.log('❌ Edit mode DISABLED');
                }
            }
        } else {
            console.error('❌ ColorEditor not initialized!');
            this.showPlaceholderMessage('Color editor not initialized');
        }
    }

    /**
     * Handle page becoming hidden
     */
    handlePageHidden() {
        // Pause any animations or intensive operations
        console.log('Page hidden - pausing operations');
    }

    /**
     * Handle page becoming visible
     */
    handlePageVisible() {
        // Resume operations
        console.log('Page visible - resuming operations');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust layouts for new window size
        console.log('Window resized - adjusting layouts');
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const cubeVisualization = document.getElementById('cube-visualization');
        if (cubeVisualization) {
            cubeVisualization.innerHTML = '<div class="cube-loading">Loading cube...</div>';
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        // Loading state will be cleared by the cube renderer initialization
        console.log('Loading state cleared - cube renderer active');
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        const cubeVisualization = document.getElementById('cube-visualization');
        if (cubeVisualization) {
            cubeVisualization.innerHTML = `<div class="cube-error">${message}</div>`;
        }
    }

    /**
     * Show placeholder message
     */
    showPlaceholderMessage(message) {
        // Create temporary message overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 1000;
            text-align: center;
        `;
        overlay.textContent = message;
        
        document.body.appendChild(overlay);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 3000);
    }

    /**
     * Demonstrate color update functionality
     * Cycles through colors when a sticker is clicked
     */
    demonstrateColorUpdate(stickerInfo) {
        const colors = ['W', 'Y', 'R', 'O', 'B', 'G'];
        const currentColorIndex = colors.indexOf(stickerInfo.color);
        const nextColorIndex = (currentColorIndex + 1) % colors.length;
        const nextColor = colors[nextColorIndex];
        
        console.log(`Changing sticker from ${stickerInfo.color} to ${nextColor}`);
        
        // Update the cube state - this will trigger the renderer to update
        this.cubeState.setStickerColor(
            stickerInfo.face, 
            stickerInfo.row, 
            stickerInfo.col, 
            nextColor
        );
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new RubiksCubeApp();
    app.init();
    
    // Expose app instance for debugging
    window.app = app;
    console.log('App instance available at window.app');
});

// Export for potential use by other modules
export { RubiksCubeApp };