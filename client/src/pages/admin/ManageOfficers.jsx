import { useEffect, useState } from 'react';
import { Plus, X, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

export default function ManageOfficers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });

  const load = () => { api.get('/admin/officers').then(r => setOfficers(r.data.officers)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post('/admin/officers', form);
      toast.success('Polling officer added!');
      setShowModal(false);
      setForm({ name: '', email: '', mobile: '', password: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add officer.'); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Polling Officers</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{officers.length} officers</p>
          </div>
          <button id="add-officer-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add Officer
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Officer</th><th>Email</th><th>Mobile</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}><div className="loader" style={{ margin: '0 auto' }} /></td></tr>
              ) : officers.map(o => (
                <tr key={o._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-400)' }}>
                        {o.name ? o.name[0].toUpperCase() : '?'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{o.email}</td>
                  <td>{o.mobile || '—'}</td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
              {!loading && officers.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No officers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add Polling Officer</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            {[
              { label: 'Full Name', key: 'name', placeholder: 'Officer name', type: 'text' },
              { label: 'Email', key: 'email', placeholder: 'officer@gov.in', type: 'email' },
              { label: 'Mobile', key: 'mobile', placeholder: 'Mobile number', type: 'text' },
              { label: 'Password', key: 'password', placeholder: 'Set password', type: 'password' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input id={`officer-${f.key}`} type={f.type} className="form-input" placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button id="save-officer-btn" className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd} disabled={saving}>
                {saving ? 'Adding...' : 'Add Officer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
