import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BusProvider } from './context';
import Home from './pages/Home';
import PilotDashboard from './pages/PilotDashboard';
import NavigatorTracker from './pages/NavigatorTracker';
import AdminPage from './pages/AdminPage';
import './App.css';

// Version: 2.0.0 - Real-time stop requests, Firebase sync, notifications
function App() {
  return (
    <BusProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pilot" element={<PilotDashboard />} />
          <Route path="/track" element={<NavigatorTracker />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </BusProvider>
  );
}

export default App;
