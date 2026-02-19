import React, { createContext, useState, useEffect, type ReactNode } from 'react';
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
}

export const BusContext = createContext<BusContextType | undefined>(undefined);

export const BusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [busLocation, setBusLocation] = useState<BusLocation>(ROUTE_DATA[0]);
  const [isLive, setIsLive] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchPositionId, setWatchPositionId] = useState<number | null>(null);

  // Real Device Location Tracking
  const startRealTimeLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported on this device');
      startSimulationEngine();
      return;
    }

    // Request permission and start watching position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setBusLocation({
          lat: latitude,
          lng: longitude
        });
        setLocationError(null);
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        // User denied permission or temporarily blocked
        if (error.code === 1) {
          setLocationError('Location permission denied. Using simulated route instead.');
        } else if (error.code === 2) {
          setLocationError('Unable to retrieve location. Using simulated route instead.');
        } else if (error.code === 3) {
          setLocationError('Location request timeout. Using simulated route instead.');
        } else {
          setLocationError('Location access unavailable. Using simulated route instead.');
        }
        
        // Fallback to simulation if real location not available
        startSimulationEngine();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    ) as unknown as number;

    setWatchPositionId(id);
  };

  const stopRealTimeLocation = (id: number | null) => {
    if (id !== null) {
      navigator.geolocation.clearWatch(id);
    }
  };

  // Simulation Engine as Fallback
  const startSimulationEngine = () => {
    const id = setInterval(() => {
      setCurrentStopIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        
        if (nextIndex >= ROUTE_DATA.length) {
          clearInterval(id);
          setIsLive(false);
          return prevIndex;
        }

        setBusLocation({
          lat: ROUTE_DATA[nextIndex].lat,
          lng: ROUTE_DATA[nextIndex].lng
        });

        return nextIndex;
      });
    }, 3000);

    setIntervalId(id);
  };

  // Simulation Engine - Moves bus through route points
  const startJourney = () => {
    setIsLive(true);
    setCurrentStopIndex(0);
    setBusLocation(ROUTE_DATA[0]);
    
    // Try to get real device location first
    if (navigator.geolocation) {
      startRealTimeLocation();
    } else {
      // Fallback to simulation
      startSimulationEngine();
    }
  };

  const stopJourney = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    if (watchPositionId !== null) {
      stopRealTimeLocation(watchPositionId);
      setWatchPositionId(null);
    }
    setIsLive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (watchPositionId !== null) {
        stopRealTimeLocation(watchPositionId);
      }
    };
  }, [intervalId, watchPositionId]);

  return (
    <BusContext.Provider
      value={{
        busLocation,
        isLive,
        currentStopIndex,
        startJourney,
        stopJourney,
        setBusLocation,
        locationError
      }}
    >
      {children}
    </BusContext.Provider>
  );
};
