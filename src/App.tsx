import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BusProvider } from './context';
import Home from './pages/Home';
import PilotDashboard from './pages/PilotDashboard';
import NavigatorTracker from './pages/NavigatorTracker';
import './App.css';

function App() {
  return (
    <BusProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pilot" element={<PilotDashboard />} />
          <Route path="/track" element={<NavigatorTracker />} />
        </Routes>
      </Router>
    </BusProvider>
  );
}

export default App;
