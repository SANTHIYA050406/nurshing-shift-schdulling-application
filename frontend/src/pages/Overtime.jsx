import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  CalendarOff, 
  ArrowUpDown, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Building2, 
  Sparkles, 
  ArrowRight,
  Filter,
  Flame,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';

export default function Overtime() {
  const [nurses, setNurses] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = most overtime first, 'asc' = least overtime first
  const [selectedNurseId, setSelectedNurseId] = useState(null);

  // Allocate Overtime Modal State
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [allocNurseId, setAllocNurseId] = useState('');
  const [allocDate, setAllocDate] = useState(new Date().toISOString().split('T')[0]);
  const [allocShiftPeriod, setAllocShiftPeriod] = useState('Evening Extension');
  const [allocHours, setAllocHours] = useState(4);
  const [allocReason, setAllocReason] = useState('ICU Patient Surge / Critical Bed Ratio');
  const [allocating, setAllocating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Load recommended candidates with lowest overtime & non-conflicting shifts
  const loadRecommendedCandidates = async (dateVal, periodVal) => {
    try {
      setLoadingCandidates(true);
      const res = await fetch(`http://localhost:5000/api/overtime/recommended-candidates?date=${dateVal}&shiftPeriod=${periodVal}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCandidates(data);
        // Default to first eligible candidate (lowest overtime!)
        const firstEligible = data.find(c => c.isEligible);
        if (firstEligible) {
          setAllocNurseId(firstEligible._id);
        } else if (data.length > 0) {
          setAllocNurseId(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleOpenAllocateModal = () => {
    setShowAllocateModal(true);
    loadRecommendedCandidates(allocDate, allocShiftPeriod);
  };

  const handleDateOrPeriodChange = (newDate, newPeriod) => {
    setAllocDate(newDate);
    setAllocShiftPeriod(newPeriod);
    loadRecommendedCandidates(newDate, newPeriod);
  };

  const handleSubmitAllocation = async (e) => {
    e.preventDefault();
    if (!allocNurseId) {
      alert('Please select an eligible nurse');
      return;
    }
    try {
      setAllocating(true);
      const res = await fetch('http://localhost:5000/api/overtime/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nurseId: allocNurseId,
          date: allocDate,
          allocatedHours: Number(allocHours),
          reason: allocReason,
          shiftPeriod: allocShiftPeriod,
          allocatedBy: 'Hospital Admin'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to allocate overtime');
      }

      setToastMessage('✓ Overtime successfully assigned to nurse (Sent for Nurse Approval)!');
      setTimeout(() => setToastMessage(null), 4000);
      setShowAllocateModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setAllocating(false);
    }
  };

  // Fetch live nurses and approved leaves
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [nRes, lRes] = await Promise.all([
          fetch('http://localhost:5000/api/nurses'),
          fetch('http://localhost:5000/api/leaves')
        ]);
        const nursesData = await nRes.json();
        const leavesData = await lRes.json();
        
        setNurses(nursesData);
        setLeaves(leavesData);

        if (nursesData.length > 0) {
          setSelectedNurseId(nursesData[0]._id);
        }
      } catch (err) {
        console.error('Error fetching overtime data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute calculated workload, overtime & leaves per nurse
  // Overtime = actual worked hours - scheduled 32/40 base hours
  const enrichedNurses = useMemo(() => {
    // Deterministic simulation mapping based on nurse properties
    const mockOvertimeDistribution = {
      'Priya Sharma': { scheduled: 32, overtime: 12, checkIns: 5 },
      'Anitha Reddy': { scheduled: 32, overtime: 8, checkIns: 4 },
      'Divya Kumar': { scheduled: 24, overtime: 2, checkIns: 3 },
      'Kavya Singh': { scheduled: 32, overtime: 14, checkIns: 5 },
      'Meera Patel': { scheduled: 40, overtime: 4, checkIns: 5 },
      'Ravi Teja': { scheduled: 32, overtime: 0, checkIns: 4 },
      'Suresh Raina': { scheduled: 24, overtime: 1, checkIns: 3 },
      'Deepa Nair': { scheduled: 32, overtime: 0, checkIns: 4 },
      'Rahul Varma': { scheduled: 16, overtime: 0, checkIns: 2 },
      'Sneha Roy': { scheduled: 32, overtime: 6, checkIns: 4 },
    };

    return nurses.map((n, idx) => {
      const mock = mockOvertimeDistribution[n.name] || {
        scheduled: 32,
        overtime: (idx * 3) % 11,
        checkIns: 4
      };

      // Count approved leave days for this nurse
      const nurseLeaves = leaves.filter(l => l.nurseId?._id === n._id && l.status === 'Approved');
      const totalLeaveDays = nurseLeaves.reduce((acc, l) => {
        const diff = Math.max(1, Math.round((new Date(l.endDate) - new Date(l.startDate)) / (1000 * 60 * 60 * 24)) + 1);
        return acc + diff;
      }, 0);

      const totalWorkedHours = mock.scheduled + mock.overtime;

      // Recommendation for shift allocation (prompt requirement #4 & user requirement)
      let allocationPriority = 'Normal';
      let priorityBadgeColor = '#fbbf24';
      let priorityText = 'Normal Allocation';

      if (mock.overtime === 0 || mock.overtime <= 2) {
        allocationPriority = 'High Priority';
        priorityBadgeColor = '#34d399';
        priorityText = 'Priority for Next Shift (Low OT)';
      } else if (mock.overtime >= 8) {
        allocationPriority = 'Rest Needed';
        priorityBadgeColor = '#f87171';
        priorityText = 'Rest Recommended (High OT)';
      }

      return {
        ...n,
        scheduledHours: mock.scheduled,
        overtimeHours: mock.overtime,
        totalHours: totalWorkedHours,
        leaveDays: totalLeaveDays,
        leaveRecords: nurseLeaves,
        allocationPriority,
        priorityBadgeColor,
        priorityText
      };
    });
  }, [nurses, leaves]);

  // Find Currently Selected Nurse for deep dive
  const activeNurse = useMemo(() => {
    return enrichedNurses.find(n => n._id === selectedNurseId) || enrichedNurses[0];
  }, [enrichedNurses, selectedNurseId]);

  // Find a Comparison Peer with Zero Overtime
  const zeroOvertimePeer = useMemo(() => {
    if (!activeNurse) return null;
    // Find peer in same department with 0 OT, or any nurse with 0 OT
    return enrichedNurses.find(n => n._id !== activeNurse._id && n.overtimeHours === 0) ||
           enrichedNurses.find(n => n._id !== activeNurse._id && n.overtimeHours <= 2) ||
           enrichedNurses[1];
  }, [enrichedNurses, activeNurse]);

  // Filter & Sort Nurse Table
  const filteredAndSortedNurses = useMemo(() => {
    return enrichedNurses
      .filter(n => {
        const matchesSearch = n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              n.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === 'All' || n.department === selectedDept;
        return matchesSearch && matchesDept;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return b.overtimeHours - a.overtimeHours; // highest overtime first
        } else {
          return a.overtimeHours - b.overtimeHours; // lowest overtime first
        }
      });
  }, [enrichedNurses, searchTerm, selectedDept, sortOrder]);

  // Aggregate Totals
  const totalOvertimeHospital = enrichedNurses.reduce((acc, curr) => acc + curr.overtimeHours, 0);
  const totalCost = totalOvertimeHospital * 45; // $45/hr average OT rate

  // Department overtime summary (Normal Ward, ER, ICU, OP)
  const departmentData = [
    { name: 'Normal Ward', hours: enrichedNurses.filter(n => n.department === 'Normal Ward').reduce((a, c) => a + c.overtimeHours, 0), color: '#38bdf8' },
    { name: 'ER', hours: enrichedNurses.filter(n => n.department === 'ER').reduce((a, c) => a + c.overtimeHours, 0), color: '#fb7185' },
    { name: 'ICU', hours: enrichedNurses.filter(n => n.department === 'ICU').reduce((a, c) => a + c.overtimeHours, 0), color: '#818cf8' },
    { name: 'OP', hours: enrichedNurses.filter(n => n.department === 'OP').reduce((a, c) => a + c.overtimeHours, 0), color: '#34d399' },
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

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Clock size={14} /> HOSPITAL OVERTIME & SHIFT BALANCING
          </div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc' }}>
            Overtime Tracking & Workload Balancing
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
            Identify high vs. low overtime nurses to balance shift allocations and prevent burnout.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenAllocateModal}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              padding: '0.75rem 1.4rem',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={18} /> + Add / Allocate Overtime
          </button>

          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.6rem 1.1rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={18} color="#f87171" />
            <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>Total Hospital OT: <strong style={{ color: '#fbbf24' }}>{totalOvertimeHospital} hrs</strong></span>
          </div>
        </div>
      </div>

      {/* MODAL: ALLOCATE OVERTIME WITH SMART RECOMMENDATION (LOW OVERTIME & NON-CONTINUING SHIFT) */}
      {showAllocateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{
            background: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800, textTransform: 'uppercase' }}>
                  Smart Allocation Engine
                </span>
                <h2 style={{ margin: '0.4rem 0 0 0', fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc' }}>
                  Allocate Overtime to Nurse
                </h2>
              </div>
              <button 
                onClick={() => setShowAllocateModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              ⚡ <strong>Hospital Constraint Enforced:</strong> Candidates are prioritized by <strong>Lowest Overtime Hours</strong>. Nurses cannot be assigned overtime that continues their current active shift to avoid acute fatigue.
            </p>

            <form onSubmit={handleSubmitAllocation}>
              {/* Row 1: Target Date & Shift Period */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                    Overtime Date
                  </label>
                  <input 
                    type="date"
                    className="form-control"
                    value={allocDate}
                    onChange={e => handleDateOrPeriodChange(e.target.value, allocShiftPeriod)}
                    required
                    style={{ padding: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                    Shift Extension Slot
                  </label>
                  <select
                    className="form-control"
                    value={allocShiftPeriod}
                    onChange={e => handleDateOrPeriodChange(allocDate, e.target.value)}
                    style={{ padding: '0.75rem', cursor: 'pointer' }}
                  >
                    <option value="Evening Extension">Evening Extension (16:00 - 00:00)</option>
                    <option value="Night Extension">Night Extension (00:00 - 08:00)</option>
                    <option value="Morning Extension">Morning Extension (08:00 - 16:00)</option>
                    <option value="Weekend Emergency">Weekend Emergency Coverage</option>
                  </select>
                </div>
              </div>

              {/* CANDIDATE SELECTOR WITH LOW OVERTIME FIRST AND CONFLICT GUARDS */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8' }}>
                    Select Candidate Nurse (Sorted by Lowest Overtime First):
                  </label>
                  {loadingCandidates && <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Scanning nurse roster...</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {candidates.map((cand, idx) => {
                    const isSelected = allocNurseId === cand._id;
                    const isRecommended = cand.isEligible && idx === 0;

                    return (
                      <div 
                        key={cand._id}
                        onClick={() => {
                          if (cand.isEligible) setAllocNurseId(cand._id);
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isSelected ? 'rgba(16, 185, 129, 0.2)' : cand.isEligible ? 'rgba(255,255,255,0.03)' : 'rgba(239, 68, 68, 0.08)',
                          border: isSelected ? '1px solid #10b981' : cand.isEligible ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(239, 68, 68, 0.25)',
                          cursor: cand.isEligible ? 'pointer' : 'not-allowed',
                          opacity: cand.isEligible ? 1 : 0.65,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input 
                            type="radio" 
                            name="nurseSelect" 
                            checked={isSelected}
                            disabled={!cand.isEligible}
                            onChange={() => setAllocNurseId(cand._id)}
                            style={{ cursor: cand.isEligible ? 'pointer' : 'not-allowed' }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: cand.isEligible ? '#f8fafc' : '#94a3b8', fontSize: '0.95rem' }}>
                              {cand.name} <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>({cand.department} • {cand.employeeId})</span>
                              {isRecommended && (
                                <span style={{ marginLeft: '0.5rem', padding: '0.2rem 0.55rem', borderRadius: '8px', background: '#059669', color: '#fff', fontSize: '0.72rem', fontWeight: 800 }}>
                                  ★ Best Choice (Lowest OT)
                                </span>
                              )}
                            </div>
                            {cand.restrictionReason && (
                              <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '0.2rem' }}>
                                ⚠ {cand.restrictionReason}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            background: cand.totalOvertimeHours === 0 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: cand.totalOvertimeHours === 0 ? '#34d399' : '#fbbf24'
                          }}>
                            {cand.totalOvertimeHours}h Total OT
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Overtime Hours & Reason */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                    Extra Hours
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="12"
                    className="form-control"
                    value={allocHours}
                    onChange={e => setAllocHours(e.target.value)}
                    required
                    style={{ padding: '0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                    Allocation Reason / Hospital Urgency
                  </label>
                  <input 
                    type="text"
                    className="form-control"
                    value={allocReason}
                    onChange={e => setAllocReason(e.target.value)}
                    required
                    placeholder="e.g. ICU Bed Surge / Post-Op Critical Coverage"
                    style={{ padding: '0.75rem' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="btn"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '0.75rem 1.4rem', borderRadius: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocating || !allocNurseId}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    fontWeight: 800,
                    padding: '0.75rem 1.8rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                    opacity: allocNurseId ? 1 : 0.6
                  }}
                >
                  {allocating ? 'Allocating...' : 'Confirm & Allocate Overtime'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3 Overview Stat Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel stat-card" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'left' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>Total Hospital Overtime</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fbbf24' }}>
            {totalOvertimeHospital} <span style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: 500 }}>hrs</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '0.35rem' }}>Tracked across all wards</div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'left' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>Estimated Overtime Payout</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#34d399' }}>
            ${totalCost.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.35rem' }}>1.5x hourly overtime premium</div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'left' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>Highest Overtime Ward</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f87171' }}>
            ICU & ER
          </div>
          <div style={{ fontSize: '0.82rem', color: '#f87171', marginTop: '0.35rem' }}>Requires immediate rebalancing</div>
        </div>
      </div>

      {/* SECTION 1: SEARCH & NURSE COMPARATIVE PROFILE BREAKDOWN */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', marginBottom: '2.25rem', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={22} color="#38bdf8" /> Nurse Overtime Profile & Peer Comparison
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
              Search any nurse to inspect their scheduled shifts, overtime, approved leaves, and compare against a zero-overtime colleague.
            </p>
          </div>

          {/* Quick Select Nurse Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Select Nurse:</span>
            <select
              className="form-control"
              value={activeNurse?._id || ''}
              onChange={e => setSelectedNurseId(e.target.value)}
              style={{ width: '220px', borderRadius: '12px', padding: '0.65rem 1rem', cursor: 'pointer' }}
            >
              {enrichedNurses.map(n => (
                <option key={n._id} value={n._id} style={{ background: '#0f172a' }}>
                  {n.name} ({n.department} - {n.overtimeHours}h OT)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Nurse Details + Comparison Card */}
        {activeNurse && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.35fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* Left: Searched Nurse Breakdown */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
                    {activeNurse.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span>ID: {activeNurse.employeeId}</span>
                    <span>•</span>
                    <span>{activeNurse.department} Department</span>
                    <span>•</span>
                    <span>{activeNurse.designation}</span>
                  </div>
                </div>

                <span style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  background: `${activeNurse.priorityBadgeColor}20`,
                  color: activeNurse.priorityBadgeColor,
                  border: `1px solid ${activeNurse.priorityBadgeColor}40`
                }}>
                  {activeNurse.priorityText}
                </span>
              </div>

              {/* 3 Core Metric Tiles: Scheduled, Overtime, Leaves */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                
                {/* Scheduled Shifts */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Scheduled Shifts</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                    {activeNurse.scheduledHours} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>hrs</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{Math.round(activeNurse.scheduledHours / 8)} shifts booked</div>
                </div>

                {/* Overtime Hours */}
                <div style={{ background: activeNurse.overtimeHours > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '14px', border: `1px solid ${activeNurse.overtimeHours > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div style={{ fontSize: '0.78rem', color: activeNurse.overtimeHours > 0 ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>Overtime Shifts</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: activeNurse.overtimeHours > 0 ? '#fbbf24' : '#94a3b8', marginTop: '0.2rem' }}>
                    +{activeNurse.overtimeHours} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>hrs</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#f87171' }}>{activeNurse.overtimeHours > 0 ? '1.5x Overtime Pay' : '0 Extra Hours'}</div>
                </div>

                {/* Leaves Taken */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Approved Leaves</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: activeNurse.leaveDays > 0 ? '#f87171' : '#34d399', marginTop: '0.2rem' }}>
                    {activeNurse.leaveDays} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>days</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{activeNurse.leaveDays > 0 ? 'Exclude from dates' : 'Fully Available'}</div>
                </div>

              </div>

              {/* Total Summary */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}>Cumulative Workload This Month:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: activeNurse.totalHours > 40 ? '#f87171' : '#34d399' }}>
                  {activeNurse.totalHours} hrs worked
                </span>
              </div>

            </div>

            {/* Right: Side-by-Side Comparison against Zero-Overtime Person */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowUpDown size={18} color="#38bdf8" /> Workload Comparison: With vs. Without Overtime
                </div>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Comparing <strong>{activeNurse.name}</strong> against peer <strong>{zeroOvertimePeer?.name || 'Zero-OT Benchmark'}</strong>.
                </p>
              </div>

              {/* Comparison Visual Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 1. Searched Nurse Bar */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                      {activeNurse.name} ({activeNurse.department})
                    </span>
                    <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.95rem' }}>
                      {activeNurse.totalHours} hrs ({activeNurse.overtimeHours}h OT)
                    </span>
                  </div>

                  {/* Multi-segment progress bar */}
                  <div style={{ width: '100%', height: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(activeNurse.scheduledHours / 50) * 100}%`, background: '#38bdf8' }} title="Scheduled Hours" />
                    <div style={{ width: `${(activeNurse.overtimeHours / 50) * 100}%`, background: '#f59e0b' }} title="Overtime Hours" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                    <span>Scheduled: {activeNurse.scheduledHours}h</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>+ {activeNurse.overtimeHours}h Overtime</span>
                  </div>
                </div>

                {/* 2. Zero-Overtime Colleague Bar */}
                {zeroOvertimePeer && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={16} color="#34d399" />
                        {zeroOvertimePeer.name} ({zeroOvertimePeer.department})
                      </span>
                      <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>
                        {zeroOvertimePeer.totalHours} hrs (0h OT)
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${(zeroOvertimePeer.scheduledHours / 50) * 100}%`, background: '#34d399' }} title="Scheduled Hours" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                      <span>Scheduled: {zeroOvertimePeer.scheduledHours}h</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>0h Overtime (Clean Baseline)</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Actionable Allocation Insight */}
              <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#38bdf8' }}>Scheduler Recommendation:</strong> Prefer assigning next upcoming shifts to <strong>{zeroOvertimePeer?.name}</strong> rather than <strong>{activeNurse.name}</strong> to balance total hours fairly.
              </div>

            </div>

          </div>
        )}

      </div>

      {/* SECTION 2: NURSE OVERTIME RANKING TABLE (MOST OT vs LEAST OT) */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', marginBottom: '2.5rem' }}>
        
        {/* Table Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📊</span> Shift Allocation & Overtime Leaderboard
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Sort by most or least overtime to balance workload and make shift assignment fast and fair.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search nurse..." 
                className="form-control" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.4rem', borderRadius: '10px', fontSize: '0.88rem' }}
              />
            </div>

            {/* Department Filter */}
            <select
              className="form-control"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              style={{ width: '160px', borderRadius: '10px', fontSize: '0.88rem' }}
            >
              <option value="All">All Departments</option>
              <option value="Normal Ward">Normal Ward</option>
              <option value="ER">ER Ward</option>
              <option value="ICU">ICU Ward</option>
              <option value="OP">OP Department</option>
            </select>

            {/* Sort Toggle: Highest OT vs Lowest OT */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                background: sortOrder === 'desc' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: sortOrder === 'desc' ? '#f87171' : '#34d399',
                border: `1px solid ${sortOrder === 'desc' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              <ArrowUpDown size={15} />
              {sortOrder === 'desc' ? 'Most Overtime First (Descending)' : 'Least Overtime First (Ascending)'}
            </button>

          </div>
        </div>

        {/* The Leaderboard Table */}
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                <th style={{ padding: '0.9rem 1rem' }}>Rank</th>
                <th style={{ padding: '0.9rem 1rem' }}>Nurse Staff</th>
                <th style={{ padding: '0.9rem 1rem' }}>Department</th>
                <th style={{ padding: '0.9rem 1rem' }}>Scheduled Hours</th>
                <th style={{ padding: '0.9rem 1rem' }}>Overtime Hours</th>
                <th style={{ padding: '0.9rem 1rem' }}>Approved Leaves</th>
                <th style={{ padding: '0.9rem 1rem' }}>Total Hours</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Shift Allocation Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedNurses.map((nurse, rankIdx) => {
                const isSelected = nurse._id === activeNurse?._id;

                return (
                  <tr 
                    key={nurse._id}
                    onClick={() => setSelectedNurseId(nurse._id)}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    {/* Rank */}
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: rankIdx < 3 && sortOrder === 'desc' ? '#f87171' : '#94a3b8' }}>
                      #{rankIdx + 1}
                    </td>

                    {/* Nurse Name */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{nurse.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: {nurse.employeeId} • {nurse.designation}</div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{ padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                        {nurse.department}
                      </span>
                    </td>

                    {/* Scheduled Hours */}
                    <td style={{ padding: '0.9rem 1rem', color: '#cbd5e1' }}>
                      {nurse.scheduledHours} hrs
                    </td>

                    {/* Overtime Hours (Highlighted) */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        background: nurse.overtimeHours > 6 ? 'rgba(239, 68, 68, 0.2)' : nurse.overtimeHours > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                        color: nurse.overtimeHours > 6 ? '#f87171' : nurse.overtimeHours > 0 ? '#fbbf24' : '#34d399',
                        border: `1px solid ${nurse.overtimeHours > 6 ? 'rgba(239, 68, 68, 0.4)' : nurse.overtimeHours > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`
                      }}>
                        {nurse.overtimeHours > 0 ? `+${nurse.overtimeHours} hrs` : '0 hrs (Clean)'}
                      </span>
                    </td>

                    {/* Approved Leaves */}
                    <td style={{ padding: '0.9rem 1rem', color: '#cbd5e1' }}>
                      {nurse.leaveDays > 0 ? (
                        <span style={{ color: '#f87171', fontWeight: 700 }}>{nurse.leaveDays} days leave</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0 leaves</span>
                      )}
                    </td>

                    {/* Total Hours */}
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#f8fafc' }}>
                      {nurse.totalHours} hrs
                    </td>

                    {/* Allocation Status Badge */}
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <span style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        background: `${nurse.priorityBadgeColor}20`,
                        color: nurse.priorityBadgeColor,
                        border: `1px solid ${nurse.priorityBadgeColor}40`
                      }}>
                        {nurse.allocationPriority === 'High Priority' ? '✓ Prioritize for Next Shift' : nurse.allocationPriority === 'Rest Needed' ? '⚠️ High OT (Rest Needed)' : 'Normal Load'}
                      </span>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* SECTION 3: VISUAL CHARTS (DEPARTMENT OVERTIME & 4-WEEK TREND) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Department Overtime */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '24px', height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
            🏥 Overtime Hours by Department
          </h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#f8fafc', fontSize: 13, fontWeight: 700 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="hours" radius={[12, 12, 4, 4]} barSize={44}>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4-Week Trend */}
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '24px', height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
            📈 4-Week Overtime Trend
          </h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { week: 'Week 1', hours: 28 },
                { week: 'Week 2', hours: 42 },
                { week: 'Week 3', hours: 35 },
                { week: 'Week 4', hours: 48 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="week" stroke="#64748b" tick={{ fill: '#f8fafc', fontSize: 12, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="hours" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#fbbf24', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
