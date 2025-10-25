# Design Document

## Overview

This feature adds a solve button to the Rubik's Cube Interactive application that generates step-by-step solving instructions using the Kociemba two-phase algorithm. The implementation follows the existing architecture patterns, reusing the modal UI pattern from the validation button and integrating with the existing CubeState management system.

The solve functionality consists of three main components:
1. **Frontend Module** (`solve-button.js`) - Handles UI interactions and displays solutions
2. **Backend API Endpoint** (`/api/solve-cube`) - Processes solve requests using Kociemba
3. **UI Integration** - Adds the solve button to the existing controls section

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │  index.html    │──────│  solve-button.js │              │
│  │  (Solve Button)│      │  (ES6 Module)    │              │
│  └────────────────┘      └──────────────────┘              │
│           │                       │                          │
│           │                       ▼                          │
│           │              ┌──────────────────┐               │
│           │              │   cube-state.js  │               │
│           │              │  (State Manager) │               │
│           │              └──────────────────┘               │
│           │                       │                          │
└───────────┼───────────────────────┼──────────────────────────┘
            │                       │
            │                       ▼ HTTP POST
            │              ┌──────────────────┐
            │              │  Backend API     │
            │              │  /api/solve-cube │
            │              └──────────────────┘
            │                       │
            │                       ▼
            │              ┌──────────────────┐
            │              │  kociemba.solve()│
            │              │  (Python Library)│
            │              └──────────────────┘
            │                       │
            │                       ▼
            │              ┌──────────────────┐
            │              │  Solution String │
            │              │  "R U R' U' ..." │
            │              └──────────────────┘
            │                       │
            └───────────────────────┘
                    Display in Modal
```

### Data Flow

1. User clicks "Solve" button
2. Frontend validates cube state locally
3. Frontend sends cubestring to `/api/solve-cube`
4. Backend validates cubestring format
5. Backend calls `kociemba.solve(cubestring)`
6. Backend returns solution moves or error
7. Frontend displays solution in modal dialog

## Components and Interfaces

### Frontend Component: SolveButton Class

**File:** `scripts/solve-button.js`

**Responsibilities:**
- Initialize solve button and modal UI
- Handle button click events
- Validate cube state before solving
- Send solve requests to backend API
- Display solution in modal dialog
- Handle errors and loading states

**Public Interface:**

```javascript
class SolveButton {
    constructor(cubeState)
    init()
    handleSolveClick()
    displaySolution(solution, moveCount)
    displayError(message)
    showModal()
    hideModal()
}
```

**Key Methods:**

- `constructor(cubeState)` - Initialize with reference to CubeState instance
- `init()` - Set up DOM references and event listeners
- `handleSolveClick()` - Main handler for solve button clicks
  - Validates cube state
  - Shows loading indicator
  - Calls backend API
  - Displays results or errors
- `displaySolution(solution, moveCount)` - Renders solution in modal
  - Formats moves with proper spacing
  - Shows move count
  - Provides copy-to-clipboard functionality
- `displayError(message)` - Shows error message in modal
- `showModal()` / `hideModal()` - Control modal visibility

### Backend Component: Solve API Endpoint

**File:** `api/backend_api.py`

**Endpoint:** `POST /api/solve-cube`

**Request Format:**
```json
{
    "cubestring": "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBBBB"
}
```

**Success Response:**
```json
{
    "success": true,
    "solution": "R U R' U' R' F R2 U' R' U' R U R' F'",
    "move_count": 14,
    "message": "Solution found successfully"
}
```

**Error Response:**
```json
{
    "success": false,
    "error": "Invalid cube state: incorrect color distribution",
    "details": "Each color must appear exactly 9 times"
}
```

**Implementation Details:**

1. **Input Validation:**
   - Check cubestring length (must be 54 characters)
   - Validate characters (only U, R, F, D, L, B allowed)
   - Verify color distribution (9 of each color)

2. **Kociemba Integration:**
   - Import kociemba library
   - Call `kociemba.solve(cubestring)`
   - Handle exceptions (ValueError for invalid cubes)

3. **Error Handling:**
   - Invalid cubestring format → 400 Bad Request
   - Impossible cube state → 422 Unprocessable Entity
   - Kociemba library error → 500 Internal Server Error
   - Missing kociemba library → 503 Service Unavailable

### UI Component: Solve Modal

**HTML Structure:**

```html
<div class="solve-modal" id="solve-modal" style="display: none;">
    <div class="solve-modal__overlay"></div>
    <div class="solve-modal__content">
        <div class="solve-modal__header">
            <h3 class="solve-modal__title">Cube Solution</h3>
            <button class="solve-modal__close" id="solve-close-btn">×</button>
        </div>
        <div class="solve-modal__body" id="solve-results">
            <!-- Solution will be inserted here -->
        </div>
        <div class="solve-modal__footer">
            <button class="solve-modal__btn solve-modal__btn--copy" id="solve-copy-btn">
                Copy Solution
            </button>
            <button class="solve-modal__btn solve-modal__btn--primary" id="solve-ok-btn">
                OK
            </button>
        </div>
    </div>
</div>
```

**CSS Styling:**

The solve modal will reuse the existing validation modal styles with minor customizations:
- Larger content area for solution display
- Monospace font for move notation
- Color-coded move groups for readability
- Responsive design for mobile devices

## Data Models

### Cubestring Format

**Structure:** 54-character string representing all cube stickers

**Face Order:** U (Up/White) → R (Right/Red) → F (Front/Green) → D (Down/Yellow) → L (Left/Orange) → B (Back/Blue)

**Example (Solved Cube):**
```
UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBBBB
```

**Sticker Positions per Face:**
```
0 1 2
3 4 5
6 7 8
```

### Solution Format

**Structure:** Space-separated move notation string

**Move Notation:**
- `R` - Right face clockwise 90°
- `R'` - Right face counter-clockwise 90°
- `R2` - Right face 180°
- Similar for L, U, D, F, B faces

**Example Solution:**
```
R U R' U' R' F R2 U' R' U' R U R' F'
```

### API Request/Response Models

**Solve Request:**
```typescript
interface SolveRequest {
    cubestring: string;  // 54-character string
}
```

**Solve Response (Success):**
```typescript
interface SolveResponse {
    success: true;
    solution: string;      // Space-separated moves
    move_count: number;    // Number of moves
    message: string;       // Success message
}
```

**Solve Response (Error):**
```typescript
interface SolveErrorResponse {
    success: false;
    error: string;         // Error message
    details?: string;      // Additional details
}
```

## Error Handling

### Frontend Error Handling

1. **Pre-validation Errors:**
   - Empty cube state → "Please set up a cube state first"
   - Invalid cube state → "Cube state is invalid. Please validate first."

2. **Network Errors:**
   - Backend unavailable → "Cannot connect to solver service"
   - Timeout → "Solve request timed out. Please try again."

3. **API Errors:**
   - 400 Bad Request → Display error message from API
   - 422 Unprocessable Entity → "This cube configuration cannot be solved"
   - 500 Internal Server Error → "Solver service error. Please try again."
   - 503 Service Unavailable → "Solver service is not available"

### Backend Error Handling

1. **Input Validation:**
```python
if not cubestring or len(cubestring) != 54:
    return jsonify({
        'success': False,
        'error': 'Invalid cubestring length',
        'details': 'Cubestring must be exactly 54 characters'
    }), 400
```

2. **Kociemba Errors:**
```python
try:
    solution = kociemba.solve(cubestring)
except ValueError as e:
    return jsonify({
        'success': False,
        'error': 'Invalid cube state',
        'details': str(e)
    }), 422
except Exception as e:
    return jsonify({
        'success': False,
        'error': 'Solver error',
        'details': str(e)
    }), 500
```

3. **Library Import Errors:**
```python
try:
    import kociemba
except ImportError:
    # Return 503 Service Unavailable
    return jsonify({
        'success': False,
        'error': 'Kociemba solver not available',
        'details': 'Please install kociemba: pip install kociemba'
    }), 503
```

## Testing Strategy

### Frontend Testing

**Test File:** `tests/test-solve-button.html`

**Test Cases:**

1. **UI Rendering:**
   - Solve button appears in controls section
   - Solve button has correct styling and icon
   - Modal is hidden by default

2. **Button Interactions:**
   - Click solve button triggers solve process
   - Button shows loading state during solve
   - Button is disabled during solve operation

3. **Solution Display:**
   - Solution appears in modal with correct formatting
   - Move count is displayed correctly
   - Copy button copies solution to clipboard
   - Close button hides modal

4. **Error Handling:**
   - Invalid cube state shows error message
   - Backend errors display user-friendly messages
   - Network errors are handled gracefully

### Backend Testing

**Test File:** `tests/test_solve_api.py`

**Test Cases:**

1. **Valid Solve Requests:**
   - Solved cube returns empty solution or "Already solved"
   - Scrambled cube returns valid solution
   - Solution can be verified by applying moves

2. **Invalid Requests:**
   - Missing cubestring returns 400
   - Wrong length cubestring returns 400
   - Invalid characters return 400
   - Impossible cube state returns 422

3. **Error Conditions:**
   - Kociemba not installed returns 503
   - Malformed JSON returns 400

### Integration Testing

**Test Scenarios:**

1. **End-to-End Solve:**
   - Set up scrambled cube
   - Click solve button
   - Verify solution appears
   - Verify solution is valid

2. **Validation Integration:**
   - Validate cube first
   - Then solve cube
   - Verify both work together

3. **State Management:**
   - Solve cube
   - Modify cube state
   - Solve again
   - Verify new solution

## Implementation Notes

### Kociemba Library Installation

Add to `requirements.txt`:
```
kociemba>=1.2.0
```

Install command:
```bash
pip install kociemba
```

### Frontend Module Integration

Update `scripts/main.js`:
```javascript
import { SolveButton } from './solve-button.js';

// Initialize solve button
const solveButton = new SolveButton(cubeState);
```

### CSS Styling Approach

Reuse existing validation modal styles:
- Copy `.validation-modal` styles to `.solve-modal`
- Customize colors for solve-specific elements
- Add monospace font for solution display
- Ensure responsive design

### Performance Considerations

1. **Kociemba Performance:**
   - Typical solve time: 50-200ms
   - No need for caching (fast enough)
   - No timeout needed (always completes quickly)

2. **Frontend Performance:**
   - Minimal DOM manipulation
   - Reuse modal pattern (no new rendering)
   - Efficient event handling

### Accessibility

1. **Keyboard Navigation:**
   - Solve button accessible via Tab
   - Modal closeable with Escape key
   - Focus management in modal

2. **Screen Readers:**
   - ARIA labels on buttons
   - Semantic HTML structure
   - Status announcements for solve results

3. **Visual Design:**
   - High contrast colors
   - Clear button states (hover, active, disabled)
   - Readable font sizes

## Dependencies

### New Dependencies

- **kociemba** (Python library) - Two-phase Rubik's cube solver
  - Version: >=1.2.0
  - License: GPL-3.0
  - Installation: `pip install kociemba`

### Existing Dependencies

- **CubeState** (scripts/cube-state.js) - State management
- **Validation Modal Styles** (styles/validation.css) - UI patterns
- **Backend API** (api/backend_api.py) - API infrastructure
- **Flask** - Web framework (already installed)

## Security Considerations

1. **Input Validation:**
   - Validate cubestring length and characters
   - Prevent injection attacks
   - Sanitize error messages

2. **Rate Limiting:**
   - Consider adding rate limiting for solve endpoint
   - Prevent abuse of solver service

3. **Error Messages:**
   - Don't expose internal system details
   - Provide user-friendly messages
   - Log detailed errors server-side

## Future Enhancements

1. **Solution Animation:**
   - Animate cube applying solution moves
   - Step-by-step visualization
   - Pause/resume controls

2. **Solution Optimization:**
   - Option for optimal vs. fast solutions
   - Multiple solution algorithms
   - Solution comparison

3. **Solution History:**
   - Save previous solutions
   - Export solutions to file
   - Share solutions via URL

4. **Interactive Tutorial:**
   - Explain each move
   - Highlight affected pieces
   - Beginner-friendly mode
