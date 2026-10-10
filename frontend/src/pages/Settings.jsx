import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Sliders, 
  ShieldCheck, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  DollarSign, 
  Save, 
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function Settings() {
  // Load saved settings from localStorage or defaults
  const [hospitalName, setHospitalName] = useState(() => localStorage.getItem('hospitalName') || 'Apex Medical Center');
  const [shiftDuration, setShiftDuration] = useState(() => Number(localStorage.getItem('shiftDuration')) || 8);
  const [overtimeRate, setOvertimeRate] = useState(() => Number(localStorage.getItem('overtimeRate')) || 1.5);
  const [hourlyWage, setHourlyWage] = useState(() => Number(localStorage.getItem('hourlyWage')) || 45);
  
  // Algorithm Constraints Settings
  const [maxWeeklyHours, setMaxWeeklyHours] = useState(() => Number(localStorage.getItem('maxWeeklyHours')) || 40);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(() => Number(localStorage.getItem('maxConsecutiveDays')) || 5);
  const [autoRebalance, setAutoRebalance] = useState(() => localStorage.getItem('autoRebalance') !== 'false');
  const [strictNightBalance, setStrictNightBalance] = useState(() => localStorage.getItem('strictNightBalance') !== 'false');

  const [toastMessage, setToastMessage] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('hospitalName', hospitalName);
    localStorage.setItem('shiftDuration', shiftDuration);
    localStorage.setItem('overtimeRate', overtimeRate);
    localStorage.setItem('hourlyWage', hourlyWage);
    localStorage.setItem('maxWeeklyHours', maxWeeklyHours);
    localStorage.setItem('maxConsecutiveDays', maxConsecutiveDays);
    localStorage.setItem('autoRebalance', autoRebalance);
    localStorage.setItem('strictNightBalance', strictNightBalance);

    setToastMessage('✓ Hospital configuration & algorithm parameters saved successfully!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetToDefaults = () => {
    if (!window.confirm('Reset all parameters back to hospital factory defaults?')) return;
    setHospitalName('Apex Medical Center');
    setShiftDuration(8);
    setOvertimeRate(1.5);
    setHourlyWage(45);
    setMaxWeeklyHours(40);
    setMaxConsecutiveDays(5);
    setAutoRebalance(true);
    setStrictNightBalance(true);

    localStorage.clear();
    setToastMessage('Reset back to factory defaults.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <SettingsIcon size={14} /> HOSPITAL POLICY & SCHEDULING RULES
          </div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc' }}>
            System Settings & Engine Rules
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
            Configure clinical policies, shift duration rules, overtime multipliers, and mathematical algorithm thresholds.
          </p>
        </div>

        <button
          onClick={handleResetToDefaults}
          className="btn"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.88rem',
            fontWeight: 600
          }}
        >
          <RotateCcw size={16} /> Reset Defaults
        </button>
      </div>

      <form onSubmit={handleSave}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* CARD 1: GENERAL HOSPITAL & FINANCIAL POLICIES */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.5rem', borderRadius: '10px', color: '#38bdf8' }}>
                <Building2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  Hospital & Shift Policies
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                  Governs standard shift hours and overtime compensation.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Hospital Facility Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Hospital Facility Name
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={hospitalName}
                  onChange={e => setHospitalName(e.target.value)}
                  style={{ borderRadius: '12px' }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Appears on official schedule exports and hospital banners.</span>
              </div>

              {/* Standard Shift Duration */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Standard Shift Duration (Hours)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={shiftDuration}
                    onChange={e => setShiftDuration(Number(e.target.value))}
                    min="4"
                    max="14"
                    style={{ borderRadius: '12px' }}
                    required
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>
                    hrs/shift
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Standard clinical rotation (usually 8 hours for 3-shift hospital rotas).</span>
              </div>

              {/* Overtime Premium Multiplier */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Overtime Pay Multiplier
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    step="0.1"
                    min="1.0"
                    max="3.0"
                    className="form-control" 
                    value={overtimeRate}
                    onChange={e => setOvertimeRate(Number(e.target.value))}
                    style={{ borderRadius: '12px' }}
                    required
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700 }}>
                    x Multiplier
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Standard rate is 1.5x regular pay for overtime hours worked.</span>
              </div>

              {/* Base Hourly Rate */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Base Staff Nurse Hourly Wage ($)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={hourlyWage}
                    onChange={e => setHourlyWage(Number(e.target.value))}
                    min="20"
                    max="150"
                    style={{ borderRadius: '12px' }}
                    required
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#34d399', fontSize: '0.85rem', fontWeight: 700 }}>
                    $/hr
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Used in the Overtime Dashboard to estimate monthly department costs.</span>
              </div>

            </div>
          </div>

          {/* CARD 2: AUTO-SCHEDULER CONSTRAINT THRESHOLDS */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.5rem', borderRadius: '10px', color: '#818cf8' }}>
                <Sliders size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  Algorithm Constraints & Optimization Rules
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                  Directly controls the mathematical scheduler engine constraints.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Max Weekly Working Hours (Constraint #3) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Max Working Hours Per Week (Constraint #3)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={maxWeeklyHours}
                    onChange={e => setMaxWeeklyHours(Number(e.target.value))}
                    min="20"
                    max="60"
                    style={{ borderRadius: '12px' }}
                    required
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>
                    hrs/week
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>The scheduler stops allocating shifts to a nurse when they reach this limit.</span>
              </div>

              {/* Max Consecutive Shifts (Constraint #5) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Max Consecutive Shifts (Constraint #5)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={maxConsecutiveDays}
                    onChange={e => setMaxConsecutiveDays(Number(e.target.value))}
                    min="2"
                    max="7"
                    style={{ borderRadius: '12px' }}
                    required
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>
                    days max
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Prevents assigning nurses more than N consecutive days to avoid fatigue.</span>
              </div>

              {/* Toggle 1: Cross-Department Surplus Rebalancing */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={autoRebalance}
                    onChange={e => setAutoRebalance(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#38bdf8', marginTop: '0.2rem' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                      Prompt for Cross-Department Rebalance on Leave Approval
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      When a nurse's leave is approved, automatically analyze hospital surplus wards and prompt admin with candidate nurses to fill the deficit.
                    </div>
                  </div>
                </label>
              </div>

              {/* Toggle 2: Fair Night Shift Balancing (Constraint #7) */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={strictNightBalance}
                    onChange={e => setStrictNightBalance(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#38bdf8', marginTop: '0.2rem' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                      Enforce Strict Night Shift Rotation (Constraint #7)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      Fairly distributes unsociable night shifts evenly so no single nurse gets overburdened with nocturnal duties.
                    </div>
                  </div>
                </label>
              </div>

            </div>
          </div>

        </div>

        {/* SAVE BUTTON BAR */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            type="submit" 
            className="btn"
            style={{
              padding: '1rem 2.5rem',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
              boxShadow: '0 10px 25px -4px rgba(79, 70, 229, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <Save size={18} /> Save & Apply Hospital Configuration
          </button>
        </div>

      </form>

    </div>
  );
}
