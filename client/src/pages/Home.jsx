import { Link } from 'react-router-dom';
import { Shield, Fingerprint, Camera, BarChart3, Users, Lock, CheckCircle, ArrowRight, Vote, Eye, MousePointer, AlertTriangle, LogIn, UserCheck, List } from 'lucide-react';

const features = [
  { icon: Camera,      title: 'Face Recognition',  desc: 'AI-powered face verification using deep learning models — runs entirely in your browser.', color: '#6366f1' },
  { icon: Fingerprint, title: 'Liveness Detection', desc: 'Random challenge prompts (look left, blink, etc.) defend against photo/video spoofing.', color: '#8b5cf6' },
  { icon: Shield,      title: 'AES-256 Encryption', desc: 'All biometric data is encrypted before storage. Your privacy is our priority.', color: '#a855f7' },
  { icon: Lock,        title: 'SHA-256 Integrity',  desc: 'Every vote gets a cryptographic hash to ensure tamper-proof records.', color: '#10b981' },
  { icon: Vote,        title: 'Hybrid Voting',      desc: 'Vote online from home (Days 1–3) or in-person at government offices (Days 4–6).', color: '#f59e0b' },
  { icon: BarChart3,   title: 'Live Results',       desc: 'Real-time results dashboard with interactive charts and exportable reports.', color: '#ef4444' },
];

/* ── 6-step voting guide ── */
const voteSteps = [
  {
    num: '01', emoji: '🔐',
    title: 'Login / Register',
    desc: 'Enter your Voter ID and login to your secure voter account.',
    detail: 'New voter? Complete registration with your photo and face scan first.',
    color: '#6366f1', glow: 'rgba(99,102,241,0.3)'
  },
  {
    num: '02', emoji: '👤',
    title: 'Verify Your Identity',
    desc: 'Complete the required security verification steps.',
    detail: 'Voter ID check → Face liveness detection → Face matching.',
    color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)'
  },
  {
    num: '03', emoji: '🗳️',
    title: 'View Candidates',
    desc: 'After successful verification, view all candidates in the election.',
    detail: 'Candidate name, party name, and symbol are displayed.',
    color: '#a855f7', glow: 'rgba(168,85,247,0.3)'
  },
  {
    num: '04', emoji: '☑️',
    title: 'Select Your Candidate',
    desc: 'Choose the candidate you want to vote for.',
    detail: 'Carefully check the name, party, and symbol before continuing.',
    color: '#06b6d4', glow: 'rgba(6,182,212,0.3)'
  },
  {
    num: '05', emoji: '👀',
    title: 'Review & Change',
    desc: 'Your selected candidate is shown on the confirmation screen.',
    detail: 'Press "Change Vote" if your selection is incorrect.',
    color: '#f59e0b', glow: 'rgba(245,158,11,0.3)'
  },
  {
    num: '06', emoji: '✅',
    title: 'Final Confirmation',
    desc: 'Click "Final Confirm" to lock your vote permanently.',
    detail: 'Once confirmed, your vote cannot be changed. You will receive a digital receipt.',
    color: '#10b981', glow: 'rgba(16,185,129,0.3)'
  },
];

/* ── Flow bar items ── */
const flowItems = [
  { emoji: '🔐', label: 'Login' },
  { emoji: '👤', label: 'Verify' },
  { emoji: '🗳️', label: 'Select' },
  { emoji: '👀', label: 'Review' },
  { emoji: '✅', label: 'Confirm' },
];

/* ── Security rules ── */
const securityRules = [
  { icon: Shield,      text: 'Vote only from a trusted device and secure internet connection.' },
  { icon: Lock,        text: 'Never share your Voter ID, password, OTP, or passkey with anyone.' },
  { icon: Users,       text: 'Do not allow another person to cast your vote for you.' },
  { icon: Eye,         text: 'Carefully verify your candidate before pressing Final Confirm.' },
  { icon: CheckCircle, text: 'One voter can cast only one vote per election.' },
  { icon: AlertTriangle, text: 'If you voted online, you cannot vote again via the offline system.' },
];

/* ── Login portals ── */
const portals = [
  {
    id: 'voter-login-btn', icon: Vote,
    title: 'Voter Portal',
    desc: 'Registered voters — log in with your Voter ID to cast your ballot securely.',
    to: '/login', label: 'Voter Login',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    glow: 'rgba(99,102,241,0.35)', border: 'rgba(99,102,241,0.4)', bg: 'rgba(99,102,241,0.08)',
  },
  {
    id: 'officer-login-btn', icon: Users,
    title: 'Officer Portal',
    desc: 'Polling officers — access the offline voting booth management system.',
    to: '/officer/login', label: 'Officer Login',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    glow: 'rgba(16,185,129,0.35)', border: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.08)',
  },
  {
    id: 'admin-login-btn', icon: Shield,
    title: 'Admin Portal',
    desc: 'System administrators — manage elections, candidates, and officers.',
    to: '/admin/login', label: 'Admin Login',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    glow: 'rgba(245,158,11,0.35)', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.08)',
  },
];

/* ── Shared section heading ── */
function SectionHeading({ badge, badgeColor = 'badge-upcoming', title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
      <span className={`badge ${badgeColor}`} style={{ marginBottom: '1rem' }}>{badge}</span>
      <h2 style={{ marginBottom: '0.75rem' }}>{title}</h2>
      {subtitle && <p style={{ maxWidth: 540, margin: '0 auto', color: 'var(--text-muted)', lineHeight: 1.7 }}>{subtitle}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <div className="page" style={{ background: 'var(--bg-base)' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>
            Votexa
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Link to="/results" style={{ color: 'var(--text-secondary)', fontWeight: 500, marginRight: '0.5rem' }}>Results</Link>
          <Link to="/login" className="btn btn-outline btn-sm" id="nav-voter-login"><Vote size={14} /> Voter</Link>
          <Link to="/officer/login" className="btn btn-sm" id="nav-officer-login" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981' }}>
            <Users size={14} /> Officer
          </Link>
          <Link to="/admin/login" className="btn btn-primary btn-sm" id="nav-admin-login"><Shield size={14} /> Admin</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '80px',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.1) 0%, transparent 60%), var(--bg-base)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'rgba(99,102,241,0.06)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, background: 'rgba(168,85,247,0.08)', borderRadius: '50%', filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite reverse' }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="badge badge-online" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              🔒 Secured with AES-256 + SHA-256
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            background: 'linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 50%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem', lineHeight: 1.1
          }}>
            The Future of<br />Democratic Voting
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            A hybrid smart voting system with AI face recognition, liveness detection,
            and cryptographic vote integrity — making elections secure, accessible, and transparent.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Link to="/login" className="btn btn-primary btn-lg" id="get-started-btn">
              <Vote size={18} /> Start Online Voting <ArrowRight size={18} />
            </Link>
            <Link to="/results" className="btn btn-outline btn-lg">
              <BarChart3 size={18} /> View Results
            </Link>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>
            New voter? <Link to="/register" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Register here →</Link>
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { value: '256-bit', label: 'Encryption' },
              { value: '3-Layer', label: 'Verification' },
              { value: 'Liveness', label: 'Anti-Spoofing' },
              { value: '0', label: 'Data Breaches' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-400)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Login Portals ── */}
      <section style={{ padding: '6rem 0', background: 'linear-gradient(180deg, var(--bg-base) 0%, var(--bg-surface) 100%)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <SectionHeading badge="Access Portals" badgeColor="badge-online" title="Choose Your Login Portal" subtitle="Select the portal that matches your role to access the system." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
            {portals.map((portal) => (
              <div key={portal.id}
                style={{ background: portal.bg, border: `1px solid ${portal.border}`, borderRadius: 'var(--radius-xl)', padding: '2rem', textAlign: 'center', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${portal.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 64, height: 64, borderRadius: 18, background: portal.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: `0 8px 24px ${portal.glow}` }}>
                  <portal.icon size={30} color="white" />
                </div>
                <h3 style={{ marginBottom: '0.6rem', fontSize: '1.2rem' }}>{portal.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.75rem' }}>{portal.desc}</p>
                <Link to={portal.to} id={portal.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.75rem', borderRadius: 'var(--radius-lg)', background: portal.gradient, color: 'white', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', boxShadow: `0 4px 16px ${portal.glow}`, transition: 'opacity 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  {portal.label} <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW TO VOTE ONLINE — Main Guide Section
      ══════════════════════════════════════════════════════ */}
      <section id="how-to-vote" style={{ padding: '6rem 0', background: 'var(--bg-base)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <SectionHeading
            badge="🗳️ Voting Guide"
            badgeColor="badge-online"
            title="How to Vote Online"
            subtitle="Follow these 6 simple steps to cast your vote securely from anywhere."
          />

          {/* ── Visual Flow Bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 0, marginBottom: '3.5rem', flexWrap: 'wrap', rowGap: '0.75rem'
          }}>
            {flowItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                  padding: '0.75rem 1.1rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  minWidth: 72, transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                </div>
                {i < flowItems.length - 1 && (
                  <div style={{ width: 28, height: 2, background: 'linear-gradient(90deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))', margin: '0 4px', flexShrink: 0, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-400)', fontSize: '0.7rem' }}>›</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── 6-step cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '4rem' }}>
            {voteSteps.map((s, i) => (
              <div key={i} className="card" style={{ position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${s.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                {/* Coloured accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, transparent)`, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', paddingTop: '0.5rem' }}>
                  {/* Step number + emoji */}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: `${s.color}18`, border: `1.5px solid ${s.color}44`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2
                    }}>
                      <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{s.emoji}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', fontWeight: 800, color: s.color, letterSpacing: '0.05em' }}>STEP {s.num}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '0.35rem', fontSize: '1rem', color: 'var(--text-primary)' }}>{s.title}</h4>
                    <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.4rem' }}>{s.desc}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>{s.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Important Reminder Box ── */}
          <div style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            maxWidth: 700, margin: '0 auto 4rem', textAlign: 'center', justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger-400)', margin: 0 }}>
              Your vote is your choice. Verify your selection carefully before pressing Final Confirm.
            </p>
          </div>

          {/* ── Security Instructions ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(99,102,241,0.04) 100%)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 'var(--radius-xl)', padding: '2.5rem',
            maxWidth: 860, margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <h3 style={{ marginTop: '0.5rem', color: 'var(--text-primary)' }}>Important Security Instructions</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {securityRules.map((rule, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <rule.icon size={15} color="var(--accent-400)" />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{rule.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA inside section ── */}
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/login" className="btn btn-primary btn-lg" id="how-to-vote-start-btn" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
              <Vote size={20} /> Start Online Voting <ArrowRight size={18} />
            </Link>
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Not registered yet? <Link to="/register" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Create your voter account →</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Security Features ── */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <SectionHeading badge="Security Features" title="Built with Multi-Layer Security" subtitle="Every aspect of the voting process is protected by industry-grade cryptographic algorithms." />
          <div className="grid-3">
            {features.map((feat, i) => (
              <div key={i} className="card" style={{ '--hover-color': feat.color, animationDelay: `${i * 0.1}s` }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${feat.color}22`, border: `1px solid ${feat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <feat.icon size={24} color={feat.color} />
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>{feat.title}</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '6rem 0', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.08) 100%)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Ready to Vote Securely?</h2>
          <p style={{ marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem', color: 'var(--text-muted)' }}>
            Register now and participate in the future of democratic elections.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary btn-lg"><Users size={18} /> Register as Voter</Link>
            <Link to="/results" className="btn btn-ghost btn-lg"><BarChart3 size={18} /> View Results</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
        <p>© 2024 Votexa — Hybrid Smart Voting System | Built with React + Node.js + face-api.js</p>
      </footer>
    </div>
  );
}
