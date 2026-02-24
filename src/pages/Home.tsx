import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Truck, X, MapPin, Lock, HelpCircle, ArrowRight, Delete } from 'lucide-react';
import { useBus } from '../context/useBus';

const Home = () => {
  const navigate = useNavigate();
  const { setRole } = useBus();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePilotClick = () => {
    setShowPinModal(true);
    setPin('');
    setError('');
  };

  const handlePinSubmit = () => {
    if (pin === '1234') {
      setRole('pilot'); // 🔥 Set role as pilot
      navigate('/pilot');
    } else {
      setError('Invalid PIN. Try 1234');
      setPin('');
    }
  };

  const handleNavigatorClick = () => {
    setRole('navigator'); // 🔥 Set role as navigator
    navigate('/track');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-16 pt-8">
        <div className="inline-block mb-6 bg-blue-100 rounded-3xl p-5">
          <Bus className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Last Seat</h1>
        <p className="text-gray-500 text-base">Real-time fleet tracking, built for everyone</p>
      </div>

      {/* Cards Container */}
      <div className="w-full max-w-sm space-y-4 mb-12">
        {/* Navigator Card */}
        <button
          onClick={handleNavigatorClick}
          className="w-full bg-blue-600 hover:bg-blue-700 rounded-3xl p-6 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-2xl flex-shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-bold text-white mb-1">I'm tracking a bus</h3>
              <p className="text-blue-100 text-sm">See live location & arrival</p>
            </div>
          </div>
        </button>

        {/* Pilot Card */}
        <button
          onClick={handlePilotClick}
          className="w-full bg-gray-900 hover:bg-black rounded-3xl p-6 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-2xl flex-shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-bold text-white mb-1">I'm the driver</h3>
              <p className="text-gray-400 text-sm">Share location with passengers</p>
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-auto pb-8">
        <div className="flex gap-2 justify-center text-sm">
          <a href="#" className="text-gray-400 hover:text-gray-600 transition">Privacy Policy</a>
          <span className="text-gray-400">•</span>
          <a href="#" className="text-gray-400 hover:text-gray-600 transition">Terms of Service</a>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-gray-600/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setShowPinModal(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1 text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Help</span>
              </button>
            </div>

            {/* Lock Icon & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enter Pilot PIN</h3>
              <p className="text-gray-500 text-sm">
                Please enter your 4-digit access code
              </p>
            </div>

            {/* PIN Display with Dots */}
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full transition-all"
                  style={{
                    backgroundColor: index < pin.length ? '#1f2937' : '#e5e7eb',
                  }}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm text-center font-semibold mb-4">
                {error}
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Numbers 1-9 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (pin.length < 4) {
                      setPin(pin + num);
                      setError('');
                    }
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-900 font-semibold text-2xl py-6 rounded-xl transition-all duration-200"
                >
                  {num}
                </button>
              ))}

              {/* Empty Space */}
              <div></div>

              {/* 0 Button */}
              <button
                onClick={() => {
                  if (pin.length < 4) {
                    setPin(pin + '0');
                    setError('');
                  }
                }}
                className="bg-white hover:bg-gray-50 text-gray-900 font-semibold text-2xl py-6 rounded-xl transition-all duration-200"
              >
                0
              </button>

              {/* Backspace Button */}
              <button
                onClick={() => {
                  setPin(pin.slice(0, -1));
                  setError('');
                }}
                className="bg-white hover:bg-gray-50 text-gray-400 py-6 rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Verify Button */}
            <button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4}
              className={`w-full font-bold py-4 rounded-full transition-all duration-300 mb-4 flex items-center justify-center gap-2 ${
                pin.length === 4
                  ? 'bg-gray-900 hover:bg-black text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Verify PIN
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Forgot PIN Link */}
            <p className="text-center">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Forgot PIN?
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
