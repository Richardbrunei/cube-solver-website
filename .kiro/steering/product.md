# Product Overview

Interactive web application for visualizing and manipulating Rubik's cubes with integrated camera capture functionality.

## Core Features

- **3D Cube Visualization**: Interactive 3D Rubik's cube with CSS transforms and smooth animations
- **Net View**: Flat net layout for easier color editing and visualization
- **Camera Integration**: Real-time camera capture with automatic HSV-based color detection via Python backend
- **Reset Functionality**: One-click reset to solved state with confirmation dialog
- **Color Editing**: Manual color editing capabilities for individual stickers
- **Responsive Design**: Works on desktop and mobile devices

## User Workflow

1. User can toggle between 3D and Net views for different visualization modes
2. Camera capture allows scanning physical cube faces (White → Red → Green → Yellow → Orange → Blue sequence)
3. Backend processes images using OpenCV for accurate color detection
4. Cube state automatically syncs between frontend and backend
5. Users can manually edit colors by clicking stickers in either view
6. Reset button returns cube to solved state

## Target Users

Rubik's cube enthusiasts who want to:
- Digitize their physical cube state
- Visualize cube configurations
- Practice solving techniques
- Share cube states
