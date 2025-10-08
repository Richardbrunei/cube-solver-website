# Implementation Plan

- [x] 1. Remove current face-based architecture completely






- [x] 1.1 Remove face-based storage from CubeState

  - Delete `this.faces` object property
  - Remove `createFace(color)` method entirely
  - Remove all face array initialization code from `initializeSolvedState()`
  - Remove `CUBE_STRING_FACE_MAPPING` constant (no longer needed)
  - _Requirements: 8.1, 8.2_


- [x] 1.2 Remove face-based conversion methods

  - Delete `convertStringToFaceArray(faceString)` method
  - Delete `convertFaceArrayToString(faceArray)` method
  - Delete `convertBackendColorToCubeKey(backendColor)` method (if not used elsewhere)
  - Remove any other face-array specific helper methods
  - _Requirements: 8.1, 8.2_


- [x] 1.3 Remove face-based validation methods

  - Delete `validateFaceStructure()` method
  - Remove face-based validation logic from `isValidState()`
  - Remove face-based checks from `validateCube()`
  - Keep only basic validation structure for now
  - _Requirements: 8.1, 8.2_

- [x] 1.4 Clean up face-based import/export code


  - Remove face-based logic from `importFromCubeString()`
  - Remove face-based logic from `importFromBackendColors()`
  - Remove face-based logic from `importFromBackendData()`
  - Simplify export methods to prepare for cubestring
  - _Requirements: 8.1, 8.2_

- [x] 1.5 Remove face-based state methods


  - Delete `getAllFaceColors()` method if it exists
  - Remove any face-iteration logic that doesn't use cubestring
  - Clean up `getState()` to prepare for cubestring-only state
  - Remove face-based backup/restore logic from `createBackup()` and `restoreFromBackup()`
  - _Requirements: 8.1, 8.2_

- [x] 1.6 Update change notifications structure


  - Remove face-based data from change event payloads
  - Prepare event structure for cubestring-based notifications
  - Keep event listener system intact
  - _Requirements: 8.1, 8.2_

- [x] 2. Add cubestring support to CubeState class





  - Add `cubestring` property to store the 54-character string using backend's COLOR_TO_CUBE format (U, R, F, D, L, B)
  - Implement `getCubestring()` and `setCubestring(cubestring)` methods
  - Implement `isValidCubestring(cubestring)` validation method that checks for valid backend notation
  - Initialize cubestring in constructor with solved state: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2_

- [x] 3. Implement position mapping helper functions











- [x] 3.1 Create string-to-face coordinate conversion

  - Implement `stringPositionToFaceCoords(position)` to convert 0-53 position to {face, row, col}
  - Define face range constants matching backend format (up: 0-8, right: 9-17, front: 18-26, down: 27-35, left: 36-44, back: 45-53)
  - Add validation for position range (0-53)
  - _Requirements: 1.4, 7.3, 7.4_


- [x] 3.2 Create face-to-string position conversion

  - Implement `faceCoordsToStringPosition(face, row, col)` to convert face coordinates to string position
  - Calculate position as face_start + (row * 3 + col)
  - Add validation for face name and row/col ranges
  - _Requirements: 1.4, 7.3, 7.4_


- [x] 3.3 Create face extraction and update helpers

  - Implement `extractFaceString(cubestring, face)` to get 9-character face substring
  - Implement `updateFaceInString(cubestring, face, faceString)` to update face in cubestring
  - Implement `getStickerFromString(position)` to get color at string position
  - Implement `setStickerInString(position, color)` to set color at string position
  - _Requirements: 1.4, 7.3, 7.4_

- [x] 4. Implement conversion helper functions






- [x] 4.1 Create array-to-string conversion

  - Implement `colorArrayToString(colorArray)` to convert 3x3 array to 9-character string
  - Flatten array in row-major order
  - Validate input array structure
  - _Requirements: 7.3, 7.4_

- [x] 4.2 Create string-to-array conversion


  - Implement `stringToColorArray(faceString)` to convert 9-character string to 3x3 array
  - Split string into 3 rows of 3 characters each
  - Validate input string length
  - _Requirements: 7.3, 7.4_

- [x] 5. Implement CubeState methods using cubestring






- [x] 5.1 Implement getFaceColors using cubestring

  - Implement `getFaceColors(facePosition)` to extract face from cubestring
  - Use `extractFaceString()` and `stringToColorArray()` helpers
  - Return 3x3 array format for backward compatibility
  - _Requirements: 2.1, 2.2, 8.1, 8.2_


- [x] 5.2 Implement setFaceColors using cubestring

  - Implement `setFaceColors(facePosition, colors)` to modify cubestring
  - Use `colorArrayToString()` and `updateFaceInString()` helpers
  - Trigger change notifications with cubestring data
  - _Requirements: 2.1, 2.2, 8.1, 8.2_


- [x] 5.3 Implement sticker methods using cubestring

  - Implement `getStickerColor(facePosition, row, col)` to read from cubestring
  - Implement `setStickerColor(facePosition, row, col, color)` to modify cubestring
  - Use `faceCoordsToStringPosition()` for position mapping
  - _Requirements: 5.1, 5.2, 5.3, 8.1, 8.2_


- [x] 5.4 Implement reset method using cubestring

  - Implement `reset()` to set cubestring to solved state
  - Define solved cubestring constant using backend format: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
  - Trigger appropriate change notifications
  - _Requirements: 6.1, 6.2, 6.3, 8.1, 8.2_


- [x] 5.5 Implement state import/export methods

  - Implement `getState()` to include cubestring in exported state
  - Implement `setState(state)` to restore cubestring
  - Implement `importFromCubeString()` to set cubestring directly
  - Implement `exportToCubeString()` to return cubestring directly
  - _Requirements: 1.1, 1.2, 8.1, 8.2_

- [x] 6. Update CubeRenderer to work with cubestring






- [x] 6.1 Update 3D face rendering

  - Modify `create3DFace(facePosition)` to read colors from cubestring via `getFaceColors()`
  - Ensure sticker elements use correct cubestring positions
  - Maintain existing visual appearance
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.1, 8.3_

- [x] 6.2 Update net face rendering


  - Modify `createNetFace(facePosition)` to read colors from cubestring via `getFaceColors()`
  - Ensure sticker elements use correct cubestring positions
  - Maintain existing visual appearance
  - _Requirements: 3.1, 3.2, 3.3, 8.1, 8.3_

- [x] 6.3 Update color update methods


  - Modify `updateFaceColors(facePosition, colors)` to work with cubestring changes
  - Modify `updateStickerColor(facePosition, row, col, color)` to work with cubestring changes
  - Ensure smooth animations and transitions
  - _Requirements: 2.2, 2.4, 3.3, 8.1, 8.3_

- [x] 6.4 Update state change handler



  - Modify `handleStateChange(event)` to handle cubestring-based change events
  - Update event handling for 'faceUpdated' and 'stickerUpdated' events
  - Ensure proper re-rendering when cubestring changes
  - _Requirements: 2.2, 2.4, 8.1, 8.3_

- [x] 7. Update camera capture to modify cubestring





- [x] 7.1 Refactor color application method

  - Update `applyDetectedColors(detectedColors, face)` to modify cubestring
  - Convert detected colors to cubestring notation
  - Use `setFaceColors()` or direct cubestring update for better performance
  - _Requirements: 4.1, 4.2, 4.3, 8.1, 8.3_

- [x] 7.2 Add cubestring conversion helper


  - Create `convertColorsToCubestring(colors, face)` helper method
  - Map backend color names to backend COLOR_TO_CUBE notation (U, R, F, D, L, B)
  - Handle color array to face string conversion using backend format
  - _Requirements: 4.1, 4.2, 4.3_

- [-] 8. Update color editor to modify cubestring



- [ ] 8.1 Update color application
  - Modify `updateColor()` method to update cubestring via `setStickerColor()`
  - Ensure selected sticker position maps correctly to cubestring
  - Maintain existing UI interactions
  - _Requirements: 5.1, 5.2, 5.3, 8.1, 8.3_

- [ ] 8.2 Verify edit mode integration
  - Test that color edits update cubestring correctly
  - Verify changes reflect in both 3D and net views
  - Ensure undo/redo works with cubestring (if implemented)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.1, 8.3_

- [ ] 9. Implement cubestring validation methods
- [ ] 9.1 Implement cubestring format validation
  - Implement `isValidCubestring()` to validate cubestring format
  - Check for exactly 54 characters
  - Check for valid characters only using backend COLOR_TO_CUBE notation (U, R, F, D, L, B)
  - Check each color appears exactly 9 times
  - _Requirements: 7.1, 7.2, 7.3, 8.4_

- [ ] 9.2 Implement validation error reporting
  - Provide detailed error messages for validation failures
  - Report invalid character positions
  - Report color distribution issues
  - Suggest corrections when possible
  - _Requirements: 7.1, 7.2, 7.3, 8.4_

- [ ] 10. Write comprehensive tests for cubestring refactoring
- [ ] 10.1 Write unit tests for cubestring operations
  - Write tests for cubestring initialization with solved state
  - Write tests for position mapping functions with various inputs
  - Write tests for conversion functions (array ↔ string)
  - Write tests for validation with valid and invalid cubestrings
  - Write tests for edge cases (out of range positions, invalid characters)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4, 8.4_

- [ ] 10.2 Write integration tests for rendering with cubestring
  - Write tests to verify 3D view renders correctly from cubestring
  - Write tests to verify net view renders correctly from cubestring
  - Write tests for view switching preserving cubestring state
  - Write tests for color updates reflecting in both views
  - Write tests for sticker selection and highlighting
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 8.1, 8.3_

- [ ] 10.3 Write integration tests for camera integration
  - Write tests for camera capture updating cubestring correctly
  - Write tests for multiple face captures working correctly
  - Write tests to verify detected colors map to correct cubestring positions
  - Write tests that views update after camera capture
  - Write tests for error handling in camera capture
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.1, 8.3_

- [ ] 10.4 Write integration tests for color editor integration
  - Write tests for manual color edits updating cubestring
  - Write tests for edits in 3D view reflecting in net view and vice versa
  - Write tests for multiple sticker edits
  - Write tests to verify edit mode works correctly with cubestring
  - Write tests for color palette selection
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.1, 8.3_

- [ ] 10.5 Write integration tests for reset functionality
  - Write tests for reset button setting cubestring to solved state
  - Write tests to verify reset works in both 3D and net views
  - Write tests for reset after camera capture
  - Write tests for reset after manual edits
  - Write tests for reset confirmation and feedback
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.1, 8.3_

- [ ] 10.6 Write tests for backward compatibility
  - Write tests to verify existing features work unchanged
  - Write tests that external components don't break
  - Write performance tests to verify equal or better performance
  - Run all existing test cases and verify they pass
  - Write regression tests for critical user workflows
  - _Requirements: 8.1, 8.2, 8.3, 8.4_
