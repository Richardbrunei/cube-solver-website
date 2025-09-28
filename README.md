# Rubik's Cube Interactive Website

A modern, interactive web application for visualizing and manipulating Rubik's cubes with integrated camera capture functionality.

## 🎯 Features

- **3D Cube Visualization**: Interactive 3D Rubik's cube with smooth animations
- **Net View**: Flat net layout for easier color editing
- **Camera Integration**: Real-time camera capture with automatic color detection
- **Reset Functionality**: One-click reset to solved state with confirmation
- **Color Editing**: Manual color editing capabilities (in development)
- **Responsive Design**: Works on desktop and mobile devices

## 📋 Prerequisites

- Modern web browser with JavaScript ES6+ support
- Python 3.7+ (for camera functionality)
- Webcam (for camera capture features)

### Python Dependencies (for camera features)
```bash
pip install opencv-python numpy flask flask-cors
```

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Richardbrunei/cube-solver-website.git
   cd cube-solver-website
   ```

2. **Set up Python backend (optional, for camera features)**
   ```bash
   python -m pip install -r requirements.txt
   ```

3. **Start the backend server (optional)**
   ```bash
   cd api
   python start_backend.py
   ```

4. **Open the web application**
   - Simply open `index.html` in your web browser
   - Or serve it using a local web server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve .
     ```

## 🎮 Usage

### Basic Cube Interaction
- **View Switching**: Toggle between 3D and Net views using the view buttons
- **Cube Manipulation**: Click on stickers to cycle through colors (in 3D mode)
- **Reset**: Click the reset button to return cube to solved state

### Camera Capture
1. Click the "Camera" button
2. Select "Launch Camera Program" 
3. Position your cube face in the camera preview
4. Press SPACEBAR to capture each face
5. Follow the sequence: White → Red → Green → Yellow → Orange → Blue

### Manual Color Editing
- Switch to Net view for easier editing
- Click on individual stickers to change colors
- Use the color palette (when available)

## 🏗️ Project Structure

```
cube-solver-website/
├── index.html              # Main application page
├── about.html              # About page
├── package.json            # Project metadata
├── requirements.txt        # Python dependencies
├── scripts/                # JavaScript modules
│   ├── main.js            # Main application entry point
│   ├── cube-state.js      # Cube state management
│   ├── cube-renderer.js   # 3D/Net rendering engine
│   ├── reset-button.js    # Reset functionality
│   ├── view-controller.js # View switching logic
│   ├── camera-capture.js  # Camera integration
│   └── cube-importer.js   # Cube state import/export
├── styles/                # CSS stylesheets
│   ├── main.css          # Main styles
│   ├── cube.css          # Cube-specific styles
│   ├── camera.css        # Camera interface styles
│   └── responsive.css    # Mobile responsiveness
├── api/                   # Python backend API
│   ├── README.md         # API documentation
│   ├── start_backend.py  # Backend server startup
│   ├── backend_api.py    # Flask API endpoints
│   ├── back_end_main.py  # Core backend functionality
│   ├── web_integrated_camera.py # Camera integration
│   └── camera_interface_template.py # Camera interface
├── tests/                 # Test files and utilities
│   ├── README.md         # Testing documentation
│   ├── test-*.html       # Frontend component tests
│   ├── test_*.py         # Backend API tests
│   └── check_dependencies.py # Dependency verification
├── docs/                  # Documentation files
│   ├── BACKEND_README.md # Backend documentation
│   ├── INTEGRATION_GUIDE.md # Integration guide
│   └── Availible_modules.txt # Available modules list
├── web_output/           # Camera program output
│   ├── status.json       # Capture status
│   └── cube_state.json   # Detected cube state
└── .kiro/                # Development specs
    └── specs/rubiks-cube-landing/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

## 🔧 Technical Details

### Frontend Architecture
- **Modular ES6 JavaScript**: Clean, maintainable code structure
- **CSS Grid & Flexbox**: Modern responsive layouts
- **Web APIs**: Camera access, local storage, animations

### Cube State Management
- **State Pattern**: Centralized cube state with change notifications
- **Observer Pattern**: Components react to state changes automatically
- **Validation**: Comprehensive cube state validation and error handling

### 3D Rendering
- **CSS 3D Transforms**: Hardware-accelerated 3D cube rendering
- **Smooth Animations**: Transition effects and hover states
- **Interactive Elements**: Click handlers and visual feedback

## 🎨 Customization

### Adding New Colors
Edit the `COLORS` object in `scripts/cube-state.js`:
```javascript
this.COLORS = {
    W: '#FFFFFF', // White
    Y: '#FFFF00', // Yellow
    R: '#FF0000', // Red
    O: '#FFA500', // Orange
    B: '#0000FF', // Blue
    G: '#00FF00'  // Green
};
```

### Modifying Cube Appearance
Adjust the 3D transforms and styling in `scripts/cube-renderer.js` and `styles/cube.css`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Roadmap

- [ ] Advanced color editing interface
- [ ] Cube solving algorithms
- [ ] Animation recording and playback
- [ ] Multiple cube size support (2x2, 4x4, etc.)
- [ ] Cube scrambling functionality
- [ ] Export/import cube configurations
- [ ] Mobile app version

## 🐛 Known Issues

- Camera functionality requires Python backend
- Some mobile browsers may have limited 3D transform support
- Color detection accuracy depends on lighting conditions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Richard Zou**
- GitHub: [@Richardbrunei](https://github.com/Richardbrunei)

## 🙏 Acknowledgments

- Inspired by classic Rubik's cube solving applications
- Built with modern web technologies and best practices
- Special thanks to the open-source community for tools and libraries

---

**Enjoy solving cubes! 🧩✨**