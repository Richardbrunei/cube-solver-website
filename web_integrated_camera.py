"""
Web-Integrated Rubik's Cube Color Detection System

This is a modified version of your camera program that integrates with the web interface.
It outputs results to files that the web interface can automatically read and import.

Based on your back_end_main.py with web integration features added.
"""

import cv2
import json
import os
import time
from datetime import datetime

# Import from your existing modules (adjust paths as needed)
import sys
BACKEND_PATH = r"C:\Users\Liang\OneDrive\Documents\cube_code_backend"
if os.path.exists(BACKEND_PATH):
    sys.path.insert(0, BACKEND_PATH)

try:
    from config import COLOR_TO_CUBE
    from camera_interface import show_live_preview, capture_face, edit_face_colors
    from cube_validation import validate_cube_state, fix_cube_complete
    from cube_display import print_cube_net, print_validation_results
    print("✅ Successfully imported existing backend modules")
except ImportError as e:
    print(f"❌ Could not import backend modules: {e}")
    print("Please ensure your backend modules are available")
    sys.exit(1)

# Web integration settings
WEB_OUTPUT_DIR = "web_output"
CUBE_STATE_FILE = os.path.join(WEB_OUTPUT_DIR, "cube_state.json")
STATUS_FILE = os.path.join(WEB_OUTPUT_DIR, "status.json")

def ensure_output_directory():
    """Create output directory for web integration files"""
    if not os.path.exists(WEB_OUTPUT_DIR):
        os.makedirs(WEB_OUTPUT_DIR)
        print(f"📁 Created output directory: {WEB_OUTPUT_DIR}")

def update_status(status, message, progress=0):
    """Update status file for web interface"""
    status_data = {
        "status": status,
        "message": message,
        "progress": progress,
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        with open(STATUS_FILE, 'w') as f:
            json.dump(status_data, f, indent=2)
        print(f"📊 Status: {status} - {message}")
    except Exception as e:
        print(f"⚠️ Could not update status file: {e}")

def save_cube_state(cube_state, cube_string, is_valid=False):
    """Save cube state to file for web interface"""
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
        print(f"💾 Saved cube state to {CUBE_STATE_FILE}")
        return True
    except Exception as e:
        print(f"❌ Could not save cube state: {e}")
        return False

def main():
    """
    Main program function with web integration
    """
    ensure_output_directory()
    update_status("starting", "Initializing camera system...")
    
    # Initialize camera
    cam = cv2.VideoCapture(0)
    if not cam.isOpened():
        update_status("error", "Camera not accessible. Please check camera connection.")
        print("Error: Camera not accessible. Please check camera connection.")
        return
    
    # Optimize camera settings for performance and quality
    cam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cam.set(cv2.CAP_PROP_FPS, 30)
    cam.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    # Standard cube face order for consistent solving
    face_order = ["White", "Red", "Green", "Yellow", "Orange", "Blue"]
    cube_state = []

    print("=== Web-Integrated Rubik's Cube Color Detection ===")
    print("Capture faces in order:", " → ".join(face_order))
    print(f"📁 Output directory: {WEB_OUTPUT_DIR}")
    print("🌐 Web interface will automatically detect and import results")
    
    update_status("ready", f"Ready to capture {len(face_order)} faces", 0)
    
    # Main capture loop - process each face
    for i, face in enumerate(face_order):
        progress = (i / len(face_order)) * 100
        update_status("capturing", f"Capturing {face} face ({i+1}/{len(face_order)})", progress)
        
        print(f"\n📷 Capturing {face} face...")
        
        # Step 1: Show live preview until user presses SPACE or ESC
        if not show_live_preview(cam, face):
            update_status("cancelled", "Capture cancelled by user")
            print("Capture cancelled by user")
            break
            
        # Step 2: Capture and analyze the face
        colors = capture_face(cam)
        
        # Step 3: Allow user to correct any mistakes
        while True:
            edit_choice = input("Edit colors? (y/n): ").strip().lower()
            if edit_choice in ['y', 'yes']:
                colors = edit_face_colors(face, colors)
                break
            elif edit_choice in ['n', 'no']:
                break
            else:
                print("Please enter 'y' or 'n'")
        
        # Step 4: Store final colors
        cube_state.extend(colors)
        cube_notation = [COLOR_TO_CUBE.get(color, "X") for color in colors]
        print(f"✅ {face}: {''.join(cube_notation)}")
        
        # Save intermediate progress
        if cube_state:
            partial_cube_string = "".join([COLOR_TO_CUBE.get(color, "X") for color in cube_state])
            save_cube_state(cube_state, partial_cube_string, False)

    # Cleanup camera resources
    cam.release()
    cv2.destroyAllWindows()

    if len(cube_state) != 54:
        update_status("incomplete", f"Incomplete capture: {len(cube_state)}/54 stickers")
        print(f"\n⚠️ Incomplete cube state: {len(cube_state)}/54 stickers")
        return

    # Generate final results
    update_status("processing", "Processing and validating cube state...", 90)
    
    cube_notation_list = [COLOR_TO_CUBE.get(color, "X") for color in cube_state]
    cube_string = "".join(cube_notation_list)
    
    print(f"\n📊 Captured {len(cube_state)}/54 stickers")
    print(f"Raw cube string: {cube_string}")
    
    # Complete cube fixing process
    if len(cube_state) == 54:
        print("\n" + "="*60)
        print("CUBE FIXING PROCESS")
        print("="*60)
        
        update_status("fixing", "Applying cube fixes and validation...", 95)
        
        fixed_cube_state, face_mapping, rotations_applied, is_valid = fix_cube_complete(cube_state)
        
        # Show what was done
        if face_mapping:
            reordering_made = any(orig != new for orig, new in face_mapping.items())
            if reordering_made:
                print("✅ Stage 1: Faces reordered by center pieces")
            else:
                print("✅ Stage 1: Face order was already correct")
        
        rotations_made = any(r != 0 for r in rotations_applied)
        if rotations_made:
            face_names = ["White", "Red", "Green", "Yellow", "Orange", "Blue"]
            rotated_faces = [f"{face_names[i]}({rotations_applied[i]}°)" 
                           for i in range(6) if rotations_applied[i] != 0]
            print(f"✅ Stage 2: Rotated faces: {', '.join(rotated_faces)}")
        else:
            print("✅ Stage 2: No face rotations needed")
        
        # Update cube state
        cube_state = fixed_cube_state
        cube_notation_list = [COLOR_TO_CUBE.get(color, "X") for color in cube_state]
        cube_string = "".join(cube_notation_list)
        
        status = "✅" if is_valid else "⚠️"
        print(f"{status} Final result: {'VALID CUBE!' if is_valid else 'Could not create valid cube - best attempt returned'}")
        
        print("="*60)
    
    # Final validation
    final_is_valid = validate_cube_state(cube_state) if len(cube_state) == 54 else False
    
    if len(cube_state) == 54:
        print("\n" + "="*60)
        print("FINAL CUBE VALIDATION")
        print("="*60)
        
        print_validation_results(final_is_valid)
        
        if final_is_valid:
            print("\n🎉 SUCCESS! Cube is valid and captured successfully")
            print(f"Final cube string: {cube_string}")
        else:
            print("\n⚠️ Cube validation failed - but colors have been captured")
            print("You can still use the cube state in the web interface")
            
        print("="*60)
        
        # Display cube net
        print_cube_net(cube_state)
    
    # Save final results for web interface
    success = save_cube_state(cube_state, cube_string, final_is_valid)
    
    if success:
        update_status("complete", f"✅ Cube detection complete! {'Valid' if final_is_valid else 'Invalid'} cube with {len(cube_state)} stickers", 100)
        print(f"\n🌐 Results saved for web interface:")
        print(f"   📄 Cube state: {CUBE_STATE_FILE}")
        print(f"   📊 Status: {STATUS_FILE}")
        print("\n💡 The web interface will automatically import these results!")
    else:
        update_status("error", "Failed to save results for web interface")

# Program entry point
if __name__ == "__main__":
    print("Web-Integrated Rubik's Cube Color Detection System")
    print("=" * 55)
    print("🌐 This version integrates with the web interface")
    print("📁 Results will be saved for automatic import")
    print("=" * 55)
    main()