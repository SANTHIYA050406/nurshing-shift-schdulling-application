import React, { useState, useEffect } from 'react';
import { 
  CalendarOff, 
  Send, 
  CheckCircle2, 
  Clock, 
  CalendarDays, 
  User, 
  Building2, 
  FileText,
  AlertCircle
} from 'lucide-react';

export default function NurseLeaveApply() {
  const [allNurses, setAllNurses] = useState([]);
  const [selectedNurseId, setSelectedNurseId] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
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

  const activeNurse = allNurses.find(n => n._id === selectedNurseId) || allNurses[0];

  // Fetch leaves for the active nurse
  useEffect(() => {
    if (activeNurse) {
      fetch(`http://localhost:5000/api/leaves?nurseId=${activeNurse._id}`)
        .then(res => res.json())
        .then(data => setLeaves(data))
        .catch(err => console.error('Error fetching nurse leaves:', err));
    }
  }, [activeNurse]);

  // Handle Form Submission
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!activeNurse) return;
    try {
      setSubmitting(true);
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
      setToastMessage('✓ Leave request submitted to Hospital Admin for approval!');
      setTimeout(() => setToastMessage(null), 5000);
      setReason('');
    } catch (err) {
      setToastMessage(`Error: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Header with Nurse Identity and Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            <CalendarOff size={16} /> NURSE LEAVE APPLICATION PORTAL
          </div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Apply for Leave
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '1.05rem' }}>
            Submit your clinical absence or time-off request directly to the hospital administrator.
          </p>
        </div>

        {/* Active Nurse Badge */}
        {activeNurse && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(30, 41, 59, 0.85)', padding: '0.65rem 1.25rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
              {activeNurse.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>{activeNurse.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{activeNurse.department} Ward • ID: {activeNurse.employeeId}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Grid: Left Application Form, Right Submitted Leave History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr', gap: '2.25rem' }}>
        
        {/* Left Card: Application Form */}
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '26px', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 12px 35px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.75rem', borderRadius: '14px', color: '#fbbf24' }}>
              <FileText size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
                New Leave Request
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Fill in the details for your upcoming absence
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitLeave}>
            
            {/* Start & End Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  style={{ padding: '0.85rem', borderRadius: '12px', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.5rem' }}>
                  End Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                  style={{ padding: '0.85rem', borderRadius: '12px', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            {/* Reason */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.5rem' }}>
                Reason for Leave
              </label>
              <textarea
                className="form-control"
                rows="4"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="State the reason (e.g. Medical illness, Doctor appointment, Family emergency, Scheduled vacation)..."
                required
                style={{ padding: '0.95rem', borderRadius: '14px', fontSize: '0.95rem', resize: 'vertical' }}
              />
            </div>

            {/* Policy Notice */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.75rem', display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <AlertCircle size={18} color="#38bdf8" />
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Your department head/admin will be notified to review and rebalance shift coverage.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn"
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '1.05rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                cursor: 'pointer'
              }}
            >
              <Send size={18} />
              {submitting ? 'Submitting Leave...' : 'Submit Leave Request to Admin'}
            </button>
          </form>
        </div>

        {/* Right Card: Leave Application History & Status */}
        <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '26px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Clock size={22} color="#38bdf8" /> My Submitted Leave History
            </h3>
            <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 800 }}>
              {leaves.length} Total Applied
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            {leaves.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', fontSize: '1rem' }}>
                No leave applications submitted yet.
              </div>
            ) : (
              leaves.map(l => (
                <div key={l._id} style={{ padding: '1.2rem 1.4rem', borderRadius: '18px', background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CalendarDays size={18} color="#38bdf8" />
                      {new Date(l.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} → {new Date(l.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
                      "{l.reason}"
                    </div>
                  </div>

                  <div>
                    <span style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: l.status === 'Pending' ? 'rgba(245, 158, 11, 0.2)' : l.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: l.status === 'Pending' ? '#fbbf24' : l.status === 'Approved' ? '#34d399' : '#f87171',
                      border: `1px solid ${l.status === 'Pending' ? 'rgba(245, 158, 11, 0.4)' : l.status === 'Approved' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                    }}>
                      {l.status === 'Pending' && <Clock size={14} />}
                      {l.status === 'Approved' && <CheckCircle2 size={14} />}
                      {l.status}
                    </span>
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
