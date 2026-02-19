# Last Seat 🚌

A Dual-Interface College Bus Tracker PWA built with React, TypeScript, and Leaflet.

## Overview

**Last Seat** is a real-time bus tracking application designed for college students and bus drivers. It features two distinct interfaces:

- **Student View**: Track the bus location in real-time on an interactive map
- **Driver Dashboard**: Control broadcast status and manage the route

## Features

### Student Interface (`/track`)
- 🗺️ **Live Map Tracking**: Real-time bus location on OpenStreetMap
- 🎯 **Route Visualization**: 
  - Grey dashed line for passed route
  - Blue solid line for upcoming route
- 📍 **Stop Indicators**: 
  - Red circles for passed stops
  - Amber for current stop
  - Green for upcoming stops
- ⏰ **ETA Calculator**: Estimated time to next stop
- 📊 **Progress Bar**: Visual journey completion indicator
- 🚌 **Smooth Bus Animation**: Bus marker with CSS transitions

### Driver Interface (`/driver`)
- 🔐 **PIN Protection**: Secure access with 4-digit PIN (default: 1234)
- 🎛️ **One-Touch Control**: Large toggle button to start/stop broadcasting
- 📊 **Journey Progress**: Visual progress bar and stop counter
- 📍 **Location Validation**: Distance check to start point
- 📋 **Stop List**: Complete route with timing information
- 🔄 **Real-time Status**: Current and next stop information

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

### State Management
The app uses React Context (`BusContext`) to manage:
- Bus location (lat/lng coordinates)
- Live status (broadcasting on/off)
- Current stop index
- Journey simulation

### Simulation Engine
When the driver starts broadcasting:
1. Bus location initializes at Dilsuknagar (first stop)
2. Every 3 seconds, the bus moves to the next coordinate
3. Student map updates in real-time with smooth transitions
4. Journey completes when reaching CMRGI College

### Distance Calculations
Uses the Haversine formula to calculate:
- Distance from bus to start point (driver validation)
- Distance to next stop (ETA calculation)
- Assumes average speed of 30 km/h for ETA

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

- [ ] Real GPS integration for actual tracking
- [ ] Push notifications for students
- [ ] Multiple route support
- [ ] Historical journey data
- [ ] Driver authentication system
- [ ] Offline PWA capabilities
- [ ] Multi-language support

## License

MIT License - Feel free to use this project for educational purposes.

## Author

Built as a demonstration of React, TypeScript, and Leaflet integration for real-time location tracking.

---

**Last Seat** - Never miss your college bus! 🚌
