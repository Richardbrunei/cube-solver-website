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

# Import backend modules
try:
    from config import COLOR_TO_CUBE
    print("✅ Successfully imported config.py")
    BACKEND_AVAILABLE = True
except ImportError as e:
    print(f"❌ CRITICAL: Could not import config.py: {e}")
    print(f"❌ Backend path: {BACKEND_PATH}")
    print(f"❌ API will not function correctly without backend modules")
    BACKEND_AVAILABLE = False
    COLOR_TO_CUBE = None

# Import camera interface functions
try:
    from camera_interface import show_live_preview, capture_face, edit_face_colors
    print("✅ Successfully imported camera_interface functions")
except ImportError as e:
    print(f"❌ Could not import camera_interface functions: {e}")
    print(f"❌ Camera capture features will not be available")
    show_live_preview = None
    capture_face = None
    edit_face_colors = None

# Import validation functions
try:
    from cube_validation import validate_cube_state, fix_cube_complete
    print("✅ Successfully imported cube_validation functions")
except ImportError as e:
    print(f"❌ Could not import cube_validation functions: {e}")
    print(f"❌ Cube validation features will not be available")
    validate_cube_state = None
    fix_cube_complete = None



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
    if not BACKEND_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Backend modules not available. Please check backend configuration.'
        }), 503

    return jsonify({
        'success': False,
        'error': 'Color detection from image not yet implemented. Use integrated camera capture instead.'
    }), 501

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
    if not BACKEND_AVAILABLE or COLOR_TO_CUBE is None:
        return jsonify({
            'success': False,
            'message': 'Backend modules not available',
            'backend_available': BACKEND_AVAILABLE
        }), 503
    
    return jsonify({
        'success': True,
        'message': 'API is working correctly',
        'backend_available': BACKEND_AVAILABLE,
        'supported_colors': list(COLOR_TO_CUBE.keys()),
        'cube_notation': list(COLOR_TO_CUBE.values())
    })

@app.route('/api/color-mappings', methods=['GET'])
def get_color_mappings():
    """Get color mappings from backend config"""
    if not BACKEND_AVAILABLE or COLOR_TO_CUBE is None:
        return jsonify({
            'success': False,
            'error': 'Backend modules not available. Cannot retrieve color mappings.'
        }), 503
    
    # Create inverse mapping
    cube_to_color = {v: k for k, v in COLOR_TO_CUBE.items()}
    
    return jsonify({
        'success': True,
        'color_to_cube': COLOR_TO_CUBE,
        'cube_to_color': cube_to_color
    })

@app.route('/api/launch-camera', methods=['POST'])
def launch_camera():
    """Launch the existing camera program"""
    if not BACKEND_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Backend modules not available. Cannot launch camera program.'
        }), 503
    
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
    if not BACKEND_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Backend modules not available. Cannot start camera capture.'
        }), 503
    
    if show_live_preview is None or capture_face is None:
        return jsonify({
            'success': False,
            'error': 'Camera interface functions not available. Cannot start camera capture.'
        }), 503
    
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
    if not BACKEND_AVAILABLE or COLOR_TO_CUBE is None:
        print("❌ Backend modules not available")
        update_status("error", "Backend modules not available")
        return
    
    if show_live_preview is None or capture_face is None:
        print("❌ Camera interface functions not available")
        update_status("error", "Camera interface functions not available")
        return
    
    try:
        # Ensure output directory exists
        ensure_output_directory()
        update_status("starting", "Initializing camera system...")
        
        # Initialize camera
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
        
        # Capture loop with spacebar control
        for i, face in enumerate(face_order):
            progress = (i / len(face_order)) * 100
            update_status("ready", f"Ready to capture {face} face ({i+1}/{len(face_order)}) - Press SPACE when ready", progress)
            
            print(f"\n📷 Capturing {face} face...")
            
            try:
                # Use existing live preview function (user presses SPACE to capture)
                if not show_live_preview(cam, face):
                    update_status("cancelled", "Capture cancelled by user")
                    print("Capture cancelled by user")
                    break
                
                # Capture the face after user pressed SPACE
                colors = capture_face(cam)
                print(f"✅ Captured {face} face: {len(colors)} colors detected")
                
            except Exception as e:
                print(f"❌ Failed to capture {face} face: {e}")
                update_status("error", f"Failed to capture {face} face: {str(e)}")
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

        # Process final results
        update_status("processing", "Processing and validating cube state...", 90)
        
        cube_notation_list = [COLOR_TO_CUBE.get(color, "X") for color in cube_state]
        cube_string = "".join(cube_notation_list)
        
        print(f"\n📊 Captured {len(cube_state)}/54 stickers")
        print("🎯 Face capture complete! Preparing for web interface...")
        
        # Apply cube fixes if validation functions are available
        if len(cube_state) == 54 and fix_cube_complete is not None:
            update_status("processing", "Processing captured colors...", 95)
            try:
                fixed_cube_state, face_mapping, rotations_applied, is_valid = fix_cube_complete(cube_state)
                cube_state = fixed_cube_state
                cube_notation_list = [COLOR_TO_CUBE.get(color, "X") for color in cube_state]
                cube_string = "".join(cube_notation_list)
                print("✅ Applied color corrections and face alignment")
            except Exception as e:
                print(f"⚠️ Could not apply fixes: {e} - using raw capture")
        
        # Final validation if available
        final_is_valid = False
        if validate_cube_state is not None:
            try:
                final_is_valid = validate_cube_state(cube_state)
            except Exception as e:
                print(f"⚠️ Could not validate cube: {e}")
        
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