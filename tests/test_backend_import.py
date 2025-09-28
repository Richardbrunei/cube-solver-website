#!/usr/bin/env python3
"""
Test script to verify we can import your existing backend modules
"""

import sys
import os

# Add your backend directory to Python path
BACKEND_PATH = r"C:\Users\Liang\OneDrive\Documents\cube_code_backend"

def test_backend_import():
    """Test importing your backend modules"""
    print("🔍 Testing Backend Module Import")
    print("=" * 50)
    
    # Check if backend directory exists
    if not os.path.exists(BACKEND_PATH):
        print(f"❌ Backend directory not found: {BACKEND_PATH}")
        print("Please verify the path is correct.")
        return False
    
    print(f"✅ Backend directory found: {BACKEND_PATH}")
    
    # Add to Python path
    sys.path.insert(0, BACKEND_PATH)
    print("✅ Added to Python path")
    
    # List files in backend directory
    try:
        files = os.listdir(BACKEND_PATH)
        python_files = [f for f in files if f.endswith('.py')]
        print(f"📁 Python files found: {python_files}")
    except Exception as e:
        print(f"❌ Error listing files: {e}")
        return False
    
    # Test importing each module
    modules_to_test = [
        'config',
        'camera_interface', 
        'cube_validation',
        'cube_display'
    ]
    
    imported_modules = []
    
    for module_name in modules_to_test:
        try:
            module = __import__(module_name)
            print(f"✅ Successfully imported: {module_name}")
            imported_modules.append(module_name)
            
            # Check for specific attributes/functions
            if module_name == 'config':
                if hasattr(module, 'COLOR_TO_CUBE'):
                    print(f"   - Found COLOR_TO_CUBE mapping")
                else:
                    print(f"   - ⚠️ COLOR_TO_CUBE not found")
                    
            elif module_name == 'camera_interface':
                functions = [attr for attr in dir(module) if callable(getattr(module, attr)) and not attr.startswith('_')]
                print(f"   - Available functions: {functions}")
                
                if hasattr(module, 'capture_face_from_image'):
                    print(f"   - ✅ capture_face_from_image function found")
                else:
                    print(f"   - ⚠️ capture_face_from_image function not found (you'll need to add this)")
                    
        except ImportError as e:
            print(f"❌ Failed to import {module_name}: {e}")
        except Exception as e:
            print(f"❌ Error with {module_name}: {e}")
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    if imported_modules:
        print(f"✅ Successfully imported: {imported_modules}")
        
        if 'config' in imported_modules and 'camera_interface' in imported_modules:
            print("🎉 Core modules available! API integration should work.")
            
            # Check if capture_face_from_image exists
            try:
                import camera_interface
                if hasattr(camera_interface, 'capture_face_from_image'):
                    print("✅ Ready for full integration!")
                    return True
                else:
                    print("⚠️ Need to add capture_face_from_image function to camera_interface.py")
                    print("   See camera_interface_template.py for guidance")
                    return True  # Still partially ready
            except:
                pass
        else:
            print("⚠️ Missing core modules. API will use fallback detection.")
    else:
        print("❌ No modules could be imported. Check the backend path.")
        
    return len(imported_modules) > 0

if __name__ == "__main__":
    success = test_backend_import()
    
    if success:
        print("\n💡 Next steps:")
        print("1. Run 'python backend_api.py' to start the API")
        print("2. Test with 'python test_api.py' or open the web interface")
        if 'capture_face_from_image' not in str(success):
            print("3. Add capture_face_from_image function to camera_interface.py")
    else:
        print("\n💡 Troubleshooting:")
        print("1. Verify the backend path is correct")
        print("2. Check that Python files exist in the backend directory")
        print("3. Ensure no import dependencies are missing")