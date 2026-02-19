import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Gauge, X } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      {/* Header with Logo */}
      <div className="text-center mb-16 pt-8">
        <div className="inline-block mb-4">
          <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto">
            <Bus className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Last Seat</h1>
      </div>

      {/* Cards Container */}
      <div className="w-full max-w-sm space-y-6">
        {/* Student Tracker Card */}
        <div
          onClick={() => navigate('/track')}
          className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-teal-200"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Student Tracker</h2>
              <p className="text-gray-600 text-sm mt-1">
                Live bus tracker, routes & ETA in real time
              </p>
            </div>
            <span className="inline-block bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              LIVE
            </span>
          </div>

          {/* Bus Icon Circle */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Bus className="w-16 h-16 text-teal-500" />
            </div>
          </div>

          {/* Button */}
          <button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
            Select Student
          </button>
        </div>

        {/* Driver Cockpit Card */}
        <div
          onClick={handleDriverClick}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-slate-700 relative overflow-hidden"
        >
          {/* PRO Badge */}
          <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            PRO
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Driver Cockpit</h2>
            <p className="text-gray-300 text-sm mt-1">
              Broadcast live location & manage shifts
            </p>
          </div>

          {/* Cockpit Icon Circle */}
          <div className="flex justify-center my-8">
            <div className="w-32 h-32 bg-slate-700 rounded-full flex items-center justify-center shadow-lg">
              <Gauge className="w-16 h-16 text-amber-400" />
            </div>
          </div>

          {/* Button */}
          <button className="w-full bg-white hover:bg-gray-100 text-slate-900 font-bold py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
            Select Driver
          </button>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex gap-2 mt-12">
        <div className="w-3 h-3 rounded-full bg-teal-500"></div>
        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
      </div>

      {/* Developer Credits Footer */}
      <div className="text-center mt-16 mb-4">
        <p className="text-gray-600 text-sm">
          Designed & Built by <span className="font-semibold">Sumanth Katta</span>
        </p>
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
