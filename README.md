# Last Seat

Real-time college bus tracking. The driver's phone broadcasts its GPS position, and every student sees the bus move on a live map with ETAs for their stop.

**Live app:** [lastseat.vercel.app](https://lastseat.vercel.app)

## Why I built it

Our college buses run fixed routes, but nobody knows where the bus actually is. Students wait at stops for 20 minutes or miss it by one. Last Seat replaces "is it gone yet?" with a live position and an ETA.

## Features

**Student view (`/track`)**
- Live bus position on a Leaflet map, synced from the driver's device
- Travelled path drawn in solid red, the route ahead dashed
- Stop list with passed, current and upcoming states, plus a distance-based ETA for each stop
- Optional browser notification when the bus is approaching your stop
- Request a stop: the request syncs to the driver's screen in real time

**Driver view (`/pilot`)**
- One tap to start or stop broadcasting high-accuracy GPS
- Shows current coordinates, accuracy and connection state
- Automatic stop detection as the bus reaches each stop, with a manual override

**Admin (`/admin`)**
- Route builder that records stops from real GPS positions and syncs them to Firebase

## How it works

```
Driver phone ──watchPosition()──▶ Firebase Realtime Database ──onValue()──▶ Student phones (map + ETA)
```

The driver dashboard writes each GPS update to `buses/<busId>` in Firebase Realtime Database. Student clients subscribe to that node and re-render the map as soon as a new position arrives, with no polling. Route and stop data live in `src/context/routeData.ts` and are shared through React Context.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · React-Leaflet · Firebase Realtime Database · React Router · Vercel

## Running locally

```bash
git clone https://github.com/sumanthkatta-dev/Last-seat.git
cd Last-seat
npm install
cp .env.example .env    # add your Firebase web config
npm run dev
```

You'll need a Firebase project with Realtime Database enabled. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for step-by-step setup and [TESTING.md](TESTING.md) for testing the sync with two devices.

## Project structure

```
src/pages/        Home, NavigatorTracker (students), PilotDashboard (driver), AdminPage, CalibratePage
src/context/      Bus state, route data and the Firebase subscription
src/config/       Firebase initialisation
src/utils/        Browser notifications
```

## Known limitations

- **Demo security:** the database rules allow public read and write, and the driver screen uses a simple PIN. A production version would put drivers behind Firebase Authentication and lock writes to authenticated drivers.
- Supports one route (Route 13) for now. Multi-route support is next.

More detail on the tracking logic is in [TRACKING_IMPLEMENTATION.md](TRACKING_IMPLEMENTATION.md).
