import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LabelList
} from 'recharts';
import { 
  Users, 
  UserCheck, 
  CalendarOff, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  Building2,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  UserX,
  UserPlus,
  ShieldAlert,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/leaves')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUpcomingLeaves(data.slice(0, 5)); // show latest 5
        }
      })
      .catch(err => console.error('Error fetching dashboard leaves:', err));
  }, []);

  // Department Staffing Data (Only Normal Ward, ER, ICU, and OP - 3 Nurses required per shift)
  const deptData = [
    { name: 'Normal Ward', nurses: 5, icon: '🏥', color: '#38bdf8', fill: 'url(#pedsGrad)' },
    { name: 'ER', nurses: 5, icon: '🚑', color: '#f43f5e', fill: 'url(#erGrad)' },
    { name: 'ICU', nurses: 5, icon: '🏥', color: '#818cf8', fill: 'url(#icuGrad)' },
    { name: 'OP', nurses: 5, icon: '🩺', color: '#34d399', fill: 'url(#surgGrad)' },
  ];

  // Shift Distribution Data
  const shiftData = [
    { name: 'Morning Shift', value: 20, color: '#f59e0b', icon: '☀️' },
    { name: 'Evening Shift', value: 16, color: '#ec4899', icon: '🌆' },
    { name: 'Night Shift', value: 12, color: '#6366f1', icon: '🌙' },
  ];

  const totalShifts = shiftData.reduce((acc, curr) => acc + curr.value, 0);

  // Custom Cute Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.96)',
          border: `1px solid ${data.color}`,
          boxShadow: `0 10px 25px ${data.color}40`,
          borderRadius: '14px',
          padding: '0.75rem 1.1rem',
          color: '#fff',
          fontSize: '0.9rem'
        }}>
          <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '1rem' }}>
            <span>{data.icon}</span>
            <span>{data.name} Department</span>
          </div>
          <div style={{ color: '#cbd5e1' }}>
            Active Staff: <strong style={{ color: data.color, fontSize: '1.05rem' }}>{data.nurses} nurses</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Donut Chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          borderRadius: '14px',
          padding: '0.75rem 1.1rem',
          color: '#fff',
          fontSize: '0.9rem'
        }}>
          <div style={{ fontWeight: 800, color: data.payload.color, fontSize: '1rem' }}>
            {data.payload.icon} {data.name}
          </div>
          <div style={{ color: '#cbd5e1', marginTop: '0.3rem' }}>
            Assigned: <strong>{data.value} nurses</strong> ({Math.round((data.value / totalShifts) * 100)}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', paddingBottom: '3rem' }}>
      {/* Header with hospital badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.14)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Building2 size={15} /> HOSPITAL SCHEDULING PORTAL
          </div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Admin Dashboard
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '1rem' }}>
            Monitor real-time nursing allocations, department coverage, and upcoming leave requests.
          </p>
        </div>
      </div>
      
      {/* 4 Stat Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem', gap: '1.25rem' }}>
        
        {/* Card 1: Total Nurses */}
        <div className="glass-panel stat-card" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.92rem', fontWeight: 600 }}>Total Nurses</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '0.5rem', borderRadius: '12px' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff' }}>54</div>
          <div style={{ fontSize: '0.82rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', fontWeight: 600 }}>
            <TrendingUp size={14} /> Full Hospital Roster
          </div>
        </div>

        {/* Card 2: Available Today */}
        <div className="glass-panel stat-card" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.92rem', fontWeight: 600 }}>Available Today</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.5rem', borderRadius: '12px' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#34d399' }}>42</div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            Eligible for active shifts
          </div>
        </div>

        {/* Card 3: On Leave */}
        <div className="glass-panel stat-card" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.92rem', fontWeight: 600 }}>On Leave</span>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.5rem', borderRadius: '12px' }}>
              <CalendarOff size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f87171' }}>5</div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            Approved leave records
          </div>
        </div>

        {/* Card 4: Overtime Hours */}
        <div className="glass-panel stat-card" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.92rem', fontWeight: 600 }}>Total Overtime</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '0.5rem', borderRadius: '12px' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fbbf24' }}>124 <span style={{ fontSize: '1.1rem', fontWeight: 500, color: '#94a3b8' }}>hrs</span></div>
          <div style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '0.35rem' }}>
            Tracked across departments
          </div>
        </div>

      </div>

      {/* Visual Analytics Section (Balanced, Symmetrical & Clear) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '1.75rem', marginBottom: '2rem' }}>
        
        {/* Left Card: Department Staffing Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.85rem', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🏥</span> Department Staffing
              </h3>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                Shows the exact count of nurses on duty in each medical department.
              </p>
            </div>
            <span style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', fontWeight: 700, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              4 Departments
            </span>
          </div>

          {/* Comfortable, Clear 300px Height Bar Chart */}
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 25, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="icuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="erGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={1} />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="pedsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="surgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                  </linearGradient>
                </defs>

                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{ fill: '#f8fafc', fontSize: 13, fontWeight: 700 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 10 }} />
                
                <Bar 
                  dataKey="nurses" 
                  barSize={46} 
                  radius={[14, 14, 4, 4]}
                >
                  <LabelList 
                    dataKey="nurses" 
                    position="top" 
                    fill="#ffffff" 
                    fontSize={13} 
                    fontWeight={800} 
                    offset={8} 
                  />
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Quick Stats Cards below the chart */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', marginTop: '0.75rem' }}>
            {deptData.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.4rem', borderRadius: '12px', border: `1px solid ${d.color}30` }}>
                <span style={{ fontSize: '1.1rem' }}>{d.icon}</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: d.color, marginTop: '0.15rem' }}>{d.nurses}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{d.name}</div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Card: Shift Distribution Donut Chart */}
        <div className="glass-panel" style={{ padding: '1.85rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>🕒</span> Shift Distribution
                </h3>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                  Coverage breakdown across 24-hour cycles.
                </p>
              </div>
              <span style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                48 On Duty
              </span>
            </div>

            <div style={{ width: '100%', height: '285px', position: 'relative', marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={shiftData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={108}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {shiftData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{totalShifts}</div>
                <div style={{ fontSize: '0.78rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginTop: '0.2rem' }}>Total Shifts</div>
              </div>
            </div>
          </div>

          {/* Shift Badges Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            {shiftData.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0.6rem 0.4rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}35` }}>
                <div style={{ fontSize: '1.1rem' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: s.color, marginTop: '0.2rem' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                  {s.name.replace(' Shift', '')} ({Math.round((s.value / totalShifts) * 100)}%)
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* SECTION: Upcoming Nurse Leave Requests (with DEPARTMENT prominently highlighted) */}
      <div className="glass-panel" style={{ padding: '1.85rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.12)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarCheck size={20} color="#fbbf24" /> Upcoming Nurse Leave Requests
            </h3>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              Recently submitted nurse leave requests awaiting or completed with department allocations.
            </p>
          </div>
          <Link to="/availability" style={{ fontSize: '0.88rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Manage & Approve Leaves →
          </Link>
        </div>

        {upcomingLeaves.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            No upcoming nurse leave requests recorded.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '0.85rem' }}>Nurse Staff</th>
                <th style={{ padding: '0.85rem' }}>Nurse Department</th>
                <th style={{ padding: '0.85rem' }}>Leave Period</th>
                <th style={{ padding: '0.85rem' }}>Reason</th>
                <th style={{ padding: '0.85rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingLeaves.map((leave, i) => {
                const nurseName = leave.nurseId?.name || 'Priya Sharma';
                const dept = leave.nurseId?.department || 'ICU';
                const empId = leave.nurseId?.employeeId || 'N001';
                const sDate = new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
                const eDate = new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' });

                // Cute department badge styling
                const deptColors = {
                  'Normal Ward': { bg: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', icon: '🏥' },
                  ER: { bg: 'rgba(244, 63, 94, 0.18)', color: '#fb7185', icon: '🚑' },
                  ICU: { bg: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', icon: '🏥' },
                  OP: { bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', icon: '🩺' },
                }[dept] || { bg: 'rgba(255,255,255,0.1)', color: '#cbd5e1', icon: '🏥' };

                return (
                  <tr key={leave._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    
                    {/* Nurse Name */}
                    <td style={{ padding: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      <div>{nurseName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'monospace' }}>ID: {empId}</div>
                    </td>

                    {/* Department (Requested specifically by user) */}
                    <td style={{ padding: '0.85rem' }}>
                      <span style={{
                        padding: '0.35rem 0.8rem',
                        borderRadius: '10px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        background: deptColors.bg,
                        color: deptColors.color,
                        border: `1px solid ${deptColors.color}40`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        <span>{deptColors.icon}</span>
                        <span>{dept} Department</span>
                      </span>
                    </td>

                    {/* Dates */}
                    <td style={{ padding: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                      {sDate} → {eDate}
                    </td>

                    {/* Reason */}
                    <td style={{ padding: '0.85rem', color: '#94a3b8' }}>
                      "{leave.reason}"
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.85rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: leave.status === 'Pending' ? 'rgba(245, 158, 11, 0.2)' : leave.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: leave.status === 'Pending' ? '#fbbf24' : leave.status === 'Approved' ? '#34d399' : '#f87171',
                        border: `1px solid ${leave.status === 'Pending' ? 'rgba(245, 158, 11, 0.4)' : leave.status === 'Approved' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                      }}>
                        {leave.status === 'Pending' ? 'Pending Approval' : leave.status}
                      </span>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* SECTION: SHORTCUT TO DEDICATED LIVE SHIFT & COVERAGE TAB */}
      <div className="glass-panel" style={{
        padding: '1.6rem 2rem',
        borderRadius: '24px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.7))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'rgba(56, 189, 248, 0.18)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc' }}>
                Live Shift Operations & Sudden Leave Coverage
              </h3>
              <span style={{
                fontSize: '0.74rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                fontWeight: 800,
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                Dedicated Tab
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              View active working nurses, track sudden absences, and auto-schedule low-overtime substitutes with anti-fatigue non-continuation rules.
            </p>
          </div>
        </div>

        <Link
          to="/live-shifts"
          className="btn"
          style={{
            background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
            color: '#ffffff',
            padding: '0.75rem 1.4rem',
            borderRadius: '12px',
            fontSize: '0.92rem',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.35)'
          }}
        >
          <span>Open Shift Operations</span>
          <ArrowRight size={17} />
        </Link>
      </div>

    </div>
  );
}
