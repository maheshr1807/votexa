import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Camera, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { loadFaceModels, getFaceDescriptor, compareFaces } from '../../utils/faceRecognition';

export default function SearchVoter() {
  const [voterId, setVoterId] = useState('');
  const [voter, setVoter] = useState(null);
  const [searching, setSearching] = useState(false);
  const [faceStatus, setFaceStatus] = useState('idle'); // idle | scanning | success | failed
  const [modelsReady, setModelsReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { loadFaceModels().then(() => setModelsReady(true)); }, []);

  const searchVoter = async () => {
    if (!voterId.trim()) { toast.error('Enter a Voter ID.'); return; }
    setSearching(true);
    setVoter(null);
    setFaceStatus('idle');
    try {
      const res = await api.get(`/officer/search/${voterId.trim()}`);
      setVoter(res.data.voter);
      if (res.data.voter.hasVoted) toast.error(`This voter has already voted (${res.data.voter.voteMode}).`);
      else await startWebcam();
    } catch { toast.error('Voter not found.'); }
    finally { setSearching(false); }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; }
    } catch { toast.error('Camera access denied.'); }
  };

  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  const verifyFace = async () => {
    if (!voter || !videoRef.current || !modelsReady) return;
    setFaceStatus('scanning');
    try {
      const { data } = await api.get(`/officer/face/${voter.voterId}`);
      const liveDesc = await getFaceDescriptor(videoRef.current);
      if (!liveDesc) { setFaceStatus('failed'); toast.error('No face detected.'); return; }
      const result = compareFaces(liveDesc, data.embedding);
      if (result.match) {
        setFaceStatus('success');
        toast.success(`Face matched! (${result.confidence}%) Redirecting to vote...`);
        setTimeout(() => {
          streamRef.current?.getTracks().forEach(t => t.stop());
          navigate('/officer/cast-vote', { state: { voter } });
        }, 1500);
      } else {
        setFaceStatus('failed');
        toast.error(`Face mismatch (${result.confidence}%). Cannot proceed.`);
        setTimeout(() => setFaceStatus('idle'), 2000);
      }
    } catch { setFaceStatus('failed'); toast.error('Verification error.'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ marginBottom: '0.4rem' }}>Search Voter</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Enter the voter's ID to search and verify their identity.</p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input id="search-voter-id" className="form-input" placeholder="Enter Voter ID (e.g. ABC1234567)"
            value={voterId} onChange={e => setVoterId(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && searchVoter()} style={{ flex: 1 }} />
          <button id="search-btn" className="btn btn-primary" onClick={searchVoter} disabled={searching}>
            <Search size={18} /> {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {voter && (
          <div className="animate-fade-in">
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={voter.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(voter.name)}&background=4f46e5&color=fff&size=200`}
                  alt={voter.name} style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--border-color)', objectFit: 'cover' }} />
                <div>
                  <h4>{voter.name}</h4>
                  <p style={{ color: 'var(--primary-400)', fontFamily: 'monospace', fontWeight: 600 }}>{voter.voterId}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{voter.address?.city}, {voter.address?.state}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {voter.hasVoted
                    ? <span className="badge badge-danger"><XCircle size={14} /> Already Voted</span>
                    : <span className="badge badge-success"><CheckCircle size={14} /> Eligible</span>
                  }
                </div>
              </div>
            </div>

            {!voter.hasVoted && (
              <>
                <div className="webcam-container" style={{ marginBottom: '1.5rem', maxWidth: 360 }}>
                  <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%' }} />
                  <div className="webcam-overlay">
                    <div className={`face-ring ${faceStatus === 'scanning' ? 'scanning' : faceStatus === 'success' ? 'success' : faceStatus === 'failed' ? 'failed' : ''}`} />
                  </div>
                </div>
                <button id="officer-verify-face-btn" className="btn btn-primary btn-lg btn-full" onClick={verifyFace}
                  disabled={faceStatus === 'scanning' || faceStatus === 'success'}>
                  <Camera size={18} />
                  {faceStatus === 'scanning' ? 'Verifying...' : faceStatus === 'success' ? 'Verified!' : 'Verify Face'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
