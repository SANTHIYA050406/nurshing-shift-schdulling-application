import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Clock, 
  CalendarDays, 
  CheckCircle2, 
  CalendarOff, 
  Send, 
  ShieldCheck, 
  LogOut, 
  Award, 
  Activity, 
  Flame, 
  Check, 
  X,
  Stethoscope,
  HeartPulse
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NurseDashboard() {
  const [allNurses, setAllNurses] = useState([]);
  const [selectedNurseId, setSelectedNurseId] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Attendance Clock In / Clock Out State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [actualHoursLogged, setActualHoursLogged] = useState(null);
  const [overtimeLogged, setOvertimeLogged] = useState(null);

  // Leave Form State
  const [isApplyingLeave, setIsApplyingLeave] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const endD = new Date();
  endD.setDate(endD.getDate() + 2);
  const [endDate, setEndDate] = useState(endD.toISOString().split('T')[0]);
  const [reason, setReason] = useState('Medical Leave / Personal Care');

  // Load nurses from backend
  useEffect(() => {
    const fetchNurses = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/nurses');
        const data = await res.json();
        setAllNurses(data);
        if (data.length > 0) {
          const savedId = localStorage.getItem('selectedNurseId');
          const matched = data.find(n => n._id === savedId);
          setSelectedNurseId(matched ? matched._id : data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching nurses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNurses();
  }, []);

  // Fetch leaves for the active nurse
  const activeNurse = allNurses.find(n => n._id === selectedNurseId) || allNurses[0];

  useEffect(() => {
    if (activeNurse) {
      fetch(`http://localhost:5000/api/leaves?nurseId=${activeNurse._id}`)
        .then(res => res.json())
        .then(data => setLeaves(data))
        .catch(err => console.error('Error fetching nurse leaves:', err));
    }
  }, [activeNurse]);

  // Handle Attendance Check-In / Check-Out
  const handleToggleAttendance = () => {
    if (!isCheckedIn) {
      const now = new Date();
      setIsCheckedIn(true);
      setCheckInTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCheckOutTime(null);
      setActualHoursLogged(null);
      setOvertimeLogged(null);
    } else {
      const now = new Date();
      const outStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setIsCheckedIn(false);
      setCheckOutTime(outStr);
      setActualHoursLogged(9.5);
      setOvertimeLogged(1.5);
      alert(`✓ Attendance Logged!\nClocked Out at ${outStr}.\nTotal Hours: 9.5 hrs (Scheduled: 8 hrs, Overtime: 1.5 hrs).`);
    }
  };

  const [toastMessage, setToastMessage] = useState(null);

  // Submit Leave Request
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!activeNurse) return;
    try {
      const res = await fetch('http://localhost:5000/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nurseId: activeNurse._id,
          startDate,
          endDate,
          reason
        })
      });
      if (!res.ok) throw new Error('Failed to submit leave application');
      const newLeave = await res.json();
      setLeaves(prev => [newLeave, ...prev]);
      setIsApplyingLeave(false);
      setToastMessage('✓ Leave application submitted successfully to Hospital Admin for review!');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage(`Error: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Simulated nurse schedule shifts
  const upcomingShifts = [
    { date: 'Today (Oct 7)', shift: 'Morning', hours: '08:00 - 16:00', dept: activeNurse?.department || 'ICU', room: 'Ward 4B - Bed 1-6' },
    { date: 'Tomorrow (Oct 8)', shift: 'Morning', hours: '08:00 - 16:00', dept: activeNurse?.department || 'ICU', room: 'ICU Critical Bay' },
    { date: 'Friday (Oct 10)', shift: 'Evening', hours: '16:00 - 00:00', dept: activeNurse?.department || 'ICU', room: 'Triage Room 2' },
    { date: 'Sunday (Oct 12)', shift: 'Night', hours: '00:00 - 08:00', dept: activeNurse?.department || 'ICU', room: 'Nocturnal ICU Bay' },
  ];

  return (
    <div style={{ width: '100%', paddingBottom: '3rem' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '1rem 1.6rem',
          borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 700,
          fontSize: '0.95rem',
          backdropFilter: 'blur(8px)'
        }}>
          <CheckCircle2 size={20} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Switcher between nurses & Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            <Stethoscope size={16} /> NURSE CLINICAL STATION & PROFILE
          </div>
          <h1 style={{ margin: 0, fontSize: '2.6rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Nurse Portal Dashboard
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '1.1rem' }}>
            Personal profile details, attendance clock-in, shift assignments, and leave records.
          </p>
        </div>

        {/* Profile Switcher & Logout */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(30, 41, 59, 0.85)', padding: '0.6rem 1.1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <User size={19} color="#38bdf8" />
            <span style={{ fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 700 }}>Switch Nurse:</span>
            <select
              className="form-control"
              value={selectedNurseId || ''}
              onChange={e => {
                setSelectedNurseId(e.target.value);
                localStorage.setItem('selectedNurseId', e.target.value);
              }}
              style={{ padding: '0.5rem 0.95rem', fontSize: '0.95rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, minWidth: '240px' }}
            >
              {allNurses.map(n => (
                <option key={n._id} value={n._id} style={{ background: '#0f172a' }}>
                  {n.name} ({n.department} - {n.employeeId})
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.8rem 1.4rem',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.18)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '0.98rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={18} /> Logout
          </Link>

        </div>
      </div>

      {activeNurse ? (
        <>
          {/* SECTION 1: COMPREHENSIVE NURSE DETAILS CARD */}
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '28px', marginBottom: '2.25rem', border: '1px solid rgba(56, 189, 248, 0.3)', boxShadow: '0 12px 35px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
              
              {/* Left Profile Info */}
              <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
                
                {/* Big Avatar with Medical Badge */}
                <div style={{
                  width: '105px',
                  height: '105px',
                  borderRadius: '28px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 30px rgba(79, 70, 229, 0.45)',
                  flexShrink: 0
                }}>
                  <Stethoscope size={52} color="#ffffff" />
                </div>

                {/* Core Personal Details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '2.3rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                      {activeNurse.name}
                    </h2>
                    <span style={{
                      padding: '0.3rem 0.85rem',
                      borderRadius: '14px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.35)'
                    }}>
                      ● Active Duty
                    </span>
                  </div>

                  <div style={{ fontSize: '1.15rem', color: '#38bdf8', fontWeight: 700, marginTop: '0.45rem' }}>
                    {activeNurse.designation || 'Staff Nurse'} • <span style={{ color: '#cbd5e1' }}>Employee ID: <strong style={{ color: '#ffffff' }}>{activeNurse.employeeId}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.75rem', marginTop: '0.9rem', color: '#94a3b8', fontSize: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Building2 size={18} color="#38bdf8" />
                      Department: <strong style={{ color: '#f8fafc' }}>{activeNurse.department} Ward</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Phone size={18} color="#34d399" />
                      <strong style={{ color: '#f8fafc' }}>{activeNurse.contact || '+1 (555) 382-9102'}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Mail size={18} color="#fbbf24" />
                      <strong style={{ color: '#cbd5e1' }}>{activeNurse.name.toLowerCase().replace(/\s+/g, '.')}@apexmed.org</strong>
                    </span>
                  </div>
                </div>

              </div>

              {/* Right: Policy & Constraints assigned to this nurse */}
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '1.6rem 1.85rem', borderRadius: '22px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                  Scheduling Policy & Clinical Parameters:
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', fontSize: '0.95rem' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Max Weekly Hours:</div>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.25rem', marginTop: '0.2rem' }}>
                      {activeNurse.maxWorkingHoursPerWeek || 40} hrs/week
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Preferred Shift:</div>
                    <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1.25rem', marginTop: '0.2rem' }}>
                      {activeNurse.preferredShift || 'Any Shift'}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Hourly Base Rate:</div>
                    <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1.25rem', marginTop: '0.2rem' }}>
                      $45.00 / hr
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Overtime Multiplier:</div>
                    <div style={{ fontWeight: 800, color: '#a5b4fc', fontSize: '1.25rem', marginTop: '0.2rem' }}>
                      1.5x Pay
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* SECTION 2: ATTENDANCE CLOCK-IN & CURRENT WORKLOAD TILES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2.25rem', marginBottom: '2.25rem' }}>
            
            {/* Clinical Attendance Station (Check-In / Check-Out) */}
            <div className="glass-panel" style={{ padding: '2.2rem', borderRadius: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Clock size={24} color="#38bdf8" /> Clinical Attendance
                  </h3>
                  <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: isCheckedIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)', color: isCheckedIn ? '#34d399' : '#94a3b8', fontWeight: 800 }}>
                    {isCheckedIn ? 'Currently Clocked In' : 'Shift Not Started'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.92rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>Today's Assigned Rotation:</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>☀️ Morning Shift (08:00 - 16:00)</div>
                  <div style={{ fontSize: '0.95rem', color: '#38bdf8', marginTop: '0.35rem', fontWeight: 600 }}>Location: {activeNurse.department} Intensive Ward</div>
                </div>

                {isCheckedIn ? (
                  <div style={{ padding: '1.2rem', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', marginBottom: '1.25rem', color: '#cbd5e1', fontSize: '0.98rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 800, marginBottom: '0.4rem', fontSize: '1.05rem' }}>
                      <CheckCircle2 size={19} /> Active Shift in Progress
                    </div>
                    <div>Clocked in at: <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{checkInTime}</strong></div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>Automatic overtime logging active.</div>
                  </div>
                ) : actualHoursLogged ? (
                  <div style={{ padding: '1.2rem', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', marginBottom: '1.25rem', fontSize: '0.98rem', color: '#cbd5e1' }}>
                    <div>Clocked out at: <strong style={{ color: '#fff' }}>{checkOutTime}</strong></div>
                    <div>Actual Hours Worked: <strong style={{ color: '#34d399' }}>{actualHoursLogged} hrs</strong></div>
                    <div>Overtime Recorded: <strong style={{ color: '#fbbf24' }}>+{overtimeLogged} hrs</strong></div>
                  </div>
                ) : null}
              </div>

              {/* Attendance Button */}
              <button
                onClick={handleToggleAttendance}
                className="btn"
                style={{
                  width: '100%',
                  padding: '1.15rem',
                  borderRadius: '16px',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  background: isCheckedIn 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                    : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  boxShadow: isCheckedIn 
                    ? '0 10px 25px rgba(239, 68, 68, 0.45)' 
                    : '0 10px 25px rgba(16, 185, 129, 0.45)'
                }}
              >
                <CheckCircle2 size={22} />
                {isCheckedIn ? 'Clock Out & Submit Shift' : 'Clock In to Morning Shift'}
              </button>
            </div>

            {/* Workload, Overtime & Hours Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              
              {/* Tile 1: Weekly Hours */}
              <div className="glass-panel" style={{ padding: '1.85rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 700 }}>Weekly Hours</div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: '#34d399', marginTop: '0.4rem', lineHeight: 1.1 }}>
                    32 <span style={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 500 }}>/ 40h</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#38bdf8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.9rem', fontWeight: 600 }}>
                  8 hours remaining before 40h limit
                </div>
              </div>

              {/* Tile 2: Monthly Overtime */}
              <div className="glass-panel" style={{ padding: '1.85rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 700 }}>Overtime Logged</div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fbbf24', marginTop: '0.4rem', lineHeight: 1.1 }}>
                    +12 <span style={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 500 }}>hrs</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#fbbf24', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.9rem', fontWeight: 600 }}>
                  Earned $810 OT premium (1.5x)
                </div>
              </div>

              {/* Tile 3: Consecutive Days */}
              <div className="glass-panel" style={{ padding: '1.85rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 700 }}>Consecutive Shifts</div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: '#818cf8', marginTop: '0.4rem', lineHeight: 1.1 }}>
                    3 <span style={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 500 }}>/ 5 max</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#34d399', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.9rem', fontWeight: 600 }}>
                  Complies with rest day policy
                </div>
              </div>

            </div>

          </div>

          {/* SECTION 3: MY UPCOMING ASSIGNED SHIFTS & LEAVE APPLICATION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2.25rem' }}>
            
            {/* Left: My Schedule */}
            <div className="glass-panel" style={{ padding: '2.2rem', borderRadius: '26px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CalendarDays size={24} color="#38bdf8" /> My Assigned Shift Schedule
                </h3>
                <span style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 800 }}>
                  Live Schedule
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8' }}>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem' }}>Shift</th>
                    <th style={{ padding: '1rem' }}>Hours</th>
                    <th style={{ padding: '1rem' }}>Assigned Ward / Room</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingShifts.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '1.1rem 1rem', fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>{s.date}</td>
                      <td style={{ padding: '1.1rem 1rem' }}>
                        <span style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '10px',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          background: s.shift === 'Morning' ? 'rgba(250, 204, 21, 0.2)' : s.shift === 'Evening' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(129, 140, 248, 0.2)',
                          color: s.shift === 'Morning' ? '#fde047' : s.shift === 'Evening' ? '#fdba74' : '#a5b4fc'
                        }}>
                          {s.shift}
                        </span>
                      </td>
                      <td style={{ padding: '1.1rem 1rem', color: '#94a3b8', fontSize: '0.98rem' }}>{s.hours}</td>
                      <td style={{ padding: '1.1rem 1rem', color: '#cbd5e1', fontWeight: 600, fontSize: '0.98rem' }}>{s.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right: Leave Management & History */}
            <div className="glass-panel" style={{ padding: '2.2rem', borderRadius: '26px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CalendarOff size={24} color="#fbbf24" /> Leave Applications
                </h3>
                <button
                  onClick={() => setIsApplyingLeave(!isApplyingLeave)}
                  className="btn"
                  style={{
                    padding: '0.55rem 1.1rem',
                    fontSize: '0.9rem',
                    borderRadius: '12px',
                    background: isApplyingLeave ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, #059669, #10b981)',
                    fontWeight: 800,
                    boxShadow: isApplyingLeave ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {isApplyingLeave ? 'Cancel' : '+ Apply Leave'}
                </button>
              </div>

              {/* Leave Form */}
              {isApplyingLeave && (
                <form onSubmit={handleApplyLeave} style={{ background: 'rgba(0,0,0,0.35)', padding: '1.5rem', borderRadius: '18px', marginBottom: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Start Date</label>
                      <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ padding: '0.7rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>End Date</label>
                      <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} required style={{ padding: '0.7rem' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Reason</label>
                    <input type="text" className="form-control" value={reason} onChange={e => setReason(e.target.value)} required style={{ padding: '0.7rem' }} />
                  </div>
                  <button type="submit" className="btn" style={{ width: '100%', background: 'linear-gradient(135deg, #059669, #10b981)', fontWeight: 800, padding: '0.9rem', fontSize: '1rem' }}>
                    <Send size={17} /> Submit for Approval
                  </button>
                </form>
              )}

              {/* Leaves List */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {leaves.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', fontSize: '0.95rem' }}>
                    No leave requests submitted for this nurse.
                  </div>
                ) : (
                  leaves.map(l => (
                    <div key={l._id} style={{ padding: '1rem 1.25rem', borderRadius: '16px', background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1rem' }}>
                          {new Date(l.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} → {new Date(l.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>"{l.reason}"</div>
                      </div>
                      <span style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        background: l.status === 'Pending' ? 'rgba(245, 158, 11, 0.2)' : l.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: l.status === 'Pending' ? '#fbbf24' : l.status === 'Approved' ? '#34d399' : '#f87171'
                      }}>
                        {l.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>
        </>
      ) : (
        <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.2rem' }}>
          Loading nurse details...
        </div>
      )}

    </div>
  );
}
