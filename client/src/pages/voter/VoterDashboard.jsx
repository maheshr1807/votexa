import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Vote, BarChart3, Shield, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function VoterDashboard() {
  const { user, voter, logout } = useAuth();
  const [election, setElection]               = useState(null);
  const [electionError, setElectionError]     = useState(null);
  const [hasVotedHere, setHasVotedHere]       = useState(false);  // voted in THIS election
  const [voteModeHere, setVoteModeHere]       = useState(null);
  const [electionLoading, setElectionLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setElectionLoading(true);
    api.get('/voter/election')
      .then(res => {
        setElection(res.data.election);
        // Use the election-specific vote status returned by the server
        setHasVotedHere(res.data.hasVotedInThisElection || false);
        setVoteModeHere(res.data.voteMode || null);
        setElectionError(null);
      })
      .catch(err => {
        setElection(null);
        setHasVotedHere(false);
        setElectionError(err.response?.data?.message || 'No active election at this time.');
      })
      .finally(() => setElectionLoading(false));
  }, []);

  // canVoteOnline: election is in online phase AND voter hasn't voted in THIS election
  const canVoteOnline = !hasVotedHere && election?.status === 'online';

  // Status pill for the voter card
  const votedBadge = hasVotedHere
    ? <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}><CheckCircle size={16} /> Vote Cast ({voteModeHere})</span>
    : <span className="badge badge-upcoming" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}><Clock size={16} /> Not Voted Yet</span>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top Nav */}
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Votexa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>
          </span>
          <button className="btn btn-outline btn-sm" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Voter Card */}
        <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.1) 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <img
              src={voter?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'V')}&background=4f46e5&color=fff&size=200`}
              alt="Profile"
              style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.4)', objectFit: 'cover' }}
            />
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>{user?.name}</h3>
              <p style={{ color: 'var(--primary-400)', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem' }}>Voter ID: {voter?.voterId}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email}</p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {electionLoading ? <span className="badge badge-upcoming">Checking...</span> : votedBadge}
            </div>
          </div>
        </div>

        {/* Election Status Banner */}
        {election ? (
          <div className="card" style={{ marginBottom: '2rem', border: `1px solid ${election.status === 'online' && !hasVotedHere ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Active Election</p>
                <h4>{election.title}</h4>
                <span className={`badge badge-${election.status}`} style={{ marginTop: '0.5rem' }}>
                  {election.status.toUpperCase()} PHASE
                </span>
              </div>
              {canVoteOnline && (
                <Link to="/voter/verify-face" className="btn btn-primary btn-lg" id="start-vote-btn" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', border: 'none' }}>
                  <Vote size={18} /> Start Voting Now →
                </Link>
              )}
            </div>

            {/* Contextual status messages */}
            {hasVotedHere && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.85rem', color: 'var(--accent-400)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle size={15} /> You have already voted in this election ({voteModeHere}). Your vote is permanently recorded.
              </div>
            )}
            {!hasVotedHere && election.status === 'offline' && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.85rem', color: 'var(--warning-400)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertCircle size={15} /> Online voting is closed. This election is in offline phase. Please visit your nearest polling office.
              </div>
            )}
            {!hasVotedHere && election.status === 'upcoming' && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.85rem', color: 'var(--primary-400)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Clock size={15} /> Voting has not started yet. Check back soon.
              </div>
            )}
          </div>
        ) : (
          <div className="alert alert-info" style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <WifiOff size={15} />
            {electionError || 'No active election at this time.'}
          </div>
        )}

        {/* Action Cards */}
        <div className="grid-3">
          {[
            {
              icon: Vote,
              color: canVoteOnline ? '#10b981' : '#6366f1',
              title: 'Cast Vote',
              desc: canVoteOnline
                ? 'Online voting is OPEN. Verify your face and cast your vote.'
                : hasVotedHere
                  ? `You have already voted in this election (${voteModeHere}).`
                  : election?.status === 'offline'
                    ? 'Online voting is closed. Visit your nearest polling office.'
                    : election?.status === 'upcoming'
                      ? 'Voting has not started yet.'
                      : 'Online voting is not currently available.',
              action: '/voter/verify-face',
              label: canVoteOnline ? 'Start Voting' : hasVotedHere ? 'Already Voted' : 'Not Available',
              disabled: !canVoteOnline
            },
            {
              icon: BarChart3, color: '#10b981',
              title: 'View Results',
              desc: 'See the live or final election results and charts.',
              action: '/results',
              label: 'View Results',
              disabled: false
            },
            {
              icon: CheckCircle, color: '#8b5cf6',
              title: 'Vote Status',
              desc: 'Check your current voting status and integrity receipt.',
              action: '/voter/status',
              label: 'Check Status',
              disabled: false
            }
          ].map((card, i) => (
            <div key={i} className="card" style={{ textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${card.color}22`, border: `1px solid ${card.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <card.icon size={24} color={card.color} />
              </div>
              <h4 style={{ marginBottom: '0.4rem' }}>{card.title}</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{card.desc}</p>
              <Link
                to={card.action}
                className="btn btn-outline btn-sm btn-full"
                style={{ opacity: card.disabled ? 0.4 : 1, pointerEvents: card.disabled ? 'none' : 'auto' }}
              >
                {card.label}
              </Link>
            </div>
          ))}
        </div>

        {/* Open voting banner */}
        {canVoteOnline && (
          <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wifi size={18} color="var(--accent-400)" />
            <div>
              <p style={{ fontWeight: 700, color: 'var(--accent-400)', fontSize: '0.9rem' }}>Online Voting is OPEN</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Click "Start Voting Now" above to cast your vote securely.</p>
            </div>
          </div>
        )}

        {/* Info Block */}
        <div className="alert alert-info" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Shield size={16} />
          <span>Your vote is encrypted and protected with SHA-256 integrity hash. Online voting: Days 1–3. Offline voting at government offices: Days 4–6.</span>
        </div>
      </div>
    </div>
  );
}
