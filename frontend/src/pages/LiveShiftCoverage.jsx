import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  HeartPulse, 
  CalendarDays,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LiveShiftCoverage() {
  const [currentShiftData, setCurrentShiftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [schedulingNurseId, setSchedulingNurseId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');

  const fetchShiftStatus = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/nurses/current-shift-status')
      .then(res => res.json())
      .then(data => {
        if (data && data.currentShift) {
          setCurrentShiftData(data);
        }
      })
      .catch(err => console.error('Error fetching shift status:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchShiftStatus();
  }, []);

  // Handle Automatic Emergency Replacement of an Absent Nurse
  const handleAutoScheduleSubstitute = async (absentNurse) => {
    try {
      setAutoScheduling(true);
      setSchedulingNurseId(absentNurse._id);

      const res = await fetch('http://localhost:5000/api/nurses/auto-schedule-substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          absentNurseId: absentNurse._id,
          shiftType: currentShiftData?.currentShift?.shiftType || 'Morning',
          department: absentNurse.department || 'ICU',
          hours: 8,
          reason: `Auto Emergency Dispatch: Replaced absent nurse (${absentNurse.name}) due to sudden leave in ${absentNurse.department}. Non-continuation anti-fatigue rule enforced.`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to auto-schedule substitute');

      setToastMessage({
        type: 'success',
        text: `✓ ${data.message} ${data.consecutiveShiftRule ? `(${data.consecutiveShiftRule})` : ''}`
      });
      setTimeout(() => setToastMessage(null), 6000);

      // Refresh data immediately
      fetchShiftStatus();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: `⚠️ Auto-Schedule Error: ${err.message}`
      });
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setAutoScheduling(false);
      setSchedulingNurseId(null);
    }
  };

  const workingNurses = currentShiftData?.workingNurses || [];
  const absentNurses = currentShiftData?.absentNurses || [];
  const alternates = currentShiftData?.alternates || [];
  const shiftInfo = currentShiftData?.currentShift || { shiftType: 'Morning', hoursLabel: '08:00 - 16:00' };

  // Filter working nurses by department if needed
  const filteredWorkingNurses = selectedDeptFilter === 'All' 
    ? workingNurses 
    : workingNurses.filter(n => n.department === selectedDeptFilter);

  const departments = ['All', 'Normal Ward', 'ER', 'ICU', 'OP'];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '25px',
          right: '25px',
          zIndex: 9999,
          background: toastMessage.type === 'error' ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'linear-gradient(135deg, #059669, #10b981)',
          color: '#ffffff',
          padding: '1.1rem 1.6rem',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          fontWeight: 700,
          fontSize: '0.96rem',
          maxWidth: '520px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toastMessage.type === 'error' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '2rem 2.25rem',
        borderRadius: '24px',
        marginBottom: '1.75rem',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.18)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.65rem' }}>
              <Clock size={15} /> CLINICAL SHIFT DISPATCH & ATTENDANCE
            </div>
            <h1 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Shift Operations & Emergency Overtime Allocation
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.98rem', color: '#94a3b8', maxWidth: '820px', lineHeight: 1.5 }}>
              Standard Hospital Protocol: Exactly <strong>3 nurses required per shift</strong> in <strong>Normal Ward</strong>, <strong>ER</strong>, <strong>ICU</strong>, and <strong>OP</strong>. If any nurse takes sudden leave, the system automatically allocates overtime to the off-duty nurse with lowest overtime.
            </p>
          </div>

          {/* Current Shift Badge & Refresh Button */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '16px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontWeight: 800
            }}>
              <span style={{ fontSize: '1.2rem' }}>☀️</span>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b' }}>Active Clinical Shift</div>
                <div style={{ fontSize: '1rem', color: '#ffffff' }}>{shiftInfo.shiftType} ({shiftInfo.hoursLabel})</div>
              </div>
            </div>

            <button
              onClick={fetchShiftStatus}
              disabled={loading}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.8rem 1.1rem',
                borderRadius: '14px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem'
              }}
              title="Refresh Shift Data"
            >
              <RefreshCw size={17} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Metric Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginTop: '1.75rem' }}>
          
          <div style={{ padding: '1rem 1.2rem', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <UserCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{workingNurses.length}</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.2rem' }}>Total Active Staff</div>
            </div>
          </div>

          <div style={{ padding: '1rem 1.2rem', borderRadius: '16px', background: absentNurses.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)', border: absentNurses.length > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: absentNurses.length > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: absentNurses.length > 0 ? '#f87171' : '#94a3b8' }}>
              <UserX size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: absentNurses.length > 0 ? '#f87171' : '#f8fafc', lineHeight: 1 }}>{absentNurses.length}</div>
              <div style={{ fontSize: '0.82rem', color: absentNurses.length > 0 ? '#fca5a5' : '#94a3b8', fontWeight: 600, marginTop: '0.2rem' }}>Sudden Leave Shortage</div>
            </div>
          </div>

          <div style={{ padding: '1rem 1.2rem', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{alternates.length}</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.2rem' }}>Eligible OT Candidates</div>
            </div>
          </div>

          <div style={{ padding: '1rem 1.2rem', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1.2 }}>Anti-Fatigue Guard</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.2rem' }}>Non-continuation active</div>
            </div>
          </div>

        </div>
      </div>

      {/* 4 DEPARTMENT STAFFING STATUS CARDS (3 NURSES NEEDED IN NORMAL WARD, ER, ICU, OP) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {['Normal Ward', 'ER', 'ICU', 'OP'].map(deptName => {
          const onDuty = workingNurses.filter(n => n.department === deptName).length;
          const required = 3;
          const deficit = Math.max(0, required - onDuty);
          const icon = {
            'Normal Ward': '🏥',
            'ER': '🚑',
            'ICU': '🏥',
            'OP': '🩺'
          }[deptName];

          return (
            <div key={deptName} style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '20px',
              background: deficit > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.1)',
              border: deficit > 0 ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  <span>{icon}</span>
                  <span>{deptName}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Requirement: <strong>3 Nurses / Shift</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  color: deficit > 0 ? '#f87171' : '#34d399',
                  lineHeight: 1.1
                }}>
                  {onDuty} / {required}
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  display: 'inline-block',
                  marginTop: '0.35rem',
                  background: deficit > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                  color: deficit > 0 ? '#fca5a5' : '#34d399'
                }}>
                  {deficit > 0 ? `⚠️ ${deficit} Nurse Deficit` : '✓ 100% Staffed'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* POLICY NOTICE CARD */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '18px',
        padding: '1.1rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
            <Info size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem' }}>
              Standard Shift Staffing & Overtime Allocation Protocol
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.15rem' }}>
              • <strong>Departments</strong>: Normal Ward, ER, ICU, and OP only • <strong>Shift Quota</strong>: Exactly 3 nurses required per department • <strong>Overtime Allocation</strong>: On any sudden leave, overtime is automatically assigned to off-duty nurses with lowest OT, pausing their next regular shift.
            </div>
          </div>
        </div>
        <Link
          to="/overtime"
          style={{
            fontSize: '0.82rem',
            color: '#38bdf8',
            textDecoration: 'none',
            fontWeight: 800,
            padding: '0.45rem 0.95rem',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}
        >
          View Overtime Records →
        </Link>
      </div>

      {/* SECTION 1: EMERGENCY ABSENCE COVERAGE DISPATCH (TOP PRIORITY) */}
      <div className="glass-panel" style={{
        padding: '2rem',
        borderRadius: '24px',
        border: absentNurses.length > 0 ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(16, 185, 129, 0.3)',
        marginBottom: '2.5rem',
        background: absentNurses.length > 0 ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)' : 'rgba(15, 23, 42, 0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {absentNurses.length > 0 ? <AlertTriangle color="#f87171" size={24} /> : <CheckCircle2 color="#34d399" size={24} />}
              <span>Sudden Absence Alert & One-Click Substitute Dispatch</span>
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              {absentNurses.length > 0 
                ? 'Clinical staff deficits detected. The system has automatically calculated the optimal off-duty nurse with the lowest overtime.'
                : 'No sudden absences or deficits in the active shift roster. Hospital department ratios are fully compliant.'}
            </p>
          </div>
          <span style={{
            padding: '0.35rem 0.9rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 800,
            background: absentNurses.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: absentNurses.length > 0 ? '#f87171' : '#34d399',
            border: absentNurses.length > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            {absentNurses.length > 0 ? `⚠️ ${absentNurses.length} Deficit Needing Coverage` : '✓ 100% Staffing Coverage'}
          </span>
        </div>

        {absentNurses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '18px',
            border: '1px dashed rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.15rem' }}>No Urgent Staffing Shortages</div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '480px', margin: '0.5rem auto 0 auto' }}>
              All assigned nurses are present or accounted for. When a nurse calls in sick or submits sudden leave, replacement recommendations will appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
            {absentNurses.map(abs => {
              // Find the best recommended alternate for this nurse's department or overall
              const bestMatch = alternates.find(a => a.department === abs.department) || alternates[0];

              return (
                <div key={abs._id} style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderRadius: '20px',
                  padding: '1.6rem',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  boxShadow: '0 8px 24px rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}>
                  
                  {/* Absent Nurse Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5', fontSize: '0.76rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                        DEFICIT: {abs.department} DEPARTMENT
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
                        {abs.name} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>({abs.employeeId})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '0.2rem', fontStyle: 'italic' }}>
                        Reason: "{abs.reason || 'Sudden Illness / Emergency Medical Leave'}"
                      </div>
                    </div>

                    <span style={{ padding: '0.3rem 0.75rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 800, fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                      {abs.leaveStatus || 'On Sudden Leave'}
                    </span>
                  </div>

                  {/* Automated Substitute Matching Box */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '16px',
                    padding: '1.2rem',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={16} /> SYSTEM RECOMMENDED SUBSTITUTE
                      </span>
                      <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: '#059669', color: '#fff', fontWeight: 800 }}>
                        Lowest Overtime Candidate
                      </span>
                    </div>

                    {bestMatch ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                            {bestMatch.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                            Dept: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{bestMatch.department}</span> • Shift Status: <span style={{ color: '#34d399' }}>{bestMatch.currentShiftWorked}</span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(52, 211, 153, 0.2)',
                            color: '#34d399',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            border: '1px solid rgba(52, 211, 153, 0.4)'
                          }}>
                            {bestMatch.totalOvertimeHours}h Total OT
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        No alternate candidate available in database.
                      </div>
                    )}

                    {/* Anti-Fatigue Rule Enforcement Notification */}
                    <div style={{
                      marginTop: '0.85rem',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(56, 189, 248, 0.1)',
                      borderRadius: '10px',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      fontSize: '0.78rem',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <ShieldAlert size={16} flexShrink={0} />
                      <span>
                        <strong>Anti-Fatigue Safeguard:</strong> This substitute's next regular shift will NOT continue immediately after this emergency shift.
                      </span>
                    </div>
                  </div>

                  {/* Dispatch Action Button */}
                  <button
                    onClick={() => handleAutoScheduleSubstitute(abs)}
                    disabled={autoScheduling && schedulingNurseId === abs._id}
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      color: '#ffffff',
                      padding: '0.85rem 1.4rem',
                      borderRadius: '14px',
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      border: 'none',
                      cursor: autoScheduling ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                  >
                    <Zap size={18} />
                    {autoScheduling && schedulingNurseId === abs._id ? 'Auto-Dispatching Candidate...' : `Auto-Schedule Substitute (${bestMatch?.name || 'Lowest OT'})`}
                  </button>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2 & 3 IN A 2-COLUMN GRID: WORKING ON SHIFT vs. ELIGIBLE ALTERNATES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '2rem' }}>
        
        {/* COLUMN 1: NURSES WORKING IN ACTIVE SHIFT */}
        <div className="glass-panel" style={{
          padding: '1.85rem',
          borderRadius: '24px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="#10b981" /> Actively Working On Shift
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
                Staff on roster for {shiftInfo.shiftType} Shift ({shiftInfo.hoursLabel})
              </p>
            </div>
            <span style={{ fontSize: '0.82rem', padding: '0.25rem 0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800 }}>
              {filteredWorkingNurses.length} Nurses
            </span>
          </div>

          {/* Department Quick Filter Pills */}
          <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDeptFilter(dept)}
                style={{
                  background: selectedDeptFilter === dept ? 'var(--primary-color)' : 'rgba(255,255,255,0.06)',
                  color: selectedDeptFilter === dept ? '#fff' : '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: selectedDeptFilter === dept ? 800 : 600,
                  cursor: 'pointer'
                }}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Nurse list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {filteredWorkingNurses.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                No active nurses found for the selected filter.
              </div>
            ) : (
              filteredWorkingNurses.map(nurse => (
                <div key={nurse._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.95rem 1.15rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}>
                      {nurse.name?.charAt(0) || 'N'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.98rem' }}>{nurse.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Dept: <strong style={{ color: '#cbd5e1' }}>{nurse.department}</strong> • ID: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{nurse.employeeId}</span>
                      </div>
                    </div>
                  </div>

                  <span style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    background: 'rgba(16, 185, 129, 0.18)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }}></span>
                    On Duty
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: RECOMMENDED OFF-DUTY ALTERNATES (LOWEST OVERTIME FIRST) */}
        <div className="glass-panel" style={{
          padding: '1.85rem',
          borderRadius: '24px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="#fbbf24" /> Off-Duty Substitutes (Low OT Ranked)
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
                Eligible nurses prioritized by lowest overtime to prevent nurse fatigue
              </p>
            </div>
            <span style={{ fontSize: '0.82rem', padding: '0.25rem 0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 800 }}>
              {alternates.length} Available
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
            {alternates.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                No off-duty substitute candidates available in records.
              </div>
            ) : (
              alternates.map((alt, idx) => (
                <div key={alt._id} style={{
                  padding: '1rem 1.15rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  border: idx === 0 ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: idx === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                        color: idx === 0 ? '#34d399' : '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.88rem'
                      }}>
                        #{idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          {alt.name}
                          {idx === 0 && (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: '#059669', color: '#fff', fontWeight: 800 }}>
                              ★ #1 Priority
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {alt.department} Department • <span style={{ color: '#38bdf8' }}>{alt.employeeId}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '0.3rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        background: alt.totalOvertimeHours === 0 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: alt.totalOvertimeHours === 0 ? '#34d399' : '#fbbf24',
                        border: alt.totalOvertimeHours === 0 ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                      }}>
                        {alt.totalOvertimeHours}h Total OT
                      </span>
                    </div>
                  </div>

                  {/* Anti-Fatigue Non-Continuation Tag */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.74rem',
                    color: '#38bdf8',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '0.45rem'
                  }}>
                    <span>🛡️ Next regular shift paused for rest</span>
                    <span style={{ color: '#34d399', fontWeight: 800 }}>Off-Duty Eligible</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
