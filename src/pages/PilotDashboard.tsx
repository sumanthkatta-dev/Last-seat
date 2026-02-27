import { useNavigate } from 'react-router-dom';
import { useBus } from '../context/useBus';
import { CheckCircle, ChevronLeft, RefreshCw, Info, ArrowRight, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PilotDashboard = () => {
  const navigate = useNavigate();
  const { 
    isLive, 
    currentStopIndex, 
    startJourney, 
    stopJourney, 
    locationError, 
    busLocation, 
    moveToNextStop,
    arrivedStops,
    markStopArrived,
    routeDirection,
    setRouteDirection,
    currentRoute,
    stopRequests,
    clearStopRequest,
    autoDetectedStops,
    distanceToCurrentStop
  } = useBus();



  const handleToggle = () => {
    if (isLive) {
      stopJourney();
    } else {
      // Request notification permission before starting journey
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('✅ Notifications enabled');
          }
        });
      }
      startJourney();
    }
  };

  const handleMarkArrived = () => {
    // Mark current stop as arrived
    markStopArrived(currentStopIndex);
    
    const stopName = getCurrentStop().name;
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🚌 Stop Arrived', {
        body: `You have arrived at ${stopName}`,
        icon: '/bus-icon.png',
        tag: 'stop-arrival',
        requireInteraction: false,
        badge: '/bus-icon.png'
      });
      
      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
    
    // Move to next stop
    setTimeout(() => {
      moveToNextStop();
    }, 1000);
  };

  const getCurrentStop = () => {
    if (currentStopIndex >= currentRoute.length) {
      return currentRoute[currentRoute.length - 1];
    }
    return currentRoute[currentStopIndex];
  };

  if (!isLive) {
    // PRE-TRIP STATE
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="max-w-sm mx-auto w-full flex flex-col h-screen">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <button
              onClick={() => navigate('/')}
              className="text-gray-700 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h1 className="text-base font-bold text-gray-900">Route 13</h1>
              <p className="text-xs text-gray-500">Vehicle 62-S-7721</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 transition">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Status Banner */}
            <div className="bg-blue-50 rounded-xl p-3 mb-6 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                System Ready — tap Start Journey to begin
              </p>
            </div>

            {/* Direction Section */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wider">Direction</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={() => setRouteDirection('to')}
                  disabled={isLive}
                  className={`py-3 px-4 rounded-full font-semibold text-sm transition-all ${
                    routeDirection === 'to'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  → To College
                </button>
                <button
                  onClick={() => setRouteDirection('from')}
                  disabled={isLive}
                  className={`py-3 px-4 rounded-full font-semibold text-sm transition-all ${
                    routeDirection === 'from'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  ← From College
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {routeDirection === 'to' 
                  ? 'Morning Route: Dilsuknagar → CMRGI / 7:15 - 8:50 AM'
                  : 'Evening Route: CMRGI → Dilsuknagar / 4:30 PM - 6:45 PM'}
              </p>
            </div>

            {/* Your Route Section */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wider">Your Route</p>
              <div className="space-y-3">
                {currentRoute.map((stop, index) => (
                  <div key={stop.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 font-medium w-4">{index + 1}</span>
                      <span className="text-sm text-gray-900 font-medium">{stop.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{stop.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Start Journey Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleToggle}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
            >
              Start Journey
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // IN-TRANSIT STATE
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col pb-0">
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Route 13 - {routeDirection === 'to' ? 'TO College' : 'FROM College'}</p>
              <p className="text-xs text-gray-500 mt-0.5">🌍 Automatic GPS Tracking Active</p>
            </div>
            {!locationError && (
              <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                🟢 Broadcasting
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          
          {/* Auto-Tracking Information Banner */}
          <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-900">🎯 Automatic Stop Detection</p>
              <p className="text-xs text-green-800 mt-1">Your location is being tracked in real-time. When you arrive at a stop (within 300m), it will be auto-detected. Confirm with the button below.</p>
            </div>
          </div>
          
          {/* Map View - Smaller */}
          <div className="h-48 bg-gray-200 relative overflow-hidden">
            {busLocation && (
              <MapContainer 
                center={[busLocation.lat, busLocation.lng] as LatLngExpression}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {/* Current Bus Location Marker */}
                <Marker
                  position={[busLocation.lat, busLocation.lng] as LatLngExpression}
                  icon={divIcon({
                    className: 'w-8 h-8 flex items-center justify-center',
                    html: `
                      <div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center border-4 border-white shadow-lg flex-shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        </svg>
                      </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32],
                  })}
                  title="Bus Location"
                />
              </MapContainer>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Stop Requests Alert */}
            {stopRequests.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
                <p className="text-amber-900 font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="text-lg">🙋</span> {stopRequests.length} Passenger{stopRequests.length > 1 ? 's' : ''} Requesting Stop
                </p>
                <div className="space-y-2">
                  {stopRequests.map((request) => (
                    <div key={request.stopId} className="bg-white rounded-lg p-3 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900">{request.stopName}</p>
                        <p className="text-xs text-gray-600">Passenger request</p>
                      </div>
                      <button
                        onClick={() => clearStopRequest(request.stopId)}
                        className="text-amber-600 hover:text-amber-700 font-bold text-xs px-2 py-1 bg-amber-100 rounded transition-all"
                      >
                        Done
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Current Stop Card */}
            <div>
              <p className="text-gray-600 text-xs font-bold uppercase mb-2 tracking-wide">Current Stop</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{getCurrentStop().name}</h2>
              <p className="text-xs text-gray-600 mb-3">Stop {currentStopIndex + 1} / Scheduled {getCurrentStop().time}</p>
              
              {/* Distance & Auto-Detection Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-blue-600 font-semibold">Distance to Stop</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{Math.round(distanceToCurrentStop)} <span className="text-lg">m</span></p>
                  </div>
                  <div className="text-right">
                    {autoDetectedStops.has(currentStopIndex) ? (
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        🎯 Auto-Detected
                      </div>
                    ) : distanceToCurrentStop <= 300 ? (
                      <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                        ⚠️ Close (300m)
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs">Approaching...</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Mark Arrived Button */}
              <button
                onClick={handleMarkArrived}
                disabled={arrivedStops.includes(currentStopIndex)}
                className={`w-full font-bold py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
                  arrivedStops.includes(currentStopIndex)
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : autoDetectedStops.has(currentStopIndex)
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                {arrivedStops.includes(currentStopIndex) ? (
                  <>✓ Stop Confirmed</>
                ) : autoDetectedStops.has(currentStopIndex) ? (
                  <>✓ Confirm Arrival</>
                ) : (
                  <>Mark as Arrived</>
                )}
              </button>
            </div>

            {/* GPS Error Display */}
            {locationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700 font-semibold">{locationError}</p>
                <p className="text-xs text-red-600 mt-1">Use "Mark as Arrived" to continue manually</p>
              </div>
            )}

            {/* Upcoming Stops */}
            <div>
              <p className="text-gray-600 text-xs font-bold uppercase mb-3 tracking-wide">Upcoming</p>
              <div className="space-y-2">
                {currentRoute.slice(currentStopIndex + 1, Math.min(currentStopIndex + 4, currentRoute.length)).map((stop, index) => {
                  const distance = ((index + 1) * 1.2).toFixed(1);
                  const timeMin = (index + 1) * 4 + 4;
                  return (
                    <div key={stop.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{stop.name}</p>
                        <p className="text-xs text-gray-600">{distance}km away</p>
                      </div>
                      <p className="text-blue-600 font-bold text-sm whitespace-nowrap">+{timeMin}min</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* End Journey Button */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <button
              onClick={stopJourney}
              className="w-full border-2 border-red-500 text-red-500 font-bold py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2 hover:bg-red-50"
            >
              <X className="w-5 h-5" />
              End Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilotDashboard;
