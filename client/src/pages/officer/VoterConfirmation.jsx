/**
 * VoterConfirmation.jsx
 *
 * This page opens in a new tab on the VOTER'S screen.
 * URL: /officer/voter-confirm?session=<sessionId>
 *
 * It has NO auth token — it communicates with the server using only the
 * sessionId. The voter uses this screen to:
 *   1. See the candidate the officer selected
 *   2. Request a CHANGE (officer re-selects on the other screen)
 *   3. Press FINAL CONFIRM to lock the vote permanently
 *
 * Security property: the officer's screen NEVER has the confirm button.
 * Only this page does.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

/* ── Public API (no auth token needed) ───────────────────── */
const API_URL = import.meta.env.VITE_API_URL || "";
const publicApi = axios.create({ baseURL: `${API_URL}/api` });

/* ── Timer constants ─────────────────────────────────────── */
const CONFIRM_SECONDS = 60; // seconds voter has to review

/* ── Status helpers ──────────────────────────────────────── */
const STATUS = {
  LOADING:          'loading',
  WAITING_OFFICER:  'waiting_officer',  // officer hasn't sent a candidate yet
  PENDING_VOTER:    'pending_voter',     // candidate shown, voter must act
  CHANGE_SENT:      'change_sent',      // voter pressed CHANGE, waiting for officer
  CONFIRMED:        'confirmed',        // vote locked
  ABANDONED:        'abandoned',
  ERROR:            'error'
};

export default function VoterConfirmation() {
  const [searchParams]   = useSearchParams();
  const sessionId        = searchParams.get('session');

  const [uiStatus,   setUiStatus]   = useState(STATUS.LOADING);
  const [session,    setSession]    = useState(null);
  const [receipt,    setReceipt]    = useState(null);  // { receiptId, candidateName, partyName, ... }
  const [timeLeft,   setTimeLeft]   = useState(CONFIRM_SECONDS);
  const [acting,     setActing]     = useState(false);
  const [error,      setError]      = useState('');

  const pollRef  = useRef(null);
  const timerRef = useRef(null);

  /* ─────────────────────────────────────────────────────────
     Poll session status
  ───────────────────────────────────────────────────────── */
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await publicApi.get(`/officer/session/${sessionId}`);
      const s   = res.data;
      setSession(s);

      switch (s.status) {
        case 'pending_selection':
          setUiStatus(STATUS.WAITING_OFFICER);
          break;
        case 'candidate_sent':
          // Keep change_sent state if voter already pressed change
          if (uiStatus !== STATUS.CHANGE_SENT) {
            setUiStatus(STATUS.PENDING_VOTER);
          }
          break;
        case 'change_requested':
          setUiStatus(STATUS.CHANGE_SENT);
          break;
        case 'voter_confirmed':
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setReceipt({
            receiptId:     s.receiptId,
            candidateName: s.candidateName,
            partyName:     s.partyName,
            candidatePhoto:s.candidatePhoto,
            electionTitle: s.electionTitle,
            voterName:     s.voterName,
            timestamp:     new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            date:          new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
          });
          setUiStatus(STATUS.CONFIRMED);
          break;
        case 'abandoned':
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setUiStatus(STATUS.ABANDONED);
          break;
        default:
          break;
      }
    } catch {
      setUiStatus(STATUS.ERROR);
      setError('Could not reach the voting server. Please contact the officer.');
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) { setUiStatus(STATUS.ERROR); setError('Missing session ID.'); return; }
    fetchSession();
    pollRef.current = setInterval(fetchSession, 2000);
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current); };
  }, [sessionId, fetchSession]);

  /* ─────────────────────────────────────────────────────────
     Countdown timer — starts when candidate is shown
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (uiStatus === STATUS.PENDING_VOTER) {
      setTimeLeft(CONFIRM_SECONDS);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [uiStatus]);

  /* ─────────────────────────────────────────────────────────
     Actions
  ───────────────────────────────────────────────────────── */
  const handleChange = async () => {
    if (acting) return;
    setActing(true);
    try {
      await publicApi.post('/officer/session/change', { sessionId });
      clearInterval(timerRef.current);
      setUiStatus(STATUS.CHANGE_SENT);
    } catch {
      setError('Could not send change request. Try again.');
    } finally {
      setActing(false);
    }
  };

  const handleConfirm = async () => {
    if (acting) return;
    setActing(true);
    try {
      const res = await publicApi.post('/officer/session/confirm', { sessionId });
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
      setReceipt({
        receiptId:      res.data.receiptId,
        candidateName:  res.data.candidateName,
        partyName:      res.data.partyName,
        candidatePhoto: res.data.candidatePhoto,
        electionTitle:  res.data.electionTitle,
        voterName:      res.data.voterName,
        timestamp:      new Date(res.data.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date:           new Date(res.data.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      });
      setUiStatus(STATUS.CONFIRMED);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not confirm vote. Please try again.');
      setActing(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     UI — Full-screen immersive voter experience
  ───────────────────────────────────────────────────────── */
  const baseStyle = {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: 'var(--font-body)',
    color: 'var(--text-primary)'
  };

  /* ── LOADING ── */
  if (uiStatus === STATUS.LOADING) return (
    <div style={baseStyle}>
      <div style={{ textAlign: 'center' }}>
        <div className="loader" style={{ width: 48, height: 48, margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Connecting to voting server...</p>
      </div>
    </div>
  );

  /* ── ERROR ── */
  if (uiStatus === STATUS.ERROR) return (
    <div style={baseStyle}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: 'var(--danger-400)', marginBottom: '0.75rem' }}>Connection Error</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    </div>
  );

  /* ── ABANDONED ── */
  if (uiStatus === STATUS.ABANDONED) return (
    <div style={baseStyle}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ marginBottom: '0.75rem' }}>Session Ended</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          This voting session was cancelled by the officer. Please approach the officer to restart.
        </p>
      </div>
    </div>
  );

  /* ── WAITING FOR OFFICER ── */
  if (uiStatus === STATUS.WAITING_OFFICER) return (
    <div style={baseStyle}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Animated waiting rings */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 2rem' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: i * 15,
              borderRadius: '50%',
              border: '2px solid rgba(99,102,241,0.3)',
              borderTopColor: 'var(--primary-400)',
              animation: `spin ${1.2 + i * 0.3}s linear infinite`
            }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
            🗳️
          </div>
        </div>
        <h2 style={{ marginBottom: '0.75rem' }}>Your Turn is Coming</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The polling officer is preparing your ballot.<br />
          Your confirmation screen will appear shortly.
        </p>
        <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Please wait at this screen. Do not close this tab.
        </div>
      </div>
    </div>
  );

  /* ── CHANGE SENT — waiting for officer to re-select ── */
  if (uiStatus === STATUS.CHANGE_SENT) return (
    <div style={baseStyle}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🔄</div>
        <h2 style={{ marginBottom: '0.75rem', color: 'var(--warning-400)' }}>Change Requested</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          You requested a change. The officer has been notified and will select a different candidate.<br />
          <br />
          Your new selection will appear here shortly.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning-400)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          Waiting for officer to re-select...
        </div>
      </div>
    </div>
  );

  /* ── CONFIRMED — show receipt ── */
  if (uiStatus === STATUS.CONFIRMED && receipt) return (
    <div style={baseStyle}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Receipt card */}
        <div style={{
          background: 'linear-gradient(160deg, #0d1117 0%, #1a1a28 100%)',
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(16,185,129,0.15)',
        }}>
          {/* Receipt header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.08))',
            borderBottom: '1px solid rgba(16,185,129,0.25)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--accent-400)', marginBottom: '0.25rem' }}>
              VOTING RECEIPT
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
            </div>
          </div>

          {/* Receipt body */}
          <div style={{ padding: '1.5rem 2rem' }}>
            {/* SIMULATION label */}
            <div style={{
              textAlign: 'center', marginBottom: '1.25rem',
              padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--warning-400)'
            }}>
              ⚠ SIMULATION — COLLEGE PROTOTYPE
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <ReceiptRow label="Election" value={receipt.electionTitle} />
              <div style={{ height: 1, background: 'var(--border-color)' }} />

              {/* Candidate info with photo */}
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Your Vote</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={receipt.candidatePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(receipt.candidateName)}&background=10b981&color=fff&size=100`}
                    alt={receipt.candidateName}
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(receipt.candidateName)}&background=10b981&color=fff&size=100`; }}
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(16,185,129,0.4)' }}
                  />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{receipt.candidateName}</p>
                    <p style={{ color: 'var(--accent-400)', fontWeight: 600, fontSize: '0.88rem' }}>{receipt.partyName}</p>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)' }} />

              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>✓ Vote Successfully Recorded</p>
              </div>

              <ReceiptRow label="Receipt ID" value={receipt.receiptId} mono accent />
              <ReceiptRow label="Time" value={`${receipt.timestamp}`} />
              <ReceiptRow label="Date" value={receipt.date} />
            </div>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                This receipt confirms your vote was recorded.<br />
                You may close this window.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── PENDING VOTER — main confirmation screen ── */
  const timerPercent = (timeLeft / CONFIRM_SECONDS) * 100;
  const timerColor   = timeLeft > 20 ? '#10b981' : timeLeft > 10 ? '#f59e0b' : '#ef4444';
  const candidate    = session;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem', fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            🗳️ Secure Voter Confirmation Screen
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '0.25rem' }}>
            Verify Your Selection
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {candidate?.voterName && <><strong>{candidate.voterName}</strong> · </>}
            Please confirm your vote carefully.
          </p>
        </div>

        {/* Countdown timer bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Time to review</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: timerColor, fontSize: '1rem' }}>{timeLeft}s</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${timerPercent}%`,
              background: timerColor,
              borderRadius: 'var(--radius-full)',
              transition: 'width 1s linear, background 0.5s ease'
            }} />
          </div>
        </div>

        {/* Warning */}
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.82rem', color: 'var(--warning-400)', marginBottom: '1.5rem', fontWeight: 500
        }}>
          ⚠️ Once you press FINAL CONFIRM, your vote is locked and cannot be changed.
        </div>

        {/* Candidate confirmation card */}
        <div style={{
          borderRadius: 'var(--radius-xl)',
          border: '2px solid rgba(99,102,241,0.35)',
          background: 'linear-gradient(145deg, var(--bg-card), rgba(16,16,26,0.95))',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(99,102,241,0.12)',
          marginBottom: '2rem'
        }}>
          {/* Top label */}
          <div style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(99,102,241,0.08)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--primary-400)', textTransform: 'uppercase', textAlign: 'center'
          }}>
            Candidate Selected by Officer
          </div>

          {/* Candidate info */}
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <img
              src={candidate?.candidatePhoto || (candidate?.candidateName ? `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.candidateName)}&background=4f46e5&color=fff&size=200` : '')}
              alt={candidate?.candidateName}
              onError={e => { if (candidate?.candidateName) e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.candidateName)}&background=4f46e5&color=fff&size=200`; }}
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(99,102,241,0.4)', marginBottom: '1.25rem' }}
            />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.35rem' }}>
              {candidate?.candidateName || '—'}
            </h2>
            <p style={{ color: 'var(--primary-400)', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.03em' }}>
              {candidate?.partyName || '—'}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* CHANGE */}
          <button
            id="voter-change-btn"
            onClick={handleChange}
            disabled={acting}
            style={{
              padding: '1.1rem',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid rgba(245,158,11,0.5)',
              background: 'rgba(245,158,11,0.08)',
              color: 'var(--warning-400)',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: acting ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-base)',
              fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
            onMouseEnter={e => { if (!acting) { e.target.style.background = 'rgba(245,158,11,0.15)'; e.target.style.borderColor = 'var(--warning-400)'; }}}
            onMouseLeave={e => { e.target.style.background = 'rgba(245,158,11,0.08)'; e.target.style.borderColor = 'rgba(245,158,11,0.5)'; }}>
            🔄 CHANGE VOTE
          </button>

          {/* FINAL CONFIRM */}
          <button
            id="voter-final-confirm-btn"
            onClick={handleConfirm}
            disabled={acting || timeLeft === 0}
            style={{
              padding: '1.1rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: acting || timeLeft === 0
                ? 'rgba(16,185,129,0.3)'
                : 'linear-gradient(135deg, #10b981, #34d399)',
              color: '#fff',
              fontWeight: 800, fontSize: '0.95rem',
              cursor: acting || timeLeft === 0 ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-base)',
              fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: acting || timeLeft === 0 ? 'none' : '0 4px 20px rgba(16,185,129,0.35)',
            }}>
            ✅ FINAL CONFIRM MY VOTE
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger-400)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          The officer <strong style={{ color: 'var(--text-secondary)' }}>cannot</strong> press FINAL CONFIRM for you.<br />
          Only you can confirm your vote.
        </p>
      </div>
    </div>
  );
}

/* ── Small receipt row helper ─────────────────────────────── */
function ReceiptRow({ label, value, mono, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontWeight: 700,
        fontFamily: mono ? 'monospace' : 'inherit',
        color: accent ? 'var(--accent-400)' : 'var(--text-primary)',
        fontSize: mono ? '0.88rem' : '0.9rem',
        textAlign: 'right'
      }}>{value}</span>
    </div>
  );
}
