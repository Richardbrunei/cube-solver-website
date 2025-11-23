# Deploy Frontend to Render

Your backend is deployed! Now let's deploy the frontend.

## Step 1: Update Backend URL

**IMPORTANT**: Update `scripts/config.js` with your actual backend URL.

Open `scripts/config.js` and replace this line:

```javascript
const API_BASE_URL = isDevelopment 
    ? 'http://localhost:5000'
    : 'https://YOUR_BACKEND_URL.onrender.com';  // ⚠️ REPLACE THIS
```

With your actual backend URL:

```javascript
const API_BASE_URL = isDevelopment 
    ? 'http://localhost:5000'
    : 'https://rubiks-cube-backend.onrender.com';  // ✅ Your actual URL
```

**Example**: If your backend is at `https://my-rubiks-backend.onrender.com`, use that URL.

## Step 2: Test Locally (Optional but Recommended)

Test that the frontend connects to your deployed backend:

```bash
# Start local frontend
python -m http.server 8000

# Open browser to http://localhost:8000
# Open browser console (F12)
# Try using features that call the backend
```

## Step 3: Remove api/ Folder (Optional)

Since your backend is deployed separately, you can remove the `api/` folder from this repo:

```bash
# Optional: Remove api folder
rm -rf api/

# Or on Windows
rmdir /s api
```

This keeps your frontend repo clean and focused on frontend code only.

## Step 4: Push to GitHub

```bash
git add .
git commit -m "Configure frontend for deployed backend"
git push origin main
```

## Step 5: Deploy Frontend as Static Site

### Option A: Render Static Site (Recommended)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. Connect your **frontend repository**
4. Configure:
   - **Name**: `rubiks-cube-frontend`
   - **Branch**: `main`
   - **Build Command**: (leave empty)
   - **Publish Directory**: `.`
5. Click **"Create Static Site"**

### Option B: Netlify (Alternative)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure:
   - **Build command**: (leave empty)
   - **Publish directory**: `.`
5. Click **"Deploy site"**

### Option C: Vercel (Alternative)

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: `.`
5. Click **"Deploy"**

## Step 6: Test Your Deployed Frontend

After deployment, test these:

1. **Open your frontend URL**: `https://rubiks-cube-frontend.onrender.com`
2. **Open browser console** (F12)
3. **Test backend connection**:
   ```javascript
   fetch('https://your-backend.onrender.com/api/health')
       .then(r => r.json())
       .then(data => console.log('Backend connected:', data));
   ```
4. **Test features**:
   - Camera capture
   - Cube solving
   - Color detection

## Troubleshooting

### CORS Errors

If you see "blocked by CORS policy" errors:

1. **Check backend CORS is enabled** in your backend's Flask app:
   ```python
   from flask_cors import CORS
   CORS(app, resources={r"/api/*": {"origins": "*"}})
   ```

2. **Redeploy backend** after enabling CORS

### Backend Connection Fails

1. **Verify backend URL** in `scripts/config.js`
2. **Test backend directly**: Open `https://your-backend.onrender.com/api/health` in browser
3. **Check backend logs** in Render Dashboard

### Features Don't Work

1. **Check browser console** for errors
2. **Verify all API calls** use `CONFIG.API_BASE_URL`
3. **Test backend endpoints** individually with curl

## Your URLs

After deployment:

- **Frontend**: `https://rubiks-cube-frontend.onrender.com`
- **Backend**: `https://your-backend.onrender.com`
- **API**: `https://your-backend.onrender.com/api/*`

## Files Changed

✅ `scripts/config.js` - Updated with environment detection
✅ `scripts/solve-button.js` - Fixed hardcoded URL to use CONFIG

## Summary

1. ✅ Update backend URL in `scripts/config.js`
2. ✅ Test locally (optional)
3. ✅ Remove `api/` folder (optional)
4. ✅ Push to GitHub
5. ✅ Deploy as Static Site on Render
6. ✅ Test deployed frontend
7. 🎉 Done!

Your Rubik's Cube app is now fully deployed with separate frontend and backend! 🚀
