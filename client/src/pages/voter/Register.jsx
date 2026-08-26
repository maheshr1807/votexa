import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Mail, Phone, Calendar, MapPin, Camera, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { loadFaceModels, getFaceDescriptor, descriptorToArray } from '../../utils/faceRecognition';

const STEPS = ['Personal Info', 'Address', 'Capture Face', 'Verify & Submit'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [captureStatus, setCaptureStatus] = useState('idle'); // idle | scanning | success | failed
  const [modelsReady, setModelsReady] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', voterId: '',
    dob: '', street: '', city: '', state: '', pincode: ''
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Load face models when reaching step 2
  useEffect(() => {
    if (step === 2) {
      loadFaceModels().then(() => setModelsReady(true)).catch(console.error);
    }
  }, [step]);

  // Start webcam
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      toast.error('Could not access webcam. Please allow camera permission.');
    }
  }, []);

  useEffect(() => {
    if (step === 2 && modelsReady) startWebcam();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [step, modelsReady, startWebcam]);

  const captureFace = async () => {
    if (!videoRef.current || !modelsReady) return;
    setCaptureStatus('scanning');
    try {
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) {
        setCaptureStatus('failed');
        toast.error('No face detected. Please look directly at the camera.');
        return;
      }
      setFaceDescriptor(descriptorToArray(descriptor));
      setCaptureStatus('success');
      toast.success('Face captured successfully!');

      // Also capture a photo snapshot for storage
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      canvas.toBlob(blob => setPhotoFile(new File([blob], 'voter_photo.jpg', { type: 'image/jpeg' })));
    } catch {
      setCaptureStatus('failed');
      toast.error('Face capture failed. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!faceDescriptor) {
      toast.error('Please capture your face first.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('faceEmbedding', JSON.stringify(faceDescriptor));
      if (photoFile) formData.append('photo', photoFile);

      const res = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      login(res.data.token, res.data.user, res.data.voter);
      toast.success('Registration successful!');
      navigate('/voter/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.1) 0%, transparent 60%), var(--bg-base)',
      padding: '2rem 1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>Votexa</span>
          </Link>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Create Voter Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Register to participate in elections</p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator" style={{ marginBottom: '2rem' }}>
          {STEPS.map((s, i) => (
            <div key={i} className="step" style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {i > 0 && <div className={`step-connector ${i <= step ? 'completed' : ''}`} />}
                  <div className={`step-number ${i < step ? 'completed' : i === step ? 'active' : 'inactive'}`}>
                    {i < step ? <CheckCircle size={18} /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? 'completed' : ''}`} />}
                </div>
                <span className={`step-label ${i === step ? 'active' : ''}`} style={{ fontSize: '0.72rem', textAlign: 'center' }}>{s}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="animate-fade-in">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input id="reg-name" name="name" className="form-input" placeholder="Enter your full name" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Voter ID</label>
                <input id="reg-voter-id" name="voterId" className="form-input" placeholder="e.g. ABC1234567" value={form.voterId} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input id="reg-dob" name="dob" type="date" className="form-input" value={form.dob} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input id="reg-email" name="email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input id="reg-mobile" name="mobile" className="form-input" placeholder="+91 98765 43210" value={form.mobile} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="reg-password" name="password" type={showPass ? 'text' : 'password'} className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} style={{ paddingRight: '3rem' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Address */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input id="reg-street" name="street" className="form-input" placeholder="House no., Street name" value={form.street} onChange={handleChange} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input id="reg-city" name="city" className="form-input" placeholder="City" value={form.city} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input id="reg-state" name="state" className="form-input" placeholder="State" value={form.state} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input id="reg-pincode" name="pincode" className="form-input" placeholder="6-digit PIN code" value={form.pincode} onChange={handleChange} />
              </div>
            </div>
          )}

          {/* Step 2: Face Capture */}
          {step === 2 && (
            <div className="animate-fade-in" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Look directly at the camera. Make sure your face is well-lit and clearly visible.
              </p>
              {!modelsReady ? (
                <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div className="loader" />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading face recognition models...</p>
                </div>
              ) : (
                <>
                  <div className="webcam-container" style={{ marginBottom: '1.5rem' }}>
                    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 'var(--radius-xl)' }} />
                    <div className="webcam-overlay">
                      <div className={`face-ring ${captureStatus === 'scanning' ? 'scanning' : captureStatus === 'success' ? 'success' : captureStatus === 'failed' ? 'failed' : ''}`} />
                    </div>
                  </div>
                  {captureStatus === 'success' ? (
                    <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                      <CheckCircle size={18} /> Face captured successfully! You can proceed.
                    </div>
                  ) : (
                    <button id="capture-face-btn" className="btn btn-primary btn-full" onClick={captureFace} disabled={captureStatus === 'scanning'}>
                      <Camera size={18} /> {captureStatus === 'scanning' ? 'Scanning...' : 'Capture Face'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Registration Summary</h4>
                {[
                  ['Full Name', form.name],
                  ['Voter ID', form.voterId],
                  ['Email', form.email],
                  ['Mobile', form.mobile],
                  ['Date of Birth', form.dob],
                  ['City', `${form.city}, ${form.state}`],
                  ['Face Data', faceDescriptor ? '✅ Captured' : '❌ Not captured']
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="alert alert-info" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                Your face data is encrypted with AES-256 before being stored. It never leaves our secure servers.
              </div>
              <button id="submit-registration-btn" className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            {step > 0 && (
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {step < 3 && (
              <button id={`next-step-${step}-btn`} className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(s => s + 1)}>
                Next <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already registered? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
