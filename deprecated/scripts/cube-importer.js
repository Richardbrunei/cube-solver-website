/**
 * CubeImporter class for automatically importing cube states from the camera program
 * Watches for output files and automatically updates the web interface
 */

export class CubeImporter {
    constructor(cubeState) {
        this.cubeState = cubeState;
        this.isWatching = false;
        this.watchInterval = null;
        this.lastImportTime = 0;
        this.statusCallbacks = [];
        
        // File paths (relative to web server)
        this.cubeStateUrl = '/web_output/cube_state.json';
        this.statusUrl = '/web_output/status.json';
        
        // Polling interval (milliseconds)
        this.pollInterval = 1000; // Check every second
    }

    /**
     * Start watching for camera program output
     */
    startWatching() {
        if (this.isWatching) {
            console.log('Already watching for camera output');
            return;
        }
        
        console.log('🔍 Started watching for camera program output...');
        this.isWatching = true;
        
        // Start polling for updates
        this.watchInterval = setInterval(() => {
            this.checkForUpdates();
        }, this.pollInterval);
        
        // Initial check
        this.checkForUpdates();
    }

    /**
     * Stop watching for camera program output
     */
    stopWatching() {
        if (!this.isWatching) {
            return;
        }
        
        console.log('⏹️ Stopped watching for camera output');
        this.isWatching = false;
        
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
    }

    /**
     * Add callback for status updates
     */
    onStatusUpdate(callback) {
        this.statusCallbacks.push(callback);
    }

    /**
     * Notify status callbacks
     */
    notifyStatusUpdate(status) {
        this.statusCallbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Error in status callback:', error);
            }
        });
    }

    /**
     * Check for updates from camera program
     */
    async checkForUpdates() {
        try {
            // Check status first
            await this.checkStatus();
            
            // Check for new cube state
            await this.checkCubeState();
            
        } catch (error) {
            // Silently handle errors (files might not exist yet)
            if (error.message.includes('404')) {
                // Files don't exist yet - this is normal
                return;
            }
            console.debug('Update check error:', error.message);
        }
    }

    /**
     * Check camera program status
     */
    async checkStatus() {
        try {
            const response = await fetch(this.statusUrl + '?t=' + Date.now());
            if (!response.ok) {
                return; // File doesn't exist yet
            }
            
            const status = await response.json();
            
            // Notify status update
            this.notifyStatusUpdate(status);
            
        } catch (error) {
            // Status file doesn't exist or can't be read
            return;
        }
    }

    /**
     * Check for new cube state
     */
    async checkCubeState() {
        try {
            const response = await fetch(this.cubeStateUrl + '?t=' + Date.now());
            if (!response.ok) {
                return; // File doesn't exist yet
            }
            
            const cubeData = await response.json();
            
            // Check if this is a new result
            const resultTime = new Date(cubeData.timestamp).getTime();
            if (resultTime <= this.lastImportTime) {
                return; // Already imported this result
            }
            
            // Import the new cube state
            await this.importCubeData(cubeData);
            this.lastImportTime = resultTime;
            
        } catch (error) {
            // Cube state file doesn't exist or can't be read
            return;
        }
    }

    /**
     * Import cube data into the web interface
     */
    async importCubeData(cubeData) {
        try {
            console.log('📥 Importing new cube state from camera program...');
            console.log('Cube data:', cubeData);
            
            const { cube_state, cube_string, is_valid, face_count, total_stickers } = cubeData;
            
            // Use the new CubeState backend integration method
            this.cubeState.importFromBackendData(cubeData);
            
            console.log(`✅ Successfully imported cube state: ${total_stickers} stickers, ${face_count} faces`);
            console.log(`📊 Cube string: ${cube_string}`);
            console.log(`🔍 Valid: ${is_valid ? 'Yes' : 'No'}`);
            
            // Show success notification
            this.showImportNotification(
                'Cube State Imported!',
                `Successfully imported ${total_stickers} stickers from camera program.${is_valid ? ' Cube is valid!' : ' Cube validation failed.'}`,
                is_valid ? 'success' : 'warning'
            );
            
            return true;
            
        } catch (error) {
            console.error('Error importing cube data:', error);
            this.showImportNotification(
                'Import Error',
                'Failed to import cube state: ' + error.message,
                'error'
            );
            return false;
        }
    }

    /**
     * Apply cube state to the web interface
     */
    applyCubeState(cubeStateArray) {
        try {
            if (!this.cubeState || !Array.isArray(cubeStateArray)) {
                console.error('Invalid cube state or cubeState object');
                return false;
            }
            
            // Use the new CubeState method for importing backend colors
            this.cubeState.importFromBackendColors(cubeStateArray);
            
            console.log('Cube state applied to web interface using new backend integration');
            return true;
            
        } catch (error) {
            console.error('Error applying cube state:', error);
            return false;
        }
    }

    /**
     * Show import notification to user
     */
    showImportNotification(title, message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `import-notification import-notification--${type}`;
        
        notification.innerHTML = `
            <div class="import-notification__content">
                <div class="import-notification__title">${title}</div>
                <div class="import-notification__message">${message}</div>
            </div>
            <button class="import-notification__close" type="button">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('import-notification--show');
        }, 10);
        
        // Auto-hide after 5 seconds
        const hideTimeout = setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);
        
        // Handle close button
        const closeBtn = notification.querySelector('.import-notification__close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(hideTimeout);
            this.hideNotification(notification);
        });
    }

    /**
     * Hide notification
     */
    hideNotification(notification) {
        notification.classList.remove('import-notification--show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Get current watching status
     */
    isCurrentlyWatching() {
        return this.isWatching;
    }
}