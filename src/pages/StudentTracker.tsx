import { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import { useBus } from '../context/useBus';
import { ROUTE_DATA } from '../context/routeData';
import { ChevronLeft, RotateCcw, Home, MapPin, User, Plus, Minus, Compass, Search, Calendar, Bell, BellOff } from 'lucide-react';
import { requestNotificationPermission, sendBusApproachingNotification, sendJourneyStartNotification } from '../utils/notifications';
import 'leaflet/dist/leaflet.css';

// Component to sync map view with bus location
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
        // Smoothly pan to new bus location
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

const StudentTracker = () => {
  const { busLocation, isLive, currentStopIndex, locationError, isUsingRealLocation } = useBus();
  const [showFullMap, setShowFullMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'tracker' | 'schedule' | 'alerts'>('tracker');
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const lastNotifiedStopIndexRef = useRef<number>(-1);
  const [gpsPath, setGpsPath] = useState<LatLngExpression[]>([]);
  const [autoFollowBus, setAutoFollowBus] = useState(true);
  const gpsPathRef = useRef<LatLngExpression[]>([]);
  
  // Reset path when journey stops
  useEffect(() => {
    if (!isLive && gpsPathRef.current.length > 0) {
      gpsPathRef.current = [];
      setGpsPath([]);
    }
  }, [isLive]);

  // Track GPS path history - syncing with GPS is a valid use case
  useEffect(() => {
    if (isLive && isUsingRealLocation) {
      const newPoint: LatLngExpression = [busLocation.lat, busLocation.lng];
      
      // First point
      if (gpsPathRef.current.length === 0) {
        const newPath = [newPoint];
        gpsPathRef.current = newPath;
        setGpsPath(newPath);
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
        gpsPathRef.current = newPath;
        setGpsPath(newPath);
      }
    }
  }, [busLocation, isLive, isUsingRealLocation]);

  // Request notification permission on mount
  useEffect(() => {
    const checkNotifications = async () => {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
    };
    checkNotifications();
  }, []);

  // Send notification when journey starts
  useEffect(() => {
    if (isLive && notificationsEnabled) {
      sendJourneyStartNotification();
    }
  }, [isLive, notificationsEnabled]);

  // Send notification when bus is approaching (2 stops away)
  useEffect(() => {
    if (isLive && notificationsEnabled && currentStopIndex > lastNotifiedStopIndexRef.current) {
      // Notify when bus is close to your stop (you can customize the stop index)
      const yourStopIndex = 2; // Example: user's stop is index 2
      
      if (currentStopIndex === yourStopIndex - 1) {
        sendBusApproachingNotification(ROUTE_DATA[yourStopIndex].name);
        lastNotifiedStopIndexRef.current = currentStopIndex;
      }
    }
  }, [isLive, currentStopIndex, notificationsEnabled]);

  // Create custom bus icon
  const busIcon = divIcon({
    html: '<div style="font-size: 40px; transition: all 1s linear;">🚌</div>',
    className: 'bus-marker',
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
    if (!isLive || currentStopIndex >= ROUTE_DATA.length - 1) {
      return 0;
    }

    const nextStop = ROUTE_DATA[currentStopIndex + 1];
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
    const allPoints: LatLngExpression[] = ROUTE_DATA.map((stop) => [stop.lat, stop.lng]);
    
    if (!isLive) {
      return {
        passed: [],
        upcoming: allPoints,
      };
    }

    const currentBusPoint: LatLngExpression = [busLocation.lat, busLocation.lng];
    const passedPoints = allPoints.slice(0, currentStopIndex + 1);
    const upcomingPoints = allPoints.slice(currentStopIndex);

    return {
      passed: [...passedPoints, currentBusPoint],
      upcoming: [currentBusPoint, ...upcomingPoints],
    };
  };

  const { passed, upcoming } = getRouteSegments();

  const getCurrentStop = () => {
    if (currentStopIndex >= ROUTE_DATA.length) {
      return ROUTE_DATA[ROUTE_DATA.length - 1];
    }
    return ROUTE_DATA[currentStopIndex];
  };

  if (showFullMap) {
    // FULL MAP VIEW
    return (
      <div className="relative h-screen w-screen bg-orange-100">
        {/* Map */}
        <MapContainer
          center={[17.4833, 78.5000]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
            errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />

          {/* Map View Sync */}
          <MapUpdater busLocation={busLocation} isLive={isLive} autoFollow={autoFollowBus} />

          {/* Real GPS Path - Traveled Route (Red Line) */}
          {gpsPath.length > 1 && isUsingRealLocation && (
            <Polyline
              positions={gpsPath}
              color="#ef4444"
              weight={6}
              opacity={0.9}
              lineJoin="round"
              lineCap="round"
            />
          )}

          {/* Planned Route Lines (if not using GPS path) */}
          {!isUsingRealLocation && passed.length > 1 && (
            <Polyline
              positions={passed}
              color="#d0d0d0"
              weight={5}
              opacity={0.7}
              dashArray="8, 8"
            />
          )}
          {upcoming.length > 1 && (
            <Polyline
              positions={upcoming}
              color="#3b82f6"
              weight={4}
              opacity={0.5}
              dashArray="10, 10"
            />
          )}

          {/* Stop Indicators */}
          {ROUTE_DATA.map((stop, index) => {
            const isPassed = isLive && index < currentStopIndex;
            const isCurrent = isLive && index === currentStopIndex;

            return (
              <Circle
                key={stop.id}
                center={[stop.lat, stop.lng]}
                radius={100}
                pathOptions={{
                  color: isPassed ? '#ef4444' : isCurrent ? '#f59e0b' : '#10b981',
                  fillColor: isPassed ? '#ef4444' : isCurrent ? '#f59e0b' : '#10b981',
                  fillOpacity: 0.8,
                }}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-bold">{stop.name}</p>
                    <p className="text-sm text-gray-600">{stop.time}</p>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* Bus Marker */}
          {isLive && isUsingRealLocation && (
            <Marker position={[busLocation.lat, busLocation.lng]} icon={busIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">🚌 Bus (Live GPS)</p>
                  <p className="text-sm">Route 42</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {busLocation.lat.toFixed(6)}, {busLocation.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowFullMap(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="text-xs font-bold text-orange-600 uppercase">Route 42</p>
                  {isUsingRealLocation && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      📡 LIVE GPS
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-gray-900">{eta} Mins Away</p>
              </div>
              <button 
                onClick={() => setAutoFollowBus(!autoFollowBus)}
                className={`p-2 rounded-full transition ${
                  autoFollowBus 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Compass className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 text-center">{getCurrentStop().name}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-24 left-4 right-4 z-[1000]">
          <div className="bg-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for stops or landmarks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
            />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-[1000] space-y-2">
          <button className="bg-white hover:bg-gray-100 text-gray-700 w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
            <Plus className="w-5 h-5" />
          </button>
          <button className="bg-white hover:bg-gray-100 text-gray-700 w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
            <Minus className="w-5 h-5" />
          </button>
        </div>

        {/* Location Follow Button */}
        <div className="absolute right-4 bottom-24 z-[1000]">
          <button 
            onClick={() => setAutoFollowBus(!autoFollowBus)}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition ${
              autoFollowBus 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
            title={autoFollowBus ? 'Auto-follow ON' : 'Auto-follow OFF'}
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] flex items-center justify-around h-16 shadow-2xl">
          <button
            onClick={() => setShowFullMap(false)}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-500 transition py-2"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-blue-500 transition py-2">
            <MapPin className="w-5 h-5" />
            <span className="text-xs">Map</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-500 transition py-2">
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    );
  }

  // STUDENT HOME VIEW WITH TABS
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full">
              <User className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Student Home</h1>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          {/* Debug Status */}
          <div className="mt-2 text-center">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              isLive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {isLive ? '🟢 Driver Active' : '⚫ Waiting for Driver'}
            </span>
          </div>
        </div>

        {/* ETA Display (Always Visible) */}
        {isLive && (
          <div className="bg-white border-b border-gray-200 px-4 py-6">
            <div className="text-center">
              <p className="text-teal-600 font-bold text-xs uppercase mb-2">ETA</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-1">{eta} mins</h2>
              <p className="text-gray-600 text-sm">Approaching {getCurrentStop().name}</p>
            </div>
            {/* Debug Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">📡 Real-Time GPS Data:</p>
              <p>📍 Bus GPS: {busLocation.lat.toFixed(6)}, {busLocation.lng.toFixed(6)}</p>
              <p>🛑 Current Stop: {getCurrentStop().name} (#{currentStopIndex + 1})</p>
              <p>✅ GPS Status: {isUsingRealLocation ? 'Active' : 'Waiting...'}</p>
              <p>🛤️ GPS Path Points: {gpsPath.length}</p>
              <button
                onClick={() => setShowFullMap(true)}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                View Full Map
              </button>
            </div>
          </div>
        )}

        {/* Main Content Based on Active Tab */}
        <div className="flex-1 overflow-y-auto pb-20 w-full">
          {!isLive ? (
            <div className="text-center py-12 px-4">
              <p className="text-5xl mb-4">📡</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">⚫ Bus Not Active</p>
              <p className="text-gray-600 mb-2">Driver hasn't started GPS tracking yet</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-left">
                <p className="text-xs text-blue-700">
                  <span className="font-bold">ℹ️ Note:</span> This app uses real GPS tracking only. 
                  When the driver starts the journey, you'll see their live location on the map.
                </p>
              </div>
            </div>
          ) : activeTab === 'tracker' ? (
            // TRACKER TAB - Show Map
            <div className="w-full h-full flex flex-col p-4">
              {/* Location Status Banner */}
              <div className={`rounded-lg p-3 mb-4 flex items-center gap-2 border ${
                isUsingRealLocation 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <span className="text-lg">
                  {isUsingRealLocation ? '📡' : '❌'}
                </span>
                <div className="flex-1">
                  <span className={`text-xs font-bold ${
                    isUsingRealLocation ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {isUsingRealLocation 
                      ? '✅ Real GPS Broadcasting' 
                      : '❌ GPS Not Active'}
                  </span>
                  {locationError && (
                    <p className="text-xs text-red-600 mt-0.5">Driver's GPS is unavailable</p>
                  )}
                </div>
              </div>
              
              {/* Mini Map */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 flex-1 min-h-0 relative">
                <MapContainer
                  center={[busLocation.lat, busLocation.lng]}
                  zoom={15}
                  style={{ height: '100%', width: '100%', minHeight: '400px' }}
                  zoomControl={false}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    maxZoom={19}
                    errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                  />
                  <MapUpdater busLocation={busLocation} isLive={isLive} autoFollow={autoFollowBus} />
                  
                  {/* Real GPS Path - Red line showing traveled route */}
                  {gpsPath.length > 1 && isUsingRealLocation && (
                    <Polyline
                      positions={gpsPath}
                      color="#ef4444"
                      weight={5}
                      opacity={0.9}
                      lineJoin="round"
                      lineCap="round"
                    />
                  )}
                  
                  {/* Planned Route (Dashed blue line) */}
                  {upcoming.length > 1 && (
                    <Polyline
                      positions={upcoming}
                      color="#3b82f6"
                      weight={3}
                      opacity={0.4}
                      dashArray="8, 8"
                    />
                  )}
                  
                  {/* Bus Marker */}
                  {isLive && isUsingRealLocation && (
                    <Marker position={[busLocation.lat, busLocation.lng]} icon={busIcon}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold">🚌 Your Bus (Live GPS)</p>
                          <p className="text-sm">{getCurrentStop().name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {busLocation.lat.toFixed(6)}, {busLocation.lng.toFixed(6)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Stops */}
                  {ROUTE_DATA.map((stop, index) => (
                    <Circle
                      key={stop.id}
                      center={[stop.lat, stop.lng]}
                      radius={60}
                      pathOptions={{
                        color: index < currentStopIndex ? '#ef4444' : index === currentStopIndex ? '#f59e0b' : '#10b981',
                        fillColor: index < currentStopIndex ? '#ef4444' : index === currentStopIndex ? '#f59e0b' : '#10b981',
                        fillOpacity: 0.7,
                      }}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold text-sm">{stop.name}</p>
                          <p className="text-xs text-gray-600">{stop.time}</p>
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                </MapContainer>
                
                {/* Map Legend */}
                <div className="absolute bottom-2 left-2 bg-white rounded-lg p-2 shadow-md text-xs z-[1000]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-1 bg-red-500 rounded"></div>
                    <span className="text-gray-700">GPS Path</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-400 rounded" style={{backgroundImage: 'repeating-linear-gradient(90deg, #3b82f6 0, #3b82f6 4px, transparent 4px, transparent 8px)'}}></div>
                    <span className="text-gray-700">Planned</span>
                  </div>
                </div>
                
                {/* Auto-follow Toggle */}
                <button 
                  onClick={() => setAutoFollowBus(!autoFollowBus)}
                  className={`absolute bottom-2 right-2 p-2 rounded-lg shadow-md transition z-[1000] ${
                    autoFollowBus 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700'
                  }`}
                  title={autoFollowBus ? 'Auto-follow ON' : 'Auto-follow OFF'}
                >
                  <Compass className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : activeTab === 'schedule' ? (
            // SCHEDULE TAB - Show Routes with Times
            <div className="w-full h-full p-4">
              <div className="space-y-3">
                {ROUTE_DATA.map((stop, index) => {
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

                      {/* Selected Stop Info */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                          {isCurrent ? (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4">
                              <p className="text-green-700 font-bold text-xs uppercase tracking-wide">🎉 Current Stop</p>
                              <h3 className="text-2xl font-bold text-green-900 mt-2">{stop.name}</h3>
                              <p className="text-green-700 font-semibold text-sm mt-3 bg-green-100 rounded-lg p-2 text-center">
                                Your bus has arrived! Get ready! ✓
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
                                <p className="text-blue-600 text-xs">Bus arrival time: {stop.time}</p>
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
            // ALERTS TAB - Notification Settings
            <div className="w-full h-full p-4">
              <div className="space-y-4">
                {/* Notification Toggle */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {notificationsEnabled ? (
                        <Bell className="w-6 h-6 text-blue-500" />
                      ) : (
                        <BellOff className="w-6 h-6 text-gray-400" />
                      )}
                      <div>
                        <p className="font-bold text-gray-900">Push Notifications</p>
                        <p className="text-xs text-gray-500">Get alerts when bus is near</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const granted = await requestNotificationPermission();
                        setNotificationsEnabled(granted);
                      }}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                        notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {!notificationsEnabled && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 space-y-3">
                      <div>
                        <p className="font-semibold">⚠️ Notifications Disabled</p>
                        <p className="mt-1">Enable notifications to get real-time alerts when the bus approaches your stop.</p>
                      </div>
                      
                      {/* Chrome Instructions */}
                      <div className="bg-amber-100 rounded-lg p-3 space-y-2">
                        <p className="font-bold text-amber-800">📱 Enable Notifications in Chrome:</p>
                        <ol className="ml-4 list-decimal space-y-1 text-amber-700">
                          <li>Click the <strong>lock icon (🔒)</strong> in the address bar</li>
                          <li>Find "Notifications" and set to <strong>"Allow"</strong></li>
                          <li>Refresh this page and try again</li>
                        </ol>
                      </div>
                      
                      {/* Alternative method */}
                      <div className="bg-amber-100 rounded-lg p-3">
                        <p className="font-bold text-amber-800 mb-1">Or via Settings:</p>
                        <p className="text-amber-700">Chrome Settings → Privacy and Security → Site Settings → Notifications → Add this site to "Allowed"</p>
                      </div>
                      
                      <p className="font-semibold text-amber-800 mt-2">
                        💡 Notifications are optional. The tracker works without them.
                      </p>
                    </div>
                  )}
                </div>

                {/* Active Alerts */}
                {isLive && notificationsEnabled ? (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex items-start gap-3 mb-4">
                      <Bell className="w-6 h-6 text-blue-600 mt-1" />
                      <div>
                        <p className="font-bold text-blue-900">Active Monitoring</p>
                        <p className="text-sm text-blue-700 mt-1">
                          We'll notify you when the bus is approaching your stop.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-2">Current Status</p>
                      <p className="font-bold text-gray-900">Bus at: {getCurrentStop().name}</p>
                      <p className="text-sm text-gray-600 mt-1">Stop {currentStopIndex + 1} of {ROUTE_DATA.length}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-5xl mb-3">🔔</p>
                    <p className="text-gray-700 font-bold">No Active Alerts</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {!isLive 
                        ? "Waiting for bus to start journey" 
                        : "Enable notifications to receive alerts"}
                    </p>
                  </div>
                )}

                {/* Notification History */}
                {notificationsEnabled && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <p className="font-bold text-gray-900 mb-3">Notification Settings</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700">Bus approaching alert</span>
                        <span className="text-xs text-green-600 font-semibold">✓ Active</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700">Journey start/end</span>
                        <span className="text-xs text-green-600 font-semibold">✓ Active</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700">Route delays</span>
                        <span className="text-xs text-gray-400">Coming soon</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center gap-1 transition py-2 flex-1 ${
            activeTab === 'alerts'
              ? 'text-blue-500'
              : 'text-gray-400 hover:text-blue-500'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-xs font-medium">Alerts</span>
        </button>
      </div>
    </div>
  );
};

export default StudentTracker;
