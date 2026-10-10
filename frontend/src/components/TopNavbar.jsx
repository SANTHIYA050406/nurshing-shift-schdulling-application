import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Bell, CheckCircle2, Clock, CalendarOff, Sparkles, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function TopNavbar() {
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();

  const isNurse = location.pathname.startsWith('/nurse-');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch live notifications based on context
    const fetchNotifications = async () => {
      try {
        const notifs = [];
        if (!isNurse) {
          // Admin Notifications: Pending Leaves, Overtime status & Sudden Absences
          const [lRes, oRes, sRes] = await Promise.all([
            fetch('http://localhost:5000/api/leaves?status=Pending'),
            fetch('http://localhost:5000/api/overtime?status=Pending Nurse Approval'),
            fetch('http://localhost:5000/api/nurses/current-shift-status')
          ]);
          const leaves = await lRes.json();
          const overtimes = await oRes.json();
          const shiftData = await sRes.json().catch(() => null);

          if (shiftData && Array.isArray(shiftData.absentNurses) && shiftData.absentNurses.length > 0) {
            notifs.push({
              id: 'urgent-absence',
              title: `🚨 ${shiftData.absentNurses.length} Sudden Staff Deficit`,
              desc: `Emergency substitute needed in ${shiftData.absentNurses[0]?.department || 'clinical'} ward`,
              time: 'Action Required',
              icon: '⚡',
              link: '/live-shifts'
            });
          }

          if (Array.isArray(leaves) && leaves.length > 0) {
            notifs.push({
              id: 'leave',
              title: `${leaves.length} Leave Approval${leaves.length > 1 ? 's' : ''} Pending`,
              desc: `Review requests from ${leaves[0]?.nurseId?.name || 'Staff'}${leaves.length > 1 ? ` & ${leaves.length - 1} more` : ''}`,
              time: 'Recent',
              icon: '💌',
              link: '/availability'
            });
          }

          if (Array.isArray(overtimes) && overtimes.length > 0) {
            notifs.push({
              id: 'ot',
              title: `${overtimes.length} Overtime Allocation${overtimes.length > 1 ? 's' : ''}`,
              desc: `Awaiting response from allocated nursing staff`,
              time: 'Pending',
              icon: '⏱️',
              link: '/overtime'
            });
          }

          notifs.push({
            id: 'sync',
            title: 'Live Shift Operations',
            desc: 'Real-time hospital ward roster synced to database',
            time: 'Live',
            icon: '✨',
            link: '/live-shifts'
          });
        } else {
          // Nurse Notifications: Today's Shift & Overtime Approvals
          const nurseId = localStorage.getItem('selectedNurseId');
          const [sRes, oRes] = await Promise.all([
            nurseId ? fetch(`http://localhost:5000/api/schedules/nurse/${nurseId}/shifts`) : Promise.resolve({ json: () => [] }),
            nurseId ? fetch(`http://localhost:5000/api/overtime?nurseId=${nurseId}&status=Pending Nurse Approval`) : Promise.resolve({ json: () => [] })
          ]);
          
          const myShifts = await sRes.json();
          const myOT = await oRes.json();

          if (Array.isArray(myOT) && myOT.length > 0) {
            notifs.push({
              id: 'nurse-ot',
              title: `Action: ${myOT.length} Overtime Request${myOT.length > 1 ? 's' : ''}`,
              desc: `Hospital Admin has allocated extra hours. Please review.`,
              time: 'Needs Decision',
              icon: '⚡',
              link: '/nurse-overtime'
            });
          }

          notifs.push({
            id: 'nurse-shift',
            title: "Today's Clinical Shift Active",
            desc: "Verify your assigned bay, duties, and supervisory handover",
            time: 'Today',
            icon: '🩺',
            link: '/nurse-shifts'
          });
        }

        setNotifications(notifs);
        setUnreadCount(notifs.length);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
  }, [location.pathname, isNurse]);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 2rem',
      marginBottom: '1.5rem',
      borderRadius: '24px',
      background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(203, 213, 225, 0.9)',
      backdropFilter: 'blur(18px)',
      boxShadow: isDark ? '0 12px 35px rgba(0, 0, 0, 0.35)' : '0 10px 30px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      zIndex: 100
    }}>
      {/* Left indicator / Hospital Status with cute badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '10px',
          background: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
        }}>
          💚
        </div>
        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-muted)' }}>
          HOSPITAL STATION: <strong style={{ color: 'var(--text-main)', letterSpacing: '0.02em' }}>ONLINE & SYNCHRONIZED</strong>
        </span>
      </div>

      {/* Right Controls: Cute Notification Bell + Cute Night/Day Toggle Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
        
        {/* Cute Notification Bell Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            style={{
              position: 'relative',
              width: '44px',
              height: '44px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark 
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))' 
                : 'linear-gradient(135deg, #ffffff, #f1f5f9)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
              color: isDark ? '#f8fafc' : '#0f172a',
              cursor: 'pointer',
              fontSize: '1.25rem',
              boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.06)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>🔔</span>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '20px',
                height: '20px',
                padding: '0 4px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff4d6d, #f43f5e)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(244, 63, 94, 0.8)',
                border: '2px solid var(--bg-card)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Dropdown Menu */}
          {showNotifications && (
            <div 
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '56px',
                right: '0',
                width: '330px',
                borderRadius: '22px',
                padding: '1.25rem',
                zIndex: 1000,
                boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.7)' : '0 20px 45px rgba(0,0,0,0.12)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid #cbd5e1',
                animation: 'fadeIn 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 900, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📬</span> Alerts & Updates
                </span>
                <span style={{ fontSize: '0.74rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', fontWeight: 900 }}>
                  {notifications.length} new
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    ✨ No alerts! Everything is running smoothly.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.link}
                      onClick={() => setShowNotifications(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.85rem',
                        padding: '0.8rem 0.95rem',
                        borderRadius: '16px',
                        textDecoration: 'none',
                        background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '1.25rem', marginTop: '2px', lineHeight: 1 }}>
                        {n.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>{n.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{n.desc}</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* The Cute Animated Sun/Moon Switch */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle cute dark and light mode"
          style={{
            position: 'relative',
            width: '74px',
            height: '38px',
            borderRadius: '24px',
            border: isDark ? '2px solid rgba(165, 180, 252, 0.4)' : '2px solid rgba(251, 191, 36, 0.5)',
            background: isDark 
              ? 'linear-gradient(135deg, #1e1b4b, #0f172a)' 
              : 'linear-gradient(135deg, #fef3c7, #fde68a)',
            cursor: 'pointer',
            padding: '3px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: isDark 
              ? 'inset 0 2px 5px rgba(0,0,0,0.6), 0 0 18px rgba(99, 102, 241, 0.3)' 
              : 'inset 0 2px 5px rgba(0,0,0,0.1), 0 0 18px rgba(245, 158, 11, 0.35)',
            transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {/* Cute stationary icons inside the switch track */}
          <span style={{ 
            position: 'absolute', 
            left: '10px', 
            fontSize: '1rem',
            opacity: isDark ? 0.35 : 1,
            transition: 'opacity 0.3s',
            userSelect: 'none'
          }}>
            ☀️
          </span>
          <span style={{ 
            position: 'absolute', 
            right: '10px', 
            fontSize: '0.95rem',
            opacity: isDark ? 1 : 0.35,
            transition: 'opacity 0.3s',
            userSelect: 'none'
          }}>
            🌙
          </span>

          {/* Cute Bouncy Sliding Thumb Handle with Smiling Face / Star */}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: isDark 
                ? 'linear-gradient(135deg, #6366f1, #4338ca)' 
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.05rem',
              boxShadow: isDark 
                ? '0 3px 10px rgba(79, 70, 229, 0.7)' 
                : '0 3px 10px rgba(245, 158, 11, 0.6)',
              transform: isDark ? 'translateX(36px)' : 'translateX(0px)',
              transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.35s',
              userSelect: 'none'
            }}
          >
            {isDark ? '✨' : '⭐'}
          </div>
        </button>

      </div>
    </header>
  );
}
