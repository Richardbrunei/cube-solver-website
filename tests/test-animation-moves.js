/**
 * Quick test for AnimationController move parsing and rotation logic
 * Run with: node tests/test-animation-moves.js
 */

// Mock AnimationController for Node.js testing
class AnimationController {
  constructor() {
    this.virtualCubestring = '';
  }

  _parseMove(notation) {
    if (!notation || typeof notation !== 'string') {
      throw new Error('Invalid move notation: must be a non-empty string');
    }

    const face = notation[0].toUpperCase();
    const validFaces = ['R', 'L', 'U', 'D', 'F', 'B'];
    
    if (!validFaces.includes(face)) {
      throw new Error(`Invalid face in move notation: ${face}`);
    }

    const modifier = notation.slice(1);
    let direction = 'clockwise';
    let turns = 1;

    if (modifier === "'") {
      direction = 'counterclockwise';
      turns = 1;
    } else if (modifier === '2') {
      direction = 'clockwise';
      turns = 2;
    } else if (modifier === '') {
      direction = 'clockwise';
      turns = 1;
    } else {
      throw new Error(`Invalid modifier in move notation: ${modifier}`);
    }

    return { face, direction, turns, notation };
  }

  _rotateFaceStickers(cube, start) {
    const temp = [
      cube[start + 0], cube[start + 1], cube[start + 2],
      cube[start + 3], cube[start + 5],
      cube[start + 6], cube[start + 7], cube[start + 8]
    ];
    
    cube[start + 0] = temp[5];
    cube[start + 1] = temp[3];
    cube[start + 2] = temp[0];
    cube[start + 3] = temp[6];
    cube[start + 5] = temp[1];
    cube[start + 6] = temp[7];
    cube[start + 7] = temp[4];
    cube[start + 8] = temp[2];
  }

  _rotateFace(cubestring, face, direction) {
    const cube = cubestring.split('');

    if (face === 'R') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 9);
        const temp = [cube[2], cube[5], cube[8]];
        cube[2] = cube[53]; cube[5] = cube[50]; cube[8] = cube[47];
        cube[53] = cube[29]; cube[50] = cube[32]; cube[47] = cube[35];
        cube[29] = cube[20]; cube[32] = cube[23]; cube[35] = cube[26];
        cube[20] = temp[0]; cube[23] = temp[1]; cube[26] = temp[2];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'L') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 36);
        const temp = [cube[0], cube[3], cube[6]];
        cube[0] = cube[18]; cube[3] = cube[21]; cube[6] = cube[24];
        cube[18] = cube[27]; cube[21] = cube[30]; cube[24] = cube[33];
        cube[27] = cube[45]; cube[30] = cube[48]; cube[33] = cube[51];
        cube[45] = temp[2]; cube[48] = temp[1]; cube[51] = temp[0];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'U') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 0);
        const temp = [cube[18], cube[19], cube[20]];
        cube[18] = cube[9]; cube[19] = cube[10]; cube[20] = cube[11];
        cube[9] = cube[45]; cube[10] = cube[46]; cube[11] = cube[47];
        cube[45] = cube[36]; cube[46] = cube[37]; cube[47] = cube[38];
        cube[36] = temp[0]; cube[37] = temp[1]; cube[38] = temp[2];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'D') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 27);
        const temp = [cube[24], cube[25], cube[26]];
        cube[24] = cube[42]; cube[25] = cube[43]; cube[26] = cube[44];
        cube[42] = cube[51]; cube[43] = cube[52]; cube[44] = cube[53];
        cube[51] = cube[15]; cube[52] = cube[16]; cube[53] = cube[17];
        cube[15] = temp[0]; cube[16] = temp[1]; cube[17] = temp[2];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'F') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 18);
        const temp = [cube[6], cube[7], cube[8]];
        cube[6] = cube[44]; cube[7] = cube[43]; cube[8] = cube[42];
        cube[44] = cube[27]; cube[43] = cube[28]; cube[42] = cube[29];
        cube[27] = cube[11]; cube[28] = cube[10]; cube[29] = cube[9];
        cube[11] = temp[0]; cube[10] = temp[1]; cube[9] = temp[2];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    } else if (face === 'B') {
      if (direction === 'clockwise') {
        this._rotateFaceStickers(cube, 45);
        const temp = [cube[0], cube[1], cube[2]];
        cube[0] = cube[17]; cube[1] = cube[16]; cube[2] = cube[15];
        cube[17] = cube[35]; cube[16] = cube[34]; cube[15] = cube[33];
        cube[35] = cube[36]; cube[34] = cube[37]; cube[33] = cube[38];
        cube[36] = temp[2]; cube[37] = temp[1]; cube[38] = temp[0];
      } else {
        for (let i = 0; i < 3; i++) {
          cube.splice(0, cube.length, ...this._rotateFace(cube.join(''), face, 'clockwise').split(''));
        }
      }
    }

    return cube.join('');
  }

  _applyMove(moveNotation) {
    try {
      const move = this._parseMove(moveNotation);
      
      for (let i = 0; i < move.turns; i++) {
        this.virtualCubestring = this._rotateFace(
          this.virtualCubestring,
          move.face,
          move.direction
        );
      }
    } catch (error) {
      console.error(`Error applying move ${moveNotation}:`, error);
      throw error;
    }
  }
}

// Test suite
const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failCount++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

// Run tests
console.log('Testing AnimationController move parsing and rotation logic...\n');

test('Parse simple move R', () => {
  const controller = new AnimationController();
  const move = controller._parseMove('R');
  assertEqual(move.face, 'R', 'Face should be R');
  assertEqual(move.direction, 'clockwise', 'Direction should be clockwise');
  assertEqual(move.turns, 1, 'Turns should be 1');
});

test("Parse prime move R'", () => {
  const controller = new AnimationController();
  const move = controller._parseMove("R'");
  assertEqual(move.face, 'R', 'Face should be R');
  assertEqual(move.direction, 'counterclockwise', 'Direction should be counterclockwise');
  assertEqual(move.turns, 1, 'Turns should be 1');
});

test('Parse double move R2', () => {
  const controller = new AnimationController();
  const move = controller._parseMove('R2');
  assertEqual(move.face, 'R', 'Face should be R');
  assertEqual(move.direction, 'clockwise', 'Direction should be clockwise');
  assertEqual(move.turns, 2, 'Turns should be 2');
});

test('Four R moves return to solved', () => {
  const controller = new AnimationController();
  controller.virtualCubestring = SOLVED;
  controller._applyMove('R');
  controller._applyMove('R');
  controller._applyMove('R');
  controller._applyMove('R');
  assertEqual(controller.virtualCubestring, SOLVED, 'R R R R should return to solved');
});

test("R followed by R' returns to solved", () => {
  const controller = new AnimationController();
  controller.virtualCubestring = SOLVED;
  controller._applyMove('R');
  controller._applyMove("R'");
  assertEqual(controller.virtualCubestring, SOLVED, "R R' should return to solved");
});

test('Four U moves return to solved', () => {
  const controller = new AnimationController();
  controller.virtualCubestring = SOLVED;
  for (let i = 0; i < 4; i++) controller._applyMove('U');
  assertEqual(controller.virtualCubestring, SOLVED, 'U U U U should return to solved');
});

test('All faces: R, L, U, D, F, B work correctly', () => {
  const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
  faces.forEach(face => {
    const controller = new AnimationController();
    controller.virtualCubestring = SOLVED;
    for (let i = 0; i < 4; i++) controller._applyMove(face);
    assertEqual(controller.virtualCubestring, SOLVED, `${face} x4 should return to solved`);
  });
});

test('R2 equals R + R', () => {
  const controller1 = new AnimationController();
  controller1.virtualCubestring = SOLVED;
  controller1._applyMove('R2');
  
  const controller2 = new AnimationController();
  controller2.virtualCubestring = SOLVED;
  controller2._applyMove('R');
  controller2._applyMove('R');
  
  assertEqual(controller1.virtualCubestring, controller2.virtualCubestring, 'R2 should equal R + R');
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Summary: ${passCount} passed, ${failCount} failed`);
console.log(`${'='.repeat(50)}`);

process.exit(failCount > 0 ? 1 : 0);
