# Integration Guide: Connecting API to Your Existing Backend

This guide explains how to connect the web API to your existing CV2 backend modules.

## Current Status

The `backend_api.py` is set up to automatically detect and use your existing backend modules. It will:
1. Try to import your existing modules (`config.py`, `camera_interface.py`, etc.)
2. Use your actual color detection algorithms if available
3. Fall back to basic detection if modules aren't found

## Integration Steps

### Step 1: Install Dependencies

First, check what's already installed:
```bash
python check_dependencies.py
```

Then install missing packages:
```bash
pip install -r requirements.txt
```

Or install individually if needed:
```bash
pip install Flask Flask-CORS opencv-python numpy Pillow requests
```

### Step 2: Verify Backend Path

Your backend path is configured as: `C:\Users\Liang\OneDrive\Documents\cube_code_backend`

The API will automatically import from this directory. No need to copy files!

### Step 3: Test Backend Import

First, test if we can access your backend modules:
```bash
python test_backend_import.py
```

This will show you:
- ✅ Which modules were found and imported successfully
- ⚠️ What functions might be missing
- 📁 What files are available in your backend directory

### Step 4: Add Missing Function (if needed)

If the test shows that `capture_face_from_image` is missing, add it to your `camera_interface.py`:

```python
def capture_face_from_image(image):
    """
    Analyze a static image to detect cube face colors
    Adapts your existing capture_face function for uploaded images
    
    Args:
        image: OpenCV image (numpy array) from web interface
    
    Returns:
        list: 9 detected colors ['White', 'Red', 'Green', ...]
    """
    # Use your existing color detection logic here
    # See camera_interface_template.py for detailed example
    pass
```

### Step 5: Test the API Integration

1. Start the backend API:
   ```bash
   python backend_api.py
   ```

2. Test the API:
   ```bash
   python test_api.py
   ```

3. Check the console output:
   - ✅ "Successfully imported config.py" = Your modules are accessible
   - ✅ "Successfully imported capture_face_from_image function" = Full integration ready
   - ⚠️ "capture_face_from_image function not found" = Need to add the function

### Step 4: Test with Frontend

1. Open `test-interactivity.html` in your browser
2. Click "Test Backend" to verify API connectivity
3. Click "Test Camera" to test the full integration

## Alternative Integration Methods

### Method A: Direct Integration (Recommended)
Follow steps 1-3 above to use your existing modules directly.

### Method B: Subprocess Integration
If you prefer not to modify your existing code, you can:
1. Create a wrapper script that calls your existing backend
2. Modify `backend_api.py` to use subprocess calls
3. Parse the output from your existing program

### Method C: Separate Backend Service
Keep your existing backend as-is and:
1. Run your backend on a different port
2. Modify the frontend to call your existing backend directly
3. Update the API URL in `camera-capture.js`

## Troubleshooting

### Import Errors
If you get import errors:
1. Ensure all your backend files are in the same directory as `backend_api.py`
2. Check that all dependencies are installed
3. Verify file names match the import statements

### Color Detection Issues
If colors aren't detected correctly:
1. Check that your `capture_face_from_image` function is working
2. Verify the image format (should be BGR numpy array)
3. Test with known good images

### API Connection Issues
If the frontend can't connect:
1. Ensure the backend is running on `http://localhost:5000`
2. Check for CORS errors in browser console
3. Verify firewall settings allow local connections

## File Structure After Integration

```
project/
├── backend_api.py              # Flask API (modified to use your modules)
├── config.py                   # Your existing config
├── camera_interface.py         # Your existing interface (with new function)
├── cube_validation.py          # Your existing validation
├── cube_display.py            # Your existing display
├── back_end_main.py           # Your existing main program
├── scripts/
│   └── camera-capture.js      # Frontend camera interface
└── styles/
    └── camera.css             # Camera styling
```

## Next Steps

1. **Copy your backend modules** to this directory
2. **Add the capture_face_from_image function** to your camera_interface.py
3. **Test the integration** using the steps above
4. **Customize as needed** for your specific requirements

Need help with any of these steps? Let me know which approach you'd prefer and I can provide more specific guidance!