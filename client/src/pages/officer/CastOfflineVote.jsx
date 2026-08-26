import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle, AlertCircle, RefreshCw, Clock,
  Send, RotateCcw, ShieldCheck, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

/* ─── Step constants ─────────────────────────────────────── */
const STEP_SELECT   = 'select';    // officer picks candidate
const STEP_WAITING  = 'waiting';   // waiting for voter to confirm/change
const STEP_CHANGE   = 'change';    // voter requested change → officer re-selects
const STEP_LOCKED   = 'locked';    // vote locked, done

export default function CastOfflineVote() {
  const { state }  = useLocation();
  const voter      = state?.voter;
  const navigate   = useNavigate();

  /* ── election / candidates ── */
  const [election,   setElection]   = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  /* ── session state ── */
  const [sessionId,    setSessionId]    = useState(null);
  const [step,         setStep]         = useState(STEP_SELECT);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [receiptId,    setReceiptId]    = useState(null);
  const [sending,      setSending]      = useState(false);

  /* ── polling ── */
  const pollRef = useRef(null);

  /* ─────────────────────────────────────────────────────────
     Load election data
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!voter) { navigate('/officer/search'); return; }
    api.get('/officer/election')
      .then(res => {
        setElection(res.data.election);
        setCandidates(res.data.candidates);
      })
      .catch(() => toast.error('No active election.'))
      .finally(() => setLoading(false));
  }, [voter, navigate]);

  /* ─────────────────────────────────────────────────────────
     Start session when component mounts (voter is verified)
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!voter || !election) return;
    api.post('/officer/session/start', {
      voterIdStr: voter.voterId,
      electionId: election._id
    }).then(res => {
      setSessionId(res.data.sessionId);
      if (res.data.resumed) toast('Session resumed for this voter.', { icon: '🔄' });
    }).catch(() => toast.error('Could not start vote session.'));

    // Abandon session if officer navigates away
    return () => {
      // cleanup handled below with navigate away warning
    };
  }, [voter, election]);

  /* ─────────────────────────────────────────────────────────
     Poll session status when waiting for voter
  ───────────────────────────────────────────────────────── */
  const pollSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await api.get(`/officer/session/${sessionId}`);
      const s = res.data;
      setSessionStatus(s);

      if (s.status === 'change_requested' && step === STEP_WAITING) {
        clearInterval(pollRef.current);
        setStep(STEP_CHANGE);
        setSelected(null);
        toast('⟵ Voter requested a change. Please re-select.', { icon: '🔄', duration: 4000 });
      }

      if (s.status === 'voter_confirmed') {
        clearInterval(pollRef.current);
        setReceiptId(s.receiptId);
        setStep(STEP_LOCKED);
        toast.success('✅ Vote locked! Voter confirmed.');
      }
    } catch {
      // swallow polling errors silently
    }
  }, [sessionId, step]);

  useEffect(() => {
    if ((step === STEP_WAITING || step === STEP_CHANGE) && sessionId) {
      pollRef.current = setInterval(pollSession, 2000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [step, sessionId, pollSession]);

  /* ─────────────────────────────────────────────────────────
     Send candidate to voter screen
  ───────────────────────────────────────────────────────── */
  const sendToVoterScreen = async () => {
    if (!selected) { toast.error('Select a candidate first.'); return; }
    if (!sessionId) { toast.error('Session not initialized.'); return; }
    setSending(true);
    try {
      await api.post('/officer/session/select', { sessionId, candidateId: selected._id });
      // Open voter confirmation screen in new tab
      const voterUrl = `${window.location.origin}/officer/voter-confirm?session=${sessionId}`;
      window.open(voterUrl, '_blank', 'width=900,height=700,left=100,top=100');
      setStep(STEP_WAITING);
      toast.success('Candidate sent to voter screen. Waiting for voter confirmation...');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     Abandon session
  ───────────────────────────────────────────────────────── */
  const handleAbandon = async () => {
    if (!window.confirm('Cancel this voting session? This voter can start again.')) return;
    if (sessionId) await api.post('/officer/session/abandon', { sessionId }).catch(() => {});
    navigate('/officer/search');
  };

  /* ─────────────────────────────────────────────────────────
     Guards
  ───────────────────────────────────────────────────────── */
  if (!voter) return null;
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="loader" />
    </div>
  );

  /* ─────────────────────────────────────────────────────────
     STEP: LOCKED — Vote confirmed, show receipt summary
  ───────────────────────────────────────────────────────── */
  if (step === STEP_LOCKED) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '2rem' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        {/* Success Icon */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(16,185,129,0.12)', border: '3px solid var(--accent-500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          animation: 'pulse-ring 2s infinite'
        }}>
          <ShieldCheck size={52} color="var(--accent-500)" />
        </div>

        <h2 style={{ marginBottom: '0.5rem' }}>Vote Locked!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Voter <strong style={{ color: 'var(--text-primary)' }}>{voter.name}</strong> confirmed their choice.<br />
          The vote is permanently recorded.
        </p>

        {/* Officer Receipt Summary */}
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'left', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <CheckCircle size={20} color="var(--accent-500)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Officer Confirmation</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem' }}>
            {[
              { label: 'Voter', value: voter.name },
              { label: 'Voter ID', value: voter.voterId },
              { label: 'Candidate', value: sessionStatus?.candidateName || selected?.name || '—' },
              { label: 'Party', value: sessionStatus?.partyName || selected?.party || '—' },
              { label: 'Receipt ID', value: receiptId || '—' },
              { label: 'Election', value: election?.title || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</p>
                <p style={{ fontWeight: 600, color: label === 'Receipt ID' ? 'var(--accent-400)' : 'var(--text-primary)', fontFamily: label === 'Receipt ID' || label === 'Voter ID' ? 'monospace' : 'inherit', fontSize: label === 'Receipt ID' ? '0.88rem' : '0.92rem' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <button id="process-next-voter-btn" className="btn btn-primary btn-lg btn-full" onClick={() => navigate('/officer/search')}>
          Process Next Voter
        </button>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────
     STEP: WAITING — Officer waits for voter to act
  ───────────────────────────────────────────────────────── */
  if (step === STEP_WAITING) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Voter header */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="var(--primary-400)" />
          </div>
          <div>
            <h4 style={{ marginBottom: '0.15rem' }}>{voter.name}</h4>
            <p style={{ color: 'var(--primary-400)', fontFamily: 'monospace', fontSize: '0.88rem', fontWeight: 600 }}>{voter.voterId}</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Session</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{sessionId?.substring(0, 8)}...</p>
          </div>
        </div>

        {/* Waiting indicator */}
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
          {/* Animated waiting ring */}
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 1.5rem' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid rgba(245,158,11,0.2)',
              borderTopColor: 'var(--warning-400)',
              animation: 'spin 1.5s linear infinite'
            }} />
            <div style={{ position: 'absolute', inset: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={28} color="var(--warning-400)" />
            </div>
          </div>

          <h3 style={{ marginBottom: '0.5rem', color: 'var(--warning-400)' }}>Waiting for Voter Confirmation</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Candidate <strong style={{ color: 'var(--text-primary)' }}>{selected?.name}</strong> ({selected?.party}) has been sent to the voter screen.<br />
            The voter must press <strong>FINAL CONFIRM</strong> to lock the vote.
          </p>

          <div className="alert alert-warning" style={{ fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={14} />
            Only the voter can press the final confirmation button. You cannot confirm on their behalf.
          </div>

          {/* Reopen voter screen */}
          <button
            id="reopen-voter-screen-btn"
            className="btn btn-outline"
            style={{ marginBottom: '1rem' }}
            onClick={() => {
              const url = `${window.location.origin}/officer/voter-confirm?session=${sessionId}`;
              window.open(url, '_blank', 'width=900,height=700,left=100,top=100');
            }}>
            <ExternalLink size={15} /> Reopen Voter Screen
          </button>

          <div style={{ marginTop: '1rem' }}>
            <button id="cancel-session-btn" className="btn btn-outline" style={{ color: 'var(--danger-400)', borderColor: 'var(--danger-400)' }} onClick={handleAbandon}>
              <RotateCcw size={15} /> Cancel Session
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
            <RefreshCw size={11} style={{ display: 'inline', marginRight: 4 }} />
            Auto-refreshing every 2 seconds...
          </p>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────
     STEP: SELECT or CHANGE — Officer picks candidate
  ───────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 740, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          {step === STEP_CHANGE && (
            <div className="alert alert-warning" style={{ marginBottom: '1rem', fontWeight: 600 }}>
              <RotateCcw size={16} />
              Voter requested a change — please re-select a candidate below.
            </div>
          )}
          <h2 style={{ marginBottom: '0.25rem' }}>
            {step === STEP_CHANGE ? 'Re-select Candidate' : 'Cast Offline Vote'}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Voter: <strong style={{ color: 'var(--text-primary)' }}>{voter.name}</strong>
            <span style={{ color: 'var(--text-muted)', margin: '0 0.5rem' }}>·</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--primary-400)', fontSize: '0.88rem', fontWeight: 600 }}>{voter.voterId}</span>
          </p>
        </div>

        {/* Security layers reminder */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {['✓ Voter ID', '✓ Face Verified', '✓ Session Active'].map(s => (
            <span key={s} style={{
              padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-400)'
            }}>{s}</span>
          ))}
          <span style={{
            padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning-400)'
          }}>⧗ Awaiting Voter Confirm</span>
        </div>

        {/* Candidates grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {candidates.map(c => (
            <div
              key={c._id}
              id={`candidate-card-${c._id}`}
              onClick={() => setSelected(c)}
              style={{
                padding: '1.5rem 1rem',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${selected?._id === c._id ? 'var(--accent-500)' : 'var(--border-color)'}`,
                background: selected?._id === c._id ? 'rgba(16,185,129,0.07)' : 'var(--bg-card)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                transform: selected?._id === c._id ? 'translateY(-3px)' : 'none',
                boxShadow: selected?._id === c._id ? '0 8px 24px rgba(16,185,129,0.2)' : 'var(--shadow-sm)',
                position: 'relative',
                overflow: 'hidden'
              }}>
              {selected?._id === c._id && (
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <CheckCircle size={18} color="var(--accent-500)" />
                </div>
              )}
              <img
                src={c.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=4f46e5&color=fff&size=200`}
                alt={c.name}
                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=4f46e5&color=fff&size=200`; }}
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.75rem', border: '2px solid var(--border-color)' }}
              />
              <h4 style={{ fontSize: '0.92rem', marginBottom: '0.25rem' }}>{c.name}</h4>
              <p style={{ color: 'var(--primary-400)', fontSize: '0.8rem', fontWeight: 600 }}>{c.party}</p>
              {c.partySymbol && <p style={{ color: 'var(--text-muted)', fontSize: '0.73rem', marginTop: '0.2rem' }}>{c.partySymbol}</p>}
            </div>
          ))}
        </div>

        {/* Action bar */}
        {selected ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.06)', gap: '1rem', flexWrap: 'wrap'
          }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {step === STEP_CHANGE ? 'New Selection' : 'Selected'}
              </p>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{selected.name}</p>
              <p style={{ color: 'var(--primary-400)', fontSize: '0.85rem' }}>{selected.party}</p>
            </div>
            <button
              id="send-to-voter-screen-btn"
              className="btn btn-primary btn-lg"
              onClick={sendToVoterScreen}
              disabled={sending || !sessionId}
              style={{ background: 'var(--gradient-primary)', minWidth: 220 }}>
              <Send size={17} />
              {sending ? 'Sending...' : step === STEP_CHANGE ? 'Send Updated Choice to Voter' : 'Send to Voter Screen →'}
            </button>
          </div>
        ) : (
          <div className="alert alert-info" style={{ fontSize: '0.88rem' }}>
            <AlertCircle size={15} /> Select a candidate above, then send it to the voter's screen for confirmation.
          </div>
        )}

        {/* Cancel */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button id="cancel-vote-session-btn" className="btn btn-outline" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} onClick={handleAbandon}>
            Cancel Voting Session
          </button>
        </div>
      </div>
    </div>
  );
}
