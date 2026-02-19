import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import { useBus } from '../context/useBus';
import { ROUTE_DATA } from '../context/routeData';
import { ChevronLeft, RotateCcw, Home, MapPin, User, Plus, Minus, Compass, Search, Calendar, Bell } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Component to sync map view with bus location
const MapUpdater = ({ busLocation, isLive }: { busLocation: { lat: number; lng: number }; isLive: boolean }) => {
  const map = useMap();

  if (isLive) {
    // Smoothly pan to bus location
    map.panTo([busLocation.lat, busLocation.lng], { animate: true, duration: 0.5 });
  }

  return null;
};

const StudentTracker = () => {
  const { busLocation, isLive, currentStopIndex, locationError } = useBus();
  const [showFullMap, setShowFullMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const getNextStop = () => {
    if (!isLive || currentStopIndex >= ROUTE_DATA.length - 1) {
      return ROUTE_DATA[0];
    }
    return ROUTE_DATA[currentStopIndex + 1];
  };

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
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Map View Sync */}
          <MapUpdater busLocation={busLocation} isLive={isLive} />

          {/* Route Lines */}
          {passed.length > 1 && (
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
              weight={5}
              opacity={0.9}
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
          {isLive && (
            <Marker position={[busLocation.lat, busLocation.lng]} icon={busIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">Bus Location</p>
                  <p className="text-sm">Route 42</p>
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
                className="bg-white text-gray-700 p-2 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center flex-1">
                <p className="text-xs font-bold text-orange-600 uppercase">Route 42</p>
                <p className="text-lg font-bold text-gray-900">{eta} Mins Away</p>
              </div>
              <button className="bg-blue-100 text-blue-600 p-2 rounded-full">
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 text-center">2HU1 Main Gate</p>
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

        {/* Location Button */}
        <div className="absolute right-4 bottom-24 z-[1000]">
          <button className="bg-blue-500 hover:bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
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

  // STUDENT HOME VIEW
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full pb-20">
        
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
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {!isLive ? (
            <div className="text-center py-12">
              <p className="text-2xl font-bold text-gray-900 mb-2">🔴 Bus Not Active</p>
              <p className="text-gray-600">Driver hasn't started the trip yet</p>
            </div>
          ) : (
            <>
              {/* Location Status Badge */}
              {locationError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span className="text-xs text-amber-700">
                    <span className="font-bold">Simulated Route:</span> {locationError.split('(')[0].trim()}
                  </span>
                </div>
              )}

              {/* ETA Card */}
              <div className="bg-white rounded-3xl p-8 mb-6 shadow-sm border border-gray-200 text-center">
                <p className="text-teal-600 font-bold text-xs uppercase mb-3">ON TIME</p>
                <h2 className="text-5xl font-bold text-gray-900 mb-2">{eta}</h2>
                <p className="text-gray-600 text-lg">Mins</p>
                <p className="text-gray-600 text-sm mt-2">Approaching {getCurrentStop().name}</p>
              </div>

              {/* Show Live Map Button */}
              <button
                onClick={() => setShowFullMap(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 mb-6"
              >
                <MapPin className="w-5 h-5" />
                Show Live Map
              </button>

              {/* Route Details */}
              <div className="mb-6">
                <p className="text-gray-600 uppercase text-xs font-bold mb-4 px-1">ROUTE DETAILS</p>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-blue-600 text-sm">🚌</span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold text-sm">Bus #402</p>
                      <p className="text-gray-500 text-xs">Route 42 - North Campus</p>
                    </div>
                  </div>

                  {/* Stops */}
                  <div className="space-y-3">
                    {ROUTE_DATA.slice(0, 3).map((stop, index) => (
                      <div key={stop.id} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-1 ${
                          index < currentStopIndex 
                            ? 'bg-red-500' 
                            : index === currentStopIndex 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${
                            index < currentStopIndex 
                              ? 'text-gray-500' 
                              : 'text-gray-900'
                          }`}>
                            {stop.name}
                          </p>
                          {index === currentStopIndex && (
                            <p className="text-xs text-blue-600">Current Stop - Arriving Soon</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Next Stop Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <p className="text-blue-600 text-xs font-bold uppercase mb-2">Next Stop</p>
                <h3 className="text-xl font-bold text-blue-900 mb-1">{getNextStop().name}</h3>
                <p className="text-blue-700 text-sm">Estimated arrival: {getNextStop().time}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] flex items-center justify-around h-16 shadow-2xl">
        <button className="flex flex-col items-center gap-1 text-blue-500 transition py-2">
          <MapPin className="w-5 h-5" />
          <span className="text-xs">Tracker</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-500 transition py-2">
          <Calendar className="w-5 h-5" />
          <span className="text-xs">Schedule</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-500 transition py-2">
          <Bell className="w-5 h-5" />
          <span className="text-xs">Alerts</span>
        </button>
      </div>
    </div>
  );
};

export default StudentTracker;
