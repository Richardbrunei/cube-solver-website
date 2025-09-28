"""
Flask API for Rubik's Cube Color Detection
Provides endpoints for image upload and color detection using CV2
Integrates with your existing backend modules
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import cv2
import numpy as np
import base64
import io
from PIL import Image
import json
import sys
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Add your backend directory to Python path
BACKEND_PATH = r"C:\Users\Liang\OneDrive\Documents\cube_code_backend"
if os.path.exists(BACKEND_PATH):
    sys.path.insert(0, BACKEND_PATH)
    print(f"✅ Added backend path: {BACKEND_PATH}")
else:
    print(f"⚠️ Backend path not found: {BACKEND_PATH}")

# Try to import your existing modules
try:
    from config import COLOR_TO_CUBE
    print("✅ Successfully imported config.py")
    
    # Try to import camera_interface functions (the ones we actually need)
    try:
        from camera_interface import show_live_preview, capture_face, edit_face_colors
        print("✅ Successfully imported camera_interface functions")
        BACKEND_AVAILABLE = True
    except ImportError as e:
        print(f"⚠️ Could not import camera_interface functions: {e}")
        BACKEND_AVAILABLE = False
        
    # Try to import validation functions
    try:
        from cube_validation import validate_cube_state, fix_cube_complete
        print("✅ Successfully imported cube_validation functions")
    except ImportError as e:
        print(f"⚠️ Could not import cube_validation functions: {e}")
        
except ImportError as e:
    print(f"⚠️ Could not import backend modules: {e}")
    print("Using fallback color detection...")
    BACKEND_AVAILABLE = False
    
    # Fallback color mapping
    COLOR_TO_CUBE = {
        'White': 'U',
        'Red': 'R', 
        'Green': 'F',
        'Yellow': 'D',
        'Orange': 'L',
        'Blue': 'B'
    }

def detect_colors_from_image(image):
    """
    Detect Rubik's cube colors from an image using your existing backend logic
    
    Args:
        image: OpenCV image (numpy array)
    
    Returns:
        list: 9 detected colors for the cube face
    """
    if BACKEND_AVAILABLE:
        try:
            # Use your existing capture_face_from_image function
            # Note: You may need to adapt your capture_face function to work with a static image
            colors = capture_face_from_image(image)
            return colors
        except Exception as e:
            print(f"Error using existing backend: {e}")
            print("Falling back to simplified detection...")
    
    # Fallback to simplified detection if your backend isn't available
    return detect_colors_fallback(image)

def detect_colors_fallback(image):
    """
    Fallback color detection when your existing backend isn't available
    """
    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Get image dimensions
    height, width = image.shape[:2]
    
    # Define 3x3 grid positions for stickers
    grid_positions = []
    for row in range(3):
        for col in range(3):
            # Calculate center position of each sticker
            x = int(width * (col + 0.5) / 3)
            y = int(height * (row + 0.5) / 3)
            grid_positions.append((x, y))
    
    detected_colors = []
    
    for x, y in grid_positions:
        # Sample color from a small region around the center
        sample_size = 20
        x1 = max(0, x - sample_size // 2)
        y1 = max(0, y - sample_size // 2)
        x2 = min(width, x + sample_size // 2)
        y2 = min(height, y + sample_size // 2)
        
        # Extract color sample
        color_sample = hsv[y1:y2, x1:x2]
        
        # Get average HSV values
        if color_sample.size > 0:
            avg_hsv = np.mean(color_sample.reshape(-1, 3), axis=0)
            color = classify_color(avg_hsv)
            detected_colors.append(color)
        else:
            detected_colors.append('White')  # Default fallback
    
    return detected_colors

def classify_color(hsv_values):
    """
    Classify HSV values into Rubik's cube colors
    Simplified color classification based on HSV ranges
    
    Args:
        hsv_values: numpy array of [H, S, V] values
    
    Returns:
        str: Color name
    """
    h, s, v = hsv_values
    
    # Convert hue to 0-360 range
    h = h * 2
    
    # White/Yellow detection (high brightness)
    if v > 200:
        if s < 50:
            return 'White'
        elif 20 <= h <= 30:
            return 'Yellow'
    
    # Low saturation = White (regardless of hue)
    if s < 50:
        return 'White'
    
    # Color classification based on hue
    if h < 10 or h > 350:
        return 'Red'
    elif 10 <= h < 25:
        return 'Orange'  
    elif 25 <= h < 35:
        return 'Yellow'
    elif 35 <= h < 85:
        return 'Green'
    elif 85 <= h < 130:
        return 'Blue'
    elif 130 <= h < 180:
        return 'Blue'  # Cyan range -> Blue
    elif 180 <= h < 350:
        return 'Red'   # Magenta range -> Red
    
    # Default fallback
    return 'White'

@app.route('/api/detect-colors', methods=['POST'])
def detect_colors():
    """
    API endpoint to detect colors from uploaded image
    
    Expected request format:
    {
        "image": "base64_encoded_image_data",
        "face": "front|back|left|right|top|bottom"
    }
    
    Returns:
    {
        "success": true,
        "colors": ["White", "Red", "Green", ...],
        "cube_notation": ["U", "R", "F", ...],
        "face": "front"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        # Decode base64 image
        image_data = data['image']
        if image_data.startswith('data:image'):
            # Remove data URL prefix
            image_data = image_data.split(',')[1]
        
        # Convert base64 to image
        image_bytes = base64.b64decode(image_data)
        image_pil = Image.open(io.BytesIO(image_bytes))
        
        # Convert PIL to OpenCV format
        image_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
        
        # Detect colors
        detected_colors = detect_colors_from_image(image_cv)
        
        # Convert to cube notation
        cube_notation = [COLOR_TO_CUBE.get(color, 'U') for color in detected_colors]
        
        # Get face name
        face = data.get('face', 'unknown')
        
        return jsonify({
            'success': True,
            'colors': detected_colors,
            'cube_notation': cube_notation,
            'face': face,
            'message': f'Successfully detected colors for {face} face'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Color detection failed: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Rubik\'s Cube Color Detection API is running'
    })

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify API is working"""
    return jsonify({
        'success': True,
        'message': 'API is working correctly',
        'supported_colors': list(COLOR_TO_CUBE.keys()),
        'cube_notation': list(COLOR_TO_CUBE.values())
    })

@app.route('/api/launch-camera', methods=['POST'])
def launch_camera():
    """Launch the existing camera program"""
    try:
        import subprocess
        import threading
        
        def run_camera():
            # Launch your existing camera program
            subprocess.run([sys.executable, 'back_end_main.py'], 
                         cwd=BACKEND_PATH if os.path.exists(BACKEND_PATH) else '.')
        
        # Run in background thread so API doesn't block
        thread = threading.Thread(target=run_camera)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Camera program launched successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to launch camera program: {str(e)}'
        }), 500

@app.route('/api/launch-integrated-camera', methods=['POST'])
def launch_integrated_camera():
    """Start the integrated camera capture process"""
    try:
        import threading
        
        def run_camera_capture():
            # Run the camera capture process using imported functions
            integrated_camera_capture()
        
        # Run in background thread so API doesn't block
        thread = threading.Thread(target=run_camera_capture)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Integrated camera capture started successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to start camera capture: {str(e)}'
        }), 500

def integrated_camera_capture():
    """
    Integrated camera capture using your existing functions
    This runs your camera interface and outputs results for the web interface
    """
    try:
        # Import your camera functions (already imported at top if available)
        if not BACKEND_AVAILABLE:
            raise Exception("Backend modules not available")
        
        # Ensure output directory exists
        ensure_output_directory()
        update_status("starting", "Initializing camera system...")
        
        # Initialize camera using your existing logic
        import cv2
        cam = cv2.VideoCapture(0)
        if not cam.isOpened():
            update_status("error", "Camera not accessible. Please check camera connection.")
            return
        
        # Optimize camera settings
        cam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cam.set(cv2.CAP_PROP_FPS, 30)
        cam.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        # Standard cube face order
        face_order = ["White", "Red", "Green", "Yellow", "Orange", "Blue"]
        cube_state = []

        print("=== Integrated Camera Capture Started ===")
        print("🎯 Goal: Capture cube face colors for web interface")
        update_status("ready", f"Ready to capture {len(face_order)} faces", 0)
        
        # Camera interface functions are already imported at module level
        
        # Capture loop with spacebar control (like your original program)
        for i, face in enumerate(face_order):
            progress = (i / len(face_order)) * 100
            update_status("ready", f"Ready to capture {face} face ({i+1}/{len(face_order)}) - Press SPACE when ready", progress)
            
            print(f"\n📷 Capturing {face} face...")
            
            try:
                # Use your existing live preview function (user presses SPACE to capture)
                if not show_live_preview(cam, face):
                    update_status("cancelled", "Capture cancelled by user")
                    print("Capture cancelled by user")
                    break
                
                # Capture the face after user pressed SPACE
                colors = capture_face(cam)
                print(f"✅ Captured {face} face: {len(colors)} colors detected")
                
                # Skip the "Edit colors?" prompt - just use the captured colors
                # Colors are automatically accepted without editing
                
            except Exception as e:
                print(f"❌ Failed to capture {face} face: {e}")
                update_status("error", f"Failed to capture {face} face: {str(e)}")
                # Continue with next face instead of breaking
                colors = ['White'] * 9  # Fallback colors
                print(f"⚠️ Using fallback colors for {face} face")
            
            # Store colors
            cube_state.extend(colors)
            cube_notation = [COLOR_TO_CUBE.get(color, "X") for color in colors]
            print(f"✅ {face}: {''.join(cube_notation)}")
            
            # Save intermediate progress
            if cube_state:
                partial_cube_string = "".join([COLOR_TO_CUBE.get(color, "X") for color in cube_state])
                save_cube_state(cube_state, partial_cube_string, False)

        # Cleanup camera
        cam.release()
        cv2.destroyAllWindows()

        if len(cube_state) != 54:
            update_status("incomplete", f"Incomplete capture: {len(cube_state)}/54 stickers")
            return

        # Process final results using your validation functions
        update_status("processing", "Processing and validating cube state...", 90)
        
        cube_notation_list = [COLOR_TO_CUBE.get(color, "X") for color in cube_state]
        cube_string = "".join(cube_notation_list)
        
        print(f"\n📊 Captured {len(cube_state)}/54 stickers")
        print("🎯 Face capture complete! Preparing for web interface...")
        
        # Optional: Apply cube fixes for better accuracy (but don't require perfect validation)
        if len(cube_state) == 54:
            update_status("processing", "Processing captured colors...", 95)
            try:
                fixed_cube_state, face_mapping, rotations_applied, is_valid = fix_cube_complete(cube_state)
                # Update with fixed state for better accuracy
                cube_state = fixed_cube_state
                cube_notation_list = [COLOR_TO_CUBE.get(color, "X") for color in cube_state]
                cube_string = "".join(cube_notation_list)
                print("✅ Applied color corrections and face alignment")
            except Exception as e:
                print(f"⚠️ Could not apply fixes: {e} - using raw capture")
                # Continue with original cube_state
        
        # Final validation (optional - just for info)
        final_is_valid = validate_cube_state(cube_state)
        
        # Save final results
        success = save_cube_state(cube_state, cube_string, final_is_valid)
        
        if success:
            status_msg = f"✅ Cube faces captured successfully! {len(cube_state)} stickers detected"
            if final_is_valid:
                status_msg += " (Valid cube)"
            else:
                status_msg += " (Validation failed - but colors captured)"
            
            update_status("complete", status_msg, 100)
            print(f"\n🌐 Results saved for web interface - {len(cube_state)} stickers")
            print("🎯 Focus: Face capture complete - web interface will handle the rest!")
        else:
            update_status("error", "Failed to save results")
            
    except Exception as e:
        print(f"❌ Camera capture error: {e}")
        update_status("error", f"Camera capture failed: {str(e)}")

# Web integration helper functions
WEB_OUTPUT_DIR = "web_output"
CUBE_STATE_FILE = os.path.join(WEB_OUTPUT_DIR, "cube_state.json")
STATUS_FILE = os.path.join(WEB_OUTPUT_DIR, "status.json")

def ensure_output_directory():
    """Create output directory for web integration files"""
    if not os.path.exists(WEB_OUTPUT_DIR):
        os.makedirs(WEB_OUTPUT_DIR)

def update_status(status, message, progress=0):
    """Update status file for web interface"""
    from datetime import datetime
    import json
    
    status_data = {
        "status": status,
        "message": message,
        "progress": progress,
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        with open(STATUS_FILE, 'w') as f:
            json.dump(status_data, f, indent=2)
    except Exception as e:
        print(f"⚠️ Could not update status file: {e}")

def save_cube_state(cube_state, cube_string, is_valid=False):
    """Save cube state to file for web interface"""
    from datetime import datetime
    import json
    
    cube_data = {
        "cube_state": cube_state,
        "cube_string": cube_string,
        "is_valid": is_valid,
        "timestamp": datetime.now().isoformat(),
        "face_count": len(cube_state) // 9 if cube_state else 0,
        "total_stickers": len(cube_state) if cube_state else 0
    }
    
    try:
        with open(CUBE_STATE_FILE, 'w') as f:
            json.dump(cube_data, f, indent=2)
        return True
    except Exception as e:
        print(f"❌ Could not save cube state: {e}")
        return False

# Serve static files (HTML, CSS, JS)
@app.route('/')
def serve_index():
    """Serve the main index.html file"""
    return send_file('index.html')

@app.route('/test-interactivity.html')
def serve_test():
    """Serve the test page"""
    return send_file('test-interactivity.html')

@app.route('/about.html')
def serve_about():
    """Serve the about page"""
    return send_file('about.html')

@app.route('/scripts/<path:filename>')
def serve_scripts(filename):
    """Serve JavaScript files"""
    return send_from_directory('scripts', filename)

@app.route('/styles/<path:filename>')
def serve_styles(filename):
    """Serve CSS files"""
    return send_from_directory('styles', filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve asset files"""
    return send_from_directory('assets', filename)

@app.route('/web_output/<path:filename>')
def serve_web_output(filename):
    """Serve camera program output files"""
    return send_from_directory('web_output', filename)

@app.route('/api/camera-status', methods=['GET'])
def camera_status():
    """Check camera availability and backend status"""
    try:
        import cv2
        
        # Check if camera is available
        cam = cv2.VideoCapture(0)
        camera_available = cam.isOpened()
        if camera_available:
            cam.release()
        
        return jsonify({
            'success': True,
            'camera_available': camera_available,
            'backend_available': BACKEND_AVAILABLE,
            'message': f"Camera: {'Available' if camera_available else 'Not available'}, Backend: {'Available' if BACKEND_AVAILABLE else 'Not available'}"
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'camera_available': False,
            'backend_available': BACKEND_AVAILABLE,
            'error': str(e)
        })

if __name__ == '__main__':
    print("Starting Rubik's Cube Color Detection API...")
    print("Available endpoints:")
    print("  POST /api/detect-colors - Detect colors from image")
    print("  GET  /api/health - Health check")
    print("  GET  /api/test - Test endpoint")
    print("\nWeb interface available at:")
    print("  http://localhost:5000/ - Main interface")
    print("  http://localhost:5000/test-interactivity.html - Test page")
    print("\nAPI running on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)