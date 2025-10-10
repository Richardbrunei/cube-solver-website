# Requirements Document

## Introduction

This feature transforms the camera capture workflow from a backend-controlled process to a frontend-controlled process. Currently, the system launches a Python backend camera program that captures images and processes colors. The new approach will capture images directly in the browser using the Web Camera API, then send those images to the backend for color extraction only. This provides better user experience with real-time feedback, eliminates the need to launch external programs, and gives users more control over the capture process.

## Requirements

### 1. Frontend Camera Capture

**User Story:** As a user, I want to capture cube face images directly in my browser, so that I have immediate visual feedback and control over the capture process.

#### Acceptance Criteria

1. WHEN the user clicks the camera button THEN the system SHALL display a live camera preview in the browser
2. WHEN the camera preview is active THEN the system SHALL show a visual guide overlay to help position the cube face
3. WHEN the visual guide is displayed THEN the system SHALL clearly show 9 sampling areas corresponding to the 9 stickers on the cube face
4. WHEN the user positions the cube THEN the system SHALL overlay a 3x3 grid showing exactly where colors will be detected
5. WHEN the user clicks the capture button THEN the system SHALL capture a still image from the video stream
6. WHEN an image is captured THEN the system SHALL display the captured image with the sampling grid overlay for confirmation
7. IF the user is not satisfied with the captured image THEN the system SHALL allow retaking the photo
8. WHEN the user confirms the captured image THEN the system SHALL proceed to send it to the backend for color extraction

### 2. Backend Color Extraction API

**User Story:** As a developer, I want a backend API endpoint that accepts images and returns detected colors, so that the frontend can handle the capture workflow independently.

#### Acceptance Criteria

1. WHEN the backend receives a POST request to `/api/detect-colors` with an image THEN the system SHALL decode the base64 image data
2. WHEN the image is decoded THEN the system SHALL apply the existing HSV color detection algorithm
3. WHEN colors are detected THEN the system SHALL return a JSON response with the 9 detected colors for the face
4. IF color detection fails THEN the system SHALL return an error response with a descriptive message
5. WHEN colors are successfully detected THEN the response SHALL include both color names (White, Red, etc.) and cube notation (U, R, F, D, L, B)
6. WHEN processing the image THEN the system SHALL complete within 2 seconds for responsive user experience

### 3. Face Selection and Sequencing

**User Story:** As a user, I want to select which cube face I'm capturing, so that the system correctly maps colors to the cube state.

#### Acceptance Criteria

1. WHEN the camera interface opens THEN the system SHALL display a face selector dropdown with all 6 faces
2. WHEN the user selects a face THEN the system SHALL update the visual guide to show which face is being captured
3. WHEN a face is successfully captured THEN the system SHALL automatically advance to the next face in the sequence
4. WHEN all 6 faces are captured THEN the system SHALL close the camera interface and update the cube visualization
5. IF the user wants to capture faces out of order THEN the system SHALL allow manual face selection at any time
6. WHEN the user closes the camera interface THEN the system SHALL preserve any already-captured faces

### 4. Image Quality and Validation

**User Story:** As a user, I want the system to validate image quality before processing, so that I get accurate color detection results.

#### Acceptance Criteria

1. WHEN an image is captured THEN the system SHALL check for minimum resolution requirements (at least 320x240)
2. WHEN an image is captured THEN the system SHALL check for adequate lighting conditions
3. IF image quality is insufficient THEN the system SHALL display a warning message with suggestions for improvement
4. WHEN the user confirms a low-quality image THEN the system SHALL still allow processing but warn about potential inaccuracy
5. WHEN the backend detects poor color confidence THEN the system SHALL return confidence scores with the results
6. IF confidence is below 70% THEN the frontend SHALL suggest retaking the photo

### 5. Error Handling and Fallback

**User Story:** As a user, I want clear error messages when camera capture fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN camera access is denied THEN the system SHALL display instructions for enabling camera permissions
2. WHEN no camera is detected THEN the system SHALL display a message and suggest using manual color editing
3. WHEN the backend is unavailable THEN the system SHALL display an error and suggest checking the backend connection
4. WHEN network errors occur THEN the system SHALL allow retry with exponential backoff
5. IF the backend times out THEN the system SHALL cancel the request after 5 seconds and display an error
6. WHEN any error occurs THEN the system SHALL preserve the current cube state and not corrupt existing data

### 6. Progressive Enhancement

**User Story:** As a user on different devices, I want the camera feature to work optimally on my device, so that I get the best experience regardless of platform.

#### Acceptance Criteria

1. WHEN the user is on a mobile device THEN the system SHALL use the rear-facing camera by default
2. WHEN the user is on a desktop THEN the system SHALL use the default webcam
3. IF multiple cameras are available THEN the system SHALL allow the user to switch between cameras
4. WHEN the browser doesn't support camera access THEN the system SHALL hide the camera button and show manual editing only
5. WHEN the device has limited processing power THEN the system SHALL reduce preview frame rate to maintain performance
6. WHEN the user has a slow network connection THEN the system SHALL compress images before sending to reduce bandwidth

### 7. User Feedback and Progress

**User Story:** As a user, I want to see progress and status updates during capture, so that I know the system is working and what to do next.

#### Acceptance Criteria

1. WHEN the camera is initializing THEN the system SHALL display a loading indicator
2. WHEN an image is being sent to the backend THEN the system SHALL display a processing indicator
3. WHEN colors are being detected THEN the system SHALL show a "Detecting colors..." message
4. WHEN a face is successfully captured THEN the system SHALL show a success message with the face name
5. WHEN multiple faces are being captured THEN the system SHALL display progress (e.g., "3 of 6 faces captured")
6. IF any step takes longer than expected THEN the system SHALL display a "Still processing..." message to prevent user confusion

### 8. Integration with Existing Cube State

**User Story:** As a user, I want captured colors to immediately update my cube visualization, so that I can see the results in real-time.

#### Acceptance Criteria

1. WHEN colors are successfully detected for a face THEN the system SHALL immediately update the cube state
2. WHEN the cube state is updated THEN the system SHALL trigger a re-render of both 3D and Net views
3. WHEN updating the cube state THEN the system SHALL use the existing `CubeState.setFaceColors()` method
4. WHEN colors are applied THEN the system SHALL convert backend notation (U, R, F, D, L, B) to the correct cubestring positions
5. IF the user switches views during capture THEN the system SHALL maintain the camera interface and continue the process
6. WHEN all faces are captured THEN the system SHALL trigger the cube validation workflow if available
