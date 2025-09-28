/**
 * Main entry point for the Rubik's Cube Interactive application
 * Initializes all components and manages the overall application state
 */

// Import modules
import { CubeState } from './cube-state.js';
import { CubeRenderer } from './cube-renderer.js';
import { ViewController } from './view-controller.js';
import { CameraCapture } from './camera-capture.js';
import { CubeImporter } from './cube-importer.js';
import { ResetButton } from './reset-button.js';
// import { ColorEditor } from './color-editor.js';

class RubiksCubeApp {
    constructor() {
        this.cubeState = null;
        this.cubeRenderer = null;
        this.viewController = null;
        this.cameraCapture = null;
        this.cubeImporter = null;
        this.resetButton = null;
        this.colorEditor = null;
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

        // Initialize cube importer for automatic camera integration
        this.cubeImporter = new CubeImporter(this.cubeState);
        this.setupCubeImporter();
        console.log('CubeImporter initialized');

        // Initialize reset button
        this.resetButton = new ResetButton(this.cubeState, this.cubeRenderer);
        console.log('ResetButton initialized');

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
            
            // Demonstrate color update functionality
            // Cycle through colors when a sticker is clicked
            this.demonstrateColorUpdate(event.detail);
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
     * Set up cube importer for automatic camera integration
     */
    setupCubeImporter() {
        if (!this.cubeImporter) return;
        
        // Add status update callback
        this.cubeImporter.onStatusUpdate((status) => {
            this.handleCameraStatus(status);
        });
        
        // Start watching for camera program output
        this.cubeImporter.startWatching();
        
        console.log('🔍 Watching for camera program output...');
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
     * Handle camera program status updates
     */
    handleCameraStatus(status) {
        const { status: statusType, message, progress } = status;
        
        // Show status in console
        console.log(`📊 Camera Status: ${statusType} - ${message} (${progress}%)`);
        
        // Show status in UI
        this.updateCameraStatusDisplay(statusType, message, progress);
        
        if (statusType === 'complete') {
            console.log('🎉 Camera program completed! Cube state should be imported automatically.');
        } else if (statusType === 'error') {
            console.error('❌ Camera program error:', message);
        }
    }

    /**
     * Update camera status display in UI
     */
    updateCameraStatusDisplay(statusType, message, progress) {
        // Create or update status display
        let statusDisplay = document.getElementById('camera-status-display');
        
        if (!statusDisplay) {
            statusDisplay = document.createElement('div');
            statusDisplay.id = 'camera-status-display';
            statusDisplay.className = 'camera-status-display';
            document.body.appendChild(statusDisplay);
        }
        
        // Update content based on status
        const progressBar = progress > 0 ? `
            <div class="camera-status-progress">
                <div class="camera-status-progress-bar" style="width: ${progress}%"></div>
            </div>
        ` : '';
        
        statusDisplay.innerHTML = `
            <div class="camera-status-content">
                <div class="camera-status-icon">${this.getStatusIcon(statusType)}</div>
                <div class="camera-status-text">
                    <div class="camera-status-type">${statusType.toUpperCase()}</div>
                    <div class="camera-status-message">${message}</div>
                </div>
                ${progressBar}
            </div>
        `;
        
        // Show/hide based on status
        if (statusType === 'complete' || statusType === 'error') {
            setTimeout(() => {
                if (statusDisplay.parentNode) {
                    statusDisplay.parentNode.removeChild(statusDisplay);
                }
            }, 5000);
        }
        
        // Add status-specific classes
        statusDisplay.className = `camera-status-display camera-status-display--${statusType}`;
    }

    /**
     * Get icon for status type
     */
    getStatusIcon(statusType) {
        const icons = {
            'starting': '🔄',
            'ready': '📷',
            'capturing': '📸',
            'positioning': '🎯',
            'processing': '⚙️',
            'complete': '✅',
            'error': '❌',
            'cancelled': '⏹️'
        };
        return icons[statusType] || '📊';
    }

    /**
     * Handle camera button click
     */
    async handleCameraClick() {
        console.log('Camera button clicked');
        
        // Show instructions for using the integrated camera program
        const message = `
            🎥 <strong>Camera Capture with Live Preview</strong>
            
            Capture cube faces using live camera preview with spacebar control!
            
            <strong>How it works:</strong>
            1. Click "Launch Camera Program" below
            2. Camera window opens with live preview
            3. Position your cube face in the preview
            4. Press SPACEBAR to capture each face
            5. Colors automatically appear in this web interface
            
            <strong>Capture Sequence:</strong>
            White → Red → Green → Yellow → Orange → Blue
            
            <strong>Features:</strong>
            • Live camera preview with mirroring
            • Spacebar capture control (like your original program)
            • Advanced HSV color detection  
            • No manual color editing needed
            • Real-time status updates in web interface
            • Automatic web integration with backend
            • Cube string and color array support
            
            <strong>Just position each face and press SPACEBAR when ready!</strong>
        `;
        
        this.showInstructionModal('🎥 Integrated Camera System', message);
    }

    /**
     * Show instruction modal with detailed message
     */
    showInstructionModal(title, message) {
        // Create instruction modal
        const modal = document.createElement('div');
        modal.className = 'instruction-modal';
        
        modal.innerHTML = `
            <div class="instruction-modal__overlay"></div>
            <div class="instruction-modal__content">
                <div class="instruction-modal__header">
                    <h3 class="instruction-modal__title">${title}</h3>
                    <button class="instruction-modal__close" type="button">×</button>
                </div>
                <div class="instruction-modal__body">
                    <p class="instruction-modal__message">${message.replace(/\n/g, '<br>')}</p>
                </div>
                <div class="instruction-modal__footer">
                    <button class="instruction-modal__launch" type="button">Launch Camera Program</button>
                    <button class="instruction-modal__import" type="button">Import Cube State</button>
                    <button class="instruction-modal__cancel" type="button">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.classList.add('instruction-modal--show');
        }, 10);
        
        // Handle buttons
        const closeModal = () => {
            modal.classList.remove('instruction-modal--show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        modal.querySelector('.instruction-modal__close').addEventListener('click', closeModal);
        modal.querySelector('.instruction-modal__cancel').addEventListener('click', closeModal);
        modal.querySelector('.instruction-modal__overlay').addEventListener('click', closeModal);
        
        modal.querySelector('.instruction-modal__launch').addEventListener('click', () => {
            this.launchIntegratedCameraProgram();
            closeModal();
        });
        
        modal.querySelector('.instruction-modal__import').addEventListener('click', () => {
            this.handleBackendImport();
            closeModal();
        });
    }

    /**
     * Launch the integrated camera program
     */
    async launchIntegratedCameraProgram() {
        try {
            // First check camera and backend status
            const statusResponse = await fetch('http://localhost:5000/api/camera-status');
            
            if (statusResponse.ok) {
                const status = await statusResponse.json();
                
                if (!status.camera_available) {
                    this.showPlaceholderMessage('❌ Camera not available. Please check your camera connection.');
                    return;
                }
                
                if (!status.backend_available) {
                    this.showPlaceholderMessage('❌ Backend modules not available. Please check your backend setup.');
                    return;
                }
            }
            
            // Launch integrated camera capture
            const response = await fetch('http://localhost:5000/api/launch-integrated-camera', {
                method: 'POST'
            });
            
            if (response.ok) {
                this.showPlaceholderMessage('🎥 Camera capture started! A camera window will open - position your cube and press SPACEBAR to capture each face. Watch status updates below!');
                
                // Ensure importer is watching
                if (this.cubeImporter && !this.cubeImporter.isCurrentlyWatching()) {
                    this.cubeImporter.startWatching();
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to start camera capture');
            }
        } catch (error) {
            console.error('Camera launch error:', error);
            this.showPlaceholderMessage(`❌ Failed to start camera: ${error.message}`);
            
            // Still start watching in case they run it manually
            if (this.cubeImporter && !this.cubeImporter.isCurrentlyWatching()) {
                this.cubeImporter.startWatching();
            }
        }
    }

    /**
     * Handle backend import - fetch latest cube state from backend
     */
    async handleBackendImport() {
        try {
            this.showPlaceholderMessage('Fetching cube state from backend...');
            
            const success = await this.cubeState.fetchFromBackend();
            
            if (success) {
                this.showPlaceholderMessage('✅ Cube state imported from backend successfully!');
            } else {
                // Fallback to manual input
                this.showImportDialog();
            }
            
        } catch (error) {
            console.error('Backend import error:', error);
            this.showPlaceholderMessage('❌ Backend import failed. Try manual input.');
            this.showImportDialog();
        }
    }

    /**
     * Show import dialog for cube state (fallback method)
     */
    showImportDialog() {
        const cubeString = prompt(`
Enter the cube string from your camera program:

Example: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB

Paste the final cube string here:`);
        
        if (cubeString && cubeString.length === 54) {
            this.importCubeState(cubeString);
        } else if (cubeString) {
            alert('Invalid cube string. Must be exactly 54 characters.');
        }
    }

    /**
     * Import cube state from string
     */
    importCubeState(cubeString) {
        try {
            // Use the new CubeState method for importing cube strings
            this.cubeState.importFromCubeString(cubeString);
            
            this.showPlaceholderMessage('Cube state imported successfully!');
            console.log('Imported cube state:', cubeString);
            
        } catch (error) {
            console.error('Error importing cube state:', error);
            this.showPlaceholderMessage('Error importing cube state. Please check the format.');
        }
    }

    /**
     * Handle edit button click
     */
    handleEditClick() {
        console.log('Edit functionality clicked');
        this.showPlaceholderMessage('Color editing functionality will be implemented in subsequent tasks');
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
});

// Export for potential use by other modules
export { RubiksCubeApp };