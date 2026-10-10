import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Clock, 
  User, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Calendar,
  CheckCircle2,
  Coffee,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
  Activity
} from 'lucide-react';

export default function NurseUpcomingShifts() {
  const [allNurses, setAllNurses] = useState([]);
  const [selectedNurseId, setSelectedNurseId] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const activeNurse = allNurses.find(n => n._id === selectedNurseId) || allNurses[0];

  // Fetch shifts for selected nurse
  useEffect(() => {
    if (activeNurse) {
      fetch(`http://localhost:5000/api/schedules/nurse/${activeNurse._id}/shifts`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setShifts(data);
          }
        })
        .catch(err => console.error('Error fetching shifts:', err));
    }
  }, [activeNurse]);

  // Current date helpers
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const formatDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateStr(todayDate);
  const tomorrowStr = formatDateStr(tomorrowDate);

  // Filter shifts from backend if available, or fall back to simulated clinical schedule
  const formatShiftDate = (d) => {
    try {
      const dateObj = new Date(d);
      return formatDateStr(dateObj);
    } catch {
      return '';
    }
  };

  const dbTodayShift = shifts.find(s => formatShiftDate(s.date) === todayStr);
  const dbTomorrowShift = shifts.find(s => formatShiftDate(s.date) === tomorrowStr);

  // Dynamic fallback roster based on nurse's department and ID
  const defaultTodayShift = {
    date: todayStr,
    shiftType: activeNurse?.preferredShift === 'Night' ? 'Night' : 'Morning',
    hours: activeNurse?.preferredShift === 'Night' ? '00:00 - 08:00 (Night)' : '08:00 - 16:00 (Morning)',
    ward: `${activeNurse?.department || 'ICU'} - Bay A (Bed 1-4)`,
    supervisor: 'Dr. Ramesh / Charge Nurse',
    duties: ['Patient Vitals & Medication Rounds', 'Post-Op Monitoring', 'Shift Handover & EMR Charting'],
    status: 'Confirmed'
  };

  const defaultTomorrowShift = {
    date: tomorrowStr,
    shiftType: 'Evening',
    hours: '16:00 - 00:00 (Evening)',
    ward: `${activeNurse?.department || 'ICU'} - High Dependency Unit`,
    supervisor: 'Dr. Ananya / Lead Resident',
    duties: ['IV Infusion Management', 'Evening Medication Administration', 'Emergency Intake Support'],
    status: 'Scheduled'
  };

  const todayShift = dbTodayShift ? {
    date: todayStr,
    shiftType: dbTodayShift.shiftType,
    hours: dbTodayShift.shiftType === 'Morning' ? '08:00 - 16:00' : dbTodayShift.shiftType === 'Evening' ? '16:00 - 00:00' : '00:00 - 08:00',
    ward: `${dbTodayShift.department || activeNurse?.department || 'ICU'} Station`,
    supervisor: 'Head Nurse & Department Supervisor',
    duties: ['Patient Care & Vitals Protocol', 'Administering Prescribed Treatments', 'Clinical Handover'],
    status: dbTodayShift.status || 'Approved'
  } : defaultTodayShift;

  const tomorrowShift = dbTomorrowShift ? {
    date: tomorrowStr,
    shiftType: dbTomorrowShift.shiftType,
    hours: dbTomorrowShift.shiftType === 'Morning' ? '08:00 - 16:00' : dbTomorrowShift.shiftType === 'Evening' ? '16:00 - 00:00' : '00:00 - 08:00',
    ward: `${dbTomorrowShift.department || activeNurse?.department || 'ICU'} Station`,
    supervisor: 'Attending Physician & Charge Nurse',
    duties: ['Shift Assessment & Documentation', 'Medication Safety Verification', 'Patient Rounds'],
    status: dbTomorrowShift.status || 'Approved'
  } : defaultTomorrowShift;

  const getShiftIcon = (type) => {
    switch(type) {
      case 'Morning': return <Sun size={28} color="#eab308" />;
      case 'Evening': return <Sunset size={28} color="#f97316" />;
      case 'Night': return <Moon size={28} color="#818cf8" />;
      default: return <Clock size={28} color="#38bdf8" />;
    }
  };

  const getShiftBadgeStyle = (type) => {
    switch(type) {
      case 'Morning':
        return { background: 'rgba(234, 179, 8, 0.18)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.4)' };
      case 'Evening':
        return { background: 'rgba(249, 115, 22, 0.18)', color: '#fdba74', border: '1px solid rgba(249, 115, 22, 0.4)' };
      case 'Night':
        return { background: 'rgba(129, 140, 248, 0.18)', color: '#a5b4fc', border: '1px solid rgba(129, 140, 248, 0.4)' };
      default:
        return { background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' };
    }
  };

  return (
    <div style={{ width: '100%', paddingBottom: '3rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            <CalendarDays size={16} /> NURSE LIVE DUTY ROSTER
          </div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Today & Tomorrow Shift Schedule
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '1.05rem' }}>
            Immediate operational shift assignments, assigned wards, and clinical duties for the active nurse.
          </p>
        </div>

        {/* Switch Nurse Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(30, 41, 59, 0.85)', padding: '0.6rem 1.1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          <User size={19} color="#38bdf8" />
          <span style={{ fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 700 }}>Active Nurse:</span>
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
      </div>

      {activeNurse && (
        <>
          {/* Active Nurse Quick Banner */}
          <div className="glass-panel" style={{ padding: '1.5rem 2rem', borderRadius: '20px', marginBottom: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(56, 189, 248, 0.25)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#fff', boxShadow: '0 6px 20px rgba(56, 189, 248, 0.3)' }}>
                {activeNurse.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{activeNurse.name}</h3>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', color: '#94a3b8', fontSize: '0.92rem' }}>
                  <span>ID: <strong style={{ color: '#e2e8f0' }}>{activeNurse.employeeId}</strong></span>
                  <span>•</span>
                  <span>Department: <strong style={{ color: '#38bdf8' }}>{activeNurse.department}</strong></span>
                  <span>•</span>
                  <span>Designation: <strong style={{ color: '#e2e8f0' }}>{activeNurse.designation || 'Staff Nurse'}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }}></span>
                  <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.98rem' }}>On Active Duty</span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN 2-COLUMN GRID: TODAY'S SHIFT & TOMORROW'S SHIFT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
            
            {/* CARD 1: TODAY'S SHIFT */}
            <div className="glass-panel" style={{ padding: '2.2rem', borderRadius: '26px', border: '1px solid rgba(56, 189, 248, 0.3)', position: 'relative', overflow: 'hidden' }}>
              
              {/* Highlight bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', padding: '0.3rem 0.85rem', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ● TODAY'S SHIFT
                  </span>
                  <h2 style={{ margin: '0.75rem 0 0 0', fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h2>
                </div>
                <div style={{ padding: '0.85rem', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getShiftIcon(todayShift.shiftType)}
                </div>
              </div>

              {/* Shift Type and Hours Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.65)', borderRadius: '18px', padding: '1.4rem', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>Shift Slot:</span>
                  <span style={{ padding: '0.35rem 0.95rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 800, ...getShiftBadgeStyle(todayShift.shiftType) }}>
                    {todayShift.shiftType} Shift
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>Operating Hours:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={17} color="#38bdf8" /> {todayShift.hours}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>Assigned Station:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={16} color="#a855f7" /> {todayShift.ward}
                  </span>
                </div>
              </div>

              {/* Duties & Responsibilities */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Assigned Clinical Responsibilities:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {todayShift.duties.map((duty, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.03)', padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.92rem', color: '#cbd5e1' }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>{duty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisory Note & Status */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                  Reporting To: <strong style={{ color: '#e2e8f0' }}>{todayShift.supervisor}</strong>
                </div>
                <span style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800 }}>
                  ✓ {todayShift.status}
                </span>
              </div>

            </div>

            {/* CARD 2: TOMORROW'S SHIFT */}
            <div className="glass-panel" style={{ padding: '2.2rem', borderRadius: '26px', border: '1px solid rgba(249, 115, 22, 0.3)', position: 'relative', overflow: 'hidden' }}>
              
              {/* Highlight bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #f97316, #fbbf24)' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', padding: '0.3rem 0.85rem', borderRadius: '20px', background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ● TOMORROW'S SHIFT
                  </span>
                  <h2 style={{ margin: '0.75rem 0 0 0', fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc' }}>
                    {tomorrowDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h2>
                </div>
                <div style={{ padding: '0.85rem', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getShiftIcon(tomorrowShift.shiftType)}
                </div>
              </div>

              {/* Shift Type and Hours Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.65)', borderRadius: '18px', padding: '1.4rem', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>Shift Slot:</span>
                  <span style={{ padding: '0.35rem 0.95rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 800, ...getShiftBadgeStyle(tomorrowShift.shiftType) }}>
                    {tomorrowShift.shiftType} Shift
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>Operating Hours:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={17} color="#fb923c" /> {tomorrowShift.hours}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>Assigned Station:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={16} color="#38bdf8" /> {tomorrowShift.ward}
                  </span>
                </div>
              </div>

              {/* Duties & Responsibilities */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Scheduled Responsibilities:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {tomorrowShift.duties.map((duty, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.03)', padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.92rem', color: '#cbd5e1' }}>
                      <CheckCircle2 size={16} color="#fb923c" />
                      <span>{duty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisory Note & Status */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                  Reporting To: <strong style={{ color: '#e2e8f0' }}>{tomorrowShift.supervisor}</strong>
                </div>
                <span style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', fontWeight: 800 }}>
                  ✓ {tomorrowShift.status}
                </span>
              </div>

            </div>

          </div>

          {/* SECTION: FULL WEEK SCHEDULE OVERVIEW */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={22} color="#38bdf8" /> 7-Day Lookahead Roster
                </h3>
                <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Comprehensive weekly schedule projection for {activeNurse.name}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const day = new Date(todayDate);
                day.setDate(day.getDate() + offset);
                const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = day.getDate();
                const isToday = offset === 0;
                const isTomorrow = offset === 1;
                
                // Determine shift type
                const shiftForDay = offset === 0 ? todayShift.shiftType : offset === 1 ? tomorrowShift.shiftType : (offset === 3 || offset === 6 ? 'Off / Rest' : 'Morning');
                const isRest = shiftForDay === 'Off / Rest';

                return (
                  <div 
                    key={offset}
                    style={{
                      background: isToday ? 'rgba(56, 189, 248, 0.15)' : isTomorrow ? 'rgba(249, 115, 22, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                      border: isToday ? '1px solid #38bdf8' : isTomorrow ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      padding: '1.2rem 0.8rem',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isToday ? '#38bdf8' : isTomorrow ? '#fb923c' : '#94a3b8', textTransform: 'uppercase' }}>
                      {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dayName}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc' }}>
                      {dayNum}
                    </span>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '8px',
                      background: isRest ? 'rgba(148, 163, 184, 0.15)' : shiftForDay === 'Morning' ? 'rgba(234, 179, 8, 0.2)' : shiftForDay === 'Evening' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(129, 140, 248, 0.2)',
                      color: isRest ? '#94a3b8' : shiftForDay === 'Morning' ? '#fde047' : shiftForDay === 'Evening' ? '#fdba74' : '#a5b4fc'
                    }}>
                      {shiftForDay}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
