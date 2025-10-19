# Development Guide

## Quick Start

### Run Everything at Once
```bash
npm run dev
```
This single command starts both the frontend and backend servers with colored output.

## Available Scripts

### `npm run dev`
Runs both frontend and backend servers concurrently:
- **Frontend**: http://localhost:8000 (Python HTTP server)
- **Backend**: http://localhost:5000 (Flask API)

Output is color-coded:
- 🔵 Cyan = Frontend logs
- 🟣 Magenta = Backend logs

### `npm run frontend`
Starts only the frontend server on port 8000.

### `npm run backend`
Starts only the backend API server on port 5000.

### `npm start`
Alias for `npm run frontend` - starts just the frontend.

## First Time Setup

1. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Configure backend path** (if using camera features)
   - Edit `api/backend_api.py`
   - Update `BACKEND_PATH` to point to your rubiks-cube-solver location
   - Example: `BACKEND_PATH = r"C:\path\to\rubiks-cube-solver"`

4. **Run the dev server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Frontend Development
- Edit files in `scripts/`, `styles/`, or root HTML files
- Changes are reflected immediately (just refresh browser)
- No build step required

### Backend Development
- Edit files in `api/` directory
- Restart backend server to see changes
- Or use Flask's debug mode for auto-reload

### Testing
- Open test files in `tests/` directory directly in browser
- Example: `http://localhost:8000/tests/test-string-view.html`

## Troubleshooting

### Port Already in Use
If port 8000 or 5000 is already in use:

**Frontend (port 8000)**
```bash
# Use a different port
python -m http.server 8001
```

**Backend (port 5000)**
Edit `api/start_backend.py` or `api/backend_api.py` to change the port.

### Backend Not Starting
- Check Python dependencies are installed: `pip list`
- Verify Flask is installed: `pip show flask`
- Check for errors in backend logs

### Camera Features Not Working
- Ensure backend is running (`npm run backend`)
- Check `BACKEND_PATH` is correctly set in `api/backend_api.py`
- Verify rubiks-cube-solver repository is cloned and accessible
- Check browser console for CORS or API errors

## Project Structure

```
rubiks-cube-interactive/
├── api/                    # Backend Flask API
│   ├── backend_api.py     # Main API server
│   └── start_backend.py   # Backend startup script
├── scripts/               # Frontend JavaScript modules
├── styles/                # CSS stylesheets
├── tests/                 # Test files
├── index.html            # Main application page
├── package.json          # Node.js configuration
└── requirements.txt      # Python dependencies
```

## Tips

- Use `Ctrl+C` to stop the dev server (stops both frontend and backend)
- Check browser console (F12) for frontend errors
- Check terminal output for backend errors
- Use browser DevTools Network tab to debug API calls
