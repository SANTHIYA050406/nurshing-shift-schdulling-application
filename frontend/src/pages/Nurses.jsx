import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  HelpCircle, 
  Building2, 
  Clock, 
  Phone, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function Nurses() {
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState(null); // null when adding, object when editing

  // Form Fields
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    department: 'ICU',
    designation: 'Staff Nurse',
    contact: '',
    maxWorkingHoursPerWeek: 40,
    preferredShift: 'Any'
  });

  // Fetch all nurses from Backend API
  const fetchNurses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5000/api/nurses');
      if (!res.ok) throw new Error('Failed to load nurses from server');
      const data = await res.json();
      setNurses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNurses();
  }, []);

  // Open Modal for Create
  const handleOpenAdd = () => {
    setEditingNurse(null);
    setFormData({
      employeeId: `N00${nurses.length + 1}`,
      name: '',
      department: 'ICU',
      designation: 'Staff Nurse',
      contact: '',
      maxWorkingHoursPerWeek: 40,
      preferredShift: 'Any'
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (nurse) => {
    setEditingNurse(nurse);
    setFormData({
      employeeId: nurse.employeeId || '',
      name: nurse.name || '',
      department: nurse.department || 'ICU',
      designation: nurse.designation || 'Staff Nurse',
      contact: nurse.contact || '',
      maxWorkingHoursPerWeek: nurse.maxWorkingHoursPerWeek || 40,
      preferredShift: nurse.preferredShift || 'Any'
    });
    setIsModalOpen(true);
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNurse) {
        // Edit Existing Nurse
        const res = await fetch(`http://localhost:5000/api/nurses/${editingNurse._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Failed to update nurse');
        const updated = await res.json();
        setNurses(prev => prev.map(n => n._id === updated._id ? updated : n));
      } else {
        // Create New Nurse
        const res = await fetch('http://localhost:5000/api/nurses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to create nurse');
        }
        const created = await res.json();
        setNurses(prev => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(`Error saving nurse: ${err.message}`);
    }
  };

  // Delete Handler
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the hospital staff registry?`)) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/nurses/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete nurse');
      setNurses(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      alert(`Error deleting nurse: ${err.message}`);
    }
  };

  // Filtered List
  const filteredNurses = nurses.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || n.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Unique Departments
  const departmentsList = ['All', 'Normal Ward', 'ER', 'ICU', 'OP'];

  return (
    <div style={{ width: '100%', paddingBottom: '3rem' }}>
      
      {/* Page Title & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc' }}>
            Nurse Staff Management
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            Register, assign departments, and manage working hour limits for automatic scheduling.
          </p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="btn" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
            boxShadow: '0 8px 20px -3px rgba(79, 70, 229, 0.4)',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: 700
          }}
        >
          <Plus size={18} /> Add New Nurse
        </button>
      </div>

      {/* Explanatory Banner: "What Does the Nurse Department Do?" */}
      {showInfoBanner && (
        <div style={{
          background: 'rgba(14, 165, 233, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          position: 'relative',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '0.6rem', borderRadius: '12px', color: '#38bdf8', marginTop: '0.1rem' }}>
            <HelpCircle size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.35rem 0', color: '#38bdf8', fontSize: '1.05rem', fontWeight: 700 }}>
              What does the Nurse Department do in ShiftSync?
            </h4>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.55 }}>
              In hospital operations, a <strong>Department</strong> (e.g., <strong>ICU</strong>, <strong>ER</strong>, <strong>Pediatrics</strong>, <strong>Surgery</strong>) represents a specialized clinical unit. Each requires unique certifications and equipment expertise.
              When you generate shifts via the <strong>Auto Scheduler</strong>, the system uses <strong>Constraint #6 (Department Matching)</strong> to guarantee that only nurses credentialed for that department are assigned to its shifts—preventing underqualified placements, keeping patient ratios safe, and balancing workload fairly across staff.
            </p>
          </div>
          <button 
            onClick={() => setShowInfoBanner(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
            title="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '18px', marginBottom: '1.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name or Employee ID..." 
              className="form-control" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.8rem', borderRadius: '10px' }}
            />
          </div>

          {/* Department Filter Dropdown */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Filter size={17} color="#94a3b8" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            <select 
              className="form-control" 
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              style={{ paddingLeft: '2.6rem', borderRadius: '10px', cursor: 'pointer' }}
            >
              {departmentsList.map(d => (
                <option key={d} value={d} style={{ background: '#0f172a' }}>
                  {d === 'All' ? 'All Departments' : `${d} Ward`}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Total Count Badge */}
        <div style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>
          Showing <strong style={{ color: '#38bdf8' }}>{filteredNurses.length}</strong> of {nurses.length} nurses
        </div>
      </div>

      {/* Main Table of Nurses */}
      <div className="glass-panel" style={{ borderRadius: '20px', padding: '0.5rem', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading nurses from MongoDB database...
          </div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#f87171' }}>
            <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
            <div>Error: {error}</div>
            <button className="btn" onClick={fetchNurses} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Retry</button>
          </div>
        ) : filteredNurses.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            No nurses found matching the current search or department filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Emp ID</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Nurse Name</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Department</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Designation</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Max Hours</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Shift Preference</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNurses.map(nurse => {
                  // Cute department pill styling
                  const deptColors = {
                    'Normal Ward': { bg: 'rgba(56, 189, 248, 0.18)', text: '#7dd3fc', border: 'rgba(56, 189, 248, 0.3)' },
                    ER: { bg: 'rgba(244, 63, 94, 0.18)', text: '#fda4af', border: 'rgba(244, 63, 94, 0.3)' },
                    ICU: { bg: 'rgba(99, 102, 241, 0.18)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)' },
                    OP: { bg: 'rgba(16, 185, 129, 0.18)', text: '#6ee7b7', border: 'rgba(16, 185, 129, 0.3)' },
                  }[nurse.department] || { bg: 'rgba(255,255,255,0.1)', text: '#cbd5e1', border: 'rgba(255,255,255,0.2)' };

                  return (
                    <tr 
                      key={nurse._id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* ID */}
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                        {nurse.employeeId}
                      </td>

                      {/* Name */}
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                        {nurse.name}
                      </td>

                      {/* Department */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          background: deptColors.bg,
                          color: deptColors.text,
                          border: `1px solid ${deptColors.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <Building2 size={13} />
                          {nurse.department}
                        </span>
                      </td>

                      {/* Designation */}
                      <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1' }}>
                        {nurse.designation}
                      </td>

                      {/* Max Hours */}
                      <td style={{ padding: '1rem 1.25rem', color: '#94a3b8' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>{nurse.maxWorkingHoursPerWeek}</span> hrs/wk
                      </td>

                      {/* Preferred Shift */}
                      <td style={{ padding: '1rem 1.25rem', color: '#94a3b8' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#cbd5e1'
                        }}>
                          {nurse.preferredShift || 'Any'}
                        </span>
                      </td>

                      {/* Action Buttons: EDIT & DELETE */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          
                          {/* EDIT BUTTON */}
                          <button
                            onClick={() => handleOpenEdit(nurse)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.8rem',
                              borderRadius: '8px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: '#38bdf8',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Edit Nurse"
                          >
                            <Edit3 size={14} /> Edit
                          </button>

                          {/* DELETE BUTTON */}
                          <button
                            onClick={() => handleDelete(nurse._id, nurse.name)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.8rem',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#f87171',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title="Delete Nurse"
                          >
                            <Trash2 size={14} /> Delete
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Nurse Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '540px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            padding: '2rem',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '0.5rem', borderRadius: '10px', color: '#38bdf8' }}>
                  {editingNurse ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                    {editingNurse ? `Edit Nurse: ${editingNurse.name}` : 'Add New Hospital Nurse'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    {editingNurse ? 'Update department, hours, and credentials' : 'Register nurse into hospital scheduling system'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.3rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Employee ID */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>Employee ID</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.employeeId} 
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                    placeholder="e.g. N007"
                  />
                </div>

                {/* Nurse Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Aisha Khan"
                  />
                </div>
              </div>

              {/* Department & Designation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>Department</label>
                  <select 
                    className="form-control"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Normal Ward">Normal Ward</option>
                    <option value="ER">ER (Emergency Room)</option>
                    <option value="ICU">ICU (Intensive Care)</option>
                    <option value="OP">OP (Outpatient Department)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>Designation</label>
                  <select 
                    className="form-control"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  >
                    <option value="Staff Nurse">Staff Nurse</option>
                    <option value="Senior Nurse">Senior Nurse</option>
                    <option value="Head Nurse">Head Nurse</option>
                    <option value="Trainee Nurse">Trainee Nurse</option>
                  </select>
                </div>
              </div>

              {/* Max Hours & Preferred Shift */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>Max Hours/Week</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.maxWorkingHoursPerWeek} 
                    onChange={e => setFormData({ ...formData, maxWorkingHoursPerWeek: Number(e.target.value) })}
                    min="10" 
                    max="60"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>Preferred Shift</label>
                  <select 
                    className="form-control"
                    value={formData.preferredShift}
                    onChange={e => setFormData({ ...formData, preferredShift: e.target.value })}
                  >
                    <option value="Any">Any Shift</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>

              {/* Contact (Optional) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>Contact Number / Email (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.contact} 
                  onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    flex: 1.5,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    fontWeight: 700
                  }}
                >
                  <Check size={18} /> {editingNurse ? 'Save Changes' : 'Create Nurse'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
