# Rubik's Cube API Backend

This folder contains the Python backend API for camera integration and cube state management.

## 📁 Files Overview

### Core API Files
- **`start_backend.py`** - Main backend server startup script
- **`backend_api.py`** - Flask API endpoints and routes
- **`back_end_main.py`** - Core backend functionality

### Camera Integration
- **`web_integrated_camera.py`** - Camera capture integration for web interface
- **`camera_interface_template.py`** - Template for camera interface implementation

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r ../requirements.txt
   ```

2. **Start the Backend Server**
   ```bash
   python start_backend.py
   ```

3. **API Endpoints**
   - `GET /api/camera-status` - Check camera availability
   - `POST /api/launch-integrated-camera` - Start camera capture
   - `GET /web_output/status.json` - Get capture status
   - `GET /web_output/cube_state.json` - Get detected cube state

## 🔧 Configuration

The backend server runs on `localhost:5000` by default. CORS is enabled for web interface integration.

## 📋 Dependencies

- **Flask** - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **OpenCV** - Computer vision and camera access
- **NumPy** - Numerical computations for color detection

## 🎯 Camera Capture Workflow

1. User clicks camera button in web interface
2. Backend launches camera capture program
3. User positions cube faces and presses SPACEBAR to capture
4. Backend processes images and detects colors
5. Cube state is automatically imported to web interface

## 🔍 API Response Format

### Camera Status Response
```json
{
  "camera_available": true,
  "backend_available": true,
  "status": "ready"
}
```

### Cube State Response
```json
{
  "faces": {
    "front": [["W","W","W"],["W","W","W"],["W","W","W"]],
    "right": [["R","R","R"],["R","R","R"],["R","R","R"]],
    // ... other faces
  },
  "timestamp": "2025-09-28T08:43:00Z",
  "valid": true
}
```

## 🛠️ Development

For development and testing, see the files in the `../tests/` directory.

## 🔒 Security Notes

- Backend only accepts connections from localhost
- No sensitive data is stored or transmitted
- Camera access requires user permission