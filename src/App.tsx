import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BusProvider } from './context';
import Home from './pages/Home';
import DriverDashboard from './pages/DriverDashboard';
import StudentTracker from './pages/StudentTracker';
import './App.css';

function App() {
  return (
    <BusProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/track" element={<StudentTracker />} />
        </Routes>
      </Router>
    </BusProvider>
  );
}

export default App;
