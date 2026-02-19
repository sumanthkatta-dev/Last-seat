import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Truck, X, ChevronRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleDriverClick = () => {
    setShowPinModal(true);
    setPin('');
    setError('');
  };

  const handlePinSubmit = () => {
    if (pin === '1234') {
      navigate('/driver');
    } else {
      setError('Invalid PIN. Try 1234');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-12 pt-8">
        <div className="inline-block mb-6 bg-blue-100 rounded-full p-3">
          <Bus className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to</h1>
        <h2 className="text-3xl font-bold text-gray-900">Campus Transit</h2>
        <p className="text-gray-500 text-base mt-2">Select your role to continue</p>
      </div>

      {/* Cards Container */}
      <div className="w-full max-w-sm space-y-4 mb-12">
        {/* Student Card */}
        <button
          onClick={() => navigate('/track')}
          className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-3xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="text-white">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">I am a Student</h3>
              <p className="text-blue-100 text-sm">Track your bus in real-time</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white flex-shrink-0" />
        </button>

        {/* Driver Card */}
        <button
          onClick={handleDriverClick}
          className="w-full bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black rounded-3xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="text-white">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">I am a Driver</h3>
              <p className="text-slate-400 text-sm">Start a route and share location</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white flex-shrink-0" />
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-auto pb-8">
        <p className="text-gray-400 text-sm mb-4">Need assistance?</p>
        <div className="flex gap-4 justify-center text-sm">
          <a href="#" className="text-gray-400 hover:text-gray-600 transition">Privacy Policy</a>
          <span className="text-gray-400">•</span>
          <a href="#" className="text-gray-400 hover:text-gray-600 transition">Terms of Service</a>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            {/* Close Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowPinModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-block bg-teal-100 p-3 rounded-full mb-4">
                <Bus className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Driver Cockpit</h3>
              <p className="text-gray-600 text-sm">
                Enter your secure 4-digit PIN to begin your shift
              </p>
            </div>

            {/* PIN Display with Dots */}
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full transition-all"
                  style={{
                    backgroundColor: index < pin.length ? '#14b8a6' : '#e5e7eb',
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
            <div className="grid grid-cols-3 gap-3 mb-6">
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
                  className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xl py-4 rounded-xl transition-all duration-200"
                >
                  {num}
                </button>
              ))}

              {/* Clear Button */}
              <button
                onClick={() => {
                  setPin('');
                  setError('');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-sm py-4 rounded-xl transition-all duration-200"
              >
                Clear
              </button>

              {/* 0 Button */}
              <button
                onClick={() => {
                  if (pin.length < 4) {
                    setPin(pin + '0');
                    setError('');
                  }
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xl py-4 rounded-xl transition-all duration-200"
              >
                0
              </button>

              {/* Backspace Button */}
              <button
                onClick={() => {
                  setPin(pin.slice(0, -1));
                  setError('');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-sm py-4 rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            {/* Authorize Button */}
            <button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4}
              className={`w-full font-bold py-4 rounded-full transition-all duration-300 mb-3 ${
                pin.length === 4
                  ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Authorize Access
            </button>

            {/* Helper Text */}
            <p className="text-gray-500 text-xs text-center">
              Forgot your PIN? <span className="font-semibold text-gray-700">Contact Support</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
