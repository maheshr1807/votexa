import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function OfficerLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { ...form, role: 'officer' });
      if (!['officer', 'admin'].includes(res.data.user.role)) {
        toast.error('Access denied.');
        return;
      }
      login(res.data.token, res.data.user);
      toast.success('Welcome, Officer!');
      navigate('/officer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.1) 0%, transparent 60%), var(--bg-base)',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Officer Login</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Polling Officer Portal</p>
        </div>
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input id="officer-email" type="email" className="form-input" placeholder="officer@gov.in"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="officer-password" type={showPass ? 'text' : 'password'} className="form-input"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: '3rem' }} required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button id="officer-login-btn" type="submit" className="btn btn-accent btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Officer Sign In'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          <Link to="/">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
