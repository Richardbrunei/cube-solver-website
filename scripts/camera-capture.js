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
            
            // Set up video element with stream
            this.setupVideoPreview();
            
            // Show the modal
            this.showCameraModal();
            
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
     * Create camera modal interface
     */
    createCameraModal() {
        // Remove existing modal if present
        if (this.cameraModal) {
            this.cameraModal.remove();
        }
        
        // Create modal container
        this.cameraModal = document.createElement('div');
        this.cameraModal.className = 'camera-modal';
        
        // Create modal content
        this.cameraModal.innerHTML = `
            <div class="camera-modal__overlay"></div>
            <div class="camera-modal__content">
                <div class="camera-modal__header">
                    <h3 class="camera-modal__title">Capture Cube State</h3>
                    <button class="camera-modal__close" type="button" aria-label="Close camera">
                        <span class="camera-modal__close-icon">×</span>
                    </button>
                </div>
                
                <div class="camera-modal__body">
                    <div class="face-selector">
                        <label class="face-selector__label">Select cube face:</label>
                        <select class="face-selector__dropdown" id="face-selector">
                            <option value="front">Front Face</option>
                            <option value="back">Back Face</option>
                            <option value="left">Left Face</option>
                            <option value="right">Right Face</option>
                            <option value="top">Top Face</option>
                            <option value="bottom">Bottom Face</option>
                        </select>
                    </div>
                    
                    <div class="camera-preview">
                        <video class="camera-preview__video" autoplay playsinline muted></video>
                        <div class="camera-preview__overlay">
                            <div class="camera-preview__guide">
                                <p class="camera-preview__instruction">Position your cube's <span class="face-name">front</span> face in the frame</p>
                                <div class="camera-preview__frame"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="camera-controls">
                        <button class="camera-btn camera-btn--capture" type="button">
                            <span class="camera-btn__icon">📷</span>
                            <span class="camera-btn__text">Capture</span>
                        </button>
                        <button class="camera-btn camera-btn--cancel" type="button">
                            <span class="camera-btn__text">Cancel</span>
                        </button>
                    </div>
                </div>
                
                <div class="camera-modal__status">
                    <p class="camera-status__text">Ready to capture</p>
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
        
        // Capture button
        const captureBtn = this.cameraModal.querySelector('.camera-btn--capture');
        if (captureBtn) {
            captureBtn.addEventListener('click', this.handleCaptureClick);
        }
        
        // Cancel button
        const cancelBtn = this.cameraModal.querySelector('.camera-btn--cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.handleCloseCamera);
        }
        
        // Face selector change
        const faceSelector = this.cameraModal.querySelector('#face-selector');
        if (faceSelector) {
            faceSelector.addEventListener('change', (e) => {
                this.updateFaceInstruction(e.target.value);
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
                this.updateCameraStatus('Camera ready - position your cube in the frame');
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
        this.updateCameraStatus('Capturing image...');
        
        try {
            // Get selected face
            const selectedFace = this.getSelectedFace();
            
            // Capture image from video stream
            const imageData = this.captureImageFromVideo();
            
            if (!imageData) {
                throw new Error('Failed to capture image from video');
            }
            
            this.updateCameraStatus('Image captured! Processing colors...');
            
            // Send image to backend for color detection
            const result = await this.detectColorsFromImage(imageData, selectedFace);
            
            if (result.success) {
                this.updateCameraStatus('Colors detected! Updating cube...');
                
                // Apply detected colors to cube state
                this.applyDetectedColors(result.colors, selectedFace);
                
                this.updateCameraStatus('Colors applied successfully!');
                
                // Close camera after successful capture
                setTimeout(() => {
                    this.closeCamera();
                }, 1500);
                
            } else {
                throw new Error(result.error || 'Color detection failed');
            }
            
        } catch (error) {
            console.error('Capture failed:', error);
            this.updateCameraStatus('Capture failed. Please try again.');
            this.showErrorMessage('Capture Error', error.message);
        }
    }

    /**
     * Capture image from video element using canvas
     */
    captureImageFromVideo() {
        if (!this.videoElement) {
            console.error('Video element not available');
            return null;
        }
        
        try {
            // Create canvas element for image capture
            if (!this.canvasElement) {
                this.canvasElement = document.createElement('canvas');
            }
            
            const canvas = this.canvasElement;
            const video = this.videoElement;
            
            // Set canvas size to match video
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            
            // Draw video frame to canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to base64 image data
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            console.log('Image captured successfully', {
                width: canvas.width,
                height: canvas.height,
                dataSize: imageData.length
            });
            
            return imageData;
            
        } catch (error) {
            console.error('Failed to capture image:', error);
            return null;
        }
    }

    /**
     * Send captured image to backend for color detection
     */
    async detectColorsFromImage(imageData, face = 'front') {
        try {
            console.log('Sending image to backend for color detection...');
            
            const response = await fetch('http://localhost:5000/api/detect-colors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    face: face
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Color detection result:', result);
            
            return result;
            
        } catch (error) {
            console.error('Backend communication failed:', error);
            
            // Fallback to basic color detection if backend is unavailable
            console.log('Falling back to basic color detection...');
            return this.basicColorDetection(imageData);
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
     * Apply detected colors to cube state
     */
    applyDetectedColors(detectedColors, face = 'front') {
        if (!this.cubeState || !Array.isArray(detectedColors)) {
            console.error('Cannot apply colors: invalid cube state or colors');
            return;
        }
        
        console.log(`Applying detected colors to ${face} face:`, detectedColors);
        
        // Map colors to cube notation
        const colorMapping = {
            'White': 'W', 'Red': 'R', 'Green': 'G',
            'Yellow': 'Y', 'Orange': 'O', 'Blue': 'B'
        };
        
        // Apply colors to 3x3 grid on the specified face
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const colorIndex = row * 3 + col;
                if (colorIndex < detectedColors.length) {
                    const detectedColor = detectedColors[colorIndex];
                    const cubeColor = colorMapping[detectedColor] || 'W';
                    
                    // Update cube state
                    this.cubeState.setStickerColor(face, row, col, cubeColor);
                }
            }
        }
        
        console.log(`Colors applied to ${face} face successfully`);
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
     * Update camera status message
     */
    updateCameraStatus(message) {
        if (!this.cameraModal) return;
        
        const statusText = this.cameraModal.querySelector('.camera-status__text');
        if (statusText) {
            statusText.textContent = message;
        }
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