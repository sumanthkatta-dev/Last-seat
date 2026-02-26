import React, { createContext, useState, useEffect, type ReactNode, useCallback, useMemo } from 'react';
import { ref, set, onValue, off, type DataSnapshot } from 'firebase/database';
import { database } from '../config/firebase';
import { ROUTE_TO_COLLEGE, ROUTE_FROM_COLLEGE } from './routeData';
import type { BusContextType, BusLocation } from './BusContextValue';

// Creating context alongside provider is a standard pattern for encapsulation
// This warning can be safely ignored as context is used internally
export const BusContext = createContext<BusContextType | undefined>(undefined);

const BUS_ID = 'bus-42'; // Unique ID for this bus route

export const BusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routeDirection, setRouteDirection] = useState<'to' | 'from'>('to');
  const currentRoute = useMemo(() => 
    routeDirection === 'to' ? ROUTE_TO_COLLEGE : ROUTE_FROM_COLLEGE,
    [routeDirection]
  );
  
  const [busLocation, setBusLocation] = useState<BusLocation>(ROUTE_TO_COLLEGE[0]);
  const [isLive, setIsLive] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchPositionId, setWatchPositionId] = useState<number | null>(null);
  const [isUsingRealLocation, setIsUsingRealLocation] = useState(false);
  const [arrivedStops, setArrivedStops] = useState<number[]>([]);
  const [stopRequests, setStopRequests] = useState<Array<{ stopId: number; stopName: string; passengerId: string; timestamp: number }>>([]);
  const [role, setRole] = useState<'pilot' | 'navigator'>('navigator'); // Default to navigator
  const [journeyStarted, setJourneyStarted] = useState(false); // Track if journey was explicitly started

  // Calculate distance between two points in meters
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Find nearest stop based on location
  const findNearestStop = useCallback((location: BusLocation): number => {
    let nearestIndex = 0;
    let minDistance = Infinity;

    currentRoute.forEach((stop, index) => {
      const distance = calculateDistance(location.lat, location.lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }, [calculateDistance, currentRoute]);

  // Real Device Location Tracking (GPS ONLY - NO SIMULATION)
  const startRealTimeLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('❌ GPS not supported. Real-time tracking requires a device with GPS.');
      setIsUsingRealLocation(false);
      setIsLive(false);
      return;
    }

    console.log('🌍 Starting REAL GPS location tracking...');
    setLocationError(null);

    // Request permission and start watching position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('✅ Real GPS location:', latitude, longitude, 'Accuracy:', accuracy, 'm');
        
        const newLocation = {
          lat: latitude,
          lng: longitude
        };
        
        setBusLocation(newLocation);
        
        // Update current stop based on actual location
        const nearestStopIndex = findNearestStop(newLocation);
        setCurrentStopIndex(nearestStopIndex);
        
        // 🔥 SYNC TO FIREBASE - Write pilot's location to Firebase for navigators
        if (role === 'pilot') {
          const busRef = ref(database, `buses/${BUS_ID}`);
          set(busRef, {
            location: newLocation,
            currentStopIndex: nearestStopIndex,
            isLive: true,
            isUsingRealLocation: true,
            timestamp: Date.now(),
            arrivedStops: arrivedStops,
            routeDirection
          }).catch((error: Error) => {
            console.error('❌ Firebase write error:', error);
          });
        }
        
        setLocationError(null);
        setIsUsingRealLocation(true);
        // isLive is already set in startJourney(), just keep GPS updating
      },
      (error) => {
        console.error('❌ GPS error:', error);
        
        // Show error but keep journey active so user can manually mark arrivals
        if (error.code === 1) {
          setLocationError('PERMISSION_DENIED: Location access blocked. Click the lock icon (🔒) in your browser address bar and allow location access.');
        } else if (error.code === 2) {
          setLocationError('POSITION_UNAVAILABLE: Unable to get GPS signal. Make sure GPS is enabled on your device.');
        } else if (error.code === 3) {
          setLocationError('TIMEOUT: GPS took too long to respond. Check your GPS signal strength.');
        } else {
          setLocationError('GPS_ERROR: Location services unavailable.');
        }
        
        setIsUsingRealLocation(false);
        // Keep isLive true so user can manually mark stops even if GPS fails
      },
      {
        enableHighAccuracy: true, // Force GPS (not network location)
        timeout: 15000,
        maximumAge: 0 // Always get fresh location
      }
    ) as unknown as number;

    setWatchPositionId(id);
  }, [findNearestStop, role, arrivedStops, routeDirection, journeyStarted]);

  const stopRealTimeLocation = useCallback((id: number | null) => {
    if (id !== null) {
      console.log('🛑 Stopping real-time location tracking');
      navigator.geolocation.clearWatch(id);
    }
  }, []);

  // Move to next stop (for pilot manual control)
  const moveToNextStop = useCallback(() => {
    setCurrentStopIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < currentRoute.length) {
        setBusLocation({
          lat: currentRoute[nextIndex].lat,
          lng: currentRoute[nextIndex].lng
        });
        console.log(`🚌 Manually moved to stop ${nextIndex}: ${currentRoute[nextIndex].name}`);
      }
      return Math.min(nextIndex, currentRoute.length - 1);
    });
  }, [currentRoute]);

  // Mark stop as arrived
  const markStopArrived = useCallback((stopIndex: number) => {
    setArrivedStops(prev => {
      if (!prev.includes(stopIndex)) {
        console.log(`✅ Marked stop ${stopIndex} as arrived`);
        return [...prev, stopIndex];
      }
      return prev;
    });
  }, []);

  // Request a stop as passenger
  const requestStop = useCallback((stopId: number, stopName: string) => {
    const busRef = ref(database, `buses/${BUS_ID}/stopRequests`);
    
    // Read current stop requests from Firebase first
    onValue(busRef, (snapshot: DataSnapshot) => {
      const existingRequests = snapshot.val() || [];
      
      // Check if request already exists for this stop
      if (existingRequests.find((r: { stopId: number }) => r.stopId === stopId)) {
        console.log(`ℹ️ Stop request already exists for ${stopName}`);
        return;
      }
      
      // Add new request
      const newRequest = {
        stopId,
        stopName,
        passengerId: `passenger-${Date.now()}`,
        timestamp: Date.now()
      };
      
      const updatedRequests = [...existingRequests, newRequest];
      
      // Write directly to Firebase so pilot sees it instantly
      set(ref(database, `buses/${BUS_ID}/stopRequests`), updatedRequests)
        .then(() => {
          console.log(`🙋 Passenger requested stop: ${stopName} (synced to Firebase)`);
          // Update local state
          setStopRequests(updatedRequests);
          
          // Show confirmation notification to passenger
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Stop Request Sent', {
              body: `Your request for ${stopName} has been sent to the driver`,
              icon: '/bus-icon.png',
              tag: `request-${stopId}`
            });
          }
        })
        .catch((error: Error) => {
          console.error('❌ Failed to send stop request:', error);
        });
    }, { onlyOnce: true }); // Read once and don't maintain subscription
  }, []);

  // Clear stop request (when driver reaches or skips stop)
  const clearStopRequest = useCallback((stopId: number) => {
    const busRef = ref(database, `buses/${BUS_ID}/stopRequests`);
    
    // Read current requests and filter out the cleared one
    onValue(busRef, (snapshot: DataSnapshot) => {
      const existingRequests = snapshot.val() || [];
      const updatedRequests = existingRequests.filter((r: { stopId: number }) => r.stopId !== stopId);
      
      // Write back to Firebase
      set(ref(database, `buses/${BUS_ID}/stopRequests`), updatedRequests)
        .then(() => {
          console.log(`✅ Cleared stop request for stop ${stopId}`);
          // Update local state
          setStopRequests(updatedRequests);
        })
        .catch((error: Error) => {
          console.error('❌ Failed to clear stop request:', error);
        });
    }, { onlyOnce: true });
  }, []);

  // Start Journey - GPS ONLY
  const startJourney = useCallback(() => {
    console.log(`🚀 Starting journey with REAL GPS tracking... Direction: ${routeDirection === 'to' ? 'TO College' : 'FROM College'}`);
    setCurrentStopIndex(0);
    setArrivedStops([]);
    setBusLocation(currentRoute[0]);
    setJourneyStarted(true); // Mark journey as explicitly started
    setIsLive(true); // Transition to In-Transit view immediately
    
    // Only use real GPS location - no simulation
    startRealTimeLocation();
  }, [startRealTimeLocation, currentRoute, routeDirection]);

  const stopJourney = useCallback(() => {
    console.log('🛑 Stopping journey...');
    if (watchPositionId !== null) {
      stopRealTimeLocation(watchPositionId);
      setWatchPositionId(null);
    }
    setIsLive(false);
    setIsUsingRealLocation(false);
    setLocationError(null);
    setJourneyStarted(false); // Reset journey started flag
  }, [watchPositionId, stopRealTimeLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchPositionId !== null) {
        stopRealTimeLocation(watchPositionId);
      }
    };
  }, [watchPositionId, stopRealTimeLocation]);

  // 🔥 FIREBASE LISTENER - Navigators listen for pilot's location updates
  useEffect(() => {
    if (role === 'navigator') {
      console.log('🧭 Navigator mode: Listening for pilot\'s location from Firebase...');
      
      const busRef = ref(database, `buses/${BUS_ID}`);
      
      onValue(busRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        
        if (data && data.isLive) {
          console.log('📡 Received pilot location from Firebase:', data);
          
          // Update state with pilot's real-time location ONLY if pilot is actively live
          if (data.location) {
            setBusLocation(data.location);
          }
          if (typeof data.currentStopIndex === 'number') {
            setCurrentStopIndex(data.currentStopIndex);
          }
          if (typeof data.isLive === 'boolean') {
            setIsLive(data.isLive);
          }
          if (typeof data.isUsingRealLocation === 'boolean') {
            setIsUsingRealLocation(data.isUsingRealLocation);
          }
          if (Array.isArray(data.arrivedStops)) {
            setArrivedStops(data.arrivedStops);
          }
          if (data.routeDirection === 'to' || data.routeDirection === 'from') {
            setRouteDirection(data.routeDirection);
          }
          // stopRequests are handled by separate listener, no need to sync here
          
          setLocationError(null);
        } else {
          // No data means pilot hasn't started or vehicle is offline
          console.log('⚫ No pilot data in Firebase - vehicle not active');
          setIsLive(false);
          setIsUsingRealLocation(false);
        }
      }, (error: Error) => {
        console.error('❌ Firebase read error:', error);
        setLocationError('Unable to connect to server. Please check your internet connection.');
      });
      
      // Cleanup listener on unmount or role change
      return () => {
        console.log('🔌 Unsubscribing from Firebase listener');
        off(busRef);
      };
    }
  }, [role, journeyStarted]);

  // 🔥 FIREBASE LISTENER FOR STOP REQUESTS - Works for both pilots and navigators
  useEffect(() => {
    console.log('🙋 Setting up real-time listener for stop requests...');
    
    const stopRequestsRef = ref(database, `buses/${BUS_ID}/stopRequests`);
    
    onValue(stopRequestsRef, (snapshot: DataSnapshot) => {
      const requests = snapshot.val() || [];
      console.log(`📩 Stop requests updated from Firebase:`, requests);
      setStopRequests(requests);
    }, (error: Error) => {
      console.error('❌ Firebase stop requests read error:', error);
    });
    
    // Cleanup listener on unmount
    return () => {
      console.log('🔌 Unsubscribing from stop requests listener');
      off(stopRequestsRef);
    };
  }, []); // Run once on mount

  // Pilot: Update Firebase when journey status changes
  useEffect(() => {
    if (role === 'pilot') {
      if (isLive && journeyStarted) {
        // Pilot actively journeying - sync location (DON'T sync stopRequests here, they're managed separately)
        const busRef = ref(database, `buses/${BUS_ID}`);
        set(busRef, {
          location: busLocation,
          currentStopIndex,
          isLive: true,
          isUsingRealLocation,
          timestamp: Date.now(),
          arrivedStops,
          routeDirection
        }).catch((error: Error) => {
          console.error('❌ Firebase update error:', error);
        });
      } else if (!isLive || !journeyStarted) {
        // Pilot stopped or not started - clear/reset Firebase data
        const busRef = ref(database, `buses/${BUS_ID}`);
        set(busRef, {
          location: currentRoute[0],
          currentStopIndex: 0,
          isLive: false,
          isUsingRealLocation: false,
          timestamp: Date.now(),
          arrivedStops: [],
          routeDirection
        }).catch((error: Error) => {
          console.error('❌ Firebase clear error:', error);
        });
        
        // Also clear stop requests when journey ends
        const stopRequestsRef = ref(database, `buses/${BUS_ID}/stopRequests`);
        set(stopRequestsRef, []).catch((error: Error) => {
          console.error('❌ Failed to clear stop requests:', error);
        });
      }
    }
  }, [role, isLive, journeyStarted, busLocation, currentStopIndex, isUsingRealLocation, arrivedStops, routeDirection, currentRoute]);

  return (
    <BusContext.Provider
      value={{
        busLocation,
        isLive,
        currentStopIndex,
        startJourney,
        stopJourney,
        setBusLocation,
        locationError,
        isUsingRealLocation,
        moveToNextStop,
        arrivedStops,
        markStopArrived,
        role,
        setRole,
        routeDirection,
        setRouteDirection,
        currentRoute,
        stopRequests,
        requestStop,
        clearStopRequest,
      }}
    >
      {children}
    </BusContext.Provider>
  );
};
