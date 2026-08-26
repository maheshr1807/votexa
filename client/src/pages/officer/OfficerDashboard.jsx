import { Link, useNavigate } from 'react-router-dom';
import { Search, Vote, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function OfficerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Officer Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Officer: <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong></span>
          <button className="btn btn-outline btn-sm" onClick={() => { logout(); navigate('/officer/login'); }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Polling Officer Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
          Use the tools below to manage offline voting for registered voters.
        </p>

        <div className="grid-2">
          <div className="card" style={{ textAlign: 'left' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Search size={26} color="var(--primary-400)" />
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>Search Voter</h4>
            <p style={{ fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Look up a voter by their Voter ID to check their status and start the verification process.
            </p>
            <Link to="/officer/search" id="search-voter-btn" className="btn btn-primary btn-full">
              Search Voter
            </Link>
          </div>

          <div className="card" style={{ textAlign: 'left' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Vote size={26} color="var(--accent-500)" />
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>Cast Offline Vote</h4>
            <p style={{ fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              After verifying the voter's identity, proceed to cast their vote on their behalf.
            </p>
            <Link to="/officer/cast-vote" id="cast-vote-btn" className="btn btn-accent btn-full">
              Cast Offline Vote
            </Link>
          </div>
        </div>

        <div className="alert alert-info" style={{ marginTop: '2rem', textAlign: 'left', fontSize: '0.85rem' }}>
          <Shield size={16} />
          <span>Remember: Always verify the voter's face and biometric before casting their offline vote. Unauthorized votes are a criminal offence.</span>
        </div>
      </div>
    </div>
  );
}
