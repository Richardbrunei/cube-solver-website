# Implementation Plan: Frontend Camera Capture

## Overview

This implementation plan transforms the camera capture workflow from backend-controlled to frontend-controlled. The frontend will handle camera access, image capture, and UI, while the backend provides color detection as a stateless API service.

## Task List

- [x] 1. Remove or deprecate legacy camera code






  - Remove or comment out old `/api/launch-integrated-camera` endpoint usage
  - Remove `CubeImporter` polling for `web_output/` files (if no longer needed)
  - Clean up old camera button handlers that launch external program
  - Update any references to old camera workflow in documentation
  - Keep backend endpoint for backward compatibility but mark as deprecated
  - _Requirements: 1.1, 2.1_
-

- [x] 2. Implement backend color detection API endpoint




  - Create `/api/detect-colors` endpoint in `backend_api.py`
  - Implement base64 image decoding
  - Apply frame preprocessing (mirror, crop, resize to 600x600)
  - Integrate existing HSV color detection from `camera_interface.py`
  - Return JSON response with detected colors and cube notation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Update CameraCapture class with refined modal UI





  - Update `createCameraModal()` to match new design specifications
  - Implement integrated controls bar with face selector and progress indicator
  - Add color display labels to each grid cell (`<span class="cell-color-label"></span>`)
  - Update modal styling to match refined layout (gradient background, better spacing)
  - Ensure grid specifications match backend (300x300px, 40x40px cells, 100px spacing)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 7.1_

- [x] 4. Implement frame processing and image capture





  - Update `captureImageFromVideo()` to match backend preprocessing
  - Implement horizontal mirroring for natural interaction
  - Add square cropping (centered)
  - Resize captured image to 600x600 pixels
  - Convert to base64 JPEG with 80% quality
  - _Requirements: 1.5, 1.6, 4.1_

- [x] 5. Implement color display animation feature





  - Create `displayDetectedColor(position, color, colorName)` method
  - Implement `animateColorDetection(colors)` for sequential animation
  - Add `getContrastColor(hexColor)` helper for text color selection
  - Create `clearGridColors()` to reset grid between captures
  - Apply CSS animations (pulse, pop) to grid cells
  - Update cell backgrounds and labels dynamically
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 6. Integrate backend API communication





  - Update `detectColorsFromImage()` to call new `/api/detect-colors` endpoint
  - Send base64 image data and face name in request
  - Parse JSON response with colors and cube notation
  - Handle success and error responses appropriately
  - Implement timeout handling (5 seconds)
  - _Requirements: 2.6, 5.5, 8.1_

- [x] 7. Implement live color preview feature
  - Implement `startLivePreview()` to continuously sample colors from video
  - Implement `stopLivePreview()` to clean up preview interval
  - Implement `updateLivePreview()` to sample and display colors every 500ms
  - Implement `sampleColorsFromVideo()` to extract RGB values from 9 grid positions
  - Implement `detectColorFromRGB()` for client-side color matching
  - Implement `displayLiveColors()` to update grid with semi-transparent preview
  - Implement `notationToColorName()` to convert notation to human-readable names
  - Auto-start preview when video loads, auto-stop during capture
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. Implement cube state integration
  - Implemented `applyDetectedColors()` to call `cubeState.setFaceColors()`
  - Implemented `convertColorsToCubestring()` to convert backend colors to notation
  - Convert face string to 3x3 array format for cube state
  - Handle face name to cubestring position mapping
  - Cube state updates trigger re-renders automatically
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Implement error handling and fallback mechanisms
  - Implemented `handleCameraError()` for camera access errors
  - Implemented `handleCameraPermissionDenied()` for permission errors
  - Implemented `showErrorMessage()` for user-friendly error display
  - Handle backend unavailable with error response
  - Handle timeout errors (5 second timeout implemented)
  - Preserve cube state on errors (no state changes on failure)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 10. Add CSS styling for refined modal UI
  - Created `styles/camera.css` with complete modal styles
  - Implemented gradient background and modern styling
  - Added button styles (primary, secondary, tertiary)
  - Implemented progress bar styling with gradient fill
  - Added grid cell animations (pulse, pop)
  - Ensured accessibility (focus states, high contrast, reduced motion)
  - Responsive design for mobile and tablet
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1_

- [x] 11. Implement partial keyboard shortcuts
  - Implemented Escape key to close modal
  - ARIA labels added to interactive elements
  - _Requirements: 1.1, 1.2 (partial)_

- [ ] 12. Implement face sequencing and progress tracking
  - Add face sequence array: `['front', 'right', 'back', 'left', 'top', 'bottom']`
  - Track captured faces count (0-6) in class property
  - Update progress bar fill percentage dynamically based on count
  - Auto-advance to next face after successful capture
  - Update face selector dropdown to next face automatically
  - Handle manual face selection (out of order capture)
  - Store captured face data to prevent re-capture
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 7.5_

- [ ] 13. Implement state management and button controls
  - Add state property with values: `ready`, `capturing`, `processing`, `success`, `error`
  - Show/hide buttons based on state (Capture visible in ready, Retake visible after capture)
  - Disable buttons during processing state
  - Update status indicator color dynamically (green=ready, yellow=processing, red=error)
  - Update status text messages for each state transition
  - Implement `setState()` method to centralize state changes
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

- [ ] 14. Add completion workflow and modal close
  - Detect when all 6 faces are captured (progress 6/6)
  - Show completion message and success animation
  - Auto-close modal after 1.5 seconds on completion
  - Trigger cube validation workflow if available
  - Clean up camera resources properly on close
  - _Requirements: 3.4, 8.6_

- [ ] 15. Complete keyboard shortcuts and accessibility
  - Add Enter key to trigger capture when in ready state
  - Implement focus trap in modal (Tab cycles through modal elements only)
  - Add screen reader announcements for status changes using aria-live
  - Ensure all controls are keyboard navigable
  - Test with screen readers (NVDA, JAWS, VoiceOver)
  - _Requirements: 1.1, 1.2_

- [ ] 16. Add image quality validation
  - Check captured image resolution (minimum 320x240)
  - Validate image data before sending to backend
  - Handle low confidence scores from backend (< 70%)
  - Show warning modal for low quality images
  - Offer retake option for poor quality
  - Allow user to proceed anyway with warning acknowledgment
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 17. Implement progressive enhancement for device capabilities
  - Detect camera API support in browser (check `navigator.mediaDevices`)
  - Hide camera button if not supported, show message
  - Use rear camera on mobile (`facingMode: 'environment'`) - already implemented
  - Add camera switching button if multiple cameras available
  - Detect device performance and adjust preview frame rate
  - Implement image compression based on network speed detection
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 18. Expand test suite
  - Create `tests/test-frontend-camera.html` for comprehensive frontend tests
  - Test camera access and permission handling
  - Test image capture and base64 encoding
  - Test face sequencing and progress tracking
  - Test state management transitions
  - Test error handling scenarios
  - Create `tests/test_camera_api.py` for backend tests
  - Test `/api/detect-colors` endpoint with various images
  - Test image preprocessing pipeline accuracy
  - Test color detection accuracy with known cube images
  - Test error responses and edge cases
  - _Requirements: All requirements_

- [ ] 19. Update main application integration
  - Verify camera button click handler in `main.js` works correctly
  - Ensure CameraCapture instance is created with cubeState reference
  - Test integration with existing cube renderer (3D and Net views)
  - Verify cube state updates trigger re-renders in both views
  - Test view switching during camera capture (modal should persist)
  - Test multiple capture sessions in same page load
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 20. Add documentation and user guide
  - Update `README.md` with new camera capture instructions
  - Create user guide for camera positioning and lighting
  - Document face capture sequence and best practices
  - Add troubleshooting section for common issues (permissions, lighting, etc.)
  - Document browser compatibility (Chrome, Firefox, Safari, Edge)
  - Add screenshots of camera interface and workflow
  - Document keyboard shortcuts and accessibility features
  - _Requirements: 7.1, 7.2, 7.3_

