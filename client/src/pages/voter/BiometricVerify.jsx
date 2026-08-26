import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, CheckCircle, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { isWebAuthnSupported, authenticateBiometric } from '../../utils/webAuthn';
import { useAuth } from '../../context/AuthContext';

export default function BiometricVerify() {
  const [status, setStatus] = useState('idle'); // idle | verifying | success | failed | unsupported
  const [supported, setSupported] = useState(true);
  const { voter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isWebAuthnSupported()) {
      setStatus('unsupported');
      setSupported(false);
    }
  }, []);

  const handleBiometric = async () => {
    setStatus('verifying');
    try {
      const credentialId = voter?.webAuthnCredentialId || null;
      const verified = await authenticateBiometric(credentialId);

      if (verified) {
        setStatus('success');
        toast.success('Biometric verified successfully!');
        setTimeout(() => navigate('/voter/vote'), 1500);
      } else {
        setStatus('failed');
        toast.error('Biometric verification failed.');
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch (err) {
      setStatus('failed');
      toast.error(err.message || 'Verification failed.');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const skipForUnsupported = () => {
    toast('Biometric not available on this device. Proceeding...', { icon: '⚠️' });
    navigate('/voter/vote');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.1) 0%, transparent 60%), var(--bg-base)',
      padding: '2rem 1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Fingerprint size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Biometric Verification</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Step 2 of 2 — Verify with your device's fingerprint or face ID
          </p>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          {/* Fingerprint Animation */}
          <div style={{
            width: 120, height: 120,
            borderRadius: '50%',
            border: `3px solid ${status === 'success' ? 'var(--accent-500)' : status === 'failed' ? 'var(--danger-500)' : status === 'verifying' ? 'var(--primary-500)' : 'var(--border-hover)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            transition: 'all 0.3s ease',
            animation: status === 'verifying' ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
            boxShadow: status === 'verifying' ? '0 0 30px rgba(99,102,241,0.4)' : 'none'
          }}>
            {status === 'success' ? (
              <CheckCircle size={52} color="var(--accent-500)" />
            ) : status === 'failed' ? (
              <AlertCircle size={52} color="var(--danger-500)" />
            ) : (
              <Fingerprint size={52} color={status === 'verifying' ? 'var(--primary-400)' : 'var(--text-muted)'} />
            )}
          </div>

          <p style={{
            color: status === 'success' ? 'var(--accent-500)' : status === 'failed' ? 'var(--danger-500)' : 'var(--text-secondary)',
            fontWeight: 600,
            marginBottom: '1.5rem',
            fontSize: '1rem'
          }}>
            {status === 'idle' && 'Touch your fingerprint sensor or use Face ID'}
            {status === 'verifying' && 'Waiting for biometric confirmation...'}
            {status === 'success' && 'Biometric verified! Redirecting to vote...'}
            {status === 'failed' && 'Verification failed. Please try again.'}
            {status === 'unsupported' && 'Biometric not supported on this device'}
          </p>

          {status === 'unsupported' ? (
            <div>
              <div className="alert alert-warning" style={{ marginBottom: '1rem', textAlign: 'left', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <div>
                  WebAuthn is not supported on this device/browser. You can proceed without biometric verification for now.
                </div>
              </div>
              <button id="skip-biometric-btn" className="btn btn-outline btn-full" onClick={skipForUnsupported}>
                Proceed without Biometric <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <button
              id="verify-biometric-btn"
              className="btn btn-accent btn-full btn-lg"
              onClick={handleBiometric}
              disabled={status === 'verifying' || status === 'success'}
            >
              <Fingerprint size={18} />
              {status === 'verifying' ? 'Verifying...' : 'Verify with Biometric'}
            </button>
          )}
        </div>

        <div className="alert alert-info" style={{ marginTop: '1rem', fontSize: '0.82rem', textAlign: 'left' }}>
          Your fingerprint never leaves your device. WebAuthn uses the device's secure enclave only.
        </div>
      </div>
    </div>
  );
}
