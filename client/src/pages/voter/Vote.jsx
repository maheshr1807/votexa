import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Vote as VoteIcon, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Vote() {
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const { setVoter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/voter/election')
      .then(res => {
        // Use per-election vote status (not stale voter.hasVoted from previous elections)
        if (res.data.hasVotedInThisElection) {
          navigate('/voter/status');
          return;
        }
        if (res.data.election?.status !== 'online') {
          navigate('/voter/dashboard');
          return;
        }
        setElection(res.data.election);
        setCandidates(res.data.candidates);
      })
      .catch(() => toast.error('No active election found.'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleVote = async () => {
    if (!selected) { toast.error('Please select a candidate.'); return; }
    if (!window.confirm(`Are you sure you want to vote for ${selected.name}? This action cannot be undone.`)) return;

    setSubmitting(true);
    try {
      const res = await api.post('/voter/vote', { candidateId: selected._id, electionId: election._id });
      setReceipt(res.data.integrityHash);
      setVoter(prev => ({ ...prev, hasVoted: true, voteMode: 'online' }));
      toast.success('Your vote has been cast!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cast vote.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loader" />
      <p style={{ color: 'var(--text-muted)' }}>Loading election data...</p>
    </div>
  );

  if (receipt) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '2rem' }}>
      <div style={{ maxWidth: 480, textAlign: 'center', width: '100%' }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(16,185,129,0.15)', border: '3px solid var(--accent-500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <CheckCircle size={52} color="var(--accent-500)" />
        </div>
        <h2 style={{ marginBottom: '0.75rem' }}>Vote Cast Successfully!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          You voted for <strong style={{ color: 'var(--text-primary)' }}>{selected?.name}</strong> ({selected?.party})
        </p>
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Vote Integrity Hash (Receipt)</p>
          <code style={{ fontSize: '0.78rem', color: 'var(--primary-400)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {receipt}
          </code>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Save this hash to verify your vote integrity later.
          </p>
        </div>
        <button className="btn btn-primary btn-full" onClick={() => navigate('/voter/status')}>
          View Voting Status
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Shield size={20} color="var(--primary-400)" />
            <span className="badge badge-online">Election Active</span>
          </div>
          <h1 style={{ marginBottom: '0.5rem' }}>{election?.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Select one candidate and click Submit Vote. You can only vote once.
          </p>
        </div>

        <div className="alert alert-warning" style={{ marginBottom: '2rem', fontSize: '0.88rem' }}>
          <AlertCircle size={16} />
          <span>Your vote is final. Once submitted, it cannot be changed.</span>
        </div>

        {/* Candidates Grid */}
        <div className="grid-3" style={{ marginBottom: '2rem' }}>
          {candidates.map(candidate => (
            <div
              key={candidate._id}
              id={`candidate-${candidate._id}`}
              className={`candidate-card ${selected?._id === candidate._id ? 'selected' : ''}`}
              onClick={() => setSelected(candidate)}
            >
              <img
                src={candidate.photo ? candidate.photo : `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=4f46e5&color=fff&size=200`}
                alt={candidate.name}
                className="candidate-photo"
                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=4f46e5&color=fff&size=200`; }}
              />
              <h4 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>{candidate.name}</h4>
              <p style={{ color: 'var(--primary-400)', fontSize: '0.85rem', fontWeight: 600 }}>{candidate.party}</p>
              {candidate.partySymbol && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{candidate.partySymbol}</p>
              )}
            </div>
          ))}
        </div>

        {candidates.length === 0 && (
          <div className="alert alert-info">No candidates found for this election.</div>
        )}

        {/* Submit */}
        {selected && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected</p>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selected.name}</p>
              <p style={{ color: 'var(--primary-400)', fontSize: '0.88rem' }}>{selected.party}</p>
            </div>
            <button
              id="submit-vote-btn"
              className="btn btn-primary btn-lg"
              onClick={handleVote}
              disabled={submitting}
            >
              <VoteIcon size={18} />
              {submitting ? 'Submitting...' : 'Submit Vote'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
