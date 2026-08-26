import { useEffect, useState } from 'react';
import { Plus, X, Play, Square, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

export default function ManageElections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '',
    onlineStartDate: '', onlineEndDate: '',
    offlineStartDate: '', offlineEndDate: '',
    resultsDate: ''
  });

  const load = () => { api.get('/admin/elections').then(r => setElections(r.data.elections)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post('/admin/elections', form);
      toast.success('Election created!');
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create election.'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/admin/elections/${id}/status`, { status });
      toast.success(`Election status → ${status}`);
      load();
    } catch { toast.error('Status update failed.'); }
  };

  const statusActions = {
    upcoming: [{ label: 'Start Online', status: 'online', icon: Play }],
    online: [{ label: 'Start Offline', status: 'offline', icon: Play }],
    offline: [{ label: 'End Election', status: 'ended', icon: Square }],
    ended: []
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Elections</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{elections.length} elections</p>
          </div>
          <button id="create-election-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Create Election
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
            <div className="loader" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {elections.map(el => (
              <div key={el._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h4>{el.title}</h4>
                      <span className={`badge badge-${el.status || 'upcoming'}`}>{(el.status || 'upcoming').toUpperCase()}</span>
                    </div>
                    {el.description && <p style={{ fontSize: '0.88rem', marginBottom: '0.75rem' }}>{el.description}</p>}
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span>📅 Online: {new Date(el.onlineStartDate).toLocaleDateString()} — {new Date(el.onlineEndDate).toLocaleDateString()}</span>
                      <span>🏢 Offline: {new Date(el.offlineStartDate).toLocaleDateString()} — {new Date(el.offlineEndDate).toLocaleDateString()}</span>
                      <span>🏆 Results: {new Date(el.resultsDate).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--accent-400)' }}>Online Votes: {el.onlineVotes}</span>
                      <span style={{ color: '#fb923c' }}>Offline Votes: {el.offlineVotes}</span>
                      <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Total: {el.totalVotes}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(statusActions[el.status] || []).map(action => (
                      <button key={action.status} className="btn btn-primary btn-sm"
                        onClick={() => changeStatus(el._id, action.status)}>
                        <action.icon size={15} /> {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {elections.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No elections yet.</p>}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Create New Election</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            {[
              { label: 'Election Title', key: 'title', placeholder: 'e.g. General Election 2024' },
              { label: 'Description', key: 'description', placeholder: 'Optional description' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input id={`election-${f.key}`} className="form-input" placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="grid-2">
              {[
                { label: 'Online Start', key: 'onlineStartDate' },
                { label: 'Online End', key: 'onlineEndDate' },
                { label: 'Offline Start', key: 'offlineStartDate' },
                { label: 'Offline End', key: 'offlineEndDate' },
                { label: 'Results Date', key: 'resultsDate' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input id={`election-${f.key}`} type="datetime-local" className="form-input"
                    value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button id="save-election-btn" className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Election'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
