import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  LogIn, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Users, 
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-main, sans-serif)',
      backgroundColor: '#090d16'
    }}>
      {/* Background Hospital Image */}
      <div style={{
        position: 'absolute',
        inset: '-20px',
        backgroundImage: "url('/hospital_building.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.52) contrast(1.15)',
        zIndex: 0
      }} />

      {/* Dark Gradient Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 40%, rgba(14, 165, 233, 0.12), transparent 55%), linear-gradient(180deg, rgba(9, 13, 22, 0.6) 0%, rgba(9, 13, 22, 0.92) 100%)',
        zIndex: 1
      }} />

      {/* TOP NAVBAR: Title on Left, Login Button on the Side (Right) */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 3rem',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {/* Title: Nurse Shift Allocation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(79, 70, 229, 0.45)'
          }}>
            <Building2 size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Nurse Shift Allocation
            </h1>
            <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Automated Hospital Scheduling Portal
            </span>
          </div>
        </div>

        {/* Login Button on the Side */}
        <Link
          to="/login"
          style={{
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 700,
            padding: '0.75rem 1.6rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 6px 20px rgba(79, 70, 229, 0.4)',
            transition: 'all 0.25s ease'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <LogIn size={18} />
          Login to Portal
          <ArrowRight size={16} />
        </Link>
      </header>

      {/* HERO SECTION */}
      <main style={{
        position: 'relative',
        zIndex: 5,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem'
      }}>
        <div className="glass-panel" style={{
          maxWidth: '860px',
          width: '100%',
          padding: '3.5rem 3rem',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '28px',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.7)'
        }}>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '30px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            <Sparkles size={16} /> Constraint-Based Optimization System
          </div>

          <h2 style={{
            fontSize: '3.1rem',
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            margin: '0 0 1.25rem 0',
            color: '#ffffff'
          }}>
            Nurse Shift Allocation & <br />
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Overtime Tracking Dashboard
            </span>
          </h2>

          <p style={{
            fontSize: '1.15rem',
            color: '#cbd5e1',
            maxWidth: '680px',
            margin: '0 auto 2.5rem auto',
            lineHeight: 1.6
          }}>
            Automatically assigns hospital nurses to morning, evening, and night shifts based on availability, department specializations, and balanced workloads.
          </p>

          {/* Primary Action Button to Login */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <Link
              to="/login"
              style={{
                textDecoration: 'none',
                fontSize: '1.05rem',
                fontWeight: 700,
                padding: '1.1rem 2.5rem',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 10px 25px -4px rgba(79, 70, 229, 0.5)',
                transition: 'all 0.25s ease'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <LogIn size={20} />
              Access Portal Login
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* 3 Pillars Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '2rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#38bdf8' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>Auto Allocation</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.15rem' }}>Zero manual shift scheduling needed</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#34d399' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>8 Strict Constraints</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.15rem' }}>Leave, workload & hours compliance</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.6rem', borderRadius: '12px', color: '#fbbf24' }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>Overtime Tracker</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.15rem' }}>Prevents nurse fatigue and burnout</div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: '1rem',
        color: '#64748b',
        fontSize: '0.82rem',
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        Nurse Shift Allocation System • Hospital Workforce Optimization
      </footer>
    </div>
  );
}
