import { CONFIG } from './config.js';

/**
 * CameraCapture class for handling camera access and cube state capture
 * Provides camera interface with video preview and image capture functionality
 */

export class CameraCapture {
    constructor(cubeState) {
        this.cubeState = cubeState;
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.isActive = false;
        this.cameraModal = null;
        this.livePreviewInterval = null;
        this.isLivePreviewEnabled = true;

        // API Configuration (from centralized config)
        this.API_BASE_URL = CONFIG.API_BASE_URL;

        // State management
        // Possible states: 'ready', 'capturing', 'processing', 'success', 'error'
        this.currentState = 'ready';

        // Face sequencing and progress tracking
        this.faceSequence = ['front', 'right', 'back', 'left', 'top', 'bottom'];
        this.currentFaceIndex = 0;
        this.capturedFaces = new Map(); // Store captured face data: face -> colors
        this.capturedFacesCount = 0;

        // Camera configuration
        this.config = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'environment' // Use back camera on mobile
            },
            audio: false
        };

        // Bind methods to maintain context
        this.handleCameraPermissionDenied = this.handleCameraPermissionDenied.bind(this);
        this.handleCameraError = this.handleCameraError.bind(this);
        this.handleCaptureClick = this.handleCaptureClick.bind(this);
        this.handleCloseCamera = this.handleCloseCamera.bind(this);
    }

    /**
     * Set camera state and update UI accordingly
     * @param {string} state - State value: 'ready', 'capturing', 'processing', 'success', 'error'
     * @param {string} message - Optional status message to display
     */
    setState(state, message = null) {
        // Validate state
        const validStates = ['ready', 'capturing', 'processing', 'success', 'error'];
        if (!validStates.includes(state)) {
            console.warn(`Invalid state: ${state}. Must be one of: ${validStates.join(', ')}`);
            return;
        }

        console.log(`State transition: ${this.currentState} → ${state}`);
        this.currentState = state;

        // Update UI based on state
        this.updateUIForState(state, message);
    }

    /**
     * Update UI elements based on current state
     * @param {string} state - Current state
     * @param {string} message - Optional status message
     */
    updateUIForState(state, message = null) {
        if (!this.cameraModal) return;

        // Get UI elements
        const captureBtn = this.cameraModal.querySelector('.action-btn--capture');
        const retakeBtn = this.cameraModal.querySelector('.action-btn--retake');
        const cancelBtn = this.cameraModal.querySelector('.action-btn--cancel');
        const statusIndicator = this.cameraModal.querySelector('.status-indicator');
        const statusText = this.cameraModal.querySelector('.status-text');
        const statusSpinner = this.cameraModal.querySelector('.status-spinner');

        // Default status messages for each state
        const defaultMessages = {
            'ready': 'Ready to capture - Press Capture when positioned',
            'capturing': 'Capturing image...',
            'processing': 'Processing colors...',
            'success': 'Colors detected successfully!',
            'error': 'An error occurred. Please try again.'
        };

        // Use provided message or default
        const statusMessage = message || defaultMessages[state];

        // Update status text
        if (statusText) {
            statusText.textContent = statusMessage;
        }

        // Update status indicator color
        if (statusIndicator) {
            // Remove all state classes
            statusIndicator.classList.remove(
                'status-indicator--ready',
                'status-indicator--capturing',
                'status-indicator--processing',
                'status-indicator--success',
                'status-indicator--error'
            );

            // Add current state class
            statusIndicator.classList.add(`status-indicator--${state}`);
        }

        // Show/hide spinner
        if (statusSpinner) {
            statusSpinner.style.display = (state === 'processing' || state === 'capturing') ? 'flex' : 'none';
        }

        // Update button visibility and disabled state based on state
        switch (state) {
            case 'ready':
                // Show Capture button, hide Retake button
                if (captureBtn) {
                    captureBtn.style.display = 'flex';
                    captureBtn.disabled = false;
                }
                if (retakeBtn) {
                    retakeBtn.style.display = 'none';
                }
                if (cancelBtn) {
                    cancelBtn.disabled = false;
                }
                break;

            case 'capturing':
            case 'processing':
                // Disable all buttons during capture/processing
                if (captureBtn) {
                    captureBtn.disabled = true;
                }
                if (retakeBtn) {
                    retakeBtn.disabled = true;
                }
                if (cancelBtn) {
                    cancelBtn.disabled = true;
                }
                break;

            case 'success':
                // Show Retake button, hide Capture button
                if (captureBtn) {
                    captureBtn.style.display = 'none';
                }
                if (retakeBtn) {
                    retakeBtn.style.display = 'flex';
                    retakeBtn.disabled = false;
                }
                if (cancelBtn) {
                    cancelBtn.disabled = false;
                }
                break;

            case 'error':
                // Show both buttons, enable them
                if (captureBtn) {
                    captureBtn.style.display = 'flex';
                    captureBtn.disabled = false;
                }
                if (retakeBtn) {
                    retakeBtn.style.display = 'none';
                }
                if (cancelBtn) {
                    cancelBtn.disabled = false;
                }
                break;
        }

        console.log(`UI updated for state: ${state}`);
    }

    /**
     * Request camera access and initialize camera interface
     */
    async requestCameraAccess() {
        try {
            console.log('Requesting camera access...');

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access is not supported in this browser');
            }

            // Request camera permission and stream
            this.stream = await navigator.mediaDevices.getUserMedia(this.config);
            console.log('Camera access granted');

            return true;

        } catch (error) {
            console.error('Camera access failed:', error);
            this.handleCameraError(error);
            return false;
        }
    }

    /**
     * Open camera interface with video preview
     */
    async openCameraInterface() {
        try {
            // First request camera access
            const hasAccess = await this.requestCameraAccess();
            if (!hasAccess) {
                return false;
            }

            // Create camera modal interface
            this.createCameraModal();

            // Initialize progress bar
            this.updateProgress();

            // Set initial face based on current sequence position
            const initialFace = this.faceSequence[this.currentFaceIndex];
            const faceSelector = this.cameraModal?.querySelector('#face-selector');
            if (faceSelector) {
                faceSelector.value = initialFace;
                this.updateFaceInstruction(initialFace);
            }

            // Set up video element with stream
            this.setupVideoPreview();

            // Show the modal
            this.showCameraModal();

            // Set initial state to ready
            this.setState('ready', 'Camera ready - position your cube in the frame');

            this.isActive = true;
            console.log('Camera interface opened successfully');

            return true;

        } catch (error) {
            console.error('Failed to open camera interface:', error);
            this.handleCameraError(error);
            return false;
        }
    }

    /**
     * Create camera modal interface with refined UI
     */
    createCameraModal() {
        // Remove existing modal if present
        if (this.cameraModal) {
            this.cameraModal.remove();
        }

        // Create modal container
        this.cameraModal = document.createElement('div');
        this.cameraModal.className = 'camera-modal';

        // Create modal content with refined layout
        this.cameraModal.innerHTML = `
            <div class="camera-modal__overlay"></div>
            <div class="camera-modal__content">
                <!-- Header -->
                <div class="camera-modal__header">
                    <h3 class="camera-modal__title">
                        <span class="title-icon">📷</span>
                        Capture Cube Face
                    </h3>
                    <button class="camera-modal__close" type="button" aria-label="Close camera">
                        <span class="camera-modal__close-icon">×</span>
                    </button>
                </div>
                
                <div class="camera-modal__body">
                    <!-- Integrated Controls Bar -->
                    <div class="controls-bar">
                        <div class="controls-bar__left">
                            <label class="face-selector__label" for="face-selector">
                                Face:
                            </label>
                            <select class="face-selector__dropdown" id="face-selector">
                                <option value="front">Front (Green)</option>
                                <option value="back">Back (Blue)</option>
                                <option value="left">Left (Orange)</option>
                                <option value="right">Right (Red)</option>
                                <option value="top">Top (White)</option>
                                <option value="bottom">Bottom (Yellow)</option>
                            </select>
                        </div>
                        <div class="controls-bar__right">
                            <span class="progress-text">Progress: <strong class="progress-count">0/6</strong></span>
                            <div class="progress-bar">
                                <div class="progress-bar__fill" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Camera Preview Container -->
                    <div class="camera-preview">
                        <!-- Video Element -->
                        <video 
                            class="camera-preview__video" 
                            autoplay 
                            playsinline 
                            muted
                            aria-label="Live camera preview">
                        </video>
                        
                        <!-- Visual Guide Overlay -->
                        <div class="camera-preview__overlay">
                            <div class="camera-preview__guide">
                                <!-- Instruction Text -->
                                <p class="camera-preview__instruction">
                                    Position your cube's 
                                    <span class="face-name" data-face="front">front</span> 
                                    face in the frame
                                </p>
                                
                                <!-- 3x3 Grid Frame -->
                                <div class="camera-preview__frame">
                                    <!-- Corner markers -->
                                    <div class="frame-corner frame-corner--tl"></div>
                                    <div class="frame-corner frame-corner--tr"></div>
                                    <div class="frame-corner frame-corner--bl"></div>
                                    <div class="frame-corner frame-corner--br"></div>
                                    
                                    <!-- 3x3 Grid with Color Display -->
                                    <div class="sampling-grid">
                                        <div class="sampling-grid__row">
                                            <div class="sampling-cell" data-position="0">
                                                <span class="cell-color-label"></span>
                                            </div>
                                            <div class="sampling-cell" data-position="1">
                                                <span class="cell-color-label"></span>
                                            </div>
                                            <div class="sampling-cell" data-position="2">
                                                <span class="cell-color-label"></span>
                                            </div>
                                        </div>
                                        <div class="sampling-grid__row">
                                            <div class="sampling-cell" data-position="3">
                                                <span class="cell-color-label"></span>
                                            </div>
                                            <div class="sampling-cell sampling-cell--center" data-position="4">
                                                <span class="cell-color-label"></span>
                                            </div>
                                            <div class="sampling-cell" data-position="5">
                                                <span class="cell-color-label"></span>
                                            </div>
                                        </div>
                                        <div class="sampling-grid__row">
                                            <div class="sampling-cell" data-position="6">
                                                <span class="cell-color-label"></span>
                                            </div>
                                            <div class="sampling-cell" data-position="7">
                                                <span class="cell-color-label"></span>
                                            </div>
                                            <div class="sampling-cell" data-position="8">
                                                <span class="cell-color-label"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Captured Image Preview (hidden by default) -->
                        <div class="camera-preview__captured" style="display: none;">
                            <img class="captured-image" alt="Captured cube face">
                            <div class="captured-overlay">
                                <div class="sampling-grid">
                                    <!-- Same grid structure for captured image -->
                                    <div class="sampling-grid__row">
                                        <div class="sampling-cell" data-position="0">
                                            <span class="cell-color-label"></span>
                                        </div>
                                        <div class="sampling-cell" data-position="1">
                                            <span class="cell-color-label"></span>
                                        </div>
                                        <div class="sampling-cell" data-position="2">
                                            <span class="cell-color-label"></span>
                                        </div>
                                    </div>
                                    <div class="sampling-grid__row">
                                        <div class="sampling-cell" data-position="3">
                                            <span class="cell-color-label"></span>
                                        </div>
                                        <div class="sampling-cell sampling-cell--center" data-position="4">
                                            <span class="cell-color-label"></span>
                                        </div>
                                        <div class="sampling-cell" data-position="5">
                                            <span class="cell-color-label"></span>
                                        </div>
                                    </div>
                                    <div class="sampling-grid__row">
                                        <div class="sampling-cell" data-position="6">
                                            <span class="cell-color-label"></span>
                                        </div>
                                        <div class="sampling-cell" data-position="7">
                                            <span class="cell-color-label"></span>
                                        </div>
                                        <div class="sampling-cell" data-position="8">
                                            <span class="cell-color-label"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="action-buttons">
                        <button 
                            class="action-btn action-btn--primary action-btn--capture" 
                            type="button"
                            aria-label="Capture image">
                            <span class="action-btn__icon">📷</span>
                            <span class="action-btn__text">Capture</span>
                        </button>
                        
                        <button 
                            class="action-btn action-btn--secondary action-btn--retake" 
                            type="button"
                            style="display: none;"
                            aria-label="Retake photo">
                            <span class="action-btn__icon">🔄</span>
                            <span class="action-btn__text">Retake</span>
                        </button>
                        
                        <button 
                            class="action-btn action-btn--tertiary action-btn--cancel" 
                            type="button"
                            aria-label="Cancel and close">
                            <span class="action-btn__text">Cancel</span>
                        </button>
                    </div>
                </div>
                
                <!-- Status Bar -->
                <div class="camera-modal__status">
                    <span class="status-indicator status-indicator--ready">●</span>
                    <p class="status-text">Ready to capture - Press Capture when positioned</p>
                    <div class="status-spinner" style="display: none;">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(this.cameraModal);

        // Set up event listeners
        this.setupCameraModalEventListeners();
    }

    /**
     * Set up event listeners for camera modal
     */
    setupCameraModalEventListeners() {
        if (!this.cameraModal) return;

        // Close button
        const closeBtn = this.cameraModal.querySelector('.camera-modal__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.handleCloseCamera);
        }

        // Overlay click to close
        const overlay = this.cameraModal.querySelector('.camera-modal__overlay');
        if (overlay) {
            overlay.addEventListener('click', this.handleCloseCamera);
        }

        // Capture button (new class name)
        const captureBtn = this.cameraModal.querySelector('.action-btn--capture');
        if (captureBtn) {
            captureBtn.addEventListener('click', this.handleCaptureClick);
        }

        // Retake button (new)
        const retakeBtn = this.cameraModal.querySelector('.action-btn--retake');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => {
                // Clear grid colors
                this.clearGridColors();

                // Restart live preview
                this.startLivePreview();

                // Set state back to ready
                this.setState('ready', 'Ready to capture - Press Capture when positioned');
            });
        }

        // Cancel button (new class name)
        const cancelBtn = this.cameraModal.querySelector('.action-btn--cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.handleCloseCamera);
        }

        // Face selector change
        const faceSelector = this.cameraModal.querySelector('#face-selector');
        if (faceSelector) {
            faceSelector.addEventListener('change', (e) => {
                const selectedFace = e.target.value;

                // Update instruction text
                this.updateFaceInstruction(selectedFace);

                // Update current face index to match manual selection
                const faceIndex = this.faceSequence.indexOf(selectedFace);
                if (faceIndex !== -1) {
                    this.currentFaceIndex = faceIndex;
                    console.log(`Manual face selection: ${selectedFace} (${faceIndex + 1}/6)`);
                }

                // Clear grid colors when switching faces
                this.clearGridColors();
            });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.handleCloseCamera();
            }
        });
    }

    /**
     * Set up video preview with camera stream
     */
    setupVideoPreview() {
        if (!this.cameraModal || !this.stream) return;

        this.videoElement = this.cameraModal.querySelector('.camera-preview__video');
        if (this.videoElement) {
            this.videoElement.srcObject = this.stream;

            // Handle video load events
            this.videoElement.addEventListener('loadedmetadata', () => {
                console.log('Video preview loaded');

                // Set state to ready
                this.setState('ready', 'Camera ready - position your cube in the frame');

                // Start live color preview after video is ready
                setTimeout(() => {
                    this.startLivePreview();
                }, 500);
            });

            this.videoElement.addEventListener('error', (e) => {
                console.error('Video preview error:', e);
                this.handleCameraError(new Error('Video preview failed'));
            });
        }
    }

    /**
     * Show camera modal
     */
    showCameraModal() {
        if (!this.cameraModal) return;

        // Add show class for animation
        this.cameraModal.classList.add('camera-modal--show');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus on modal for accessibility
        this.cameraModal.focus();
    }

    /**
     * Handle capture button click
     */
    async handleCaptureClick() {
        console.log('Capture button clicked');

        // Set state to capturing
        this.setState('capturing', 'Capturing image...');

        // Stop live preview during capture
        this.stopLivePreview();

        try {
            // Get selected face
            const selectedFace = this.getSelectedFace();

            // Clear any previous colors from grid
            this.clearGridColors();

            // Capture image from video stream
            const imageData = this.captureImageFromVideo();

            if (!imageData) {
                throw new Error('Failed to capture image from video');
            }

            // Set state to processing
            this.setState('processing', 'Image captured! Processing colors...');

            // Send image to backend for color detection
            const result = await this.detectColorsFromImage(imageData, selectedFace);

            if (result.success) {
                this.setState('processing', 'Colors detected! Animating...');

                // Animate color detection with sequential cell updates
                await this.animateColorDetection(result.colors);

                // Apply detected colors to cube state
                this.applyDetectedColors(result.colors, selectedFace);

                // Mark face as captured and store data
                this.markFaceCaptured(selectedFace, result.colors);

                // Set state to success
                this.setState('success', `${selectedFace} face captured successfully!`);

                // Check if all faces are captured
                if (this.capturedFacesCount >= 6) {
                    // All faces captured - trigger completion workflow
                    await this.handleCompletion();
                } else {
                    // Auto-advance to next face
                    setTimeout(() => {
                        this.advanceToNextFace();
                        this.clearGridColors();
                        this.startLivePreview();
                        this.setState('ready', 'Ready to capture next face');
                    }, 1500);
                }

            } else {
                throw new Error(result.error || 'Color detection failed');
            }

        } catch (error) {
            console.error('Capture failed:', error);

            // Set state to error
            this.setState('error', 'Capture failed. Please try again.');
            this.showErrorMessage('Capture Error', error.message);

            // Restart live preview on error
            this.startLivePreview();
        }
    }

    /**
     * Capture image from video element using canvas
     * Matches backend preprocessing pipeline:
     * 1. Horizontal mirroring for natural interaction
     * 2. Square cropping (centered)
     * 3. Resize to 600x600 pixels
     * 4. Convert to base64 JPEG with 80% quality
     */
    captureImageFromVideo() {
        if (!this.videoElement) {
            console.error('Video element not available');
            return null;
        }

        try {
            const video = this.videoElement;
            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 480;

            // Step 1: Capture frame from video with horizontal mirroring
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoWidth;
            tempCanvas.height = videoHeight;
            const tempCtx = tempCanvas.getContext('2d');

            // Mirror horizontally for natural interaction (matching backend cv2.flip)
            tempCtx.scale(-1, 1);
            tempCtx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);

            // Step 2: Crop to square aspect ratio (centered)
            const size = Math.min(videoWidth, videoHeight);
            const x = (videoWidth - size) / 2;
            const y = (videoHeight - size) / 2;

            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = size;
            croppedCanvas.height = size;
            const croppedCtx = croppedCanvas.getContext('2d');

            // Extract centered square region
            croppedCtx.drawImage(
                tempCanvas,
                x, y, size, size,  // Source rectangle (centered square)
                0, 0, size, size   // Destination rectangle (full canvas)
            );

            // Step 3: Resize to 600x600 pixels (CAMERA_RESOLUTION)
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = 600;
            finalCanvas.height = 600;
            const finalCtx = finalCanvas.getContext('2d');

            // Use high-quality image smoothing for better color detection
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';

            finalCtx.drawImage(
                croppedCanvas,
                0, 0, size, size,      // Source (cropped square)
                0, 0, 600, 600         // Destination (600x600)
            );

            // Step 4: Convert to base64 JPEG with 80% quality
            const imageData = finalCanvas.toDataURL('image/jpeg', 0.8);

            console.log('Image captured and processed successfully', {
                originalSize: `${videoWidth}x${videoHeight}`,
                croppedSize: `${size}x${size}`,
                finalSize: '600x600',
                dataSize: imageData.length,
                format: 'JPEG (80% quality)'
            });

            return imageData;

        } catch (error) {
            console.error('Failed to capture image:', error);
            return null;
        }
    }

    /**
     * Send captured image to backend for color detection
     * Implements 5-second timeout as per requirements
     * @param {string} imageData - Base64 encoded image data
     * @param {string} face - Face name (front, back, left, right, top, bottom)
     * @returns {Promise<Object>} Detection result with colors and cube notation
     */
    async detectColorsFromImage(imageData, face = 'front') {
        try {
            console.log('Sending image to backend for color detection...');

            // Create abort controller for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.warn('Request timeout after 5 seconds');
            }, 5000); // 5 second timeout as per requirements

            try {
                // Send POST request to /api/detect-colors endpoint
                const response = await fetch(`${this.API_BASE_URL}/api/detect-colors`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: imageData,
                        face: face
                    }),
                    signal: controller.signal
                });

                // Clear timeout on successful response
                clearTimeout(timeoutId);

                // Handle HTTP errors
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                // Parse JSON response
                const result = await response.json();
                console.log('Color detection result:', result);

                // Validate response structure
                if (!result.success) {
                    throw new Error(result.error || result.message || 'Color detection failed');
                }

                // Validate colors array
                if (!Array.isArray(result.colors) || result.colors.length !== 9) {
                    throw new Error('Invalid response: expected 9 colors');
                }

                return result;

            } catch (fetchError) {
                // Clear timeout on error
                clearTimeout(timeoutId);

                // Handle timeout specifically
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timeout: Backend took longer than 5 seconds to respond');
                }

                throw fetchError;
            }

        } catch (error) {
            console.error('Backend communication failed:', error);

            // Return error response instead of fallback for better error handling
            return {
                success: false,
                error: error.message,
                message: `Color detection failed: ${error.message}`,
                colors: null,
                cube_notation: null,
                face: face
            };
        }
    }

    /**
     * Basic color detection fallback (client-side)
     */
    basicColorDetection(imageData) {
        console.log('Using basic color detection fallback');

        // Simple fallback - detect some basic colors
        // This is a very basic implementation for when backend is unavailable
        const colors = [
            'White', 'Red', 'Green',
            'Yellow', 'Orange', 'Blue',
            'White', 'Red', 'Green'
        ];

        return {
            success: true,
            colors: colors,
            cube_notation: colors.map(color => {
                const mapping = {
                    'White': 'U', 'Red': 'R', 'Green': 'F',
                    'Yellow': 'D', 'Orange': 'L', 'Blue': 'B'
                };
                return mapping[color] || 'U';
            }),
            face: 'front',
            message: 'Basic color detection used (backend unavailable)'
        };
    }

    /**
     * Get currently selected face from dropdown
     */
    getSelectedFace() {
        if (!this.cameraModal) return 'front';

        const faceSelector = this.cameraModal.querySelector('#face-selector');
        return faceSelector ? faceSelector.value : 'front';
    }

    /**
     * Update face instruction text
     */
    updateFaceInstruction(face) {
        if (!this.cameraModal) return;

        const faceNameSpan = this.cameraModal.querySelector('.face-name');
        if (faceNameSpan) {
            faceNameSpan.textContent = face;
        }
    }

    /**
     * Convert detected colors to cubestring notation
     * Maps backend color names to backend COLOR_TO_CUBE notation (U, R, F, D, L, B)
     * @param {Array} colors - Array of color names from backend (e.g., ['White', 'Red', ...])
     * @param {string} face - Face name (front, back, left, right, top, bottom)
     * @returns {string} 9-character face string in cubestring notation
     */
    convertColorsToCubestring(colors, face) {
        if (!Array.isArray(colors) || colors.length !== 9) {
            console.error('Invalid colors array: must be array of 9 colors');
            return null;
        }

        // Map backend color names to cubestring notation (U, R, F, D, L, B)
        // This matches the backend's COLOR_TO_CUBE mapping
        const colorMapping = {
            'White': 'U',   // Up face
            'Red': 'R',     // Right face
            'Green': 'F',   // Front face
            'Yellow': 'D',  // Down face
            'Orange': 'L',  // Left face
            'Blue': 'B',    // Back face
            'Unknown': 'U'  // Default to white/up for unknown colors
        };

        // Convert each color to cubestring notation
        let faceString = '';
        for (let i = 0; i < colors.length; i++) {
            const detectedColor = colors[i];
            const cubeChar = colorMapping[detectedColor] || colorMapping['Unknown'];
            faceString += cubeChar;
        }

        console.log(`Converted colors for ${face} face:`, colors, '→', faceString);
        return faceString;
    }

    /**
     * Apply detected colors to cube state
     * Updates cubestring directly for better performance
     * @param {Array} detectedColors - Array of color names from backend
     * @param {string} face - Face name (front, back, left, right, top, bottom)
     */
    applyDetectedColors(detectedColors, face = 'front') {
        if (!this.cubeState || !Array.isArray(detectedColors)) {
            console.error('Cannot apply colors: invalid cube state or colors');
            return;
        }

        console.log(`Applying detected colors to ${face} face:`, detectedColors);

        // Convert detected colors to cubestring notation
        const faceString = this.convertColorsToCubestring(detectedColors, face);

        if (!faceString) {
            console.error('Failed to convert colors to cubestring notation');
            return;
        }

        // Convert face string to 3x3 array format
        const colorArray = [];
        for (let row = 0; row < 3; row++) {
            const rowArray = [];
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                rowArray.push(faceString[index]);
            }
            colorArray.push(rowArray);
        }

        // Update cubestring using setFaceColors for better performance
        // This updates the entire face at once rather than sticker by sticker
        this.cubeState.setFaceColors(face, colorArray);

        console.log(`Colors applied to ${face} face successfully`);
    }

    /**
     * Display detected color in a specific grid cell
     * @param {number} position - Cell position (0-8)
     * @param {string} color - Hex color code (e.g., '#FFFFFF')
     * @param {string} colorName - Color notation (e.g., 'U', 'R', 'F')
     */
    displayDetectedColor(position, color, colorName) {
        if (!this.cameraModal) return;

        // Find the cell in the overlay grid
        const cell = this.cameraModal.querySelector(
            `.camera-preview__overlay .sampling-cell[data-position="${position}"]`
        );

        if (!cell) {
            console.warn(`Cell at position ${position} not found`);
            return;
        }

        const label = cell.querySelector('.cell-color-label');

        // Add detecting animation
        cell.classList.add('sampling-cell--detecting');

        // After brief delay, show detected color
        setTimeout(() => {
            cell.classList.remove('sampling-cell--detecting');
            cell.classList.add('sampling-cell--detected');

            // Set background color
            cell.style.backgroundColor = color;

            // Set text color based on brightness for readability
            const textColor = this.getContrastColor(color);
            if (label) {
                label.style.color = textColor;
                label.textContent = colorName;
            }
        }, 300);
    }

    /**
     * Animate color detection for all 9 cells sequentially
     * @param {Array} colors - Array of 9 detected colors (color names like 'White', 'Red', etc.)
     */
    async animateColorDetection(colors) {
        if (!Array.isArray(colors) || colors.length !== 9) {
            console.error('Invalid colors array: must be array of 9 colors');
            return;
        }

        // Color name to hex mapping (matching CubeState.COLORS)
        const colorToHex = {
            'White': '#FFFFFF',
            'Red': '#FF0000',
            'Green': '#00FF00',
            'Yellow': '#FFFF00',
            'Orange': '#FFA500',
            'Blue': '#4DA6FF',
            'U': '#FFFFFF',  // Up (White)
            'R': '#FF0000',  // Right (Red)
            'F': '#00FF00',  // Front (Green)
            'D': '#FFFF00',  // Down (Yellow)
            'L': '#FFA500',  // Left (Orange)
            'B': '#4DA6FF'   // Back (Blue)
        };

        // Animate each cell sequentially
        for (let i = 0; i < colors.length; i++) {
            const colorName = colors[i];
            const hexColor = colorToHex[colorName] || '#CCCCCC';

            // Update status
            this.updateCameraStatus(`Detecting colors... (${i + 1}/9)`);

            // Display color with animation
            this.displayDetectedColor(i, hexColor, colorName);

            // Wait for animation to complete before moving to next cell
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Update status when complete
        this.updateCameraStatus('All colors detected!');
    }

    /**
     * Get contrasting text color (black or white) based on background
     * Uses relative luminance calculation for accessibility
     * @param {string} hexColor - Background color in hex format (e.g., '#FFFFFF')
     * @returns {string} 'black' or 'white'
     */
    getContrastColor(hexColor) {
        // Remove # if present
        const hex = hexColor.replace('#', '');

        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Calculate relative luminance using WCAG formula
        // https://www.w3.org/TR/WCAG20/#relativeluminancedef
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Return black for light backgrounds, white for dark
        return luminance > 0.5 ? 'black' : 'white';
    }

    /**
     * Clear grid colors to reset between captures
     * Removes all color styling and labels from grid cells
     */
    clearGridColors() {
        if (!this.cameraModal) return;

        // Find all sampling cells in the overlay
        const cells = this.cameraModal.querySelectorAll(
            '.camera-preview__overlay .sampling-cell'
        );

        cells.forEach(cell => {
            // Remove animation classes
            cell.classList.remove('sampling-cell--detecting', 'sampling-cell--detected');

            // Reset background color
            cell.style.backgroundColor = '';

            // Clear label
            const label = cell.querySelector('.cell-color-label');
            if (label) {
                label.textContent = '';
                label.style.color = '';
            }
        });

        console.log('Grid colors cleared');
    }

    /**
     * Start live color preview
     * Continuously samples colors from video feed to help user position cube
     */
    startLivePreview() {
        if (!this.isLivePreviewEnabled || this.livePreviewInterval) return;

        console.log('Starting live color preview...');

        // Sample colors every 500ms for smooth preview without overwhelming performance
        this.livePreviewInterval = setInterval(() => {
            this.updateLivePreview();
        }, 500);
    }

    /**
     * Stop live color preview
     */
    stopLivePreview() {
        if (this.livePreviewInterval) {
            clearInterval(this.livePreviewInterval);
            this.livePreviewInterval = null;
            console.log('Live color preview stopped');
        }
    }

    /**
     * Update live preview by sampling colors from current video frame
     * Uses backend's detect_color_advanced with fast mode for better accuracy
     */
    async updateLivePreview() {
        if (!this.videoElement || !this.cameraModal) return;

        try {
            // Capture current frame from video
            const imageData = this.captureImageFromVideoForPreview();

            if (!imageData) {
                console.warn('Failed to capture image for live preview');
                return;
            }

            // Get selected face
            const selectedFace = this.getSelectedFace();

            // Send to backend for fast color detection
            const result = await this.detectColorsForLivePreview(imageData, selectedFace);

            if (result.success && result.colors && result.colors.length === 9) {
                // Convert color names to display format
                const colors = result.colors.map(colorName => {
                    const colorToHex = {
                        'White': '#FFFFFF', 'Red': '#FF0000', 'Green': '#00FF00',
                        'Yellow': '#FFFF00', 'Orange': '#FFA500', 'Blue': '#4DA6FF'
                    };
                    return {
                        hex: colorToHex[colorName] || '#CCCCCC',
                        name: result.cube_notation[result.colors.indexOf(colorName)] || 'U'
                    };
                });

                // Update grid cells with detected colors
                this.displayLiveColors(colors);
            }
        } catch (error) {
            console.warn('Live preview update failed:', error);
        }
    }

    /**
     * Capture image from video for live preview (lower quality for speed)
     * @returns {string} Base64 encoded JPEG image data
     */
    captureImageFromVideoForPreview() {
        if (!this.videoElement) return null;

        try {
            const video = this.videoElement;
            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 480;

            // Use smaller resolution for live preview (faster processing)
            const previewSize = 300;

            // Capture and mirror frame
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoWidth;
            tempCanvas.height = videoHeight;
            const tempCtx = tempCanvas.getContext('2d');

            tempCtx.scale(-1, 1);
            tempCtx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);

            // Crop to square
            const size = Math.min(videoWidth, videoHeight);
            const x = (videoWidth - size) / 2;
            const y = (videoHeight - size) / 2;

            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = previewSize;
            croppedCanvas.height = previewSize;
            const croppedCtx = croppedCanvas.getContext('2d');

            croppedCtx.drawImage(
                tempCanvas,
                x, y, size, size,
                0, 0, previewSize, previewSize
            );

            // Convert to base64 with lower quality for speed
            return croppedCanvas.toDataURL('image/jpeg', 0.6);

        } catch (error) {
            console.warn('Failed to capture preview image:', error);
            return null;
        }
    }

    /**
     * Detect colors using fast backend endpoint for live preview
     * @param {string} imageData - Base64 encoded image
     * @param {string} face - Face name
     * @returns {Promise<Object>} Detection result
     */
    async detectColorsForLivePreview(imageData, face = 'front') {
        try {
            // Use shorter timeout for live preview (2 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            try {
                const response = await fetch(`${this.API_BASE_URL}/api/detect-colors-fast`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: imageData,
                        face: face
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                return result;

            } catch (fetchError) {
                clearTimeout(timeoutId);

                if (fetchError.name === 'AbortError') {
                    // Timeout - just skip this preview update
                    return { success: false, error: 'Timeout' };
                }

                throw fetchError;
            }

        } catch (error) {
            // Silently fail for live preview - don't disrupt user experience
            return { success: false, error: error.message };
        }
    }

    /**
     * Sample colors from video at the 9 grid positions (DEPRECATED - kept for fallback)
     * @returns {Array} Array of 9 color objects with hex and name
     */
    sampleColorsFromVideo() {
        if (!this.videoElement) return null;

        try {
            const video = this.videoElement;
            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 480;

            // Create temporary canvas for sampling
            const canvas = document.createElement('canvas');
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            const ctx = canvas.getContext('2d');

            // Mirror the video frame to match the displayed preview
            ctx.scale(-1, 1);
            ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);

            // Calculate sampling positions (3x3 grid in center)
            const size = Math.min(videoWidth, videoHeight);
            const offsetX = (videoWidth - size) / 2;
            const offsetY = (videoHeight - size) / 2;

            // Sample at 9 positions matching the grid overlay
            const colors = [];
            const gridSize = size * 0.6; // Sample from 60% of center area
            const startX = offsetX + (size - gridSize) / 2;
            const startY = offsetY + (size - gridSize) / 2;
            const cellSize = gridSize / 3;

            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    // Sample from center of each cell
                    const x = Math.floor(startX + (col + 0.5) * cellSize);
                    const y = Math.floor(startY + (row + 0.5) * cellSize);

                    // Get pixel data
                    const imageData = ctx.getImageData(x, y, 1, 1);
                    const [r, g, b] = imageData.data;

                    // Convert to hex
                    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

                    // Detect color name from RGB
                    const colorName = this.detectColorFromRGB(r, g, b);

                    colors.push({ hex, name: colorName });
                }
            }

            return colors;

        } catch (error) {
            console.warn('Failed to sample colors from video:', error);
            return null;
        }
    }

    /**
     * Detect Rubik's cube color from RGB values
     * Uses simple distance-based color matching
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {string} Color notation (U, R, F, D, L, B)
     */
    detectColorFromRGB(r, g, b) {
        // Reference colors for Rubik's cube faces
        const referenceColors = {
            'U': { r: 255, g: 255, b: 255 }, // White
            'R': { r: 255, g: 0, b: 0 },     // Red
            'F': { r: 0, g: 255, b: 0 },     // Green
            'D': { r: 255, g: 255, b: 0 },   // Yellow
            'L': { r: 255, g: 165, b: 0 },   // Orange
            'B': { r: 0, g: 0, b: 255 }      // Blue
        };

        // Find closest color using Euclidean distance
        let minDistance = Infinity;
        let closestColor = 'U';

        for (const [notation, ref] of Object.entries(referenceColors)) {
            const distance = Math.sqrt(
                Math.pow(r - ref.r, 2) +
                Math.pow(g - ref.g, 2) +
                Math.pow(b - ref.b, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestColor = notation;
            }
        }

        return closestColor;
    }

    /**
     * Convert notation to color name
     * @param {string} notation - Color notation (U, R, F, D, L, B)
     * @returns {string} Color name (White, Red, Green, Yellow, Orange, Blue)
     */
    notationToColorName(notation) {
        const notationToName = {
            'U': 'White',
            'R': 'Red',
            'F': 'Green',
            'D': 'Yellow',
            'L': 'Orange',
            'B': 'Blue'
        };
        return notationToName[notation] || notation;
    }

    /**
     * Display live colors in grid without animation
     * @param {Array} colors - Array of 9 color objects with hex and name
     */
    displayLiveColors(colors) {
        if (!this.cameraModal || !Array.isArray(colors) || colors.length !== 9) return;

        // Color notation to hex mapping
        const colorToHex = {
            'U': '#FFFFFF',  // White
            'R': '#FF0000',  // Red
            'F': '#00FF00',  // Green
            'D': '#FFFF00',  // Yellow
            'L': '#FFA500',  // Orange
            'B': '#4DA6FF'   // Blue
        };

        colors.forEach((color, index) => {
            const cell = this.cameraModal.querySelector(
                `.camera-preview__overlay .sampling-cell[data-position="${index}"]`
            );

            if (!cell) return;

            const label = cell.querySelector('.cell-color-label');
            const hexColor = colorToHex[color.name] || color.hex;

            // Update cell without animation (smooth transition via CSS)
            cell.style.backgroundColor = hexColor;
            cell.style.opacity = '0.7'; // Slightly transparent for live preview

            // Update label with color name instead of notation
            if (label) {
                const textColor = this.getContrastColor(hexColor);
                label.style.color = textColor;
                // Convert notation (U, R, F) to color name (White, Red, Green)
                const colorName = this.notationToColorName(color.name);
                label.textContent = colorName;
            }
        });
    }

    /**
     * Handle completion workflow when all 6 faces are captured
     * Shows completion message, success animation, and auto-closes modal
     */
    async handleCompletion() {
        console.log('All 6 faces captured! Starting completion workflow...');

        // Show completion message with success animation
        this.setState('success', '🎉 All 6 faces captured successfully!');

        // Add success animation to the modal
        if (this.cameraModal) {
            const modalContent = this.cameraModal.querySelector('.camera-modal__content');
            if (modalContent) {
                modalContent.classList.add('camera-modal__content--success');
            }
        }

        // Wait 1.5 seconds to show completion message
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Trigger cube validation workflow if available
        this.triggerValidationWorkflow();

        // Close camera and clean up resources
        this.closeCamera();

        console.log('Completion workflow finished');
    }

    /**
     * Trigger cube validation workflow if available
     * Attempts to trigger validation button click to show validation results
     */
    triggerValidationWorkflow() {
        try {
            // Check if validation button exists
            const validateBtn = document.getElementById('validate-btn');

            if (validateBtn && !validateBtn.disabled) {
                console.log('Triggering cube validation workflow...');

                // Trigger validation after a brief delay to allow modal to close
                setTimeout(() => {
                    validateBtn.click();
                    console.log('Validation workflow triggered');
                }, 500);
            } else {
                console.log('Validation button not available or disabled');
            }
        } catch (error) {
            console.warn('Failed to trigger validation workflow:', error);
            // Don't throw error - validation is optional
        }
    }

    /**
     * Handle camera close
     */
    handleCloseCamera() {
        this.closeCamera();
    }

    /**
     * Close camera interface and clean up resources
     */
    closeCamera() {
        console.log('Closing camera interface...');

        // Stop live preview
        this.stopLivePreview();

        // Stop camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                console.log('Camera track stopped');
            });
            this.stream = null;
        }

        // Remove modal from DOM
        if (this.cameraModal) {
            this.cameraModal.classList.remove('camera-modal--show');

            // Wait for animation to complete before removing
            setTimeout(() => {
                if (this.cameraModal && this.cameraModal.parentNode) {
                    this.cameraModal.parentNode.removeChild(this.cameraModal);
                }
                this.cameraModal = null;
            }, 300);
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Reset state
        this.isActive = false;
        this.videoElement = null;
        this.canvasElement = null;

        // Reset face sequencing state (preserve captured faces for potential re-open)
        // Note: We keep capturedFaces and capturedFacesCount to preserve data
        // Reset currentFaceIndex to start from beginning on next open
        this.currentFaceIndex = 0;

        console.log('Camera interface closed');
    }

    /**
     * Handle camera permission denied
     */
    handleCameraPermissionDenied() {
        const message = `
            Camera access was denied. To use the camera feature:
            
            1. Click the camera icon in your browser's address bar
            2. Select "Allow" for camera access
            3. Refresh the page and try again
            
            You can still edit cube colors manually using the Edit Colors button.
        `;

        this.showErrorMessage('Camera Permission Denied', message);
    }

    /**
     * Handle camera errors
     */
    handleCameraError(error) {
        console.error('Camera error:', error);

        let title = 'Camera Error';
        let message = 'An error occurred while accessing the camera.';

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            this.handleCameraPermissionDenied();
            return;
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            title = 'No Camera Found';
            message = `
                No camera was found on this device. 
                
                You can still edit cube colors manually using the Edit Colors button.
            `;
        } else if (error.name === 'NotSupportedError') {
            title = 'Camera Not Supported';
            message = `
                Camera access is not supported in this browser.
                
                Try using a modern browser like Chrome, Firefox, or Safari.
                You can still edit cube colors manually using the Edit Colors button.
            `;
        } else if (error.message) {
            message = error.message;
        }

        this.showErrorMessage(title, message);

        // Clean up on error
        this.closeCamera();
    }

    /**
     * Show error message to user
     */
    showErrorMessage(title, message) {
        // Create error modal
        const errorModal = document.createElement('div');
        errorModal.className = 'camera-error-modal';

        errorModal.innerHTML = `
            <div class="camera-error-modal__overlay"></div>
            <div class="camera-error-modal__content">
                <div class="camera-error-modal__header">
                    <h3 class="camera-error-modal__title">${title}</h3>
                </div>
                <div class="camera-error-modal__body">
                    <p class="camera-error-modal__message">${message.replace(/\n/g, '<br>')}</p>
                </div>
                <div class="camera-error-modal__footer">
                    <button class="camera-error-modal__ok" type="button">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(errorModal);

        // Show modal
        setTimeout(() => {
            errorModal.classList.add('camera-error-modal--show');
        }, 10);

        // Handle OK button
        const okBtn = errorModal.querySelector('.camera-error-modal__ok');
        const closeError = () => {
            errorModal.classList.remove('camera-error-modal--show');
            setTimeout(() => {
                if (errorModal.parentNode) {
                    errorModal.parentNode.removeChild(errorModal);
                }
            }, 300);
        };

        okBtn.addEventListener('click', closeError);

        // Close on overlay click
        const overlay = errorModal.querySelector('.camera-error-modal__overlay');
        overlay.addEventListener('click', closeError);

        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeError();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Update camera status message and indicator
     */
    updateCameraStatus(message, state = 'ready') {
        if (!this.cameraModal) return;

        const statusText = this.cameraModal.querySelector('.status-text');
        const statusIndicator = this.cameraModal.querySelector('.status-indicator');
        const statusSpinner = this.cameraModal.querySelector('.status-spinner');

        if (statusText) {
            statusText.textContent = message;
        }

        // Update status indicator based on state
        if (statusIndicator) {
            // Remove all state classes
            statusIndicator.classList.remove('status-indicator--ready', 'status-indicator--processing', 'status-indicator--error', 'status-indicator--success');

            // Add appropriate state class
            statusIndicator.classList.add(`status-indicator--${state}`);
        }

        // Show/hide spinner for processing state
        if (statusSpinner) {
            statusSpinner.style.display = state === 'processing' ? 'flex' : 'none';
        }
    }

    /**
     * Update progress bar and counter
     * Updates the progress bar fill percentage and count text
     */
    updateProgress() {
        if (!this.cameraModal) return;

        const progressCount = this.cameraModal.querySelector('.progress-count');
        const progressFill = this.cameraModal.querySelector('.progress-bar__fill');

        // Update count text
        if (progressCount) {
            progressCount.textContent = `${this.capturedFacesCount}/6`;
        }

        // Update progress bar fill percentage
        if (progressFill) {
            const percentage = (this.capturedFacesCount / 6) * 100;
            progressFill.style.width = `${percentage}%`;
        }

        console.log(`Progress updated: ${this.capturedFacesCount}/6 faces captured`);
    }

    /**
     * Advance to next face in sequence
     * Auto-advances to the next face after successful capture
     */
    advanceToNextFace() {
        // Move to next face in sequence
        this.currentFaceIndex = (this.currentFaceIndex + 1) % this.faceSequence.length;
        const nextFace = this.faceSequence[this.currentFaceIndex];

        // Update face selector dropdown
        const faceSelector = this.cameraModal?.querySelector('#face-selector');
        if (faceSelector) {
            faceSelector.value = nextFace;

            // Trigger change event to update instruction text
            this.updateFaceInstruction(nextFace);
        }

        console.log(`Advanced to next face: ${nextFace} (${this.currentFaceIndex + 1}/6)`);
    }

    /**
     * Mark face as captured and store its data
     * @param {string} face - Face name (front, back, left, right, top, bottom)
     * @param {Array} colors - Array of 9 detected colors
     */
    markFaceCaptured(face, colors) {
        // Check if this face was already captured
        const wasAlreadyCaptured = this.capturedFaces.has(face);

        // Store face data
        this.capturedFaces.set(face, colors);

        // Update count only if this is a new capture
        if (!wasAlreadyCaptured) {
            this.capturedFacesCount++;
            console.log(`Face "${face}" captured for the first time (${this.capturedFacesCount}/6)`);
        } else {
            console.log(`Face "${face}" re-captured (count remains ${this.capturedFacesCount}/6)`);
        }

        // Update progress display
        this.updateProgress();
    }

    /**
     * Check if a face has been captured
     * @param {string} face - Face name
     * @returns {boolean} True if face has been captured
     */
    isFaceCaptured(face) {
        return this.capturedFaces.has(face);
    }

    /**
     * Get captured face data
     * @param {string} face - Face name
     * @returns {Array|null} Array of 9 colors or null if not captured
     */
    getCapturedFaceData(face) {
        return this.capturedFaces.get(face) || null;
    }

    /**
     * Clear grid colors (reset to empty state)
     */
    clearGridColors() {
        if (!this.cameraModal) return;

        const cells = this.cameraModal.querySelectorAll('.sampling-cell');
        cells.forEach(cell => {
            // Remove detected state
            cell.classList.remove('sampling-cell--detected', 'sampling-cell--detecting');

            // Clear background color
            cell.style.backgroundColor = '';

            // Clear label
            const label = cell.querySelector('.cell-color-label');
            if (label) {
                label.textContent = '';
                label.style.color = '';
            }
        });
    }

    /**
     * Check if camera is currently active
     */
    isActive() {
        return this.isActive;
    }

    /**
     * Get current camera stream
     */
    getStream() {
        return this.stream;
    }
}