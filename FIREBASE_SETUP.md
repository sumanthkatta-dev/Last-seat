# Firebase Setup Guide

## 🔥 Quick Setup (5 minutes)

Follow these steps to enable real-time GPS sync between pilot and navigators:

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `last-seat-tracker` (or your preferred name)
4. Disable Google Analytics (not needed for this app)
5. Click "Create Project"

### Step 2: Add Web App

1. In your Firebase project dashboard, click the **Web icon** (</>)
2. Enter app nickname: "Last Seat Web App"
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. Copy the `firebaseConfig` object

### Step 3: Enable Realtime Database

1. In Firebase Console, go to **Build** → **Realtime Database**
2. Click "Create Database"
3. Choose location closest to your users
4. Start in **Test Mode** (we'll secure it next)
5. Click "Enable"

### Step 4: Set Database Security Rules

1. In Realtime Database, click the **Rules** tab
2. Replace the rules with:

```json
{
  "rules": {
    "buses": {
      ".read": true,
      ".write": true
    },
    "adminRoutes": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. Click "Publish"

⚠️ **Note**: These rules allow anyone to read/write. For production, implement proper authentication.

### Step 5: Update Environment Variables

1. Open the `.env` file in your project root
2. Replace the demo values with your actual Firebase config:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=1:your-app-id:web:your-app-hash
VITE_ADMIN_PASSWORD=your-strong-admin-password
```

### Step 6: Test It!

1. **Restart your dev server**: 
   ```bash
   npm run dev
   ```

2. **Open TWO browser windows/devices**:
   - Window 1: Go to your app → Click "I am a Pilot" → PIN: 1234 → Start Journey
   - Window 2: Go to your app → Click "I am a Navigator" → View Map

3. **You should see**: Navigator map showing pilot's real-time GPS location! 🎉

## 🌐 Deploy to Vercel

After Firebase setup, deploy to Vercel:

1. Add environment variables in **Vercel Dashboard** → Project Settings → Environment Variables
2. Add all `VITE_FIREBASE_*` variables
3. Redeploy your app

## 🔒 Production Security (Recommended)

For production, enable Firebase Authentication and update rules:

```json
{
  "rules": {
    "buses": {
      ".read": true,
      "$busId": {
        ".write": "auth != null"
      }
    }
  }
}
```

This allows:
- ✅ Anyone can READ vehicle locations (navigators don't need login)
- ✅ Only authenticated users can WRITE (pilots must login)

## 📊 Monitor Usage

- Go to Firebase Console → Realtime Database → Usage tab
- Free tier: 1GB data transfer/month, 100 simultaneous connections
- Should be sufficient for small campus deployments

## 🆘 Troubleshooting

### "Firebase: Error (auth/api-key-not-valid)"
- Check your `.env` file has correct API key
- Restart dev server after changing `.env`

### "Permission denied" in Firebase
- Check your Database Rules allow read/write
- Verify Database URL is correct in `.env`

### Pilot not starting journey
- Make sure pilot has GPS permission enabled
- Check browser console for Firebase connection errors
- Verify both devices are using the same Firebase project
- Check Firebase Console → Realtime Database → Data tab to see if location is being written

## 🎯 What Gets Synced?

When pilot starts journey, Firebase stores:
- GPS coordinates (lat/lng)
- Current stop index
- Journey status (live/stopped)
- Arrived stops array
- Timestamp

Students receive real-time updates whenever this data changes!
