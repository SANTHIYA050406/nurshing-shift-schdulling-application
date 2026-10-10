import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NurseDashboard from './pages/NurseDashboard';
import Availability from './pages/Availability';
import Scheduler from './pages/Scheduler';
import Nurses from './pages/Nurses';
import Overtime from './pages/Overtime';
import LiveShiftCoverage from './pages/LiveShiftCoverage';

import NurseLeaveApply from './pages/NurseLeaveApply';
import NurseUpcomingShifts from './pages/NurseUpcomingShifts';
import NurseOvertime from './pages/NurseOvertime';
import TopNavbar from './components/TopNavbar';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isAuthPage && <Sidebar />}
      <main style={{ flex: 1, padding: isAuthPage ? '0' : '1.75rem 2.25rem' }}>
        {!isAuthPage && <TopNavbar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-shifts" element={<LiveShiftCoverage />} />
          <Route path="/nurse-dashboard" element={<NurseDashboard />} />
          <Route path="/nurse-shifts" element={<NurseUpcomingShifts />} />
          <Route path="/nurse-overtime" element={<NurseOvertime />} />
          <Route path="/nurse-leave" element={<NurseLeaveApply />} />
          <Route path="/nurses" element={<Nurses />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/scheduler" element={<Scheduler />} />
          <Route path="/overtime" element={<Overtime />} />
        </Routes>
      </main>
    </div>
  );
}

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
