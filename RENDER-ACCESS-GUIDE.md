# Accessing Your App on Render

Complete guide to accessing your Rubik's Cube app after deplo        Render.

## Your App URL

After deployment, Render provides a URL like:
```
https://your-app-name.onrender.com
```

Replace `your-app-name` with your actual service name from Render.

## What's Available

### Frontend (User Interface)
- **Main App*  ttps://your-app-name.onrender.com/`
- **About Page**: `https://your-app-name.onrender.com/about.html`
- **Test Page**: `htt r-app-name.onrender.com/test-interactivity.html`

### Backend API Endpoints

#### Health & Status
- **Health Check**: `https://your-app-name.onrender.com/api/health`
  - Returns: `{"status": "healthy", "message": "..."}`
  
- **Test Endpoint**: `https://your-app-name.onrender.co    
  - Returns: Backend status and available features

#### Color Detection
- **Detect Colors**: `POST https://your-app-name.onrend i/detect-colors`
  - Body: `{"image": "base64...", "face": "front"}`
  
- **Fast Detection**: `POST https://your-app-name.onrender.com/api/detect-colors-fast`
  - Body: `{"image": "base64...", "face": "front"}`

#### Cube Operations
- **Color Mappings**: `GET https://your-app-name.on  pi/color-mappings`
  - Returns: Color notation mappings

- **Solve Cube**: `POST https://your-app-name.onrender.com/api/solve-cube`
  - Body: `{"cubestring": "UUUUUUUUU..."}`

- **Validate Cube**: `POST https://your-app-n     om/ap alidate-  e`  `{"cube_state": [...], "cube_string": "..."}`

#### Camera (Limited on Render)
- **Camera Status**: `GET https://your-app-name.onrender.com/api/camera-status`
  - Note: Will show unavailable on Render (no camera hardware)

## How to Find Your URL

### Method 1: Render Dashboard
1. Go to https://dashboard.render.com
2. Click on your service
3. Look for the URL at the top: `https://your-app-name.onrender.com`
4. Click to open in browser

### Method 2: Deployment Logs
1. Go to your service in Render Dashboard
2. Click "Logs" tab
3. Look for: `Your service is live 🎉`
4. URL will be shown below

### Method 3: Settings
1. Go to your service in Render Dashboard
2. Click "mttings" tab
3. Find "Service URL" section

## Testing Your Deployment

### Quick Test (Browser)
Open these URLs in your browser:

1. **Main App**: `https://your-app-name.onrender.com/`
   - Should show the Rubik's cube interface

2. **Health Check**: `https://your-app-name.onrender.com/api/health`
   - Should return: `{"status":"healthy","message":"Rubik's Cube Color Detection API is runni `

3. **Test Endpoint**: `https://your-app-name.onrender.com/api/test`
   - Should show backend status and supported colors

### Command Line Test (curl)
```bash
# Health check
curl https://your-app-name.onrender.com/api/health

# Test e   curl https://your-app-name.onrender.com/api/test

# Color mappings
curl https://your-app-name.onrender.com/api/color-mappings
```

### JavaScript Test (Browser Console)
Open your app and run in browser console:
```javascript
// Test health endpoint
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log('Health:', data));

// Test color mappings
fetch('/api/color-mappings')
  .then(r => r.json())
  .then(data => console.log('Mappings:', data));
```

## Architecture on Render

```
┌─────────────────────────────────────────┐
│  https://your-app-name.onrender.com     │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │   Flask Backend (Port $PORT)       │ │
│  │   ┌──────────────┐  ┌───────────┐  │ │
│  │   │   Frontend   │  │    API    │  │ │
│  │   │   (Static)   │  │ Endpoints │  │ │
│  │   │              │  │           │  │ │
│  │   │  /           │  │  /api/*   │  │ │
│  │   │  /about.html │  │           │  │ │
│  │   │  /scripts/*  │  │           │  │ │
│  │   │  /styles/*   │  │           │  │ │
│  │   └──────────────┘  └───────────┘  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Points:**
- Single Flask app serves both frontend and backend
- Frontend files served from root d 
- API endpoints under `/api/*` prefix
- All on one domain (no CORS issues)

## Common Issues & Solutions

### Issue: "Service Unavailable" or 503 Error
**Cause**: App is starting up or crashed
**Solution**: 
- Wait 30-60 seconds for initial startup
- Check logs in Render Dashboard
- Verify build completed successfully

### Issue: Free Tier Sleeps After 15 Minutes
**Cause**: Render free tier spins down inactive services
**Solution**:
- First request after sleep takes 30-60 seconds
- Upgrade to paid tier ($7/month) for always-on
- Or use a service like UptimeRobot to ping periodically

### Issue: Static Files Not Loading (404)
**Cause**: File paths incorrect
**Solution**:
- Verify files are in repository
- Check that paths are relative, not absolute
- Review Flask static file routes

### Issue: API Returns 500 Error
**Cause**: Backend error
**Solution**:
- Check logs in Render Dashboard
- Test `/api/health` endpoint
- Verify dependencies installed correctly

### Issue: Camera Features Don't Work
**Expected**: Camera requires local hardware
**Solution**:
- Camera features only work in local development
- Use manual color editing on Render
- Or deploy to a VPS with camera support

## Monitoring Your App

### Render Dashboard
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, bandwidth usage
- **Events**: Deployment history and status

### Health Check Endpoint
Set up monitoring with services like:
- **UptimeRobot**: Free monitoring, pings your health endpoint
- **Pingdom**: Advanced monitoring with alerts
- **StatusCake**: Free tier available

Example UptimeRobot setup:
1. Go to https://uptimerobot.com
2. Add new monitor
3. URL: `https://your-app-name.onrender.com/api/health`
4. Interval: 5 minutes
5. Get alerts if app goes down

## Custom Domain (Optional)

### Add Custom Domain
1. Go to Render Dashboard → Your Service
2. Click "Settings" tab
3. Scroll to "Custom Domain"
4. Click "Add Custom Domain"
5. Enter your domain (e.g., `rubiks.yourdomain.com`)
6. Follow DNS configuration instructions

### Update DNS
Add CNAME record in your DNS provider:
```
Type: CNAME
Name: rubiks (or your subdomain)
Value: your-app-name.onrender.com
```

### SSL Certificate
- Render automatically provisions SSL certificates
- HTTPS enabled by default
- Certificate auto-renews

## Performance Tips

### Free Tier Limitations
- 750 hours/month (enough for one always-on service)
- Spins down after 15 minutes of inactivity
- 512 MB RAM
- Shared CPU

### Optimization
1. **Keep Alive**: Use UptimeRobot to ping every 5-10 minutes
2. **Caching**: Add cache headers for static files
3. **Compression**: Enable gzip compression
4. **CDN**: Use Cloudflare for static assets (advanced)

### Upgrade Options
- **Starter Plan**: $7/month
  - Always on (no spin down)
  - 512 MB RAM
  - Dedicated resources
  
- **Standard Plan**: $25/month
  - 2 GB RAM
  - More CPU
  - Better performance

## API Documentation

For detailed API documentation, see:
- `DEPLOYMENT.md` - Full deployment guide
- `BACKEND-PATH-CONFIG.md` - Backend configuration
- `docs/INTEGRATION_GUIDE.md` - Integration details

## Support

### Render Support
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### App Issues
- Check application logs in Render Dashboard
- Test endpoints individually
- Verify environment configuration

## Quick Reference

```bash
# Your app URLs (replace your-app-name)
Frontend:  https://your-app-name.onrender.com/
API:       https://your-app-name.onrender.com/api/
Health:    https://your-app-name.onrender.com/api/health

# Test commands
curl https://your-app-name.onrender.com/api/health
curl https://your-app-name.onrender.com/api/test
curl https://your-app-name.onrender.com/api/color-mappings

# Render Dashboard
https://dashboard.render.com
```

## Next Steps

1. ✅ Deploy your app to Render
2. ✅ Test all endpoints
3. ✅ Set up monitoring (UptimeRobot)
4. ✅ Share your app URL
5. ⭐ Consider upgrading if needed
6. 🎉 Enjoy your deployed Rubik's cube app!
