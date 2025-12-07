# Color Editor User Guide

## Overview

The Color Editor provides an intuitive, paint-bucket-style interface for manually editing cube sticker colors. Using a **color-first workflow**, you select a color once and then apply it to multiple stickers, making bulk editing fast and efficient.

## Quick Start

1. Click the **"Edit Colors"** button
2. Click a color from the palette
3. Click stickers on the cube to paint them
4. Click **"Edit Colors"** again when done

## Detailed Workflow

### Step 1: Enable Edit Mode

Click the **"Edit Colors"** button in the controls panel. The button will highlight to show edit mode is active, and a color palette will appear at the bottom of the screen.

**Visual Indicators:**
- Edit button shows active state (highlighted)
- Color palette slides into view
- Info text displays: "Select a color"

### Step 2: Select a Color

Click any color button in the palette to select it:
- **White** (U face)
- **Red** (R face)
- **Green** (F face)
- **Yellow** (D face)
- **Orange** (L face)
- **Blue** (B face)

**Visual Feedback:**
- Selected color button shows a prominent blue border
- Info text updates: "Click stickers to paint [ColorName]"
- Screen readers announce: "[ColorName] color selected. Click stickers to paint."

### Step 3: Paint Stickers

With a color selected, click any sticker on the cube (in either 3D or Net view) to apply the color.

**Key Features:**
- **Persistent Selection**: The color stays selected after each click
- **Paint Multiple**: Click as many stickers as you want without reselecting
- **Instant Feedback**: Stickers update immediately when clicked
- **Smart Behavior**: Clicking a sticker that already has the selected color does nothing (no unnecessary updates)

### Step 4: Change or Deselect Color

**To Switch Colors:**
- Simply click a different color button in the palette
- The new color becomes selected immediately
- Continue painting with the new color

**To Deselect (Stop Painting):**
- Click the currently selected color button again
- The selection indicator disappears
- Info text resets to: "Select a color"
- Clicking stickers now does nothing (prevents accidental changes)

### Step 5: Disable Edit Mode

Click the **"Edit Colors"** button again to exit edit mode.

**What Happens:**
- Color palette slides out of view
- Edit button returns to normal state
- Any selected color is cleared
- Sticker clicks no longer change colors

## Keyboard Navigation

The color editor is fully keyboard accessible:

### Navigation Keys
- **Tab**: Move focus to the color palette
- **Arrow Right / Arrow Down**: Move to next color
- **Arrow Left / Arrow Up**: Move to previous color
- **Home**: Jump to first color (White)
- **End**: Jump to last color (Blue)

### Selection Keys
- **Enter** or **Space**: Select/deselect the focused color

### Focus Indicators
- Focused color button shows a blue outline
- Only one button is tabbable at a time (roving tabindex pattern)

## Screen Reader Support

The color editor provides comprehensive screen reader support:

### ARIA Attributes
- Color palette has `role="toolbar"` and descriptive label
- Each color button has `aria-label` (e.g., "Select White color")
- Selected state indicated with `aria-pressed="true"`
- Color buttons grouped with `role="group"`

### Live Announcements
- Color selection: "White color selected. Click stickers to paint."
- Color deselection: "Color deselected. Select a color to paint stickers."
- Announcements use `aria-live="polite"` for non-intrusive feedback

## Tips & Best Practices

### Efficient Editing
1. **Plan Your Colors**: Think about which stickers need the same color
2. **Select Once, Paint Many**: Take advantage of persistent selection
3. **Use Net View**: Switch to Net view for easier access to all stickers
4. **Deselect When Done**: Click the selected color again to prevent accidental changes

### Avoiding Mistakes
- **Deselect Before Exploring**: Deselect the color before clicking around the cube
- **Visual Confirmation**: Always check the selected color indicator before painting
- **Undo Not Available**: Changes are immediate - be careful with your clicks

### Accessibility
- **Keyboard Users**: Use arrow keys for faster navigation than tabbing
- **Screen Reader Users**: Listen for selection announcements to confirm your choice
- **High Contrast**: Selected color has a prominent 4px blue border for visibility

## Technical Details

### Color Notation
The editor uses backend notation internally:
- **U** = White (Up face)
- **R** = Red (Right face)
- **F** = Green (Front face)
- **D** = Yellow (Down face)
- **L** = Orange (Left face)
- **B** = Blue (Back face)

### State Management
- **Persistent Selection**: Selected color remains active until explicitly changed or edit mode is disabled
- **No Sticker Selection**: Unlike traditional editors, stickers don't stay "selected" after painting
- **Idempotent Operations**: Clicking a sticker with the same color it already has does nothing

### Integration
- **Works in Both Views**: Edit mode works in both 3D and Net views
- **State Synchronization**: Changes update the cubestring immediately
- **Renderer Updates**: The 3D/Net visualization updates automatically via change listeners

## Troubleshooting

### Color Palette Not Appearing
- **Check Edit Mode**: Ensure the "Edit Colors" button is highlighted
- **Browser Compatibility**: Requires modern browser with ES6 support
- **Console Errors**: Open DevTools (F12) and check for JavaScript errors

### Stickers Not Changing Color
- **Select a Color First**: Ensure a color is selected (check for blue border)
- **Edit Mode Active**: Verify the edit button shows active state
- **Valid Sticker**: Ensure you're clicking on an actual sticker element

### Keyboard Navigation Not Working
- **Focus the Palette**: Tab to the color palette first
- **Browser Focus**: Ensure the browser window has focus
- **JavaScript Enabled**: Verify JavaScript is enabled in your browser

### Screen Reader Issues
- **ARIA Support**: Ensure your screen reader supports ARIA live regions
- **Browser Compatibility**: Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
- **Announcements Delayed**: Live region announcements may have a slight delay

## Comparison: Old vs New Workflow

### Old Workflow (Sticker-First)
1. Click a sticker
2. Select a color from palette
3. Repeat for each sticker

**Drawbacks:**
- Required 2 clicks per sticker
- Tedious for bulk editing
- Easy to lose track of which sticker was selected

### New Workflow (Color-First) ✨
1. Select a color
2. Click multiple stickers
3. Change color when needed

**Benefits:**
- Only 1 click per sticker after initial selection
- Much faster for bulk editing
- Clear visual feedback of selected color
- More intuitive (like a paint bucket tool)

## Accessibility Compliance

The color editor meets **WCAG 2.1 Level AA** standards:

- ✅ **1.3.1 Info and Relationships**: Proper semantic structure with ARIA
- ✅ **2.1.1 Keyboard**: Full keyboard navigation support
- ✅ **2.4.3 Focus Order**: Logical focus order with roving tabindex
- ✅ **2.4.7 Focus Visible**: Clear focus indicators (3px blue outline)
- ✅ **4.1.2 Name, Role, Value**: All elements have accessible names and roles
- ✅ **4.1.3 Status Messages**: Live region for dynamic announcements

## Related Documentation

- **README.md**: General application usage
- **Backend Integration**: `docs/BACKEND-API-INTEGRATION-GUIDE.md`
- **API Configuration**: `docs/API-CONFIGURATION-GUIDE.md`
- **Mobile Optimization**: `docs/MOBILE-PERFORMANCE-OPTIMIZATIONS.md`

## Feature Specifications

For developers interested in the implementation details:
- **Requirements**: `.kiro/specs/color-editor-workflow-improvement/requirements.md`
- **Design**: `.kiro/specs/color-editor-workflow-improvement/design.md`
- **Tasks**: `.kiro/specs/color-editor-workflow-improvement/tasks.md`

---

**Need Help?** Check the troubleshooting section above or open an issue on GitHub.
