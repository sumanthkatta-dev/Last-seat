import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import { useBus } from '../context/useBus';
import { MapPin, Calendar, User, Share2, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Component to sync map view with vehicle location
const MapUpdater = ({ busLocation, isLive, autoFollow }: { 
  busLocation: { lat: number; lng: number }; 
  isLive: boolean;
  autoFollow: boolean;
}) => {
  const map = useMap();
  const prevLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isLive && autoFollow) {
      const prevLocation = prevLocationRef.current;
      const hasLocationChanged = !prevLocation || 
        Math.abs(prevLocation.lat - busLocation.lat) > 0.0001 ||
        Math.abs(prevLocation.lng - busLocation.lng) > 0.0001;

      if (hasLocationChanged) {
        // Smoothly pan to new vehicle location
        map.setView([busLocation.lat, busLocation.lng], map.getZoom(), {
          animate: true,
          duration: 1
        });
        prevLocationRef.current = busLocation;
      }
    }
  }, [busLocation, isLive, autoFollow, map]);

  return null;
};

const NavigatorTracker = () => {
  const { busLocation, isLive, currentStopIndex, isUsingRealLocation, routeDirection, currentRoute, stopRequests, requestStop } = useBus();
  const [activeTab, setActiveTab] = useState<'tracker' | 'schedule' | 'profile'>('tracker');
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [gpsPath, setGpsPath] = useState<LatLngExpression[]>([]);
  const [showBanner, setShowBanner] = useState(true);
  const gpsPathRef = useRef<LatLngExpression[]>([]);
  const [autoFollowVehicle] = useState(true);
  
  // Request notification permission when component loads
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('✅ Passenger notifications enabled');
        }
      });
    }
  }, []);
  
  // Notify passenger when bus reaches their requested stop
  useEffect(() => {
    const notifiedStops = new Set<number>();
    
    return () => {
      stopRequests.forEach(request => {
        if (currentStopIndex === request.stopId && !notifiedStops.has(request.stopId)) {
          notifiedStops.add(request.stopId);
          
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('🚌 Bus Arrived!', {
              body: `Your bus has arrived at ${request.stopName}. Please get ready to board!`,
              icon: '/bus-icon.png',
              tag: `arrival-${request.stopId}`,
              requireInteraction: false
            });
            
            setTimeout(() => {
              notification.close();
            }, 8000);
          }
        }
      });
    };
  }, [currentStopIndex, stopRequests]);
  
  // Update gpsPath state when ref changes
  const updateGpsPath = useCallback((newPath: LatLngExpression[]) => {
    gpsPathRef.current = newPath;
    setGpsPath(newPath);
  }, []);
  
  // Reset path when journey stops
  // @eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isLive && gpsPathRef.current.length > 0) {
      updateGpsPath([]);
    }
  }, [isLive]);

  // Track GPS path history - syncing with GPS is a valid use case
  // @eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isLive && isUsingRealLocation) {
      const newPoint: LatLngExpression = [busLocation.lat, busLocation.lng];
      
      // First point
      if (gpsPathRef.current.length === 0) {
        updateGpsPath([newPoint]);
        return;
      }
      
      // Calculate distance from last point
      const lastPoint = gpsPathRef.current[gpsPathRef.current.length - 1] as [number, number];
      const distanceFromLast = Math.sqrt(
        Math.pow(lastPoint[0] - busLocation.lat, 2) + 
        Math.pow(lastPoint[1] - busLocation.lng, 2)
      );
      
      // Add point if moved more than ~10 meters (0.0001 degrees ≈ 11m)
      if (distanceFromLast > 0.0001) {
        const newPath = [...gpsPathRef.current, newPoint];
        updateGpsPath(newPath);
      }
    }
  }, [busLocation, isLive, isUsingRealLocation]);

  // Create custom vehicle icon
  const vehicleIcon = divIcon({
    html: '<div style="font-size: 40px; transition: all 1s linear;">🚌</div>',
    className: 'vehicle-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Calculate ETA to next stop
  const eta = useMemo(() => {
    if (!isLive || currentStopIndex >= currentRoute.length - 1) {
      return 0;
    }

    const nextStop = currentRoute[currentStopIndex + 1];
    const distance = calculateDistance(
      busLocation.lat,
      busLocation.lng,
      nextStop.lat,
      nextStop.lng
    );

    const timeInMinutes = (distance / 1000 / 30) * 60;
    return Math.ceil(timeInMinutes);
  }, [busLocation, currentStopIndex, isLive]);

  // Split route into passed and upcoming segments
  const getRouteSegments = () => {
    const allPoints: LatLngExpression[] = currentRoute.map((stop) => [stop.lat, stop.lng]);
    
    if (!isLive) {
      return {
        passed: [],
        upcoming: allPoints,
      };
    }

    const currentVehiclePoint: LatLngExpression = [busLocation.lat, busLocation.lng];
    const passedPoints = allPoints.slice(0, currentStopIndex + 1);
    const upcomingPoints = allPoints.slice(currentStopIndex);

    return {
      passed: [...passedPoints, currentVehiclePoint],
      upcoming: [currentVehiclePoint, ...upcomingPoints],
    };
  };

  // Used in map for planned route visualization (kept for future use)
  getRouteSegments();

  const getCurrentStop = () => {
    if (currentStopIndex >= currentRoute.length) {
      return currentRoute[currentRoute.length - 1];
    }
    return currentRoute[currentStopIndex];
  };

  // MAIN VIEW
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-sm mx-auto w-full flex flex-col h-screen">
        
        {activeTab === 'tracker' ? (
          // TRACKER TAB - Full Screen Map
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-10">
              <h1 className="text-lg font-bold text-gray-900">Last Seat</h1>
              <button className="text-gray-700 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>

            {/* Banner */}
            {showBanner && isLive && (
              <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900">Your trip isn't - get ready</p>
                  <p className="text-xs text-amber-800 mt-0.5">Better your seating</p>
                </div>
                <button onClick={() => setShowBanner(false)} className="text-amber-600 hover:text-amber-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Full Screen Map */}
            <div className="flex-1 relative">
              <MapContainer
                center={[busLocation.lat, busLocation.lng]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                  maxZoom={19}
                />
                <MapUpdater busLocation={busLocation} isLive={isLive} autoFollow={autoFollowVehicle} />
                
                {/* GPS Path */}
                {gpsPath.length > 1 && (
                  <Polyline
                    positions={gpsPath}
                    color="#2563eb"
                    weight={4}
                    opacity={0.8}
                  />
                )}
                
                {/* Vehicle Marker */}
                {isUsingRealLocation && (
                  <Marker position={[busLocation.lat, busLocation.lng]} icon={vehicleIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold">🚌 Live Location</p>
                        <p className="text-xs">{getCurrentStop().name}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Stop Markers */}
                {currentRoute.map((stop, index) => (
                  <Circle
                    key={stop.id}
                    center={[stop.lat, stop.lng]}
                    radius={50}
                    pathOptions={{
                      color: index <= currentStopIndex ? '#2563eb' : '#9ca3af',
                      fillColor: index <= currentStopIndex ? '#2563eb' : '#9ca3af',
                      fillOpacity: 0.5,
                    }}
                  >
                    <Popup>
                      <div>
                        <p className="font-bold text-sm">{stop.name}</p>
                        <p className="text-xs text-gray-500">{stop.time}</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            </div>

            {/* Bottom Info Card - ETA Overlay */}
            {isLive && (
              <div className="absolute bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-[999]">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Arriving soon</p>
                <h2 className="text-5xl font-bold text-gray-900 mt-1">{eta} <span className="text-2xl">min</span></h2>
                <div className="mt-3 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{getCurrentStop().name}</p>
                    <p className="text-xs text-gray-500">Your destination</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg transition text-sm">
                    <Share2 className="w-4 h-4" />
                    Share Status
                  </button>
                  <button 
                    onClick={() => {
                      const currentStop = getCurrentStop();
                      requestStop(currentStop.id, currentStop.name);
                    }}
                    disabled={stopRequests.some(r => r.stopId === getCurrentStop().id)}
                    className={`flex-1 font-semibold py-2 px-3 rounded-lg transition text-sm ${
                      stopRequests.some(r => r.stopId === getCurrentStop().id)
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : 'bg-red-50 hover:bg-red-100 text-red-600'
                    }`}
                  >
                    {stopRequests.some(r => r.stopId === getCurrentStop().id) ? '✓ Requested' : '🙋 Request Stop'}
                  </button>
                </div>
              </div>
            )}

            {!isLive && (
              <div className="absolute bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl p-6 z-[999] text-center">
                <p className="text-4xl mb-3">📡</p>
                <p className="font-bold text-gray-900">Vehicle Not Active</p>
                <p className="text-sm text-gray-600 mt-2">Waiting for driver to start journey</p>
              </div>
            )}
          </>
        ) : activeTab === 'schedule' ? (
          <div className="w-full p-4 flex-1 overflow-y-auto pb-20">
            <div className="space-y-3">
                {currentRoute.map((stop, index) => {
                  const isCurrent = index === currentStopIndex;
                  const isPassed = index < currentStopIndex;
                  const isSelected = selectedStopId === stop.id;

                  return (
                    <button
                      key={stop.id}
                      onClick={() => setSelectedStopId(isSelected ? null : stop.id)}
                      className={`w-full text-left transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-500 rounded-2xl shadow-md'
                          : 'bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm'
                      } p-4`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 mt-1 flex items-center justify-center font-bold text-white text-xs transition-all ${
                          isPassed
                            ? 'bg-red-500'
                            : isCurrent
                            ? 'bg-gradient-to-br from-green-400 to-green-600 ring-2 ring-green-300'
                            : isSelected
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold transition-colors ${
                            isPassed 
                              ? 'text-gray-400' 
                              : isCurrent 
                              ? 'text-green-700 text-lg' 
                              : 'text-gray-900'
                          }`}>
                            {stop.name}
                          </p>
                          <p className={`text-xs transition-colors ${isPassed ? 'text-gray-400' : 'text-gray-600'}`}>
                            {stop.time}
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 shadow-md">
                            NOW
                          </span>
                        )}
                        {!isPassed && !isCurrent && (
                          <span className="text-gray-400 text-lg flex-shrink-0">→</span>
                        )}
                      </div>

                      {/* Request Stop Button - Always Visible for Upcoming Stops */}
                      {!isPassed && !isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestStop(stop.id, stop.name);
                          }}
                          disabled={stopRequests.some(r => r.stopId === stop.id)}
                          className={`w-full mt-3 py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                            stopRequests.some(r => r.stopId === stop.id)
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <span className="text-lg">{stopRequests.some(r => r.stopId === stop.id) ? '✓' : '🙋'}</span>
                          {stopRequests.some(r => r.stopId === stop.id) ? 'Request Sent' : 'Request Stop'}
                        </button>
                      )}

                      {/* Selected Stop Info */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                          {isCurrent ? (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4">
                              <p className="text-green-700 font-bold text-xs uppercase tracking-wide">🎉 Current Stop</p>
                              <h3 className="text-2xl font-bold text-green-900 mt-2">{stop.name}</h3>
                              <p className="text-green-700 font-semibold text-sm mt-3 bg-green-100 rounded-lg p-2 text-center">
                                Your vehicle has arrived! Get ready! ✓
                              </p>
                            </div>
                          ) : isPassed ? (
                            <div className="bg-gray-100 rounded-xl p-4 border border-gray-300">
                              <p className="text-gray-700 font-bold text-xs uppercase">Previous Stop</p>
                              <h3 className="text-lg font-bold text-gray-900 mt-2">{stop.name}</h3>
                              <p className="text-gray-600 text-xs mt-2">✓ This stop has been completed</p>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-400 rounded-xl p-4">
                              <p className="text-blue-700 font-bold text-xs uppercase tracking-wide">📍 Your Stop Ahead</p>
                              <h3 className="text-2xl font-bold text-blue-900 mt-2">{stop.name}</h3>
                              <div className="mt-3 space-y-2">
                                <p className="text-blue-700 font-bold text-sm">
                                  Ready in <span className="text-2xl text-blue-600">{Math.max(0, eta - Math.ceil((index - currentStopIndex) * 3))}</span> mins
                                </p>
                                <p className="text-blue-600 text-xs">Vehicle arrival time: {stop.time}</p>
                              </div>
                              <p className="text-blue-700 text-xs mt-3 bg-blue-100 rounded-lg p-2 text-center font-semibold">
                                Get ready at your location
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ) : (
          // PROFILE TAB
          <div className="w-full p-4 flex-1 overflow-y-auto pb-20">
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl">
                    👤
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Passenger</p>
                    <p className="text-sm text-gray-600">Route 13 Tracker</p>
                    <p className="text-xs text-blue-600 mt-1">Active</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Current Route</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    Route 13 {routeDirection === 'to' ? '(TO College)' : '(FROM College)'}
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Trips This Week</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">5 Trips</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase">Total Distance</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">24.5 km</p>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <p className="font-bold text-gray-900 mb-3">Settings</p>
                <button className="w-full text-left py-2 px-3 hover:bg-gray-50 rounded-lg transition text-sm font-medium text-gray-700">
                  🔔 Notifications
                </button>
                <button className="w-full text-left py-2 px-3 hover:bg-gray-50 rounded-lg transition text-sm font-medium text-gray-700">
                  🗣️ Feedback & Support
                </button>
                <button className="w-full text-left py-2 px-3 hover:bg-gray-50 rounded-lg transition text-sm font-medium text-gray-700">
                  ⚙️ Preferences
                </button>
                <button className="w-full text-left py-2 px-3 hover:bg-red-50 rounded-lg transition text-sm font-medium text-red-600">
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-white border-t border-gray-200 z-[1000] flex items-center justify-around h-16 shadow-2xl w-full max-w-sm">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center gap-1 transition py-2 flex-1 ${
            activeTab === 'tracker'
              ? 'text-blue-500'
              : 'text-gray-400 hover:text-blue-500'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-xs font-medium">Tracker</span>
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center gap-1 transition py-2 flex-1 ${
            activeTab === 'schedule'
              ? 'text-blue-500'
              : 'text-gray-400 hover:text-blue-500'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-xs font-medium">Schedule</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition py-2 flex-1 ${
            activeTab === 'profile'
              ? 'text-blue-500'
              : 'text-gray-400 hover:text-blue-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default NavigatorTracker;
