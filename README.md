# Last Seat 🚌

A Real-Time GPS College Bus Tracker with **Firebase Realtime Sync** - Built with React, TypeScript, and Leaflet.

## Overview

**Last Seat** is a real-time GPS-synced bus tracking application designed for college students and bus drivers. It uses **Firebase Realtime Database** to sync the driver's GPS location to all students in real-time - no simulation, just real GPS!

- **Student View**: See driver's real-time GPS location on the map
- **Driver Dashboard**: Broadcast your GPS location to all students
- **Real-Time Sync**: Firebase ensures instant updates across all devices

## ⚡ Key Feature: Real-Time GPS Sync

The driver's GPS location is **instantly broadcasted** to all students using Firebase Realtime Database:

```
Driver Device (GPS) → Firebase → Student Devices (Map)
     🚌 →              ☁️  →         📱📱📱
```

- Driver gets GPS coordinates from their device
- Location is written to Firebase in real-time
- All students receive updates within milliseconds
- Works across multiple devices simultaneously

## Features

### Student Interface (`/track`)
- 🗺️ **Live GPS Tracking**: See driver's real-time GPS location from Firebase
- 📍 **GPS Path Visualization**: 
  - Red solid line showing actual traveled GPS path
  - Blue dashed line for planned route ahead
- 🎯 **Auto-Follow Map**: Map follows bus automatically with toggle control
- 📊 **Stop Indicators**: 
  - Red circles for passed stops
  - Amber for current stop
  - Green for upcoming stops
- ⏰ **ETA Calculator**: Accurate time based on GPS distance
- 🔔 **Push Notifications**: Optional alerts when bus approaches your stop
- 📱 **Three Tab System**:
  - Tracker: Live map with GPS path
  - Schedule: Route stops with status
  - Alerts: Notification settings (optional)
- 🎯 **6-Decimal Precision**: GPS coordinates accurate to ~0.1 meters
- 🗺️ **Full Map View**: Expanded map with search and zoom controls
- 🔄 **Real-Time Updates**: Live sync with driver's location via Firebase

### Driver Interface (`/driver`)
- 📡 **GPS Broadcasting**: Uses real device GPS and syncs to Firebase
- 🔥 **Firebase Sync**: Writes location to cloud every time GPS updates
- 🎛️ **One-Touch Control**: Start/stop GPS broadcasting
- 📍 **Real-Time Status**: Shows GPS coordinates and accuracy
- ✅ **Stop Management**: Mark stops as arrived and progress through route
- 📊 **Live GPS Indicator**: Shows when GPS is active vs inactive
- 🔄 **High Accuracy Mode**: Forces GPS usage for precise location
- ⚠️ **Permission Handling**: Clear messages for GPS permission states
- 🛑 **Manual Stop Control**: Move to next stop with button control
- ☁️ **Cloud Sync**: All data synced to Firebase for students

### Landing Page (`/`)
- 🎨 **Role Selection**: Beautiful split-screen design
- 👨‍🎓 **Student Card**: Direct access to tracking
- 🚌 **Driver Card**: PIN-protected dashboard access (PIN: 1234)
- 🎭 **Modern UI**: Glassmorphic design with gradient backgrounds

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router Dom
- **Styling**: Tailwind CSS v4
- **Maps**: React-Leaflet & Leaflet
- **Icons**: Lucide React
- **State Management**: React Context API
- **Backend**: Firebase Realtime Database ⭐
- **Deployment**: Vercel (with SPA routing)

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

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Firebase Account** - Get one free at [firebase.google.com](https://firebase.google.com)

### Step 1: Clone and Install

```bash
# Install dependencies
npm install
```

### Step 2: Firebase Setup (Required!)

**The app requires Firebase to sync driver and student locations.**

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions, or follow these quick steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Realtime Database**
4. Set database rules:
   ```json
   {
     "rules": {
       "buses": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```
5. Copy your Firebase config
6. Create `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### Step 3: Run the App

```bash
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
