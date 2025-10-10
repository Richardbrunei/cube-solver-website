# Color Editor User Guide

## Overview

The Color Editor allows you to manually edit individual sticker colors on the Rubik's cube. It integrates seamlessly with the cubestring-based state management system and works in both 3D and net views.

## How to Use

### Enabling Edit Mode

1. Click the **🎨 Edit Colors** button in the control panel
2. The color palette will appear on the right side of the screen (or bottom on mobile)
3. The edit button will highlight to show edit mode is active

### Editing a Sticker

There are two ways to edit a sticker:

**Method 1: Sticker First**
1. Click any sticker on the cube
2. The sticker will highlight with a blue border
3. Click a color from the palette
4. The sticker updates immediately

**Method 2: Color First**
1. Click a color from the palette
2. The color button will highlight
3. Click any sticker on the cube
4. The sticker updates immediately

### Color Palette

The palette includes all six standard Rubik's cube colors:
- **White** (W) - Up face
- **Yellow** (Y) - Down face
- **Red** (R) - Right face
- **Orange** (O) - Left face
- **Blue** (B) - Back face
- **Green** (G) - Front face

### View Switching

You can edit stickers in either view:
- **3D View**: Rotate and edit the cube in 3D space
- **Net View**: Edit the flat unfolded cube layout

Changes made in one view are immediately reflected in the other view.

### Disabling Edit Mode

1. Click the **🎨 Edit Colors** button again
2. The color palette will disappear
3. The edit button will return to normal state

## Tips

- **Quick Edits**: Select a color first, then click multiple stickers to apply the same color quickly
- **Visual Feedback**: Selected stickers show a blue border, selected colors show a highlight
- **View Preference**: Use 3D view for spatial understanding, net view for easier access to all faces
- **Undo**: Currently no undo feature - use the Reset button to start over if needed

## Technical Details

### Cubestring Integration

The color editor updates the cube state using the cubestring format:
- Each edit calls `cubeState.setStickerColor(face, row, col, color)`
- This updates the 54-character cubestring
- Changes propagate automatically to both views
- Backend notation is used (U, R, F, D, L, B)

### Event Flow

```
User Action → Sticker Selection → Color Selection → Cubestring Update → View Refresh
```

### Keyboard Shortcuts

Currently no keyboard shortcuts are implemented. This may be added in a future update.

## Troubleshooting

### Color palette not appearing
- Make sure edit mode is enabled (button should be highlighted)
- Check browser console for errors
- Try refreshing the page

### Sticker not updating
- Ensure both a sticker and color are selected
- Check that edit mode is enabled
- Verify the cube is interactive (not during a transition)

### Changes not visible in other view
- This should not happen - if it does, it's a bug
- Try switching views manually
- Check browser console for errors

## Browser Compatibility

The color editor works in all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

Requires JavaScript ES6 module support.

## Future Enhancements

Planned features for future versions:
- Undo/redo functionality
- Keyboard shortcuts for colors
- Batch editing (entire face at once)
- Custom color picker
- Edit history
- Validation warnings for invalid cube states

## Developer API

If you're integrating the color editor programmatically:

```javascript
// Enable edit mode
colorEditor.enableEditMode();

// Disable edit mode
colorEditor.disableEditMode();

// Toggle edit mode
colorEditor.toggleEditMode();

// Check if edit mode is enabled
const isEnabled = colorEditor.isEnabled();

// Select a color programmatically
colorEditor.selectColor('R'); // Red

// Handle sticker selection programmatically
colorEditor.handleStickerSelection({
    face: 'front',
    row: 1,
    col: 1,
    color: 'G'
});

// Update color (applies selected color to selected sticker)
colorEditor.updateColor();
```

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review the test suite at `tests/test-color-editor.html`
3. See implementation details in `tests/TASK8-IMPLEMENTATION-SUMMARY.md`
