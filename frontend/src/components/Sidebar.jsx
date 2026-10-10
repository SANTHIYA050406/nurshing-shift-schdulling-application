import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Clock, 
  LogOut, 
  CalendarCheck,
  Stethoscope,
  CalendarOff,
  Activity
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);

  const isNurseRoute = location.pathname.startsWith('/nurse-');
  const userRole = localStorage.getItem('userRole') || (isNurseRoute ? 'nurse' : 'admin');
  const isNurse = userRole === 'nurse' || isNurseRoute;

  useEffect(() => {
    // Fetch pending leave count for admin badge
    fetch('http://localhost:5000/api/leaves?status=Pending')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPendingLeaves(data.length);
      })
      .catch(() => {});

    // Fetch absent nurses count for urgent coverage badge
    fetch('http://localhost:5000/api/nurses/current-shift-status')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.absentNurses)) {
          setAbsentCount(data.absentNurses.length);
        }
      })
      .catch(() => {});
  }, [location.pathname]);
  
  const adminNavItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { 
      path: '/live-shifts', 
      name: 'Live Shift & Coverage', 
      icon: <Activity size={20} />,
      badge: absentCount > 0 ? `${absentCount} Deficit` : null,
      badgeColor: '#ef4444'
    },
    { path: '/nurses', name: 'Nurses', icon: <Users size={20} /> },
    { 
      path: '/availability', 
      name: 'Leave Approvals', 
      icon: <CalendarCheck size={20} />,
      badge: pendingLeaves > 0 ? pendingLeaves : null,
      badgeColor: '#f59e0b'
    },
    { path: '/scheduler', name: 'Auto Scheduler', icon: <CalendarDays size={20} /> },
    { path: '/overtime', name: 'Overtime', icon: <Clock size={20} /> },
  ];

  const nurseNavItems = [
    { path: '/nurse-dashboard', name: 'Nurse Profile', icon: <Stethoscope size={20} /> },
    { path: '/nurse-shifts', name: 'Today & Tomorrow Shift', icon: <CalendarDays size={20} /> },
    { path: '/nurse-overtime', name: 'Overtime & Approvals', icon: <Clock size={20} /> },
    { path: '/nurse-leave', name: 'Apply for Leave', icon: <CalendarOff size={20} /> },
  ];

  const navItems = isNurse ? nurseNavItems : adminNavItems;

  return (
    <div className="glass-panel" style={{ width: '260px', height: '100vh', position: 'sticky', top: 0, borderRight: '1px solid rgba(255,255,255,0.1)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary-color)', margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>ShiftSync</h2>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hospital Portal</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'var(--primary-color)' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {item.icon}
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span style={{
                  background: item.badgeColor || '#f59e0b',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link 
        to="/login"
        className="btn" 
        style={{ 
          background: 'transparent', 
          border: '1px solid var(--danger-color)', 
          color: 'var(--danger-color)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem',
          textDecoration: 'none',
          padding: '0.7rem'
        }}
      >
        <LogOut size={18} /> Logout
      </Link>
    </div>
  );
}
