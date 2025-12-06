# Implementation Plan

- [x] 1. Update ColorEditor core logic for color-first workflow





  - Modify `selectColor()` method to implement toggle behavior (deselect if already selected)
  - Remove `selectedSticker` property and related state management
  - Simplify `handleStickerSelection()` to only apply color when selectedColor exists
  - Replace `updateColor()` with new `applyColorToSticker()` method
  - Add `deselectColor()` method for explicit deselection
  - _Requirements: 1.1, 1.3, 1.4, 3.1_

- [ ]* 1.1 Write property test for color selection state persistence
  - **Property 1: Color selection state persistence**
  - **Validates: Requirements 1.1, 1.4**

- [ ]* 1.2 Write property test for color selection toggle behavior
  - **Property 2: Color selection toggle behavior**
  - **Validates: Requirements 3.1**

- [ ]* 1.3 Write property test for color selection updates
  - **Property 3: Color selection updates correctly**
  - **Validates: Requirements 1.3**

- [x] 2. Update color palette UI logic




  - Modify `updatePaletteUI()` to handle selection/deselection states
  - Update info text to show "Select a color" when none selected
  - Update info text to show "Click stickers to paint [ColorName]" when color selected
  - Ensure only one color button has selected class at a time
  - Remove sticker info display (no longer needed)
  - _Requirements: 1.2, 3.2, 3.4, 4.2_

- [ ]* 2.1 Write property test for selected color visual indicator
  - **Property 4: Selected color visual indicator**
  - **Validates: Requirements 1.2, 4.1**

- [ ]* 2.2 Write property test for deselection visual feedback
  - **Property 10: Deselection visual feedback**
  - **Validates: Requirements 3.2, 3.4, 4.2**

- [x] 3. Implement sticker painting logic





  - Create `applyColorToSticker()` method that applies selectedColor to clicked sticker
  - Add validation to check if selectedColor exists before applying
  - Add idempotent check to skip update if sticker already has selectedColor
  - Ensure selectedColor persists after application (don't clear it)
  - Remove sticker selection state management
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 3.1 Write property test for color application to stickers
  - **Property 5: Color application to stickers**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 3.2 Write property test for multiple sticker painting
  - **Property 6: Multiple sticker painting**
  - **Validates: Requirements 2.3**

- [ ]* 3.3 Write property test for no sticker selection persistence
  - **Property 7: No sticker selection persistence**
  - **Validates: Requirements 2.4**

- [ ]* 3.4 Write property test for idempotent color application
  - **Property 8: Idempotent color application**
  - **Validates: Requirements 2.5**

- [x] 4. Implement guard conditions and no-op behavior





  - Add check in `handleStickerSelection()` to return early if selectedColor is null
  - Ensure no state changes occur when clicking stickers without selected color
  - Add validation for invalid color selections
  - Add error handling for invalid sticker coordinates
  - _Requirements: 3.3_

- [ ]* 4.1 Write property test for no-op without selected color
  - **Property 9: No-op without selected color**
  - **Validates: Requirements 3.3**

- [x] 5. Update edit mode management





  - Modify `enableEditMode()` to ensure selectedColor starts as null
  - Modify `disableEditMode()` to clear selectedColor and hide palette
  - Update `toggleEditMode()` to properly initialize/cleanup state
  - Ensure palette visibility is managed correctly
  - _Requirements: 1.5, 3.5, 5.1, 5.5_

- [ ]* 5.1 Write property test for edit mode initialization
  - **Property 11: Edit mode initialization**
  - **Validates: Requirements 3.5**

- [ ]* 5.2 Write property test for edit mode cleanup
  - **Property 12: Edit mode cleanup**
  - **Validates: Requirements 1.5, 5.5**

- [ ]* 5.3 Write property test for palette visibility invariant
  - **Property 13: Palette visibility invariant**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 6. Update main.js integration










  - Verify `handleEditClick()` works with new toggle behavior
  - Update placeholder message to reflect new workflow
  - Ensure edit button active state is managed correctly
  - Test integration with CubeRenderer sticker selection events
  - _Requirements: 4.5_

- [ ]* 6.1 Write property test for edit button visual state
  - **Property 14: Edit button visual state**
  - **Validates: Requirements 4.5**

- [x] 7. Add CSS styles for color palette





  - Create `.color-palette` styles for positioning and layout
  - Create `.color-palette__color-btn--selected` styles for visual feedback
  - Add hover states for color buttons
  - Ensure palette doesn't obstruct cube visualization
  - Add smooth transitions for palette show/hide
  - _Requirements: 5.4_

- [ ]* 7.1 Write unit tests for UI state consistency
  - Test that CSS classes are applied correctly
  - Test that info text updates correctly
  - Test that palette visibility matches edit mode state
  - _Requirements: 1.2, 3.2, 4.2, 5.1, 5.5_

- [x] 8. Add accessibility improvements















  - Add `aria-pressed` attribute to color buttons
  - Add `aria-live` region for color selection announcements
  - Ensure keyboard navigation works for color palette
  - Add focus management for color button selection
  - Test with screen readers
  - _Requirements: 4.1, 4.2_

- [ ]* 8.1 Write unit tests for accessibility features
  - Test ARIA attributes are set correctly
  - Test keyboard navigation works
  - Test focus management
  - _Requirements: 4.1, 4.2_

- [x] 9. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Manual testing and refinement
  - Test complete workflow: enable edit mode → select color → paint multiple stickers → deselect → disable edit mode
  - Test edge cases: rapid clicking, mode toggling during operation
  - Test in different browsers (Chrome, Firefox, Safari, Edge)
  - Verify visual feedback is clear and intuitive
  - Test with keyboard-only navigation
  - _Requirements: All_
