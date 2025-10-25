# Deprecated Files

This folder contains deprecated or unused files that are no longer part of the active codebase.

## Deprecated Scripts

### scripts/cube-importer.js
**Deprecated:** No longer used with frontend camera capture workflow.

**Original Purpose:** Watched for output files from the backend camera program and automatically imported cube states by polling `web_output/` directory.

**Why Deprecated:** The new workflow uses browser-based camera capture with direct API responses via `/api/detect-colors`. No longer needs file polling.

**Replacement:** Camera capture now handled entirely by `camera-capture.js` with real-time API communication.

---

## Deprecated API Files

### api/web_integrated_camera.py
**Deprecated:** Not used in current system.

**Original Purpose:** Standalone camera capture program that opened OpenCV desktop windows and wrote results to `web_output/` files for the frontend to poll.

**Why Deprecated:** The current system uses browser-based WebRTC camera capture with the `/api/detect-colors` endpoint. No longer needs desktop windows or file-based communication.

**Replacement:** Frontend camera capture (`camera-capture.js`) + backend API (`/api/detect-colors` in `backend_api.py`).

### api/camera_interface_template.py
**Deprecated:** Template file no longer needed.

**Original Purpose:** Template for adapting backend camera functions to work with uploaded images.

**Why Deprecated:** The integration is now complete in `backend_api.py` with proper image preprocessing and color detection endpoints.

**Replacement:** Fully implemented in `backend_api.py` endpoints.

---

## Migration Notes

If you need to reference the old workflow:
- Old workflow: Python script → OpenCV window → File output → Frontend polling
- New workflow: Browser camera → Image capture → API request → Direct response

The deprecated files are kept for reference but should not be imported or used in the active codebase.
