import React, { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { ROUTE_DATA } from './routeData';

interface BusLocation {
  lat: number;
  lng: number;
}

interface BusContextType {
  busLocation: BusLocation;
  isLive: boolean;
  currentStopIndex: number;
  startJourney: () => void;
  stopJourney: () => void;
  setBusLocation: (location: BusLocation) => void;
  locationError: string | null;
  isUsingRealLocation: boolean;
  moveToNextStop: () => void;
  arrivedStops: number[];
  markStopArrived: (stopIndex: number) => void;
}

export const BusContext = createContext<BusContextType | undefined>(undefined);

export const BusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [busLocation, setBusLocation] = useState<BusLocation>(ROUTE_DATA[0]);
  const [isLive, setIsLive] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchPositionId, setWatchPositionId] = useState<number | null>(null);
  const [isUsingRealLocation, setIsUsingRealLocation] = useState(false);
  const [arrivedStops, setArrivedStops] = useState<number[]>([]);

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

    ROUTE_DATA.forEach((stop, index) => {
      const distance = calculateDistance(location.lat, location.lng, stop.lat, stop.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }, [calculateDistance]);

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
        
        setBusLocation({
          lat: latitude,
          lng: longitude
        });
        
        // Update current stop based on actual location
        const nearestStopIndex = findNearestStop({ lat: latitude, lng: longitude });
        setCurrentStopIndex(nearestStopIndex);
        
        setLocationError(null);
        setIsUsingRealLocation(true);
        setIsLive(true);
      },
      (error) => {
        console.error('❌ GPS error:', error);
        
        // Show error and stop journey - NO SIMULATION FALLBACK
        if (error.code === 1) {
          setLocationError('PERMISSION_DENIED: Location access blocked. Click the lock icon (🔒) in your browser address bar and allow location access. Then restart the journey.');
        } else if (error.code === 2) {
          setLocationError('POSITION_UNAVAILABLE: Unable to get GPS signal. Make sure GPS is enabled on your device and you have a clear view of the sky.');
        } else if (error.code === 3) {
          setLocationError('TIMEOUT: GPS took too long to respond. Check your GPS signal strength and try again.');
        } else {
          setLocationError('GPS_ERROR: Location services unavailable. Ensure GPS is enabled in your device settings.');
        }
        
        setIsUsingRealLocation(false);
        setIsLive(false);
      },
      {
        enableHighAccuracy: true, // Force GPS (not network location)
        timeout: 15000,
        maximumAge: 0 // Always get fresh location
      }
    ) as unknown as number;

    setWatchPositionId(id);
  }, [findNearestStop]);

  const stopRealTimeLocation = useCallback((id: number | null) => {
    if (id !== null) {
      console.log('🛑 Stopping real-time location tracking');
      navigator.geolocation.clearWatch(id);
    }
  }, []);

  // Move to next stop (for driver manual control)
  const moveToNextStop = useCallback(() => {
    setCurrentStopIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < ROUTE_DATA.length) {
        setBusLocation({
          lat: ROUTE_DATA[nextIndex].lat,
          lng: ROUTE_DATA[nextIndex].lng
        });
        console.log(`🚌 Manually moved to stop ${nextIndex}: ${ROUTE_DATA[nextIndex].name}`);
      }
      return Math.min(nextIndex, ROUTE_DATA.length - 1);
    });
  }, []);

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

  // Start Journey - GPS ONLY
  const startJourney = useCallback(() => {
    console.log('🚀 Starting journey with REAL GPS tracking...');
    setCurrentStopIndex(0);
    setArrivedStops([]);
    setBusLocation(ROUTE_DATA[0]);
    
    // Only use real GPS location - no simulation
    startRealTimeLocation();
  }, [startRealTimeLocation]);

  const stopJourney = useCallback(() => {
    console.log('🛑 Stopping journey...');
    if (watchPositionId !== null) {
      stopRealTimeLocation(watchPositionId);
      setWatchPositionId(null);
    }
    setIsLive(false);
    setIsUsingRealLocation(false);
    setLocationError(null);
  }, [watchPositionId, stopRealTimeLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchPositionId !== null) {
        stopRealTimeLocation(watchPositionId);
      }
    };
  }, [watchPositionId, stopRealTimeLocation]);

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
      }}
    >
      {children}
    </BusContext.Provider>
  );
};
