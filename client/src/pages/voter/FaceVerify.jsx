/**
 * FaceVerify.jsx
 *
 * Three-step pipeline:
 *   1. Face Detection  — confirm a face is visible
 *   2. Liveness Checks — 3 random challenges (look left/right, blink, camera)
 *   3. Face Matching   — compare live descriptor to stored embedding
 *
 * NOTE: This provides basic anti-spoofing against static photos.
 * It is NOT a guarantee against all presentation attacks.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  loadFaceModels,
  detectFaceLandmarks,
  checkLivenessChallenge,
  getFaceDescriptor,
  compareFaces,
  pickChallenges,
} from '../../utils/faceRecognition';
import api from '../../api/axios';

/* ── Pipeline stages ─────────────────────────────────────── */
const STAGE = {
  LOADING:    'loading',     // models loading
  DETECTING:  'detecting',   // waiting for a clear face
  LIVENESS:   'liveness',    // challenge in progress
  MATCHING:   'matching',    // running face descriptor compare
  SUCCESS:    'success',     // match passed
  FAILED:     'failed',      // match failed
};

/* ── Challenge hold threshold (frames the pose must be held) ── */
const HOLD_FRAMES = 8; // ~1.6 seconds at 200ms polling

export default function FaceVerify() {
  /* ── refs ── */
  const videoRef      = useRef(null);
  const streamRef     = useRef(null);
  const pollRef       = useRef(null);
  const holdCountRef  = useRef(0);   // frames current challenge has been satisfied

  /* ── state ── */
  const [stage,            setStage]            = useState(STAGE.LOADING);
  const [challenges,       setChallenges]        = useState([]);
  const [challengeIdx,     setChallengeIdx]      = useState(0);
  const [completedIdxs,    setCompletedIdxs]     = useState([]);
  const [holdProgress,     setHoldProgress]      = useState(0);  // 0-100%
  const [faceDetected,     setFaceDetected]      = useState(false);
  const [confidence,       setConfidence]        = useState(0);
  const [attempts,         setAttempts]          = useState(0);
  const [matchError,       setMatchError]        = useState('');

  const navigate = useNavigate();

  /* ── Guard: election must be online + not already voted ── */
  useEffect(() => {
    api.get('/voter/election')
      .then(res => {
        if (res.data.hasVotedInThisElection) navigate('/voter/status');
        else if (res.data.election?.status !== 'online') navigate('/voter/dashboard');
      })
      .catch(() => navigate('/voter/dashboard'));
  }, [navigate]);

  /* ── Webcam ─────────────────────────────────────────────── */
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch {
      toast.error('Camera access denied. Please allow camera permission.');
    }
  }, []);

  /* ── Model loading ── */
  useEffect(() => {
    const init = async () => {
      await loadFaceModels();
      await startWebcam();
      const picked = pickChallenges(3);
      setChallenges(picked);
      setStage(STAGE.DETECTING);
    };
    init();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(pollRef.current);
    };
  }, [startWebcam]);

  /* ── Detection polling loop ─────────────────────────────── */
  useEffect(() => {
    clearInterval(pollRef.current);

    if (stage === STAGE.DETECTING) {
      pollRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        const result = await detectFaceLandmarks(videoRef.current);
        setFaceDetected(!!result);
        if (result) {
          // Face confirmed — move to liveness
          clearInterval(pollRef.current);
          setStage(STAGE.LIVENESS);
        }
      }, 300);
    }

    if (stage === STAGE.LIVENESS) {
      holdCountRef.current = 0;
      pollRef.current = setInterval(async () => {
        if (!videoRef.current || challengeIdx >= challenges.length) return;
        const result = await detectFaceLandmarks(videoRef.current);
        setFaceDetected(!!result);
        if (!result) {
          holdCountRef.current = 0;
          setHoldProgress(0);
          return;
        }

        const challenge = challenges[challengeIdx];
        const satisfied = checkLivenessChallenge(result.landmarks, challenge.type);

        if (satisfied) {
          holdCountRef.current += 1;
          setHoldProgress(Math.round((holdCountRef.current / HOLD_FRAMES) * 100));

          if (holdCountRef.current >= HOLD_FRAMES) {
            // Challenge complete
            holdCountRef.current = 0;
            setHoldProgress(0);
            setCompletedIdxs(prev => [...prev, challengeIdx]);

            const nextIdx = challengeIdx + 1;
            if (nextIdx >= challenges.length) {
              // All challenges done — move to face matching
              clearInterval(pollRef.current);
              setStage(STAGE.MATCHING);
            } else {
              setChallengeIdx(nextIdx);
            }
          }
        } else {
          // Reset hold if pose lost
          holdCountRef.current = Math.max(0, holdCountRef.current - 1);
          setHoldProgress(Math.round((holdCountRef.current / HOLD_FRAMES) * 100));
        }
      }, 200);
    }

    return () => clearInterval(pollRef.current);
  }, [stage, challengeIdx, challenges]);

  /* ── Face Matching (runs once when stage transitions to MATCHING) ── */
  useEffect(() => {
    if (stage !== STAGE.MATCHING) return;

    const runMatch = async () => {
      try {
        const { data } = await api.get('/voter/face-embedding');
        const storedDescriptor = data.embedding;

        const liveDescriptor = await getFaceDescriptor(videoRef.current);
        if (!liveDescriptor) {
          setMatchError('No face detected during matching. Please try again.');
          setAttempts(a => a + 1);
          setStage(STAGE.FAILED);
          return;
        }

        const result = compareFaces(liveDescriptor, storedDescriptor);
        setConfidence(result.confidence);

        if (result.match) {
          setStage(STAGE.SUCCESS);
          toast.success(`Identity verified! ${result.confidence}% confidence`);
          setTimeout(() => navigate('/voter/vote'), 1800);
        } else {
          setMatchError(`Face did not match (${result.confidence}% similarity). ${attempts >= 2 ? 'Please contact support.' : 'Try again.'}`);
          setAttempts(a => a + 1);
          setStage(STAGE.FAILED);
        }
      } catch {
        setMatchError('Verification error. Please try again.');
        setAttempts(a => a + 1);
        setStage(STAGE.FAILED);
      }
    };

    runMatch();
  }, [stage, navigate, attempts]);

  /* ── Retry — restart from liveness ── */
  const handleRetry = () => {
    if (attempts >= 3) return;
    const picked = pickChallenges(3);
    setChallenges(picked);
    setChallengeIdx(0);
    setCompletedIdxs([]);
    setHoldProgress(0);
    holdCountRef.current = 0;
    setMatchError('');
    setStage(STAGE.DETECTING);
  };

  /* ── UI helpers ── */
  const currentChallenge = challenges[challengeIdx];

  const stageLabel = {
    [STAGE.LOADING]:   { text: 'Loading models…',              color: 'var(--text-muted)',    ring: '' },
    [STAGE.DETECTING]: { text: 'Position your face in frame',  color: 'var(--primary-400)',   ring: 'scanning' },
    [STAGE.LIVENESS]:  { text: currentChallenge?.label || '',  color: 'var(--warning-400)',   ring: 'liveness' },
    [STAGE.MATCHING]:  { text: 'Matching identity…',           color: 'var(--primary-400)',   ring: 'scanning' },
    [STAGE.SUCCESS]:   { text: `Verified! ${confidence}% confidence`, color: 'var(--accent-500)', ring: 'success' },
    [STAGE.FAILED]:    { text: 'Verification failed',          color: 'var(--danger-400)',    ring: 'failed' },
  };
  const cfg = stageLabel[stage] || stageLabel[STAGE.LOADING];

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.12) 0%, transparent 60%), var(--bg-base)',
      padding: '2rem 1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>Identity Verification</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Face Detection → Liveness Check → Face Match
          </p>
        </div>

        {/* Pipeline steps indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: '1. Detect', active: [STAGE.DETECTING].includes(stage), done: ![STAGE.LOADING, STAGE.DETECTING].includes(stage) },
            { label: '2. Liveness', active: stage === STAGE.LIVENESS, done: [STAGE.MATCHING, STAGE.SUCCESS, STAGE.FAILED].includes(stage) },
            { label: '3. Match', active: stage === STAGE.MATCHING, done: stage === STAGE.SUCCESS },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '0.3rem 0.85rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700,
              background: s.done ? 'rgba(16,185,129,0.12)' : s.active ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
              border: `1px solid ${s.done ? 'rgba(16,185,129,0.35)' : s.active ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`,
              color: s.done ? 'var(--accent-400)' : s.active ? 'var(--primary-400)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}>
              {s.done ? <CheckCircle size={12} /> : null}
              {s.label}
            </div>
          ))}
        </div>

        {/* Camera card */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>

          {/* Webcam view */}
          <div className="webcam-container" style={{ marginBottom: '1.25rem', position: 'relative' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
            <div className="webcam-overlay">
              <div className={`face-ring ${cfg.ring}`} />
            </div>

            {/* Face detected indicator */}
            {stage !== STAGE.LOADING && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)',
                background: faceDetected ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.75)',
                fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                backdropFilter: 'blur(4px)'
              }}>
                {faceDetected ? '✓ Face detected' : '⚠ No face'}
              </div>
            )}
          </div>

          {/* Status text */}
          <p style={{ color: cfg.color, fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', minHeight: '1.5rem' }}>
            {stage === STAGE.SUCCESS && <CheckCircle size={18} style={{ display: 'inline', marginRight: 6 }} />}
            {stage === STAGE.FAILED  && <XCircle     size={18} style={{ display: 'inline', marginRight: 6 }} />}
            {cfg.text}
          </p>

          {/* ── LIVENESS CHALLENGE UI ── */}
          {stage === STAGE.LIVENESS && currentChallenge && (
            <div>
              {/* Challenge card */}
              <div style={{
                padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>{currentChallenge.emoji}</div>
                <p style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--warning-400)', marginBottom: '0.25rem' }}>
                  {currentChallenge.label}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{currentChallenge.hint}</p>
              </div>

              {/* Hold progress bar */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>Hold pose…</span>
                  <span>{holdProgress}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${holdProgress}%`,
                    background: holdProgress >= 100 ? 'var(--gradient-accent)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.2s ease'
                  }} />
                </div>
              </div>

              {/* Challenge progress dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {challenges.map((c, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                    background: completedIdxs.includes(i) ? 'rgba(16,185,129,0.15)' : i === challengeIdx ? 'rgba(245,158,11,0.15)' : 'var(--bg-surface)',
                    border: `2px solid ${completedIdxs.includes(i) ? 'var(--accent-500)' : i === challengeIdx ? 'var(--warning-400)' : 'var(--border-color)'}`,
                    color: completedIdxs.includes(i) ? 'var(--accent-400)' : i === challengeIdx ? 'var(--warning-400)' : 'var(--text-muted)',
                    transition: 'all 0.3s ease'
                  }}>
                    {completedIdxs.includes(i) ? '✓' : c.emoji}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MATCHING spinner ── */}
          {stage === STAGE.MATCHING && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.75rem' }}>
              <div className="loader" style={{ width: 20, height: 20 }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Comparing facial features…</span>
            </div>
          )}

          {/* ── LOADING spinner ── */}
          {stage === STAGE.LOADING && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
              <div className="loader" />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading face recognition models…</p>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {stage === STAGE.SUCCESS && (
            <div style={{ padding: '0.5rem 0' }}>
              <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div style={{ height: '100%', width: `${confidence}%`, background: 'var(--gradient-accent)', borderRadius: 'var(--radius-full)' }} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Redirecting to ballot…</p>
            </div>
          )}

          {/* ── FAILED ── */}
          {stage === STAGE.FAILED && (
            <div>
              {matchError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'left' }}>
                  <AlertCircle size={15} /> {matchError}
                </div>
              )}
              {attempts < 3 ? (
                <button id="retry-verify-btn" className="btn btn-primary btn-full" onClick={handleRetry}>
                  <RefreshCw size={16} /> Try Again (Attempt {attempts + 1}/3)
                </button>
              ) : (
                <div className="alert alert-error" style={{ fontSize: '0.85rem' }}>
                  <AlertCircle size={15} /> Too many failed attempts. Please contact the election office.
                </div>
              )}
            </div>
          )}

          {/* ── DETECTING — waiting for face ── */}
          {stage === STAGE.DETECTING && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Look directly at the camera. Move closer if needed.
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="alert alert-info" style={{ fontSize: '0.78rem', textAlign: 'left' }}>
          <Shield size={14} />
          <span>
            Liveness detection guards against static photo attacks.
            Face comparison runs locally in your browser — no images are sent to the server.
            <br />
            <em style={{ color: 'var(--text-muted)' }}>Note: Basic liveness does not prevent all presentation attacks.</em>
          </span>
        </div>
      </div>
    </div>
  );
}
