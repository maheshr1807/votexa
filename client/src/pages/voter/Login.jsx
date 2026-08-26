import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ voterId: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { ...form, role: 'voter' });
      login(res.data.token, res.data.user, res.data.voter);
      toast.success('Welcome back!');
      navigate('/voter/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 70% 30%, rgba(99,102,241,0.1) 0%, transparent 60%), var(--bg-base)',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem' }}>Votexa</span>
          </Link>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Voter Login</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in with your Voter ID</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-voter-id">Voter ID</label>
              <input
                id="login-voter-id"
                className="form-input"
                placeholder="e.g. DEFRF34445 (not your email)"
                value={form.voterId}
                onChange={e => setForm(p => ({ ...p, voterId: e.target.value }))}
                required
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Enter your Voter ID, not your email address.</p>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: '3rem' }}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button id="login-submit-btn" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign In to Vote'}
            </button>
          </form>

          <div className="divider">or</div>

          <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <p>Are you an admin? <Link to="/admin/login">Admin Login</Link></p>
            <p style={{ marginTop: '0.5rem' }}>Polling officer? <Link to="/officer/login">Officer Login</Link></p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          New voter? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
