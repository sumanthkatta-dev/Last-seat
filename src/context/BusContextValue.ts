import { createContext } from 'react';

export interface BusLocation {
  lat: number;
  lng: number;
}

export interface BusContextType {
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
  role: 'driver' | 'student';
  setRole: (role: 'driver' | 'student') => void;
}

export const BusContext = createContext<BusContextType | undefined>(undefined);
