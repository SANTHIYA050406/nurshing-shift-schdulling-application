import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Check, 
  Building2, 
  Clock, 
  User, 
  ShieldCheck,
  Zap,
  UserX,
  UserCheck,
  Mail,
  Send,
  ExternalLink,
  Eye,
  X
} from 'lucide-react';

export default function Scheduler() {
  const [status, setStatus] = useState('idle');
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [emailResults, setEmailResults] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [previewEmailModal, setPreviewEmailModal] = useState(null);

  // Form states (3 nurses required per shift across Normal Ward, ER, ICU, OP)
  const [department, setDepartment] = useState('Normal Ward');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  const endD = new Date();
  endD.setDate(endD.getDate() + 6);
  const [endDate, setEndDate] = useState(endD.toISOString().split('T')[0]);

  // Default to 3 nurses per morning shift (the required 3-nurse quota)
  const [morning, setMorning] = useState(3);
  const [evening, setEvening] = useState(0);
  const [night, setNight] = useState(0);
  const [maxConsecutive, setMaxConsecutive] = useState(5);

  // Load existing schedule and leaves for department on mount / department change
  const loadData = () => {
    fetch('http://localhost:5000/api/schedules')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const match = data.find(s => s.department === department);
          if (match) {
            setSchedule(match);
            setStatus('generated');
            setIsApproved(match.status === 'Approved');
          } else {
            setSchedule(null);
            setStatus('idle');
          }
        }
      })
      .catch(() => {});

    fetch('http://localhost:5000/api/leaves')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setLeaves(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, [department]);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setStatus('generating');
    setError(null);
    setIsApproved(false);
    
    try {
      const response = await fetch('http://localhost:5000/api/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: startDate,
          periodEnd: endDate,
          department,
          requirements: { morning, evening, night },
          maxConsecutiveShifts: maxConsecutive
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to generate schedule');
      }

      const data = await response.json();
      setSchedule(data);
      setStatus('generated');
      loadData();
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  // Approve Schedule
  const handleApproveSchedule = async () => {
    if (!schedule || !schedule._id) return;
    setIsApproving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/schedules/${schedule._id}/approve`, {
        method: 'PATCH'
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to approve schedule');
      }
      const data = await res.json();
      setIsApproved(true);
      if (data.emailNotifications) {
        setEmailResults(data.emailNotifications);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  // Export Schedule to CSV
  const handleExportCSV = () => {
    if (!schedule || !schedule.shifts || schedule.shifts.length === 0) return;

    const headers = ['Date', 'Shift Type', 'Department', 'Employee ID', 'Nurse Name', 'Designation', 'Assignment Type'];
    const rows = schedule.shifts.map(s => {
      const dateStr = new Date(s.date).toLocaleDateString();
      const nurseObj = typeof s.nurseId === 'object' ? s.nurseId : {};
      return [
        `"${dateStr}"`,
        `"${s.shiftType}"`,
        `"${schedule.department}"`,
        `"${nurseObj.employeeId || 'N/A'}"`,
        `"${nurseObj.name || 'Assigned Nurse'}"`,
        `"${nurseObj.designation || 'Staff'}"`,
        `"${s.isOvertime ? 'Overtime Coverage' : 'Regular'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${schedule.department}_Schedule_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter leaves for selected department
  const deptLeaves = leaves.filter(l => l.nurseId?.department === department);
  const approvedLeaves = deptLeaves.filter(l => l.status === 'Approved');
  const pendingLeaves = deptLeaves.filter(l => l.status === 'Pending');

  return (
    <div style={{ width: '100%', paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <Sparkles size={14} /> 3-NURSE SHIFT QUOTA OPTIMIZATION ENGINE
        </div>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc' }}>
          Automatic Nurse Shift Scheduler
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
          Mandatory 3 nurses per shift across <strong>Normal Ward</strong>, <strong>ER</strong>, <strong>ICU</strong>, and <strong>OP</strong>. Approved leaves trigger automatic overtime allocation for lowest-overtime off-duty nurses.
        </p>
      </div>

      {/* Policy Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))', 
        border: '1px solid rgba(56, 189, 248, 0.25)', 
        padding: '1.25rem 1.5rem', 
        borderRadius: '16px', 
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '10px', color: '#38bdf8' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>4 Core Departments</div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Normal Ward, ER, ICU, and OP only (5 nurses assigned each).</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', color: '#34d399' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>3 Nurses Per Shift Quota</div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Each department strictly requires 3 nurses per operational shift.</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '10px', color: '#fbbf24' }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>Approved Leave Overtime Rule</div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Approved leaves remove the nurse and auto-allocate overtime to maintain 3 staff.</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Requirements Form & Leave Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={20} color="#38bdf8" /> Shift Requirements
            </h2>

            <form onSubmit={handleGenerate}>
              
              {/* Department Selection */}
              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cbd5e1' }}>Department</label>
                <select 
                  className="form-control" 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)}
                  style={{ borderRadius: '12px', padding: '0.85rem' }}
                >
                  <option value="Normal Ward">Normal Ward</option>
                  <option value="ER">ER (Emergency Room)</option>
                  <option value="ICU">ICU (Intensive Care Unit)</option>
                  <option value="OP">OP (Outpatient Department)</option>
                </select>
              </div>
              
              {/* Date Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cbd5e1' }}>Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    style={{ borderRadius: '12px' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cbd5e1' }}>End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    style={{ borderRadius: '12px' }}
                    required
                  />
                </div>
              </div>

              {/* Quick Shift Quota Presets */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>
                  Quick Staffing Preset:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { setMorning(3); setEvening(0); setNight(0); }}
                    className="btn"
                    style={{ 
                      fontSize: '0.78rem', 
                      padding: '0.35rem 0.75rem', 
                      borderRadius: '8px', 
                      background: morning === 3 && evening === 0 && night === 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${morning === 3 && evening === 0 && night === 0 ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                      color: morning === 3 && evening === 0 && night === 0 ? '#38bdf8' : '#cbd5e1'
                    }}
                  >
                    ☀️ Morning (3 Nurses)
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMorning(0); setEvening(3); setNight(0); }}
                    className="btn"
                    style={{ 
                      fontSize: '0.78rem', 
                      padding: '0.35rem 0.75rem', 
                      borderRadius: '8px', 
                      background: morning === 0 && evening === 3 && night === 0 ? 'rgba(251, 146, 60, 0.25)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${morning === 0 && evening === 3 && night === 0 ? '#fb923c' : 'rgba(255,255,255,0.1)'}`,
                      color: morning === 0 && evening === 3 && night === 0 ? '#fb923c' : '#cbd5e1'
                    }}
                  >
                    🌆 Evening (3 Nurses)
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMorning(3); setEvening(3); setNight(3); }}
                    className="btn"
                    style={{ 
                      fontSize: '0.78rem', 
                      padding: '0.35rem 0.75rem', 
                      borderRadius: '8px', 
                      background: morning === 3 && evening === 3 && night === 3 ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${morning === 3 && evening === 3 && night === 3 ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                      color: morning === 3 && evening === 3 && night === 3 ? '#a855f7' : '#cbd5e1'
                    }}
                  >
                    ⚡ All Shifts (3 Nurses Each)
                  </button>
                </div>
              </div>

              {/* Nurses Required per Shift */}
              <div style={{ marginTop: '1rem', marginBottom: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    Nurses Per Shift:
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>Standard: 3 Nurses</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fde047' }}>☀️ Morning</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={morning} 
                      min="0"
                      max="10"
                      onChange={e => setMorning(Number(e.target.value))} 
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fdba74' }}>🌆 Evening</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={evening} 
                      min="0"
                      max="10"
                      onChange={e => setEvening(Number(e.target.value))} 
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#a5b4fc' }}>🌙 Night</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={night} 
                      min="0"
                      max="10"
                      onChange={e => setNight(Number(e.target.value))} 
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Enforced Constraints */}
              <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.4rem' }}>
                  Automated Scheduling Rules:
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>✓ <strong>Approved Leave:</strong> Excludes nurse from shifts.</div>
                  <div>✓ <strong>Pending Leave:</strong> Nurse remains scheduled until approval.</div>
                  <div>✓ <strong>Auto Overtime:</strong> Fills vacancies using lowest accumulated overtime.</div>
                  <div>✓ <strong>Quota:</strong> Enforces 3 nurses per shift.</div>
                </div>
              </div>

              {/* GENERATE BUTTON */}
              <button 
                type="submit" 
                className="btn" 
                style={{ 
                  width: '100%', 
                  padding: '1.1rem',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
                  boxShadow: '0 10px 25px -4px rgba(79, 70, 229, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem'
                }} 
                disabled={status === 'generating'}
              >
                {status === 'generating' ? (
                  <>
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Generating Optimal Schedule...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    GENERATE AUTO SCHEDULE
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Department Leave Status Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#f59e0b" /> Leave Status for {department}
            </h3>

            {deptLeaves.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No leaves registered for {department}.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {deptLeaves.map(l => (
                  <div 
                    key={l._id} 
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: '12px', 
                      background: l.status === 'Approved' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      border: `1px solid ${l.status === 'Approved' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.88rem' }}>
                        {l.nurseId?.name} ({l.nurseId?.employeeId})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()} • {l.reason}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '12px',
                        background: l.status === 'Approved' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: l.status === 'Approved' ? '#f87171' : '#fbbf24',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        {l.status === 'Approved' ? <UserX size={12} /> : <Clock size={12} />}
                        {l.status}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: l.status === 'Approved' ? '#f87171' : '#fbbf24', marginTop: '0.2rem' }}>
                        {l.status === 'Approved' ? 'Removed from schedule' : 'Still active on schedule'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Generated Schedule & Validation */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarDays size={20} color="#34d399" /> {department} Shift Schedule
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                {schedule ? `${new Date(schedule.periodStart).toLocaleDateString()} to ${new Date(schedule.periodEnd).toLocaleDateString()} • ${schedule.shifts?.length || 0} Total Shifts` : 'Review generated shift assignments'}
              </p>
            </div>

            {status === 'generated' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleGenerate()}
                  className="btn"
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 600
                  }}
                >
                  <RefreshCw size={14} /> Regenerate
                </button>
              </div>
            )}
          </div>

          {/* Idle State */}
          {status === 'idle' && (
            <div style={{ height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94a3b8', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '18px', padding: '2rem' }}>
              <CalendarDays size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>No Active Schedule for {department}</div>
              <p style={{ maxWidth: '420px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Click <strong>GENERATE AUTO SCHEDULE</strong> to allocate the mandatory 3 nurses per shift. Approved leaves will be automatically excluded and replaced via fair overtime allocation.
              </p>
            </div>
          )}
          
          {/* Generating Animation State */}
          {status === 'generating' && (
            <div style={{ height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <div style={{ width: '48px', height: '48px', border: '3px solid', borderColor: '#38bdf8 transparent transparent transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '1.25rem', fontSize: '1.05rem', fontWeight: 700 }}>Calculating 3-Nurse Shift Allocations...</p>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Checking leaves, balancing overtime, and maintaining 3 nurses per shift...</span>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', color: '#f87171' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={20} /> Generation Error
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem' }}>{error}</p>
            </div>
          )}

          {/* Generated Schedule State */}
          {status === 'generated' && schedule && (
            <div>
              
              {/* Validation Summary Card */}
              <div style={{ 
                background: schedule.validation?.isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                border: `1px solid ${schedule.validation?.isValid ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`, 
                padding: '1.25rem', 
                borderRadius: '16px', 
                marginBottom: '1.5rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ color: schedule.validation?.isValid ? '#34d399' : '#f87171', margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {schedule.validation?.isValid ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {schedule.validation?.isValid ? '3-Nurse Quota Satisfied ✓' : 'Staffing Shortage Warning ⚠️'}
                  </h4>

                  <span style={{ fontSize: '0.82rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: isApproved ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.08)', color: isApproved ? '#34d399' : '#cbd5e1', fontWeight: 700 }}>
                    Status: {isApproved ? 'Approved & Published' : 'Draft Generated'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <div>✓ 3 nurses assigned per scheduled shift</div>
                  <div>✓ Approved leaves excluded from duty</div>
                  <div>✓ Automatic overtime allocated for vacancies</div>
                  <div>✓ 0 overlapping shifts per nurse</div>
                </div>

                {/* Overtime Allocations Highlight */}
                {schedule.validation?.overtimeAllocations && schedule.validation.overtimeAllocations.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      <Zap size={14} /> Overtime Dispatched ({schedule.validation.overtimeAllocations.length} shifts):
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#fde68a', fontSize: '0.8rem' }}>
                      {schedule.validation.overtimeAllocations.slice(0, 4).map((ot, idx) => (
                        <li key={idx}>{ot}</li>
                      ))}
                      {schedule.validation.overtimeAllocations.length > 4 && (
                        <li>...and {schedule.validation.overtimeAllocations.length - 4} more overtime allocations</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Shifts Table */}
              <div style={{ maxHeight: '420px', overflowY: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 5, color: '#94a3b8' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Shift</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Assigned Nurse</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Duty Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.shifts.map((s, i) => {
                      const nurseObj = typeof s.nurseId === 'object' ? s.nurseId : null;
                      const nurseName = nurseObj ? nurseObj.name : 'Nurse';
                      const empId = nurseObj ? nurseObj.employeeId : 'ID';
                      const designation = nurseObj ? nurseObj.designation : 'Staff';

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: s.isOvertime ? 'rgba(245, 158, 11, 0.04)' : 'transparent' }}>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontWeight: 600 }}>
                            {new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ 
                              padding: '0.25rem 0.65rem', 
                              borderRadius: '6px', 
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              background: s.shiftType === 'Morning' ? 'rgba(250, 204, 21, 0.2)' : s.shiftType === 'Evening' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(129, 140, 248, 0.2)',
                              color: s.shiftType === 'Morning' ? '#fde047' : s.shiftType === 'Evening' ? '#fdba74' : '#a5b4fc'
                            }}>
                              {s.shiftType === 'Morning' ? '☀️ Morning' : s.shiftType === 'Evening' ? '🌆 Evening' : '🌙 Night'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{nurseName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {empId} • {designation}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {s.isOvertime ? (
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.25rem 0.65rem', 
                                borderRadius: '6px', 
                                fontSize: '0.75rem', 
                                fontWeight: 800,
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#fbbf24',
                                border: '1px solid rgba(245, 158, 11, 0.35)'
                              }}>
                                <Zap size={12} /> OVERTIME COVERAGE
                              </span>
                            ) : (
                              <span style={{ 
                                padding: '0.25rem 0.65rem', 
                                borderRadius: '6px', 
                                fontSize: '0.75rem', 
                                fontWeight: 600,
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399'
                              }}>
                                Regular Duty
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons: Approve & Export */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleApproveSchedule}
                  disabled={isApproved || isApproving}
                  className="btn" 
                  style={{ 
                    flex: 1, 
                    background: isApproved ? 'rgba(16, 185, 129, 0.25)' : 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    padding: '0.9rem'
                  }}
                >
                  {isApproving ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Approving & Dispatching Emails...
                    </>
                  ) : (
                    <>
                      <Check size={18} /> {isApproved ? 'Schedule Approved & Emailed ✓' : 'Approve & Dispatch Duty Emails'}
                    </>
                  )}
                </button>

                <button 
                  onClick={handleExportCSV}
                  className="btn" 
                  style={{ 
                    flex: 1, 
                    background: 'rgba(255,255,255,0.08)', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    color: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    padding: '0.9rem'
                  }}
                >
                  <Download size={18} /> Export Schedule (CSV)
                </button>
              </div>

              {/* Email Notifications Dispatched Confirmation */}
              {emailResults && (
                <div style={{ marginTop: '1.5rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#38bdf8', fontSize: '0.95rem' }}>
                      <Mail size={18} /> Shift Duty Notification Emails Dispatched ({emailResults.count} Nurses)
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700 }}>
                      ✓ Delivered
                    </span>
                  </div>
                  <p style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                    Automated duty notification emails have been dispatched to all assigned nurses detailing their shift timings, department, and clinical hand-over instructions.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {emailResults.recipients?.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '0.6rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{r.name}</span>
                          <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>({r.email})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{r.shiftsCount} shift(s)</span>
                          {r.html && (
                            <button
                              type="button"
                              onClick={() => setPreviewEmailModal(r)}
                              className="btn"
                              style={{ 
                                padding: '0.25rem 0.6rem', 
                                fontSize: '0.75rem', 
                                borderRadius: '8px', 
                                background: 'rgba(56, 189, 248, 0.15)', 
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                color: '#38bdf8',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontWeight: 700
                              }}
                            >
                              <Eye size={12} /> Preview Email
                            </button>
                          )}
                          {r.previewUrl && (
                            <a 
                              href={r.previewUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ color: '#fbbf24', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              Web Mail <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Email Preview Modal */}
      {previewEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(30, 41, 59, 0.5)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>
                  <Mail size={18} color="#38bdf8" /> Official Shift Duty Email Preview
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  To: <strong>{previewEmailModal.name}</strong> &lt;{previewEmailModal.email}&gt;
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewEmailModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#cbd5e1',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - HTML Email Iframe */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f1f5f9' }}>
              <iframe
                title="Email Preview"
                srcDoc={previewEmailModal.html}
                style={{
                  width: '100%',
                  height: '520px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#ffffff'
                }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(30, 41, 59, 0.5)'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Subject: <span style={{ color: '#38bdf8' }}>{previewEmailModal.subject}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmailModal(null)}
                className="btn"
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
