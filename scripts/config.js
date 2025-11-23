/**
 * Application Configuration
 * Centralized configuration for the Rubik's Cube application
 */

// Detect environment and set appropriate backend URL
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

const API_BASE_URL = isDevelopment 
    ? 'http://localhost:5000'  // Local development
    : 'https://YOUR_BACKEND_URL.onrender.com';  // ⚠️ REPLACE WITH YOUR ACTUAL BACKEND URL

export const CONFIG = {
    /**
     * Backend API Base URL
     * Automatically switches between local and production
     * 
     * Local: http://localhost:5000
     * Production: YOUR_BACKEND_URL.onrender.com
     */
    API_BASE_URL: API_BASE_URL,
    
    /**
     * API Endpoints
     * Relative paths appended to API_BASE_URL
     */
    API_ENDPOINTS: {
        COLOR_MAPPINGS: '/api/color-mappings',
        VALIDATE_CUBE: '/api/validate-cube',
        DETECT_COLORS: '/api/detect-colors',
        DETECT_COLORS_FAST: '/api/detect-colors-fast'
    },
    
    /**
     * Camera Configuration
     */
    CAMERA: {
        // Ideal video resolution
        VIDEO_WIDTH: 640,
        VIDEO_HEIGHT: 480,
        
        // Capture resolution (sent to backend)
        CAPTURE_WIDTH: 600,
        CAPTURE_HEIGHT: 600,
        
        // Live preview update interval (ms)
        PREVIEW_INTERVAL: 500,
        
        // API timeout for color detection (ms)
        DETECTION_TIMEOUT: 5000,
        PREVIEW_TIMEOUT: 2000
    },
    
    /**
     * Validation Configuration
     */
    VALIDATION: {
        // Use backend validation by default
        USE_BACKEND: true,
        
        // Expected cubestring length
        CUBESTRING_LENGTH: 54,
        
        // Valid cube notation characters
        VALID_CHARS: ['U', 'R', 'F', 'D', 'L', 'B']
    }
};

/**
 * Get full API URL for an endpoint
 * @param {string} endpoint - Endpoint key from CONFIG.API_ENDPOINTS
 * @returns {string} Full URL
 */
export function getApiUrl(endpoint) {
    const path = CONFIG.API_ENDPOINTS[endpoint];
    if (!path) {
        console.warn(`Unknown API endpoint: ${endpoint}`);
        return CONFIG.API_BASE_URL;
    }
    return `${CONFIG.API_BASE_URL}${path}`;
}

/**
 * Update API base URL at runtime
 * @param {string} newUrl - New base URL
 */
export function setApiBaseUrl(newUrl) {
    CONFIG.API_BASE_URL = newUrl;
    console.log(`API base URL updated to: ${newUrl}`);
}
