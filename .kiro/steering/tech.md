# Technology Stack

## Frontend

- **Vanilla JavaScript (ES6+)**: Modular architecture with ES6 imports/exports
- **CSS3**: Modern layouts with Grid, Flexbox, and 3D transforms
- **HTML5**: Semantic markup with Web APIs (Camera, Local Storage)
- **No build process**: Direct browser execution, no bundler required

## Backend

**Note: The backend is a separate service that runs independently from the frontend.**

- **Python 3.7+**: Core backend language
- **Flask**: Web framework for REST API
- **Flask-CORS**: Cross-origin resource sharing support
- **OpenCV (cv2)**: Computer vision and camera access
- **NumPy**: Numerical computations for color detection
- **Pillow**: Image processing and format conversion

The backend must be started separately and runs on a different port from the frontend. The frontend communicates with it via REST API calls.

## Architecture Patterns

### Frontend Patterns
- **Modular ES6**: Each component is a separate module with clear responsibilities
- **State Pattern**: Centralized `CubeState` class manages all cube data
- **Observer Pattern**: Components subscribe to state changes via listeners
- **Event-Driven**: Custom events for component communication

### Backend Patterns
- **REST API**: JSON-based endpoints for camera and cube state operations
- **HSV Color Space**: Advanced color detection using HSV ranges optimized for cube colors

## Key Conventions

### Cube State Format
- **Cubestring**: 54-character string representing cube state
- **Format**: `UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB` (solved state)
- **Face Order**: Up (0-8), Right (9-17), Front (18-26), Down (27-35), Left (36-44), Back (45-53)
- **Notation**: U=White, R=Red, F=Green, D=Yellow, L=Orange, B=Blue

### Color Notation
- **Display Notation**: W, Y, R, O, B, G (White, Yellow, Red, Orange, Blue, Green)
- **Backend Notation**: U, R, F, D, L, B (Up, Right, Front, Down, Left, Back)
- **Hex Colors**: Defined in `CubeState.COLORS` object

## Common Commands

### Development Server
```bash
# Start frontend (serves static files)
python -m http.server 8000
# or
npm start

# Start backend API
cd api
python start_backend.py
```

### Dependencies
```bash
# Install Python dependencies
pip install -r requirements.txt

# Check dependencies
python tests/check_dependencies.py
```

### Testing
```bash
# Frontend tests (open in browser)
# tests/test-*.html files

# Backend tests
python tests/test_api.py
python tests/test_backend_import.py
```

## API Endpoints

- `GET /api/camera-status` - Check camera availability
- `POST /api/launch-integrated-camera` - Start camera capture
- `GET /api/color-mappings` - Get color notation mappings
- `GET /web_output/status.json` - Get capture status
- `GET /web_output/cube_state.json` - Get detected cube state

## File Organization

- **scripts/**: Frontend JavaScript modules (ES6)
- **styles/**: CSS stylesheets (modular by feature)
- **api/**: Python backend API and camera integration
- **tests/**: Test files for both frontend and backend
- **docs/**: Documentation and integration guides
- **web_output/**: Camera program output (JSON files)
