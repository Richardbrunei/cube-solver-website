#!/usr/bin/env python3
"""
Check which dependencies are installed and which need to be installed
"""

import sys

def check_package(package_name, import_name=None):
    """Check if a package is installed"""
    if import_name is None:
        import_name = package_name
    
    try:
        __import__(import_name)
        print(f"✅ {package_name} - INSTALLED")
        return True
    except ImportError:
        print(f"❌ {package_name} - NOT INSTALLED")
        return False

def main():
    """Check all required dependencies"""
    print("🔍 Checking Dependencies for Rubik's Cube API")
    print("=" * 50)
    
    # Check required packages
    packages = [
        ("Flask", "flask"),
        ("Flask-CORS", "flask_cors"),
        ("OpenCV", "cv2"),
        ("NumPy", "numpy"),
        ("Pillow", "PIL"),
        ("Requests", "requests")  # For testing
    ]
    
    installed = []
    missing = []
    
    for package_name, import_name in packages:
        if check_package(package_name, import_name):
            installed.append(package_name)
        else:
            missing.append(package_name)
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    if installed:
        print(f"✅ Installed ({len(installed)}): {', '.join(installed)}")
    
    if missing:
        print(f"❌ Missing ({len(missing)}): {', '.join(missing)}")
        print("\n💡 To install missing packages:")
        print("Option 1 - Install all at once:")
        print("   pip install -r requirements.txt")
        print("\nOption 2 - Install individually:")
        for package in missing:
            if package == "Flask-CORS":
                print("   pip install Flask-CORS")
            elif package == "OpenCV":
                print("   pip install opencv-python")
            elif package == "Pillow":
                print("   pip install Pillow")
            else:
                print(f"   pip install {package}")
    else:
        print("🎉 All dependencies are installed!")
        print("\n💡 You can now run:")
        print("   python backend_api.py")
    
    print(f"\nPython version: {sys.version}")

if __name__ == "__main__":
    main()