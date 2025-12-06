# Design Document

## Overview

This design document outlines the improvements to the color editing workflow in the Rubik's Cube Interactive application. The current implementation follows a "sticker-first" approach where users click a sticker and then select a color. The improved design implements a "color-first" approach similar to paint bucket tools in graphic design applications, where users select a color once and then apply it to multiple stickers in succession.

The key architectural change is inverting the selection flow: instead of maintaining `selectedSticker` as the primary state and applying `selectedColor` to it, we maintain `selectedColor` as the primary state and apply it to any clicked sticker. This provides a more efficient and intuitive editing experience.

## Architecture

### Component Structure

The ColorEditor class remains the primary component responsible for color editing functionality. The architecture follows these principles:

1. **State Management**: ColorEditor maintains selection state (`selectedColor`) and communicates with CubeState for cube data modifications
2. **Event-Driven Communication**: Uses the existing event system (CubeRenderer's `stickerSelected` events) for sticker interactions
3. **UI Separation**: Color palette UI is managed entirely by ColorEditor, keeping rendering concerns separate from state management
4. **Observer Pattern**: CubeState change listeners ensure the renderer updates automatically when colors change

### Data Flow

```
User clicks color button
  → ColorEditor.selectColor(color)
    → Update selectedColor state
    → Update UI to show selection
    
User clicks sticker (with color selected)
  → CubeRenderer fires 'stickerSelected' event
    → ColorEditor.handleStickerSelection(stickerInfo)
      → ColorEditor.applyColorToSticker(stickerInfo)
        → CubeState.setStickerColor(face, row, col, selectedColor)
          → CubeState notifies change listeners
            → CubeRenderer updates visual display

User clicks selected color button again
  → ColorEditor.deselectColor()
    → Clear selectedColor state
    → Update UI to remove selection
```

## Components and Interfaces

### ColorEditor Class

**Modified Properties:**
```javascript
{
  cubeState: CubeState,           // Reference to cube state manager
  cubeRenderer: CubeRenderer,     // Reference to cube renderer
  isEditMode: boolean,            // Whether edit mode is active
  selectedColor: string | null,   // Currently selected color (primary state)
  palette: HTMLElement,           // Color palette DOM element
  availableColors: string[],      // Array of color codes ['U', 'R', 'F', 'D', 'L', 'B']
  colorNames: Object              // Mapping of color codes to display names
}
```

**Modified Methods:**

```javascript
// Color selection (modified behavior)
selectColor(color: string): void
  - If color is already selected, deselect it
  - Otherwise, set as selected color
  - Update UI to show/hide selection indicator
  - No longer automatically applies to sticker

// Color deselection (new method)
deselectColor(): void
  - Clear selectedColor state
  - Remove visual selection indicators
  - Update palette info text

// Sticker interaction (modified behavior)
handleStickerSelection(stickerInfo: Object): void
  - If selectedColor exists, apply it immediately
  - If no selectedColor, do nothing (no selection state change)
  - Do not maintain sticker selection state

// Color application (new method)
applyColorToSticker(stickerInfo: Object): void
  - Validate selectedColor exists
  - Check if color is different from current
  - Call CubeState.setStickerColor()
  - Do not clear selectedColor (persist for next click)

// UI updates (modified)
updatePaletteUI(): void
  - Update color button selection indicators
  - Update info text based on state
  - Show "Select a color" when none selected
  - Show "Click stickers to paint [ColorName]" when color selected
```

### CubeRenderer Integration

No changes required to CubeRenderer. The existing `stickerSelected` event system works perfectly for the new workflow. The renderer continues to:
- Fire `stickerSelected` events when stickers are clicked
- Listen for CubeState changes and update visuals
- Provide `clearSelection()` method (used when edit mode is disabled)

### CubeState Integration

No changes required to CubeState. The existing methods work perfectly:
- `setStickerColor(face, row, col, color)` - Updates cubestring and notifies listeners
- `getStickerColor(face, row, col)` - Retrieves current sticker color
- Change listener system - Notifies renderer of updates

## Data Models

### Color Selection State

```javascript
{
  selectedColor: string | null,  // 'U', 'R', 'F', 'D', 'L', 'B', or null
  isEditMode: boolean            // Whether edit mode is active
}
```

### Sticker Information (from renderer events)

```javascript
{
  face: string,    // 'top', 'right', 'front', 'bottom', 'left', 'back'
  row: number,     // 0-2
  col: number,     // 0-2
  color: string    // Current color code
}
```

### Color Palette UI State

```javascript
{
  buttons: HTMLElement[],        // Array of color button elements
  selectedButton: HTMLElement | null,  // Currently selected button
  infoText: string              // Current info message
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified:
- Property 4.1 is identical to 1.2 (both test visual feedback for selected color)
- Properties about UI rendering (hover states, smooth transitions) are UX concerns better handled by manual testing
- Properties 5.2 and 5.3 can be combined into a single invariant about palette persistence

The following properties represent the unique, testable behaviors:

### Property 1: Color selection state persistence
*For any* color button click, if no color is currently selected, the selectedColor state should be set to that color and remain set until explicitly deselected or edit mode is disabled.
**Validates: Requirements 1.1, 1.4**

### Property 2: Color selection toggle behavior
*For any* color button click, if that color is already selected, the selectedColor state should be cleared (deselected).
**Validates: Requirements 3.1**

### Property 3: Color selection updates correctly
*For any* sequence of color button clicks, the selectedColor state should always match the most recently clicked color (unless it was clicked twice in a row, which deselects it).
**Validates: Requirements 1.3**

### Property 4: Selected color visual indicator
*For any* color selection state, exactly one color button should have the selected CSS class if and only if selectedColor is not null, and that button should correspond to the selectedColor value.
**Validates: Requirements 1.2, 4.1**

### Property 5: Color application to stickers
*For any* sticker click when selectedColor is not null, the sticker's color in the cubestring should be updated to match selectedColor.
**Validates: Requirements 2.1, 2.2**

### Property 6: Multiple sticker painting
*For any* sequence of sticker clicks with a selected color, each sticker should be painted with that color, and the selectedColor should remain unchanged after each application.
**Validates: Requirements 2.3**

### Property 7: No sticker selection persistence
*For any* sticker click with a selected color, after the color is applied, no sticker should maintain a selected state in the UI.
**Validates: Requirements 2.4**

### Property 8: Idempotent color application
*For any* sticker that already has the selected color, clicking it should not trigger a cubestring update or change notification.
**Validates: Requirements 2.5**

### Property 9: No-op without selected color
*For any* sticker click when selectedColor is null, the sticker's color should remain unchanged.
**Validates: Requirements 3.3**

### Property 10: Deselection visual feedback
*For any* color deselection, no color button should have the selected CSS class, and the info text should display the default "Select a color" message.
**Validates: Requirements 3.2, 3.4, 4.2**

### Property 11: Edit mode initialization
*For any* edit mode enable action, the selectedColor should be null (no color pre-selected).
**Validates: Requirements 3.5**

### Property 12: Edit mode cleanup
*For any* edit mode disable action, the selectedColor should be cleared and the palette should be hidden.
**Validates: Requirements 1.5, 5.5**

### Property 13: Palette visibility invariant
*For any* color selection or sticker painting operation while edit mode is enabled, the palette should remain visible and in the same DOM position.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 14: Edit button visual state
*For any* edit mode state, the edit button should have the active CSS class if and only if edit mode is enabled.
**Validates: Requirements 4.5**

## Error Handling

### User Input Validation

1. **Invalid Color Selection**
   - Scenario: User attempts to select a color that doesn't exist
   - Handling: Validate color against `availableColors` array before setting state
   - User Feedback: Console warning (should not occur in normal operation)

2. **Sticker Click Without Edit Mode**
   - Scenario: Sticker click event fires when edit mode is disabled
   - Handling: Early return in `handleStickerSelection` if `!isEditMode`
   - User Feedback: No action taken (expected behavior)

3. **Invalid Sticker Coordinates**
   - Scenario: Sticker event contains invalid face/row/col values
   - Handling: CubeState validation will throw error, catch and log
   - User Feedback: Console error, no state change

### State Consistency

1. **Palette DOM Element Missing**
   - Scenario: Palette element is not found in DOM
   - Handling: Check for null before operations, recreate if necessary
   - User Feedback: Console warning, attempt to recreate palette

2. **CubeState Update Failure**
   - Scenario: `setStickerColor` throws an error
   - Handling: Catch error, log, and maintain previous state
   - User Feedback: Console error, visual state remains unchanged

3. **Event Listener Cleanup**
   - Scenario: ColorEditor is destroyed but listeners remain
   - Handling: Implement cleanup method to remove all event listeners
   - User Feedback: None (internal cleanup)

### Edge Cases

1. **Rapid Color Selection**
   - Scenario: User clicks multiple colors in rapid succession
   - Handling: Each click updates state immediately, last click wins
   - User Feedback: Visual indicator updates with each click

2. **Rapid Sticker Clicking**
   - Scenario: User clicks many stickers quickly
   - Handling: Each click triggers immediate state update
   - User Feedback: Each sticker updates immediately

3. **Edit Mode Toggle During Operation**
   - Scenario: Edit mode disabled while user is painting
   - Handling: Clear all state, hide palette, stop accepting sticker clicks
   - User Feedback: Palette disappears, edit button becomes inactive

## Testing Strategy

### Unit Testing Approach

Unit tests will focus on individual methods and state transitions:

1. **Color Selection Tests**
   - Test `selectColor()` with valid colors
   - Test `selectColor()` with already-selected color (toggle)
   - Test `deselectColor()` clears state correctly

2. **Sticker Application Tests**
   - Test `applyColorToSticker()` updates cubestring
   - Test application with null selectedColor (no-op)
   - Test application to sticker with same color (idempotent)

3. **UI Update Tests**
   - Test `updatePaletteUI()` adds/removes CSS classes correctly
   - Test info text updates based on state
   - Test palette visibility based on edit mode

4. **Mode Management Tests**
   - Test `enableEditMode()` shows palette and initializes state
   - Test `disableEditMode()` hides palette and clears state
   - Test `toggleEditMode()` switches between states correctly

### Property-Based Testing Approach

Property-based tests will use **fast-check** (JavaScript PBT library) to verify universal properties across many randomly generated inputs. Each test will run a minimum of 100 iterations.

1. **Color Selection Properties**
   - Generate random sequences of color selections
   - Verify state consistency after each selection
   - Verify toggle behavior works correctly

2. **Sticker Painting Properties**
   - Generate random sticker coordinates and colors
   - Verify cubestring updates correctly
   - Verify selectedColor persists across applications

3. **State Invariants**
   - Generate random sequences of operations
   - Verify palette visibility invariants
   - Verify no sticker selection persistence

4. **Integration Properties**
   - Generate random edit mode toggles and operations
   - Verify state cleanup on mode changes
   - Verify UI consistency with internal state

### Test Organization

```
tests/
  color-editor/
    unit/
      color-selection.test.js
      sticker-application.test.js
      ui-updates.test.js
      mode-management.test.js
    property/
      color-selection-properties.test.js
      sticker-painting-properties.test.js
      state-invariants.test.js
      integration-properties.test.js
```

### Testing Tools

- **Test Framework**: Jest (already used in project)
- **PBT Library**: fast-check (to be added)
- **DOM Testing**: jsdom (for testing DOM manipulation)
- **Assertions**: Jest's built-in assertions

### Test Data Generators

For property-based testing, we'll need generators for:

```javascript
// Generate random color codes
fc.constantFrom('U', 'R', 'F', 'D', 'L', 'B')

// Generate random face names
fc.constantFrom('top', 'right', 'front', 'bottom', 'left', 'back')

// Generate random sticker coordinates
fc.record({
  face: fc.constantFrom('top', 'right', 'front', 'bottom', 'left', 'back'),
  row: fc.integer({ min: 0, max: 2 }),
  col: fc.integer({ min: 0, max: 2 }),
  color: fc.constantFrom('U', 'R', 'F', 'D', 'L', 'B')
})

// Generate random sequences of operations
fc.array(fc.oneof(
  fc.record({ type: fc.constant('selectColor'), color: colorGen }),
  fc.record({ type: fc.constant('clickSticker'), sticker: stickerGen }),
  fc.record({ type: fc.constant('toggleEditMode') })
))
```

## Implementation Notes

### Key Changes from Current Implementation

1. **Remove `selectedSticker` state** - No longer needed since we don't maintain sticker selection
2. **Modify `selectColor()` to toggle** - Clicking selected color deselects it
3. **Simplify `handleStickerSelection()`** - Just apply color if one is selected, no state management
4. **Remove `updateColor()` method** - Replace with simpler `applyColorToSticker()`
5. **Update info text logic** - Show different messages based on selectedColor state

### Backward Compatibility

This change modifies the user interaction flow but maintains the same public API:
- `enableEditMode()` / `disableEditMode()` / `toggleEditMode()` - unchanged
- `isEnabled()` - unchanged
- Event listeners - unchanged
- CubeState integration - unchanged

The only breaking change is the removal of the `selectedSticker` property, which was internal state not exposed in the public API.

### Performance Considerations

1. **Reduced State Updates** - No longer updating sticker selection state reduces unnecessary re-renders
2. **Idempotent Check** - Checking if color is already applied prevents unnecessary cubestring updates
3. **Event Delegation** - Color palette uses event delegation for button clicks (already implemented)

### Accessibility Considerations

1. **Keyboard Navigation** - Color buttons should be keyboard accessible (tab navigation)
2. **ARIA Labels** - Add `aria-pressed` attribute to selected color button
3. **Screen Reader Feedback** - Update `aria-live` region when color is selected/deselected
4. **Focus Management** - Maintain focus on color button after selection

### Browser Compatibility

No new browser APIs are required. The implementation uses:
- ES6 classes (already used throughout project)
- DOM manipulation (standard APIs)
- CSS classes (standard)
- Event listeners (standard)

Supports all modern browsers (Chrome, Firefox, Safari, Edge).
