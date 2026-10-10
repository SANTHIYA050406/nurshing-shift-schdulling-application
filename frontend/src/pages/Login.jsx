import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Stethoscope, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'nurse'
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'admin') {
      setEmail('admin@hospital.com');
      setPassword('admin123');
    } else {
      setEmail('nurse.priya@hospital.com');
      setPassword('nurse123');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('userRole', activeTab);
      if (activeTab === 'nurse') {
        navigate('/nurse-dashboard');
      } else {
        navigate('/dashboard');
      }
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-main, sans-serif)',
      backgroundColor: '#090d16',
      overflow: 'hidden'
    }}>
      {/* Visual Effects & Animations */}
      <style>{`
        @keyframes bgBreathe {
          0%, 100% { transform: scale(1); filter: brightness(0.65) saturate(1.1); }
          50% { transform: scale(1.03); filter: brightness(0.72) saturate(1.2); }
        }
        @keyframes cardGlow {
          0%, 100% { box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(79, 70, 229, 0.2); }
          50% { box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 45px rgba(16, 185, 129, 0.25); }
        }
        .hospital-bg {
          position: absolute;
          inset: -20px;
          background-image: url('/hospital_building.jpg');
          background-size: cover;
          background-position: center;
          animation: bgBreathe 24s ease-in-out infinite;
          z-index: 0;
        }
        .login-card {
          position: relative;
          z-index: 2;
          width: 90%;
          max-width: 460px;
          padding: 2.75rem 2.25rem;
          background: rgba(15, 23, 42, 0.78);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 24px;
          animation: cardGlow 8s ease-in-out infinite;
        }
        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          border: none;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .input-group {
          position: relative;
          display: flex;
          align-items: center;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.14);
          transition: all 0.2s ease;
        }
        .input-group:focus-within {
          border-color: #38bdf8;
          background: rgba(15, 23, 42, 0.9);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
        }
        .input-field {
          width: 100%;
          padding: 0.95rem 1rem 0.95rem 3rem;
          background: transparent;
          border: none;
          outline: none;
          color: #f8fafc;
          font-size: 0.95rem;
        }
        .submit-btn {
          width: 100%;
          padding: 1rem;
          border-radius: 12px;
          border: none;
          color: white;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.25s ease;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* Hospital Building Background */}
      <div className="hospital-bg" />

      {/* Dark Gradient Overlay for Contrast */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.4) 0%, rgba(9, 13, 22, 0.85) 100%)',
        zIndex: 1
      }} />

      {/* Centered Clean Login Card */}
      <div className="login-card">
        
        {/* Hospital Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: activeTab === 'admin' 
              ? 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)' 
              : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            boxShadow: activeTab === 'admin' 
              ? '0 8px 20px rgba(79, 70, 229, 0.4)' 
              : '0 8px 20px rgba(16, 185, 129, 0.4)',
            marginBottom: '1rem',
            transition: 'all 0.3s ease'
          }}>
            {activeTab === 'admin' ? (
              <Shield size={28} color="#ffffff" />
            ) : (
              <Stethoscope size={28} color="#ffffff" />
            )}
          </div>
          <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
            Hospital Portal Login
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
            Nursing Staff Shift Scheduling System
          </p>
        </div>

        {/* Clean Admin vs Nurse Toggle Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '0.35rem',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1.75rem'
        }}>
          <button
            type="button"
            className="tab-btn"
            onClick={() => handleTabChange('admin')}
            style={{
              background: activeTab === 'admin' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'transparent',
              color: activeTab === 'admin' ? '#ffffff' : '#94a3b8',
              boxShadow: activeTab === 'admin' ? '0 4px 14px rgba(79, 70, 229, 0.4)' : 'none'
            }}
          >
            <Shield size={17} />
            Admin Login
          </button>

          <button
            type="button"
            className="tab-btn"
            onClick={() => handleTabChange('nurse')}
            style={{
              background: activeTab === 'nurse' ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
              color: activeTab === 'nurse' ? '#ffffff' : '#94a3b8',
              boxShadow: activeTab === 'nurse' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            <Stethoscope size={17} />
            Nurse Login
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Email / ID Field */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
              {activeTab === 'admin' ? 'ADMIN EMAIL' : 'NURSE EMAIL'}
            </label>
            <div className="input-group">
              <Mail size={18} color="#38bdf8" style={{ position: 'absolute', left: '1rem' }} />
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.com"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
              PASSWORD
            </label>
            <div className="input-group">
              <Lock size={18} color="#38bdf8" style={{ position: 'absolute', left: '1rem' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.9rem',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              background: activeTab === 'admin'
                ? 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)'
                : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              boxShadow: activeTab === 'admin'
                ? '0 10px 25px -3px rgba(79, 70, 229, 0.45)'
                : '0 10px 25px -3px rgba(16, 185, 129, 0.45)'
            }}
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In as {activeTab === 'admin' ? 'Administrator' : 'Nurse'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

        </form>

        {/* Simple Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
          Select <strong>Admin</strong> or <strong>Nurse</strong> above to log into your dashboard.
        </div>

      </div>
    </div>
  );
}
