import type { RouteStop } from './routeData';

export interface BusLocation {
  lat: number;
  lng: number;
}

export interface StopRequest {
  stopId: number;
  stopName: string;
  passengerId: string;
  timestamp: number;
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
  role: 'pilot' | 'navigator';
  setRole: (role: 'pilot' | 'navigator') => void;
  routeDirection: 'to' | 'from';
  setRouteDirection: (direction: 'to' | 'from') => void;
  currentRoute: RouteStop[];
  stopRequests: StopRequest[];
  requestStop: (stopId: number, stopName: string) => void;
  clearStopRequest: (stopId: number) => void;
  autoDetectedStops: Set<number>;
  departedStops: Set<number>;
  distanceToCurrentStop: number;
}
