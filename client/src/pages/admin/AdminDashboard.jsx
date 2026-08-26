import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Vote, Building2, BarChart3, TrendingUp, UserCheck, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setStats(res.data.stats))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Voters', value: stats.totalVoters, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Voted', value: stats.votersTurnout, icon: Vote, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Turnout', value: `${stats.turnoutPercent}%`, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Candidates', value: stats.totalCandidates, icon: UserCheck, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Elections', value: stats.totalElections, icon: Building2, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { label: 'Total Votes Cast', value: stats.totalVotes, icon: BarChart3, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ] : [];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <h2 style={{ marginBottom: '0.4rem' }}>Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Overview of the Hybrid Smart Voting System
        </p>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
            <div className="loader" /><span style={{ color: 'var(--text-muted)' }}>Loading stats...</span>
          </div>
        ) : (
          <>
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              {statCards.map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon" style={{ background: s.bg }}>
                    <s.icon size={26} color={s.color} />
                  </div>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Election */}
            {stats?.activeElection && (
              <div className="card" style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(10,10,15,0) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-500)', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Election</p>
                    <h4>{stats.activeElection.title}</h4>
                  </div>
                  <span className={`badge badge-${stats.activeElection.status}`} style={{ marginLeft: 'auto' }}>
                    {stats.activeElection.status.toUpperCase()}
                  </span>
                </div>

                {/* Turnout Bar */}
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Voter Turnout</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-400)' }}>{stats.turnoutPercent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${stats.turnoutPercent}%`, background: 'var(--gradient-accent)' }} />
                  </div>
                </div>
              </div>
            )}
            {/* Officer Audit CTA */}
            <div
              className="card"
              id="officer-audit-card"
              onClick={() => navigate('/admin/officer-audit')}
              style={{ cursor: 'pointer', border: '1px solid rgba(99,102,241,0.3)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'all var(--transition-base)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldAlert size={24} color="var(--primary-400)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Officer Audit Dashboard</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>View polling officer sessions, change rates, and flag suspicious behavior.</p>
              </div>
              <div style={{ fontSize: '1.2rem', color: 'var(--primary-400)' }}>→</div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
