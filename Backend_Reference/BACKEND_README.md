# Rubik's Cube Color Detection Backend

This backend API provides color detection services for the Rubik's Cube Interactive frontend using OpenCV (CV2) for advanced image processing.

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Backend Server

Option A - Using the startup script:
```bash
python start_backend.py
```

Option B - Direct Flask run:
```bash
python backend_api.py
```

The API will be available at: `http://localhost:5000`

### 3. Test the API

Visit `http://localhost:5000/api/test` in your browser to verify the API is working.

## API Endpoints

### POST /api/detect-colors
Detect colors from an uploaded image.

**Request:**
```json
{
    "image": "base64_encoded_image_data",
    "face": "front|back|left|right|top|bottom"
}
```

**Response:**
```json
{
    "success": true,
    "colors": ["White", "Red", "Green", "Yellow", "Orange", "Blue", "White", "Red", "Green"],
    "cube_notation": ["U", "R", "F", "D", "L", "B", "U", "R", "F"],
    "face": "front",
    "message": "Successfully detected colors for front face"
}
```

### GET /api/health
Health check endpoint.

### GET /api/test
Test endpoint to verify API functionality.

## Integration with Frontend

The frontend camera capture automatically sends images to this backend for color detection. If the backend is unavailable, it falls back to basic client-side color detection.

## Dependencies

- **Flask**: Web framework for the API
- **Flask-CORS**: Cross-origin resource sharing support
- **OpenCV (cv2)**: Computer vision and image processing
- **NumPy**: Numerical computing for image arrays
- **Pillow**: Image processing and format conversion

## Color Detection Algorithm

The backend uses HSV color space analysis to detect Rubik's cube colors:

1. Convert image from BGR to HSV color space
2. Sample colors from a 3x3 grid representing cube stickers
3. Classify colors based on HSV ranges optimized for cube colors
4. Return detected colors in both human-readable and cube notation formats

## Troubleshooting

**Backend not starting:**
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify Python version compatibility (3.7+)

**Camera not connecting to backend:**
- Ensure backend is running on `http://localhost:5000`
- Check browser console for CORS or network errors
- Verify firewall settings allow local connections

**Color detection accuracy:**
- Ensure good lighting conditions
- Position cube face clearly in camera frame
- Consider camera white balance settings