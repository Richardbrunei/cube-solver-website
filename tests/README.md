# Tests and Development Files

This folder contains test files, development utilities, and debugging tools for the Rubik's Cube Interactive Website.

## 📁 Files Overview

### HTML Test Files
- **`test-reset-button.html`** - Standalone test for reset button functionality
- **`test-interactivity.html`** - Test file for cube interaction features

### Python Test Files
- **`test_api.py`** - API endpoint testing
- **`test_backend_import.py`** - Backend import and dependency testing
- **`check_dependencies.py`** - Dependency verification script

## 🧪 Running Tests

### Backend Dependency Check
```bash
python check_dependencies.py
```

### API Testing
```bash
python test_api.py
```

### Backend Import Testing
```bash
python test_backend_import.py
```

### Frontend Component Testing
Open the HTML test files in your browser:
- `test-reset-button.html` - Test reset functionality
- `test-interactivity.html` - Test cube interactions

## 🔧 Development Workflow

1. **Check Dependencies** - Run `check_dependencies.py` first
2. **Test Backend** - Use `test_backend_import.py` to verify backend setup
3. **Test API** - Run `test_api.py` to check API endpoints
4. **Test Frontend** - Open HTML test files for component testing

## 📋 Test Coverage

### Backend Tests
- ✅ Dependency verification
- ✅ API endpoint functionality
- ✅ Camera integration
- ✅ File I/O operations

### Frontend Tests
- ✅ Reset button functionality
- ✅ Cube state management
- ✅ 3D rendering
- ✅ User interactions

## 🐛 Debugging

Use these test files to isolate and debug specific functionality:

- **Camera Issues** → `test_api.py`
- **Import Problems** → `test_backend_import.py`
- **UI Components** → HTML test files
- **Dependencies** → `check_dependencies.py`

## 📝 Adding New Tests

When adding new functionality, create corresponding test files:

1. **Backend Features** → Add Python test files
2. **Frontend Components** → Add HTML test files
3. **API Endpoints** → Update `test_api.py`
4. **Dependencies** → Update `check_dependencies.py`