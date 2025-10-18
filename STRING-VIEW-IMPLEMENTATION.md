# String View Implementation

## Overview
Added a third view option to the Rubik's Cube Interactive application that allows users to view and edit the raw 54-character cubestring representation.

## Changes Made

### New Files Created
1. **scripts/string-view.js** - StringView class for rendering and managing the string editor
2. **styles/string-view.css** - Styles for the string view interface
3. **tests/test-string-view.html** - Test page for the string view

### Modified Files
1. **index.html**
   - Added "String View" button to view controls
   - Included string-view.css stylesheet

2. **scripts/view-controller.js**
   - Added 'string' to valid view types
   - Added `switchToString()` method
   - Added string view settings (transition duration, optimizations)
   - Updated view switching logic to handle string view

3. **scripts/cube-renderer.js**
   - Added `renderStringView()` method
   - Dynamically imports StringView when needed

4. **styles/main.css**
   - Updated view-controls to support three buttons with flex-wrap

## Features

### String View Interface
- **Display Section**: Shows current cubestring with color-coded characters and face separators
- **Editor Section**: Textarea for editing the cubestring with character counter
- **Validation**: Real-time validation of cubestring format
  - Checks for correct length (54 characters)
  - Validates characters (U, R, F, D, L, B only)
  - Warns if color counts are incorrect (each should appear 9 times)
- **Actions**:
  - Apply Changes: Updates the cube state with new cubestring
  - Copy to Clipboard: Copies cubestring for sharing
  - Reset to Current: Reverts editor to current cube state
- **Legend**: Visual guide showing color notation and face order

### Color Coding
Characters are color-coded to match their cube colors:
- U (White) - White background with border
- R (Red) - Red background
- F (Green) - Green background
- D (Yellow) - Yellow background
- L (Orange) - Orange background
- B (Blue) - Blue background

### Format
Cubestring format: `UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB`
- Face Order: Up (0-8), Right (9-17), Front (18-26), Down (27-35), Left (36-44), Back (45-53)
- Each face has 9 stickers, reading left-to-right, top-to-bottom

## Usage

1. Click "String View" button to switch to string view
2. View the current cubestring in the display section
3. Edit the cubestring in the textarea
4. Click "Apply Changes" to update the cube
5. Switch back to 3D or Net view to see the changes

## Technical Details

### Dynamic Loading
The StringView class is loaded dynamically when first accessed to optimize initial page load.

### State Management
- StringView integrates with CubeState for seamless updates
- Listens for cube state changes (reset, cubeStringChanged events)
- Changes in string view are reflected in 3D and Net views
- Validation ensures only valid cubestrings are applied
- Tracks editing state to prevent overwriting user input

### Reset Button Integration
- String view automatically updates when reset button is clicked
- Display and input fields refresh to show solved state
- Validation messages are cleared on external updates
- Editing state prevents updates while user is typing

### Responsive Design
- Mobile-friendly layout with adjusted font sizes
- Grid layout adapts to smaller screens
- Touch-friendly buttons and inputs

## Testing
- `tests/test-string-view.html` - Test string view in isolation
- `tests/test-string-view-reset.html` - Test reset button integration with string view
