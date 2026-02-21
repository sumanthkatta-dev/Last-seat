import { useNavigate } from 'react-router-dom';
import { useBus } from '../context/useBus';
import { ROUTE_DATA } from '../context/routeData';
import { MapPin, LogOut, Map, Radio, MessageCircle, Settings, CheckCircle, ChevronRight, Navigation } from 'lucide-react';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { 
    isLive, 
    currentStopIndex, 
    startJourney, 
    stopJourney, 
    locationError, 
    busLocation, 
    isUsingRealLocation,
    moveToNextStop,
    arrivedStops,
    markStopArrived 
  } = useBus();

  // Compute student count based on stop index
  const studentsWaiting = isLive ? (currentStopIndex * 7 + 12) % 20 + 8 : 0;
  const totalCapacity = 40;
  const nextShiftTime = '1:30 PM';

  const handleToggle = () => {
    if (isLive) {
      stopJourney();
    } else {
      startJourney();
    }
  };

  const handleMarkArrived = () => {
    // Mark current stop as arrived
    markStopArrived(currentStopIndex);
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Stop Marked', {
        body: `Arrived at ${getCurrentStop().name}`,
        icon: '/bus-icon.png'
      });
    }
    
    // Move to next stop
    setTimeout(() => {
      moveToNextStop();
    }, 1000);
  };

  const getCurrentStop = () => {
    if (currentStopIndex >= ROUTE_DATA.length) {
      return ROUTE_DATA[ROUTE_DATA.length - 1];
    }
    return ROUTE_DATA[currentStopIndex];
  };

  if (!isLive) {
    // PRE-TRIP STATE
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col p-4 pb-0">
        <div className="max-w-sm mx-auto w-full flex flex-col flex-1">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">PRE-TRIP DASHBOARD</p>
              <h1 className="text-2xl font-bold text-gray-900">Route 42</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Status Card */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-blue-700 font-bold text-sm mb-1">📡 Real GPS Tracking Required</p>
                <p className="text-blue-600 text-xs">
                  This app uses ONLY real GPS location. When you start the journey, you'll be prompted to allow location access. 
                  Make sure GPS is enabled on your device for accurate tracking.
                </p>
              </div>
            </div>
          </div>

          {/* System Ready Toggle */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-gray-600 font-semibold text-sm mb-1">System Status</p>
              <p className="text-gray-900 font-bold">SYSTEM READY</p>
            </div>
            <button
              onClick={handleToggle}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-emerald-500 transition-all"
            >
              <span className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform" />
            </button>
          </div>

          {/* Upcoming Route */}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase">Upcoming Route</h3>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
              <div className="text-center mb-4 pb-4 border-b border-blue-200">
                <p className="text-blue-600 font-bold text-2xl">4 STOPS</p>
              </div>

              {/* Stops List */}
              <div className="space-y-4">
                {ROUTE_DATA.slice(0, 4).map((stop, index) => (
                  <div key={stop.id} className={`flex items-start gap-3 pb-4 ${index < 3 ? 'border-b border-blue-200' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                      index === 0 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                      {index === 0 && <CheckCircle className="w-5 h-5" />}
                      {index > 0 && index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${index === 0 ? 'text-blue-600' : 'text-gray-700'}`}>
                        {stop.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {index === 0 ? 'CURRENT' : `+${index * 12} mins`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Start Journey Button */}
          <button
            onClick={handleToggle}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-full transition-all duration-300 shadow-lg mb-4 flex items-center justify-center gap-2"
          >
            Start Journey
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // IN-TRANSIT STATE
  return (
    <div className="min-h-screen bg-white flex flex-col pb-0">
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Route 13</p>
              <h1 className="text-lg font-bold text-gray-900">Vehicle-BUS-7721</h1>
            </div>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full">
              <Radio className="w-5 h-5" />
            </button>
          </div>
          
          {/* Route Started Badge */}
          <div className="inline-block bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1 rounded-full">
            ● ROUTE STARTED
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* Location Status */}
          <div className={`rounded-2xl p-4 mb-6 border-2 flex items-start gap-3 ${
            locationError 
              ? 'bg-red-50 border-red-300' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className={`text-lg mt-1 flex-shrink-0 ${locationError ? 'text-red-600' : 'text-green-600'}`}>
              {locationError ? '❌' : '📡'}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-sm ${locationError ? 'text-red-700' : 'text-green-700'}`}>
                {isUsingRealLocation ? '✅ Real GPS Tracking Active' : '❌ GPS Not Available'}
              </p>
              <p className={`text-xs leading-relaxed mt-1 ${locationError ? 'text-red-600' : 'text-green-600'}`}>
                {locationError ? (
                  <>
                    {locationError}
                    <br />
                    <span className="text-xs font-semibold mt-2 inline-block">
                      ⚠️ Journey stopped. Please enable location permissions and GPS, then start again.
                    </span>
                  </>
                ) : (
                  <>
                    📍 Lat: {busLocation.lat.toFixed(6)}, Lng: {busLocation.lng.toFixed(6)}
                    <br />
                    <span className="text-xs font-semibold mt-1 inline-block flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      Broadcasting real GPS position to students
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Current Target Stop */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
            <p className="text-gray-600 uppercase text-xs font-bold mb-3">Current Target Stop</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{getCurrentStop().name}</h2>
            <p className="text-gray-600 text-sm mb-1">Stop {currentStopIndex + 1} of {ROUTE_DATA.length}</p>
            <p className="text-gray-500 text-xs mb-4">Scheduled time: {getCurrentStop().time}</p>
            
            {/* Mark Arrived Button */}
            <button
              onClick={handleMarkArrived}
              disabled={arrivedStops.includes(currentStopIndex)}
              className={`w-full font-bold py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
                arrivedStops.includes(currentStopIndex)
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {arrivedStops.includes(currentStopIndex) ? 'Marked as Arrived ✓' : 'Mark Arrived'}
            </button>
            
            {/* Stop Journey Button */}
            <button
              onClick={stopJourney}
              className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-full transition-all duration-300 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              End Journey
            </button>
          </div>

          {/* Passengers & Shift */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Passengers */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-center">
              <p className="text-gray-600 text-xs font-bold uppercase mb-2">Passengers</p>
              <p className="text-3xl font-bold text-gray-900">{studentsWaiting}/{totalCapacity}</p>
            </div>

            {/* Next Shift */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-center">
              <p className="text-gray-600 text-xs font-bold uppercase mb-2">Next Shift</p>
              <p className="text-2xl font-bold text-gray-900">{nextShiftTime}</p>
            </div>
          </div>

          {/* Upcoming Stops */}
          <div className="mb-6">
            <p className="text-gray-600 uppercase text-xs font-bold mb-3">Upcoming Stops</p>
            <div className="space-y-3">
              {ROUTE_DATA.slice(currentStopIndex + 1, Math.min(currentStopIndex + 4, ROUTE_DATA.length)).map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{stop.name}</p>
                    <p className="text-xs text-gray-500">{(index + 1) * 4}km away</p>
                  </div>
                  <p className="text-blue-600 font-bold text-sm">+{(index + 1) * 8} min</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="grid grid-cols-4 gap-1">
            <button className="flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-blue-500 transition">
              <Map className="w-5 h-5" />
              <span className="text-xs">MAP</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-blue-500 transition">
              <Radio className="w-5 h-5" />
              <span className="text-xs">STOPS</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-blue-500 transition">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">CHAT</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-blue-500 transition">
              <Settings className="w-5 h-5" />
              <span className="text-xs">MENU</span>
            </button>
          </div>
        </div>

        {/* Live Tracking Status */}
        <div className="bg-gray-700 text-white text-xs font-bold text-center py-2 px-4 rounded-t-xl">
          ● LIVE TRACKING ACTIVE
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
