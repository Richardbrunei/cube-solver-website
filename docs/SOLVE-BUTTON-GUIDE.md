# Cube Solver Integration Guide

## Overview

The Cube Solver feature provides step-by-step solving instructions for any valid Rubik's cube configuration using the Kociemba two-phase algorithm. This guide covers the implementation, API usage, and integration details.

## Features

- **Kociemba Algorithm**: Uses the two-phase algorithm to find near-optimal solutions (typically 20 moves or less)
- **Standard Notation**: Solutions provided in standard cube notation (R, L, U, D, F, B with modifiers)
- **Pre-validation**: Validates cube state before attempting to solve
- **Error Handling**: User-friendly error messages for invalid cube states
- **Copy to Clipboard**: Easy solution copying for reference
- **Modal Display**: Clean, readable solution presentation

## Architecture

### Frontend Component

**File**: `scripts/solve-button.js`

The `SolveButton` class handles all frontend solve functionality:

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

### Backend API Endpoint

**Endpoint**: `POST /api/solve-cube`

**Location**: `api/backend_api.py`

## API Documentation

### Request Format

```http
POST /api/solve-cube
Content-Type: application/json

{
    "cubestring": "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBBBB"
}
```

**Parameters**:
- `cubestring` (string, required): 54-character string representing the cube state
  - Format: UUUUUUUUU RRRRRRRRR FFFFFFFFF DDDDDDDDD LLLLLLLLL BBBBBBBBB
  - Face order: Up, Right, Front, Down, Left, Back
  - Each face: 9 stickers in row-major order (top-left to bottom-right)

### Success Response

```json
{
    "success": true,
    "solution": "R U R' U' R' F R2 U' R' U' R U R' F'",
    "move_count": 14,
    "message": "Solution found successfully"
}
```

**Fields**:
- `success` (boolean): Always `true` for successful responses
- `solution` (string): Space-separated sequence of moves in standard notation
- `move_count` (integer): Total number of moves in the solution
- `message` (string): Success message

### Error Responses

#### Invalid Cubestring Format (400 Bad Request)

```json
{
    "success": false,
    "error": "Invalid cubestring length",
    "details": "Cubestring must be exactly 54 characters"
}
```

#### Invalid Cube State (422 Unprocessable Entity)

```json
{
    "success": false,
    "error": "Invalid cube state",
    "details": "There is not exactly one facelet of each colour"
}
```

#### Backend Service Unavailable (503 Service Unavailable)

```json
{
    "success": false,
    "error": "Kociemba solver not available",
    "details": "Please install kociemba: pip install kociemba"
}
```

## Cube Notation Reference

### Basic Moves

- **R**: Right face clockwise 90°
- **L**: Left face clockwise 90°
- **U**: Up face clockwise 90°
- **D**: Down face clockwise 90°
- **F**: Front face clockwise 90°
- **B**: Back face clockwise 90°

### Modifiers

- **'** (prime): Counter-clockwise 90° (e.g., `R'`)
- **2**: 180° turn (e.g., `R2`)

### Example Solution

```
R U R' U' R' F R2 U' R' U' R U R' F'
```

This represents:
1. R - Right clockwise
2. U - Up clockwise
3. R' - Right counter-clockwise
4. U' - Up counter-clockwise
5. ... and so on

## Installation

### Python Dependencies

Add to `requirements.txt`:
```
kociemba>=1.2.0
```

Install:
```bash
pip install kociemba
```

### Frontend Integration

Import and initialize in `scripts/main.js`:

```javascript
import { SolveButton } from './solve-button.js';

// Initialize with CubeState instance
const solveButton = new SolveButton(cubeState);
```

## Usage

### User Workflow

1. **Set up cube state**: Use camera capture or manual editing to configure the cube
2. **Click Solve button**: Located at the bottom of the controls section
3. **View solution**: Solution appears in a modal dialog with move count
4. **Copy solution**: Click "Copy Solution" to copy moves to clipboard
5. **Follow moves**: Apply the moves to your physical cube to solve it

### Programmatic Usage

```javascript
// Get cube state
const cubestring = cubeState.getCubestring();

// Send solve request
const response = await fetch('http://localhost:5000/api/solve-cube', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cubestring })
});

const data = await response.json();

if (data.success) {
    console.log(`Solution: ${data.solution}`);
    console.log(`Moves: ${data.move_count}`);
} else {
    console.error(`Error: ${data.error}`);
}
```

## Error Handling

### Frontend Validation

Before sending to backend:
- Checks if cube state exists
- Validates cubestring format
- Provides immediate feedback for obvious errors

### Backend Validation

The backend performs comprehensive validation:
- Cubestring length (must be 54 characters)
- Valid characters (only U, R, F, D, L, B)
- Color distribution (9 of each color)
- Physical validity (cube must be solvable)

### User-Friendly Error Messages

| Backend Error | User Message |
|--------------|--------------|
| Invalid length | "Invalid cube state format" |
| Invalid characters | "Invalid cube state format" |
| Wrong color count | "Invalid cube configuration: incorrect color distribution" |
| Impossible state | "This cube configuration cannot be solved" |
| Kociemba error | "Unable to solve cube. Please verify the cube state." |
| Service unavailable | "Solver service is not available. Please contact support." |

## Performance

### Typical Performance

- **Solve time**: 50-200ms for most cube states
- **Solution length**: Typically 15-20 moves
- **Optimal**: Near-optimal solutions (not guaranteed shortest)

### Optimization Notes

- No caching needed (solve is fast enough)
- No timeout required (always completes quickly)
- Minimal server load (lightweight computation)

## Testing

### Frontend Tests

**File**: `tests/test-solve-button.html`

Test cases:
- Button rendering and styling
- Click handler and loading states
- Solution display formatting
- Error message display
- Modal interactions
- Copy to clipboard functionality

### Backend Tests

**File**: `tests/test_solve_api.py`

Test cases:
- Valid solve requests
- Invalid cubestring formats
- Impossible cube states
- Error handling
- Response format validation

### Manual Testing

1. **Solved cube**: Should return empty or minimal solution
2. **Scrambled cube**: Should return valid solution
3. **Invalid cube**: Should show appropriate error
4. **Backend offline**: Should handle gracefully

## Troubleshooting

### "Solver service is not available"

**Cause**: Kociemba library not installed

**Solution**:
```bash
pip install kociemba
```

### "Invalid cube configuration"

**Cause**: Cube state has incorrect color distribution or is physically impossible

**Solution**:
- Use the validation button to check cube state
- Verify all faces are correctly scanned/entered
- Ensure each color appears exactly 9 times

### "Cannot connect to solver service"

**Cause**: Backend API is not running

**Solution**:
```bash
cd api
python start_backend.py
```

### Solution doesn't work on physical cube

**Cause**: Cube state may not match physical cube orientation

**Solution**:
- Verify cube orientation matches the application
- White face should be on top (U face)
- Green face should be in front (F face)
- Re-scan or re-enter the cube state carefully

## Security Considerations

### Input Validation

- All inputs validated on both frontend and backend
- Cubestring length and character restrictions enforced
- No arbitrary code execution possible

### Rate Limiting

Consider implementing rate limiting for production:
```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=get_remote_address)

@app.route('/api/solve-cube', methods=['POST'])
@limiter.limit("10 per minute")
def solve_cube():
    # ... implementation
```

## Future Enhancements

### Planned Features

- **Solution Animation**: Visualize solution moves on the 3D cube
- **Step-by-Step Mode**: Apply moves one at a time with guidance
- **Alternative Algorithms**: Support for different solving methods
- **Solution Optimization**: Option for shortest vs. fastest solutions
- **Solution History**: Save and compare multiple solutions
- **Export Solutions**: Download solutions as text or PDF

### API Extensions

Potential future endpoints:
- `POST /api/optimize-solution`: Find shorter solution
- `POST /api/verify-solution`: Verify a solution is correct
- `POST /api/scramble-cube`: Generate random scramble
- `GET /api/solution-history`: Retrieve past solutions

## Related Documentation

- **Backend API Integration**: `BACKEND-API-INTEGRATION-GUIDE.md`
- **Validation System**: `VALIDATION-BUTTON-GUIDE.md`
- **API Configuration**: `API-CONFIGURATION-GUIDE.md`
- **Color Detection**: `LOW-BRIGHTNESS-COLOR-DETECTION.md`

## Support

For issues or questions:
- Check the troubleshooting section above
- Review test files for usage examples
- Consult the design document: `.kiro/specs/cube-solver-button/design.md`
- Open an issue on GitHub

---

**Happy solving! 🧩✨**
