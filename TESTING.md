# Quick Testing Guide 🧪

## ⚠️ IMPORTANT: Firebase Setup Required First!

Before testing, you MUST complete Firebase setup. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

## 🚀 Test Real-Time Sync (2 Devices)

### Option 1: Two Browser Windows (Same Computer)

1. **Open TWO browser windows** side-by-side
2. Navigate both to: `http://localhost:5173` or your Vercel URL

**Window 1 - Driver:**
```
1. Click "I am a Driver"
2. Enter PIN: 1234
3. Click "Start Journey"
4. Allow location permission when prompted
5. Wait for GPS lock (green indicator)
```

**Window 2 - Student:**
```
1. Click "I am a Student"  
2. Open "Tracker" tab
3. You should see driver's GPS location on map!
4. Watch the red path line as driver moves
```

### Option 2: Two Different Devices

**Device 1 (Driver's Phone/Laptop):**
```
1. Open https://your-app.vercel.app
2. Go to driver dashboard with PIN: 1234
3. Start journey and enable GPS
4. Walk around with the device
```

**Device 2 (Student's Phone/Laptop):**
```
1. Open https://your-app.vercel.app
2. Go to student tracker
3. Watch driver's location update in real-time!
```

## ✅ What You Should See

### On Driver Screen:
- ✅ Green GPS indicator with coordinates
- 📡 "Real GPS Tracking Active" message
- 📍 Coordinates updating every few seconds
- 🗺️ Accurate location on map

### On Student Screen:
- 📡 "Real GPS Broadcasting" indicator
- 🗺️ Driver's bus marker on map
- 🔴 Red GPS path line showing traveled route
- 📍 Automatic map following as bus moves
- ⏰ Live ETA updates

## 🧪 Test Checklist

- [ ] Driver can start journey
- [ ] Driver's GPS permission works
- [ ] Driver sees green GPS indicator
- [ ] Student sees driver's location on map
- [ ] Location updates in real-time (within 1-2 seconds)
- [ ] GPS path (red line) draws as driver moves
- [ ] Student map follows bus automatically
- [ ] Stop indicators update (red/amber/green)
- [ ] ETA calculates correctly
- [ ] Driver can mark stops as arrived
- [ ] Student sees stop status changes

## 🐛 Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
❌ Your `.env` file has incorrect Firebase config
✅ Check your Firebase Console for correct values

### Student Not Seeing Driver's Location
❌ Check these:
- [ ] Firebase Realtime Database is enabled
- [ ] Database rules allow read/write
- [ ] Both devices using same Firebase project
- [ ] Driver's GPS is active (green indicator)
- [ ] Check browser console for errors

### GPS Not Working
❌ Common issues:
- Location permission denied → Allow in browser
- HTTPS required → Deploy to Vercel or use localhost
- GPS disabled on device → Enable in device settings
- Indoor location weak → Go near window or outside

### Firebase Connection Issues
❌ Check:
- [ ] Internet connection working
- [ ] `.env` file exists and has correct values
- [ ] Server restarted after changing `.env`
- [ ] Firebase project not deleted/suspended

## 🔍 Debug Mode

Open browser console (F12) to see debug logs:

**Driver logs:**
```
🌍 Starting REAL GPS location tracking...
✅ Real GPS location: [lat] [lng] Accuracy: [m]
🔥 Writing to Firebase: buses/bus-42
```

**Student logs:**
```
👨‍🎓 Student mode: Listening for driver's location from Firebase...
📡 Received driver location from Firebase: {...}
```

If you don't see these logs, check your Firebase setup!

## 📱 Mobile Testing

For best results:
1. Deploy to Vercel (HTTPS required for GPS)
2. Open on actual mobile devices
3. Driver: Walk around campus/street
4. Student: Watch live tracking from different location

## 🎯 Expected Performance

- **GPS Update Rate**: Every 1-5 seconds
- **Firebase Sync Delay**: < 1 second
- **Map Rendering**: Smooth, no lag
- **Path Accuracy**: Within 5-10 meters

## 💡 Pro Tips

1. **Test Outdoors**: GPS works best with clear sky view
2. **Use HTTPS**: Required for production GPS access
3. **Mobile Data**: Works better than WiFi for GPS
4. **Battery**: GPS drains battery, warn drivers
5. **Cleanup**: Driver must click "End Journey" to stop broadcasting

## 🆘 Still Having Issues?

1. Check [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Firebase must be configured
2. View browser console (F12) for error messages
3. Check Firebase Console → Realtime Database → Data tab
4. Verify location permissions in browser settings
5. Try Chrome/Firefox (best browser support)

## ✨ Success!

If both devices see each other's location updates in real-time, you're all set! 🎉
