# Rubik's Cube Interactive Website

A modern, interactive web application for visualizing and manipulating Rubik's cubes with integrated camera capture functionality.

## 🎯 Features

- **Interactive 3D Cube**: Drag to rotate the cube in any direction for full 360° viewing
- **Dual View Modes**: Toggle between 3D perspective and flat net layout
- **Camera Integration**: Real-time camera capture with HSV-based color detection via Python backend
- **Smart Color Detection**: Optimized for low-brightness environments with advanced HSV algorithms
- **Manual Color Editing**: Click stickers to cycle through colors or use the color editor
- **Reset Controls**: Separate reset buttons for cube state and viewing angle
- **Validation System**: Backend validation ensures accurate cube state before import
- **Responsive Design**: Works seamlessly on desktop and mobile devices

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

2. **Install dependencies**
   ```bash
   # Python dependencies (for backend/camera features)
   python -m pip install -r requirements.txt
   
   # Node dependencies (for dev script)
   npm install
   ```

3. **Start the application**
   
   **Option A: Run both frontend and backend together (recommended)**
   ```bash
   npm run dev
   ```
   This will start:
   - Frontend server on http://localhost:8000
   - Backend API on http://localhost:5000
   
   **Option B: Run servers separately**
   ```bash
   # Terminal 1 - Frontend
   npm run frontend
   # or
   python -m http.server 8000
   
   # Terminal 2 - Backend (optional, for camera features)
   npm run backend
   # or
   cd api && python start_backend.py
   ```
   
   **Option C: Frontend only (no camera features)**
   ```bash
   npm start
   # or just open index.html in your browser
   ```

4. **Configure backend (if using camera features)**
   - Backend programs found at [rubiks-cube-solver](https://github.com/Richardbrunei/rubiks-cube-solver)
   - Update `BACKEND_PATH` in `api/backend_api.py` to point to your solver location

## 🎮 Usage

### 3D Cube Interaction
- **Rotate View**: Click and drag on the cube to rotate it in any direction
- **Reset View**: Click the rotation reset button (circular arrow icon) to return to default angle
- **View Switching**: Toggle between 3D and Net views using the view buttons
- **Color Editing**: Click on stickers to cycle through colors (W→Y→R→O→B→G)
- **Reset Cube**: Click the reset button to return cube to solved state (with confirmation)

### Camera Capture Workflow
1. Click the "Camera" button in the interface
2. Select "Launch Camera Program" to start the backend camera
3. Position your cube face in the live preview window
4. Press SPACEBAR to capture each face
5. Follow the on-screen sequence: White → Red → Green → Yellow → Orange → Blue
6. The backend validates and processes the cube state automatically
7. Cube state imports into the frontend once all faces are captured

### Manual Color Editing
- Click individual stickers in either 3D or Net view to cycle colors
- Use the color editor panel for precise color selection
- Switch to Net view for easier bulk editing
- Changes are validated in real-time

## 🏗️ Project Structure

```
cube-solver-website/
├── index.html              # Main application page
├── about.html              # About page
├── package.json            # Project metadata
├── requirements.txt        # Python dependencies
├── scripts/                # JavaScript modules (ES6)
│   ├── main.js            # Application entry point
│   ├── cube-state.js      # Centralized state management
│   ├── cube-renderer.js   # 3D/Net rendering with rotation
│   ├── view-controller.js # View switching logic
│   ├── camera-capture.js  # Backend camera integration
│   ├── cube-importer.js   # Automatic cube state import
│   ├── reset-button.js    # Cube state reset
│   ├── color-editor.js    # Manual color editing
│   ├── validation-button.js # Cube state validation
│   └── config.js          # API configuration
├── styles/                # CSS stylesheets
│   ├── main.css          # Main styles
│   ├── cube.css          # Cube-specific styles
│   ├── camera.css        # Camera interface styles
│   └── responsive.css    # Mobile responsiveness
├── api/                   # Python backend (Flask + OpenCV)
│   ├── README.md         # API documentation
│   ├── start_backend.py  # Backend server startup
│   ├── backend_api.py    # Flask REST API endpoints
│   ├── web_integrated_camera.py # Camera with live preview
│   └── camera_interface_template.py # Camera interface template
├── tests/                 # Test files and summaries
│   ├── test-*.html       # Frontend component tests
│   ├── test_*.py         # Backend API tests
│   ├── check_dependencies.py # Dependency verification
│   └── *-SUMMARY.md      # Implementation documentation
├── docs/                  # Comprehensive documentation
│   ├── API-CONFIGURATION-GUIDE.md # API setup guide
│   ├── BACKEND-API-INTEGRATION-GUIDE.md # Backend integration
│   ├── LIVE-PREVIEW-BACKEND-INTEGRATION.md # Camera setup
│   ├── COLOR-EDITOR-GUIDE.md # Color editing documentation
│   ├── VALIDATION-BUTTON-GUIDE.md # Validation system
│   ├── LOW-BRIGHTNESS-COLOR-DETECTION.md # HSV detection
│   └── LEGACY-CAMERA-DEPRECATION.md # Migration guide
├── Backend_Reference/    # Backend reference implementation
│   ├── BACKEND_README.md # Backend documentation
│   ├── INTEGRATION_GUIDE.md # Integration guide
│   └── back_end_main.py  # Reference backend code
├── web_output/           # Camera program output (JSON)
│   ├── status.json       # Capture status
│   └── cube_state.json   # Detected cube state
└── .kiro/                # Development specs and steering
    ├── specs/            # Feature specifications
    │   ├── rubiks-cube-landing/ # Landing page spec
    │   ├── cubestring-refactor/ # Cubestring implementation
    │   └── cube-3d-rotation/    # 3D rotation feature
    └── steering/         # Project conventions and standards
```

## 🔧 Technical Details

### Frontend Architecture
- **Modular ES6 JavaScript**: Clean separation of concerns with ES6 modules
- **State Pattern**: Centralized `CubeState` class as single source of truth
- **Observer Pattern**: Components subscribe to state changes via listeners
- **Event-Driven**: Custom events for component communication
- **CSS Grid & Flexbox**: Modern responsive layouts
- **No Build Process**: Direct browser execution, no bundler required

### Backend Architecture
- **Flask REST API**: JSON-based endpoints for camera and cube operations
- **OpenCV Integration**: Computer vision for camera access and image processing
- **HSV Color Detection**: Advanced color detection optimized for cube colors
- **Live Preview**: Real-time camera feed with overlay guidance
- **Validation System**: Backend validates cube state before frontend import

### Cube State Format
- **Cubestring**: 54-character string representing cube state
- **Format**: `UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB` (solved state)
- **Face Order**: Up (0-8), Right (9-17), Front (18-26), Down (27-35), Left (36-44), Back (45-53)
- **Notation**: U=White, R=Red, F=Green, D=Yellow, L=Orange, B=Blue

### 3D Rendering & Interaction
- **CSS 3D Transforms**: Hardware-accelerated 3D cube rendering
- **Drag-to-Rotate**: Mouse-based rotation with smooth tracking
- **Rotation Persistence**: View angle preserved across view switches
- **Dual Reset**: Separate controls for cube state and viewing angle
- **Interactive Stickers**: Click handlers with visual feedback

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

### Completed ✅
- [x] 3D drag-to-rotate interaction
- [x] Backend camera integration with live preview
- [x] HSV-based color detection
- [x] Cube state validation system
- [x] Manual color editing
- [x] Dual view modes (3D and Net)
- [x] Rotation reset functionality

### In Progress 🚧
- [ ] Enhanced color editor UI
- [ ] Mobile touch gesture support for rotation

### Planned 📋
- [ ] Cube solving algorithms
- [ ] Animation recording and playback
- [ ] Multiple cube size support (2x2, 4x4, etc.)
- [ ] Cube scrambling functionality
- [ ] Export/import cube configurations
- [ ] Mobile app version
- [ ] Keyboard shortcuts for common actions

## 🐛 Known Issues

- Camera functionality requires Python backend to be running
- Some mobile browsers may have limited 3D transform support
- Color detection accuracy depends on lighting conditions (optimized for low-brightness)
- Touch gestures for rotation not yet implemented (desktop mouse only)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Richard Zou**
- GitHub: [@Richardbrunei](https://github.com/Richardbrunei)

## 🙏 Acknowledgments

- Inspired by classic Rubik's cube solving applications
- Built with modern web technologies and best practices
- OpenCV and NumPy for computer vision capabilities
- Flask for lightweight backend API
- Special thanks to the open-source community

## 📚 Documentation

For detailed documentation, see the `/docs` directory:
- **API Configuration**: `docs/API-CONFIGURATION-GUIDE.md`
- **Backend Integration**: `docs/BACKEND-API-INTEGRATION-GUIDE.md`
- **Camera Setup**: `docs/LIVE-PREVIEW-BACKEND-INTEGRATION.md`
- **Color Detection**: `docs/LOW-BRIGHTNESS-COLOR-DETECTION.md`
- **Validation System**: `docs/VALIDATION-BUTTON-GUIDE.md`

---

**Enjoy solving cubes! 🧩✨**