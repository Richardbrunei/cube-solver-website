# NPM Dev Script Setup

## What Changed

Added a convenient `npm run dev` command that starts both frontend and backend servers simultaneously.

## Setup

1. **Install the concurrently package**
   ```bash
   npm install
   ```

2. **Run both servers**
   ```bash
   npm run dev
   ```

That's it! Both servers will start with color-coded output.

## What It Does

The `npm run dev` command runs:
- **Frontend server** on http://localhost:8000 (cyan output)
- **Backend API** on http://localhost:5000 (magenta output)

## New Scripts Available

```bash
npm run dev       # Start both frontend and backend
npm run frontend  # Start only frontend (port 8000)
npm run backend   # Start only backend (port 5000)
npm start         # Start only frontend (alias)
```

## Output Example

```
[frontend] Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
[backend]  * Running on http://127.0.0.1:5000
[frontend] 127.0.0.1 - - [19/Oct/2025 10:30:15] "GET / HTTP/1.1" 200 -
[backend]  * Detected change in 'backend_api.py', reloading
```

## Benefits

- ✅ One command to start everything
- ✅ Color-coded output (frontend = cyan, backend = magenta)
- ✅ Both servers stop with single Ctrl+C
- ✅ Easier development workflow
- ✅ No need for multiple terminal windows

## Files Modified

1. **package.json**
   - Added `concurrently` as dev dependency
   - Added `frontend`, `backend`, and updated `dev` scripts
   - Added color-coded prefixes for better readability

2. **README.md**
   - Updated installation instructions
   - Added three options for running the app
   - Documented the new `npm run dev` command

3. **DEVELOPMENT.md** (new)
   - Comprehensive development guide
   - Troubleshooting tips
   - Project structure overview
