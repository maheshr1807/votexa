import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Clock, Vote, Shield } from 'lucide-react';

export default function VoteStatus() {
  const { user, voter } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '2rem' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: voter?.hasVoted ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
          border: `3px solid ${voter?.hasVoted ? 'var(--accent-500)' : 'var(--primary-500)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          {voter?.hasVoted ? <CheckCircle size={52} color="var(--accent-500)" /> : <Clock size={52} color="var(--primary-400)" />}
        </div>

        <h2 style={{ marginBottom: '0.75rem' }}>
          {voter?.hasVoted ? 'Vote Successfully Cast!' : 'You Have Not Voted Yet'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {voter?.hasVoted
            ? `Your vote was cast via ${voter.voteMode} voting on ${voter.votedAt ? new Date(voter.votedAt).toLocaleString() : 'N/A'}.`
            : 'The election is currently active. Cast your vote to participate.'
          }
        </p>

        {voter?.hasVoted && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Voter</span>
              <span style={{ fontWeight: 600 }}>{user?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Voter ID</span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{voter?.voterId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mode</span>
              <span className={`badge badge-${voter.voteMode}`}>{voter.voteMode}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {!voter?.hasVoted && (
            <Link to="/voter/verify-face" className="btn btn-primary btn-lg">
              <Vote size={18} /> Cast Vote
            </Link>
          )}
          <Link to="/results" className="btn btn-outline">View Results</Link>
          <Link to="/voter/dashboard" className="btn btn-ghost">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
