import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  User, 
  Building2, 
  CalendarDays, 
  Flame, 
  ShieldCheck, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Check, 
  X,
  FileText,
  Sparkles,
  Info
} from 'lucide-react';

export default function NurseOvertime() {
  const [allNurses, setAllNurses] = useState([]);
  const [selectedNurseId, setSelectedNurseId] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [remarksInput, setRemarksInput] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

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

  // Fetch overtime allocations for this nurse
  const fetchAllocations = async (nurseId) => {
    if (!nurseId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/overtime?nurseId=${nurseId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllocations(data);
      }
    } catch (err) {
      console.error('Error fetching overtime allocations:', err);
    }
  };

  useEffect(() => {
    if (activeNurse) {
      fetchAllocations(activeNurse._id);
    }
  }, [activeNurse]);

  // Handle Accept or Decline by Nurse
  const handleRespond = async (allocationId, decision) => {
    try {
      setRespondingId(allocationId);
      const res = await fetch(`http://localhost:5000/api/overtime/${allocationId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decision,
          nurseRemarks: remarksInput[allocationId] || (decision === 'Accepted' ? 'Accepted by Nurse' : 'Declined due to personal scheduling conflict')
        })
      });

      if (!res.ok) throw new Error('Failed to update overtime response');
      const data = await res.json();
      
      setToastMessage(`✓ Overtime allocation ${decision.toLowerCase()} successfully!`);
      setTimeout(() => setToastMessage(null), 4000);

      // Refresh list
      fetchAllocations(activeNurse._id);
    } catch (err) {
      alert(err.message);
    } finally {
      setRespondingId(null);
    }
  };

  // Metrics calculation
  const pendingRequests = allocations.filter(a => a.status === 'Pending Nurse Approval');
  const acceptedAllocations = allocations.filter(a => a.status === 'Accepted');
  const totalOvertimeHoursCompleted = acceptedAllocations.reduce((sum, a) => sum + (a.completedHours || a.allocatedHours || 0), 0);
  
  // Rate calculation (Estimated overtime premium: e.g. $35/hr)
  const estimatedOvertimePay = totalOvertimeHoursCompleted * 35;

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

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            <Clock size={16} /> NURSE OVERTIME & ALLOCATION APPROVAL
          </div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Overtime Log & Admin Allocations
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '1.05rem' }}>
            Review hours worked beyond standard shift, approve or decline hospital admin overtime assignments.
          </p>
        </div>

        {/* Switch Nurse Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(30, 41, 59, 0.85)', padding: '0.6rem 1.1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          <User size={19} color="#38bdf8" />
          <span style={{ fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 700 }}>Nurse Profile:</span>
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
          {/* STATS OVERVIEW CARDS: HOW MUCH THEY DID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            
            {/* Card 1: Total Overtime Completed */}
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '22px', border: '1px solid rgba(245, 158, 11, 0.3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Completed Overtime</span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f59e0b', margin: '0.4rem 0' }}>
                    {totalOvertimeHoursCompleted} <span style={{ fontSize: '1.2rem', color: '#cbd5e1', fontWeight: 600 }}>hrs</span>
                  </div>
                  <span style={{ fontSize: '0.84rem', color: '#34d399', fontWeight: 600 }}>
                    ↑ Approved & logged in system
                  </span>
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                  <Flame size={26} />
                </div>
              </div>
            </div>

            {/* Card 2: Pending Allocations Waiting For Nurse */}
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '22px', border: pendingRequests.length > 0 ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Action Required</span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: pendingRequests.length > 0 ? '#fb923c' : '#38bdf8', margin: '0.4rem 0' }}>
                    {pendingRequests.length} <span style={{ fontSize: '1.2rem', color: '#cbd5e1', fontWeight: 600 }}>requests</span>
                  </div>
                  <span style={{ fontSize: '0.84rem', color: pendingRequests.length > 0 ? '#fb923c' : '#94a3b8', fontWeight: 600 }}>
                    {pendingRequests.length > 0 ? 'Allocated by Admin - Needs Your Approval' : 'No pending allocations'}
                  </span>
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '14px', background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' }}>
                  <AlertCircle size={26} />
                </div>
              </div>
            </div>

            {/* Card 3: Standard Shift Cap & Limit */}
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '22px', border: '1px solid rgba(56, 189, 248, 0.25)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Weekly Contract Limit</span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38bdf8', margin: '0.4rem 0' }}>
                    {activeNurse.maxWorkingHoursPerWeek || 40} <span style={{ fontSize: '1.2rem', color: '#cbd5e1', fontWeight: 600 }}>hrs/wk</span>
                  </div>
                  <span style={{ fontSize: '0.84rem', color: '#94a3b8', fontWeight: 600 }}>
                    Base hours prior to OT
                  </span>
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <ShieldCheck size={26} />
                </div>
              </div>
            </div>

            {/* Card 4: Estimated Overtime Differential Pay */}
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '22px', border: '1px solid rgba(16, 185, 129, 0.3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Est. Overtime Differential</span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#34d399', margin: '0.4rem 0' }}>
                    ${estimatedOvertimePay}
                  </div>
                  <span style={{ fontSize: '0.84rem', color: '#34d399', fontWeight: 600 }}>
                    Computed at 1.5x Premium rate
                  </span>
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <Award size={26} />
                </div>
              </div>
            </div>

          </div>

          {/* SECTION 1: ADMIN OVERTIME ALLOCATIONS PENDING NURSE APPROVAL */}
          <div className="glass-panel" style={{ padding: '2.2rem', borderRadius: '26px', border: '1px solid rgba(245, 158, 11, 0.35)', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.6rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <AlertCircle size={24} color="#f59e0b" /> Admin Overtime Allocations Awaiting Your Decision
                </h3>
                <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
                  Hospital management has requested extra coverage. Please review and <strong>Accept</strong> or <strong>Decline</strong>.
                </p>
              </div>
              <span style={{ padding: '0.4rem 1rem', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 800, fontSize: '0.88rem' }}>
                {pendingRequests.length} Pending Approval
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', fontSize: '0.98rem' }}>
                🎉 You have no pending overtime requests from administration. All current allocations have been reviewed.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {pendingRequests.map((req) => (
                  <div 
                    key={req._id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '20px',
                      padding: '1.75rem',
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1.2fr auto',
                      gap: '1.5rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', padding: '0.25rem 0.75rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', fontWeight: 800 }}>
                          {req.shiftPeriod}
                        </span>
                        <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>
                          Allocated by: <strong style={{ color: '#e2e8f0' }}>{req.allocatedBy}</strong>
                        </span>
                      </div>
                      <h4 style={{ margin: '0.3rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                        {req.reason}
                      </h4>
                      <div style={{ display: 'flex', gap: '1.25rem', color: '#cbd5e1', fontSize: '0.92rem', marginTop: '0.4rem' }}>
                        <span>Date: <strong>{new Date(req.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                        <span>•</span>
                        <span>Extra Duration: <strong style={{ color: '#fbbf24' }}>+{req.allocatedHours} Hours</strong></span>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                        Nurse Response Note / Feedback (Optional):
                      </label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g. Can cover 4 hours gladly / Have emergency clash"
                        value={remarksInput[req._id] || ''}
                        onChange={e => setRemarksInput({ ...remarksInput, [req._id]: e.target.value })}
                        style={{ padding: '0.65rem 0.95rem', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.85rem' }}>
                      <button
                        onClick={() => handleRespond(req._id, 'Accepted')}
                        disabled={respondingId === req._id}
                        className="btn"
                        style={{
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          fontWeight: 800,
                          padding: '0.75rem 1.3rem',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                        }}
                      >
                        <Check size={18} /> Accept
                      </button>

                      <button
                        onClick={() => handleRespond(req._id, 'Declined')}
                        disabled={respondingId === req._id}
                        className="btn"
                        style={{
                          background: 'rgba(239, 68, 68, 0.18)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          fontWeight: 800,
                          padding: '0.75rem 1.3rem',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <X size={18} /> Decline
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: COMPREHENSIVE OVERTIME HISTORY & AUDIT LOG */}
          <div className="glass-panel" style={{ padding: '2.2rem', borderRadius: '26px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileText size={24} color="#38bdf8" /> Overtime Activity & Approval History
                </h3>
                <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
                  Complete log of accepted extra hours, dates, rationale, and compensation tracking for {activeNurse.name}.
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.98rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8' }}>
                  <th style={{ padding: '1.1rem 1rem' }}>Date</th>
                  <th style={{ padding: '1.1rem 1rem' }}>Shift Extension</th>
                  <th style={{ padding: '1.1rem 1rem' }}>Reason & Hospital Requirement</th>
                  <th style={{ padding: '1.1rem 1rem' }}>Allocated Hours</th>
                  <th style={{ padding: '1.1rem 1rem' }}>Your Response / Status</th>
                  <th style={{ padding: '1.1rem 1rem' }}>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => {
                  const isAccepted = a.status === 'Accepted';
                  const isDeclined = a.status === 'Declined';
                  const isPending = a.status === 'Pending Nurse Approval';

                  return (
                    <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '1.1rem 1rem', fontWeight: 700, color: '#f8fafc' }}>
                        {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '1.1rem 1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                          {a.shiftPeriod}
                        </span>
                      </td>
                      <td style={{ padding: '1.1rem 1rem', maxWidth: '320px' }}>
                        <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{a.reason}</div>
                        {a.nurseRemarks && (
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem', fontStyle: 'italic' }}>
                            Nurse Note: "{a.nurseRemarks}"
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1.1rem 1rem' }}>
                        <span style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#fbbf24'
                        }}>
                          +{a.allocatedHours} hrs
                        </span>
                      </td>
                      <td style={{ padding: '1.1rem 1rem' }}>
                        <span style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: isAccepted ? 'rgba(16, 185, 129, 0.2)' : isDeclined ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isAccepted ? '#34d399' : isDeclined ? '#f87171' : '#fbbf24'
                        }}>
                          {isAccepted && <Check size={14} />}
                          {isDeclined && <X size={14} />}
                          {isPending && <Clock size={14} />}
                          {a.status}
                        </span>
                      </td>
                      <td style={{ padding: '1.1rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                        {a.allocatedBy || 'Admin'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}
