import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

export default function ManageCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', party: '', partySymbol: '', electionId: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api.get('/admin/candidates'), api.get('/admin/elections')])
      .then(([c, e]) => { setCandidates(c.data.candidates); setElections(e.data.elections); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', party: '', partySymbol: '', electionId: '' }); setPhotoFile(null); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, party: c.party, partySymbol: c.partySymbol || '', electionId: c.electionId?._id || '' }); setPhotoFile(null); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('photo', photoFile);

      if (editing) {
        await api.put(`/admin/candidates/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Candidate updated.');
      } else {
        await api.post('/admin/candidates', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Candidate added.');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    try {
      await api.delete(`/admin/candidates/${id}`);
      toast.success('Candidate deleted.');
      setCandidates(c => c.filter(x => x._id !== id));
    } catch { toast.error('Delete failed.'); }
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Candidates</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{candidates.length} candidates registered</p>
          </div>
          <button id="add-candidate-btn" className="btn btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add Candidate
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Party</th>
                <th>Symbol</th>
                <th>Election</th>
                <th>Votes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}><div className="loader" style={{ margin: '0 auto' }} /></td></tr>
              ) : candidates.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={c.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=4f46e5&color=fff&size=80`}
                        alt={c.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    </div>
                  </td>
                  <td>{c.party}</td>
                  <td>{c.partySymbol || '—'}</td>
                  <td><span className="badge badge-upcoming">{c.electionId?.title || 'N/A'}</span></td>
                  <td><strong style={{ color: 'var(--primary-400)' }}>{c.voteCount}</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Pencil size={15} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && candidates.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No candidates yet. Click "Add Candidate" to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{editing ? 'Edit Candidate' : 'Add Candidate'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="modal-cand-name" className="form-input" placeholder="Candidate name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Party Name</label>
              <input id="modal-cand-party" className="form-input" placeholder="Political party" value={form.party} onChange={e => setForm(p => ({ ...p, party: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Party Symbol</label>
              <input id="modal-cand-symbol" className="form-input" placeholder="e.g. 🌸 Lotus, 🤚 Hand" value={form.partySymbol} onChange={e => setForm(p => ({ ...p, partySymbol: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Election</label>
              <select id="modal-cand-election" className="form-input form-select" value={form.electionId} onChange={e => setForm(p => ({ ...p, electionId: e.target.value }))}>
                <option value="">Select election</option>
                {elections.map(el => <option key={el._id} value={el._id}>{el.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Photo</label>
              <input id="modal-cand-photo" type="file" accept="image/*" className="form-input" onChange={e => setPhotoFile(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button id="save-candidate-btn" className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
