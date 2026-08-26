import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Trophy, Shield, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function PublicResults() {
  const [elections, setElections] = useState([]);
  const [selected, setSelected] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/results').then(r => { setElections(r.data.elections); if (r.data.elections.length) setSelected(r.data.elections[0]._id); }); }, []);
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get(`/results/${selected}`).then(r => setResults(r.data)).finally(() => setLoading(false));
  }, [selected]);

  const barData = results ? {
    labels: results.chartData.map(c => c.name),
    datasets: [{ label: 'Votes', data: results.chartData.map(c => c.votes), backgroundColor: ['rgba(99,102,241,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)', 'rgba(168,85,247,0.8)'], borderRadius: 8 }]
  } : null;

  const pieData = results ? {
    labels: ['Online Votes', 'Offline Votes'],
    datasets: [{ data: [results.onlineVotes, results.offlineVotes], backgroundColor: ['rgba(99,102,241,0.8)', 'rgba(16,185,129,0.8)'], borderWidth: 3, borderColor: ['#0a0a0f', '#0a0a0f'] }]
  } : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Votexa</span>
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /> Back</Link>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Election Results</h1>
          <p style={{ color: 'var(--text-muted)' }}>Official results for completed elections</p>
        </div>

        {elections.length === 0 && !loading && (
          <div className="alert alert-info" style={{ textAlign: 'center', maxWidth: 400, margin: '3rem auto' }}>
            No completed elections yet. Results will appear here after the election ends.
          </div>
        )}

        {elections.length > 0 && (
          <div className="form-group" style={{ maxWidth: 400, margin: '0 auto 2rem' }}>
            <select id="public-election-select" className="form-input form-select" value={selected} onChange={e => setSelected(e.target.value)}>
              {elections.map(el => <option key={el._id} value={el._id}>{el.title}</option>)}
            </select>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ margin: '0 auto' }} /></div>}

        {results && !loading && (
          <div className="animate-fade-in">
            {/* Summary */}
            <div className="grid-4" style={{ marginBottom: '2rem' }}>
              {[
                { label: 'Total Votes', value: results.totalVotes, color: '#6366f1' },
                { label: 'Online', value: results.onlineVotes, color: '#10b981' },
                { label: 'Offline', value: results.offlineVotes, color: '#f59e0b' },
                { label: 'Turnout', value: `${results.turnoutPercent}%`, color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {results.winner && (
              <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(239,68,68,0.06) 100%)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <Trophy size={40} color="#f59e0b" />
                <div>
                  <p style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎉 Winner</p>
                  <h3>{results.winner.name}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{results.winner.party} — {results.winner.voteCount} votes ({results.chartData[0]?.percentage}%)</p>
                </div>
                <img src={results.winner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(results.winner.name)}&background=f59e0b&color=fff&size=200`}
                  alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginLeft: 'auto', border: '3px solid rgba(245,158,11,0.4)' }} />
              </div>
            )}

            <div className="grid-2" style={{ marginBottom: '2rem' }}>
              <div className="card">
                <h4 style={{ marginBottom: '1rem' }}>Votes by Candidate</h4>
                {barData && <Bar data={barData} options={{ plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(99,102,241,0.08)' } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(99,102,241,0.08)' } } } }} />}
              </div>
              <div className="card">
                <h4 style={{ marginBottom: '1rem' }}>Online vs Offline</h4>
                {pieData && <Pie data={pieData} options={{ plugins: { legend: { labels: { color: '#94a3b8' } } } }} />}
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Candidate</th><th>Party</th><th>Votes</th><th>%</th><th>Bar</th></tr></thead>
                <tbody>
                  {results.chartData.map((c, i) => (
                    <tr key={c.id}>
                      <td><strong style={{ color: i === 0 ? '#f59e0b' : 'var(--text-muted)' }}>{i + 1}{i === 0 ? ' 🏆' : ''}</strong></td>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong></td>
                      <td>{c.party}</td>
                      <td><strong style={{ color: 'var(--primary-400)' }}>{c.votes}</strong></td>
                      <td>{c.percentage}%</td>
                      <td style={{ width: 160 }}><div className="progress-bar"><div className="progress-fill" style={{ width: `${c.percentage}%` }} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
