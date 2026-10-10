import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Building2, 
  Filter, 
  Check, 
  X,
  ArrowRightLeft,
  Users,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Plus,
  Send
} from 'lucide-react';

export default function Availability() {
  const [leaves, setLeaves] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);

  // Transfer Recommendation Modal State
  const [transferModal, setTransferModal] = useState({
    isOpen: false,
    affectedNurse: null,
    neededDept: '',
    surplusDept: '',
    selectedTransferNurseId: '',
    candidateNurses: []
  });

  const [transferToast, setTransferToast] = useState(null);

  // Fetch Leaves & Nurses from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [lRes, nRes] = await Promise.all([
        fetch('http://localhost:5000/api/leaves'),
        fetch('http://localhost:5000/api/nurses')
      ]);
      const leavesData = await lRes.json();
      const nursesData = await nRes.json();
      setLeaves(leavesData);
      setNurses(nursesData);
    } catch (err) {
      console.error('Error fetching availability/leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Active vs On-Leave Counts Per Department (Normal Ward, ER, ICU, OP)
  const departments = ['Normal Ward', 'ER', 'ICU', 'OP'];
  const departmentCounts = departments.map(dept => {
    const totalInDept = nurses.filter(n => n.department === dept);
    // Nurses in this dept who have an approved leave
    const onLeaveInDept = totalInDept.filter(n => 
      leaves.some(l => l.nurseId?._id === n._id && l.status === 'Approved')
    );
    const activeInDept = totalInDept.length - onLeaveInDept.length;
    return {
      name: dept,
      total: totalInDept.length,
      active: activeInDept,
      onLeave: onLeaveInDept.length
    };
  });

  // Handle Admin Approval or Rejection
  const handleReviewLeave = async (leave, status) => {
    try {
      setActionLoading(leave._id);
      const res = await fetch(`http://localhost:5000/api/leaves/${leave._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          adminNotes: status === 'Approved' ? 'Approved by Admin' : 'Rejected by Admin'
        })
      });
      if (!res.ok) throw new Error(`Failed to ${status.toLowerCase()} leave request`);
      const data = await res.json();
      
      // Update UI leaves state
      setLeaves(prev => prev.map(l => l._id === leave._id ? data.leave : l));

      // IF APPROVED: Decrease nurse count in that department & check for transfer recommendation
      if (status === 'Approved') {
        const nurseDept = leave.nurseId?.department || 'ICU';
        
        // Find departments that have at least 2 active nurses to spare (surplus)
        const currentNurses = nurses;
        const otherDepts = departments.filter(d => d !== nurseDept);
        
        // Find department with maximum active nurses
        let bestSurplusDept = '';
        let maxCount = 0;
        otherDepts.forEach(d => {
          const count = currentNurses.filter(n => n.department === d).length;
          if (count > maxCount) {
            maxCount = count;
            bestSurplusDept = d;
          }
        });

        const eligibleCandidates = currentNurses.filter(n => n.department === bestSurplusDept);

        if (bestSurplusDept && eligibleCandidates.length > 0) {
          // Open Transfer Rebalance Permission Modal
          setTransferModal({
            isOpen: true,
            affectedNurse: leave.nurseId,
            neededDept: nurseDept,
            surplusDept: bestSurplusDept,
            selectedTransferNurseId: eligibleCandidates[0]._id,
            candidateNurses: eligibleCandidates
          });
        }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Admin Approves the Cross-Department Transfer
  const handleConfirmTransfer = async () => {
    if (!transferModal.selectedTransferNurseId || !transferModal.neededDept) return;
    try {
      const res = await fetch('http://localhost:5000/api/nurses/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nurseId: transferModal.selectedTransferNurseId,
          toDepartment: transferModal.neededDept,
          reason: `Coverage rebalance due to approved leave of ${transferModal.affectedNurse?.name}`
        })
      });
      if (!res.ok) throw new Error('Transfer request failed');
      const data = await res.json();

      // Update nurse in local state
      setNurses(prev => prev.map(n => n._id === data.nurse._id ? data.nurse : n));
      
      setTransferToast(`Success: ${data.nurse.name} was transferred from ${data.fromDepartment} to ${data.toDepartment} to maintain full staffing!`);
      setTimeout(() => setTransferToast(null), 6000);
      setTransferModal({ ...transferModal, isOpen: false });
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div style={{ width: '100%', paddingBottom: '3rem' }}>
      
      {/* Toast Alert */}
      {transferToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 700,
          fontSize: '0.92rem',
          backdropFilter: 'blur(8px)'
        }}>
          <CheckCircle2 size={20} />
          <span>{transferToast}</span>
        </div>
      )}

      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.14)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <CalendarCheck size={15} /> ADMIN LEAVE REVIEW & WORKFORCE REBALANCE
          </div>
          <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Leave Approvals & Staffing Rebalance
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '1rem' }}>
            Admin portal to approve or reject leave requests submitted by nurses, adjust department rosters, and rebalance surplus staff.
          </p>
        </div>

        {/* Pending Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: pendingCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', padding: '0.75rem 1.35rem', borderRadius: '14px', border: `1px solid ${pendingCount > 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}` }}>
          <Clock size={19} color={pendingCount > 0 ? '#fbbf24' : '#34d399'} />
          <span style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
            Pending Requests: <strong style={{ color: pendingCount > 0 ? '#fbbf24' : '#34d399', fontSize: '1.2rem' }}>{pendingCount}</strong>
          </span>
        </div>
      </div>

      {/* DEPARTMENT STAFFING LIVE COUNTER CARDS (Shows Decreases when leave approved) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {departmentCounts.map(d => {
          const colors = {
            'Normal Ward': { border: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
            ER: { border: 'rgba(244, 63, 94, 0.3)', color: '#fb7185', bg: 'rgba(244, 63, 94, 0.12)' },
            ICU: { border: 'rgba(99, 102, 241, 0.3)', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.12)' },
            OP: { border: 'rgba(16, 185, 129, 0.3)', color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)' }
          }[d.name] || { border: 'rgba(255,255,255,0.1)', color: '#fff', bg: 'rgba(255,255,255,0.05)' };

          return (
            <div key={d.name} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '18px', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: colors.color, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={16} /> {d.name} Ward
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: colors.bg, color: colors.color, fontWeight: 700 }}>
                  {d.total} Registered
                </span>
              </div>

              {/* Active Count (Decreased when leave is approved) */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff' }}>
                  {d.active}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  active on-duty nurses
                </div>
              </div>

              {/* Leave Status Indicator */}
              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {d.onLeave > 0 ? (
                  <span style={{ color: '#f87171', fontWeight: 700 }}>
                    ⚠️ {d.onLeave} nurse(s) on approved leave (Count Decreased)
                  </span>
                ) : (
                  <span style={{ color: '#34d399', fontWeight: 600 }}>
                    ✓ Full coverage available (0 on leave)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEAVE APPLICATIONS TABLE */}
      <div className="glass-panel" style={{ padding: '1.85rem', borderRadius: '24px', marginBottom: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> Applied Nurse Leave Requests
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Review applied leaves. Accepting a leave decreases active department staff and asks permission to rebalance surplus nurses.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {['All', 'Pending', 'Approved', 'Rejected'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filterStatus === st ? 'var(--primary-color)' : 'transparent',
                  color: filterStatus === st ? '#ffffff' : '#94a3b8'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '0.9rem 1rem' }}>Nurse Staff</th>
                <th style={{ padding: '0.9rem 1rem' }}>Department</th>
                <th style={{ padding: '0.9rem 1rem' }}>Requested Leave Period</th>
                <th style={{ padding: '0.9rem 1rem' }}>Reason</th>
                <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Admin Decision</th>
              </tr>
            </thead>
            <tbody>
              {leaves
                .filter(l => filterStatus === 'All' || l.status === filterStatus)
                .map(leave => {
                  const nurseName = leave.nurseId?.name || 'Unknown';
                  const dept = leave.nurseId?.department || 'ICU';
                  const empId = leave.nurseId?.employeeId || 'N/A';
                  
                  const startStr = new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const endStr = new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' });

                  const isPending = leave.status === 'Pending';
                  const isApproved = leave.status === 'Approved';
                  const isRejected = leave.status === 'Rejected';

                  return (
                    <tr key={leave._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{nurseName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontFamily: 'monospace' }}>ID: {empId}</div>
                      </td>

                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{ padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                          {dept}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1rem', color: '#cbd5e1' }}>
                        <div style={{ fontWeight: 600 }}>{startStr} → {endStr}</div>
                      </td>

                      <td style={{ padding: '0.9rem 1rem', color: '#94a3b8' }}>
                        "{leave.reason}"
                      </td>

                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: isPending ? 'rgba(245, 158, 11, 0.2)' : isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: isPending ? '#fbbf24' : isApproved ? '#34d399' : '#f87171',
                          border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.4)' : isApproved ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                        }}>
                          {isPending && <Clock size={13} />}
                          {isApproved && <CheckCircle2 size={13} />}
                          {isRejected && <XCircle size={13} />}
                          {leave.status}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              disabled={actionLoading === leave._id}
                              onClick={() => handleReviewLeave(leave, 'Approved')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.5rem 0.95rem',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #059669, #10b981)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                              }}
                            >
                              <Check size={14} /> Approve Leave
                            </button>

                            <button
                              disabled={actionLoading === leave._id}
                              onClick={() => handleReviewLeave(leave, 'Rejected')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.5rem 0.85rem',
                                borderRadius: '10px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
                            Decision Saved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

      </div>

      {/* CROSS-DEPARTMENT TRANSFER PERMISSION MODAL */}
      {transferModal.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(15, 23, 42, 0.96)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.2)',
            padding: '2.25rem',
            position: 'relative'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.75rem', borderRadius: '14px', color: '#fbbf24' }}>
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
                  Permission Request: Department Rebalance
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600 }}>
                  Active nurse count in {transferModal.neededDept} has decreased!
                </p>
              </div>
            </div>

            {/* Explanation Box */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.55 }}>
                Since <strong>{transferModal.affectedNurse?.name}</strong>'s leave was approved, the active staff in <strong style={{ color: '#38bdf8' }}>{transferModal.neededDept}</strong> is down by 1.
              </div>
              <div style={{ marginTop: '0.75rem', color: '#34d399', fontSize: '0.92rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} />
                Surplus Detected: <strong>{transferModal.surplusDept}</strong> has extra nurses available!
              </div>
            </div>

            {/* Transfer Selection Form */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Select nurse from {transferModal.surplusDept} to reassign to {transferModal.neededDept}:
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {transferModal.candidateNurses.map(nurse => (
                  <label 
                    key={nurse._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: transferModal.selectedTransferNurseId === nurse._id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.03)',
                      border: transferModal.selectedTransferNurseId === nurse._id ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input 
                        type="radio" 
                        name="transferNurse" 
                        checked={transferModal.selectedTransferNurseId === nurse._id} 
                        onChange={() => setTransferModal({ ...transferModal, selectedTransferNurseId: nurse._id })}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>{nurse.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: {nurse.employeeId} • {nurse.designation}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
                      Currently in {nurse.department}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setTransferModal({ ...transferModal, isOpen: false })}
                style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', fontWeight: 600 }}
              >
                Keep Current (No Transfer)
              </button>

              <button
                type="button"
                className="btn"
                onClick={handleConfirmTransfer}
                style={{
                  flex: 1.5,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)'
                }}
              >
                <ArrowRightLeft size={16} /> Approve & Reassign to {transferModal.neededDept}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
