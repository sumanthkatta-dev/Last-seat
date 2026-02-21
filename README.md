# Last Seat 🚌

A Real-Time GPS College Bus Tracker PWA built with React, TypeScript, and Leaflet.

## Overview

**Last Seat** is a real-time GPS bus tracking application designed for college students and bus drivers. It features two distinct interfaces with **REAL GPS tracking only** - no simulation:

- **Student View**: Track the bus location in real-time using actual GPS coordinates
- **Driver Dashboard**: Share real-time GPS location with students

## Features

### Student Interface (`/track`)
- 🗺️ **Live GPS Tracking**: Real-time bus location using actual device GPS
- 📍 **GPS Path Visualization**: 
  - Red solid line showing actual traveled GPS path
  - Blue dashed line for planned route ahead
- 🎯 **Auto-Follow Map**: Map follows bus automatically with toggle control
- 📊 **Stop Indicators**: 
  - Red circles for passed stops
  - Amber for current stop
  - Green for upcoming stops
- ⏰ **ETA Calculator**: Accurate time based on GPS distance
- 🔔 **Push Notifications**: Alerts when bus approaches your stop
- 📱 **Three Tab System**:
  - Tracker: Live map with GPS path
  - Schedule: Route stops with status
  - Alerts: Notification settings
- 🎯 **6-Decimal Precision**: GPS coordinates accurate to ~0.1 meters
- 🗺️ **Full Map View**: Expanded map with search and zoom controls

### Driver Interface (`/driver`)
- 📡 **GPS-Only Tracking**: Uses real device GPS (no simulation fallback)
- 🎛️ **One-Touch Control**: Start/stop GPS broadcasting
- 📍 **Real-Time Status**: Shows GPS coordinates and accuracy
- ✅ **Stop Management**: Mark stops as arrived and progress through route
- 📊 **Live GPS Indicator**: Shows when GPS is active vs inactive
- 🔄 **High Accuracy Mode**: Forces GPS usage for precise location
- ⚠️ **Permission Handling**: Clear messages for GPS permission states
- 🛑 **Manual Stop Control**: Move to next stop with button control

### Landing Page (`/`)
- 🎨 **Role Selection**: Beautiful split-screen design
- 👨‍🎓 **Student Card**: Direct access to tracking
- 🚌 **Driver Card**: PIN-protected dashboard access
- 🎭 **Modern UI**: Glassmorphic design with gradient backgrounds

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router Dom
- **Styling**: Tailwind CSS v4
- **Maps**: React-Leaflet & Leaflet
- **Icons**: Lucide React
- **State Management**: React Context API

## Route Information

**Route 13**: Dilsuknagar to CMRGI College

| Stop ID | Location | Time |
|---------|----------|------|
| 1301 | Dilsuknagar Saibaba Temple | 7:15 |
| 1302 | TV Tower Malakpet | 7:20 |
| 1304 | Moosaram Bagh | 7:22 |
| 1305 | Ali Cafe | 7:25 |
| 1306 | Amberpet PS | 7:27 |
| 1308 | Padma Rao Nagar | 7:40 |
| 9999 | CMRGI (College) | 8:50 |

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sumanthkatta-dev/Last-seat)

### Manual Deployment

1. **Push your code to GitHub** (already done)

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **The `vercel.json` file handles**:
   - SPA routing (fixes 404 on reload/back button)
   - Redirects all routes to `index.html`
   - Static asset caching

4. **Build Settings** (Auto-detected):
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Every push to `main` branch auto-deploys

### Important Notes

✅ **The app is now Vercel-compatible!**
- `vercel.json` configuration included
- All routes redirect to `index.html` for client-side routing
- No more 404 errors on reload or back button
- Static assets cached for 1 year for performance

🔒 **HTTPS Required for GPS**:
- GPS location requires HTTPS or localhost
- Vercel provides HTTPS by default
- Users must grant location permission

📱 **Mobile Considerations**:
- GPS works best on mobile devices
- Desktop uses network-based location
- Ensure browser has location permission

## Project Structure

```
last-seat/
├── src/
│   ├── context/
│   │   └── BusContext.tsx      # Global state management
│   ├── pages/
│   │   ├── Home.tsx            # Landing page with role selection
│   │   ├── DriverDashboard.tsx # Driver control panel
│   │   └── StudentTracker.tsx  # Student map view
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles + Tailwind
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── vite.config.ts             # Vite configuration
```

## How It Works

### GPS Location Tracking
The app uses the browser's Geolocation API with high accuracy mode:
- **Driver Side**: Requests GPS permission and continuously tracks location
- **Student Side**: Receives real-time GPS coordinates from driver
- **Path Tracking**: Records GPS points every ~10 meters to show traveled route
- **Nearest Stop Detection**: Calculates which stop the bus is closest to
- **Permission Handling**: Falls back with clear error messages if GPS unavailable

### State Management
The app uses React Context (`BusContext`) to manage:
- Real GPS location (lat/lng coordinates with 6-decimal precision)
- Live status (GPS broadcasting on/off)
- Current stop index (calculated from GPS position)
- Arrived stops tracking
- GPS path history for route visualization

### GPS Path Visualization
When the driver starts the journey:
1. Requests device GPS permission with high accuracy mode
2. Continuously updates location using `watchPosition()`
3. Records GPS points to create traveled path
4. Student map shows red line of actual GPS path
5. Map auto-follows bus with smooth panning
6. Updates nearest stop based on GPS proximity

### Distance Calculations
Uses the Haversine formula to calculate:
- Distance from bus to each stop (nearest stop detection)
- Distance to next stop (ETA calculation)
- Assumes average speed of 30 km/h for ETA
- Filters path points to avoid duplicates (~10m threshold)

## Default Credentials

**Driver PIN**: `1234`

## Color Palette

- **Primary**: Emerald-500 (`#10b981`)
- **Dark**: Slate-900 (`#0f172a`)
- **Accent**: Blue-500 (Driver card)

## Browser Support

- Modern browsers with ES6+ support
- Works best on Chrome, Firefox, Safari, Edge
- Mobile responsive design

## Development Notes

### Key Components

**BusContext.tsx**
- Manages global bus state
- Implements journey simulation
- Exports `useBus()` hook and `ROUTE_DATA` constant

**Home.tsx**
- Role selection interface
- PIN verification modal
- Navigation to appropriate dashboard

**DriverDashboard.tsx**
- Broadcast control toggle
- Distance validation to start point
- Progress tracking with visual indicators

**StudentTracker.tsx**
- Full-screen Leaflet map
- Custom bus marker with smooth transitions
- Route polylines (passed vs upcoming)
- Stop circles with status colors
- ETA calculator and bottom info card

### CSS Features
- Tailwind CSS v4 with PostCSS
- Custom bus marker transitions
- Glassmorphic cards with backdrop blur
- Responsive grid layouts
- Gradient backgrounds

## Future Enhancements

- [x] Real GPS integration for actual tracking ✅ **IMPLEMENTED**
- [x] Push notifications for students ✅ **IMPLEMENTED**
- [ ] Multiple route support
- [ ] Historical journey data and analytics
- [ ] Driver authentication system
- [ ] Enhanced offline PWA capabilities
- [ ] Multi-language support
- [ ] Student attendance tracking
- [ ] Real-time chat between driver and students
- [ ] Weather-based ETA adjustments

## Browser & Device Requirements

### GPS Location Requirements
- **HTTPS**: GPS requires secure connection (Vercel provides this)
- **Location Permission**: User must grant browser location access
- **Supported Browsers**:
  - Chrome/Edge (recommended for GPS accuracy)
  - Firefox
  - Safari (iOS/macOS)
  - Mobile browsers

### Best Experience
- 📱 Mobile device with GPS chip (for driver)
- 🌐 Strong internet connection
- 🔋 Sufficient battery (GPS is power-intensive)
- 📡 Good GPS signal (outdoor works best)

## License

MIT License - Feel free to use this project for educational purposes.

## Author

Built as a demonstration of React, TypeScript, and Leaflet integration for real-time location tracking.

---

**Last Seat** - Never miss your college bus! 🚌
