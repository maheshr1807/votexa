import { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Download, Trophy, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const chartDefaults = {
  plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } } },
  scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(99,102,241,0.08)' } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(99,102,241,0.08)' } } }
};

export default function AdminResults() {
  const [elections, setElections] = useState([]);
  const [selected, setSelected] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/admin/elections').then(r => setElections(r.data.elections)); }, []);

  const loadResults = async (electionId) => {
    if (!electionId) return;
    setLoading(true);
    try {
      const res = await api.get(`/results/${electionId}`);
      setResults(res.data);
    } catch { toast.error('Could not load results.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selected) loadResults(selected); }, [selected]);

  const exportPDF = () => {
    if (!results) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(results.election.title, 14, 20);
    doc.setFontSize(11);
    doc.text(`Total Votes: ${results.totalVotes} | Turnout: ${results.turnoutPercent}%`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [['Rank', 'Candidate', 'Party', 'Votes', 'Percentage']],
      body: results.chartData.map((c, i) => [i + 1, c.name, c.party, c.votes, `${c.percentage}%`]),
      styles: { fillColor: [79, 70, 229] },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 }
    });
    doc.save(`${results.election.title}_results.pdf`);
    toast.success('PDF downloaded!');
  };

  const exportExcel = () => {
    if (!results) return;
    const ws = XLSX.utils.json_to_sheet(results.chartData.map((c, i) => ({
      Rank: i + 1, Candidate: c.name, Party: c.party, Votes: c.votes, Percentage: `${c.percentage}%`
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, `${results.election.title}_results.xlsx`);
    toast.success('Excel downloaded!');
  };

  const barData = results ? {
    labels: results.chartData.map(c => c.name),
    datasets: [{
      label: 'Votes',
      data: results.chartData.map(c => c.votes),
      backgroundColor: ['rgba(99,102,241,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)', 'rgba(168,85,247,0.7)'],
      borderRadius: 8
    }]
  } : null;

  const pieData = results ? {
    labels: ['Online Votes', 'Offline Votes'],
    datasets: [{
      data: [results.onlineVotes, results.offlineVotes],
      backgroundColor: ['rgba(99,102,241,0.8)', 'rgba(16,185,129,0.8)'],
      borderColor: ['var(--bg-card)', 'var(--bg-card)'],
      borderWidth: 3
    }]
  } : null;

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Election Results</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {results && <>
              <button id="export-pdf-btn" className="btn btn-outline btn-sm" onClick={exportPDF}><Download size={15} /> PDF</button>
              <button id="export-excel-btn" className="btn btn-outline btn-sm" onClick={exportExcel}><Download size={15} /> Excel</button>
            </>}
          </div>
        </div>

        <div className="form-group" style={{ maxWidth: 400, marginBottom: '2rem' }}>
          <label className="form-label">Select Election</label>
          <select id="results-election-select" className="form-input form-select" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Choose an election...</option>
            {elections.map(el => <option key={el._id} value={el._id}>{el.title} ({el.status})</option>)}
          </select>
        </div>

        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><div className="loader" /><span style={{ color: 'var(--text-muted)' }}>Loading results...</span></div>}

        {results && !loading && (
          <div className="animate-fade-in">
            {/* Summary Cards */}
            <div className="grid-4" style={{ marginBottom: '2rem' }}>
              {[
                { label: 'Total Votes', value: results.totalVotes, color: '#6366f1' },
                { label: 'Online Votes', value: results.onlineVotes, color: '#10b981' },
                { label: 'Offline Votes', value: results.offlineVotes, color: '#f59e0b' },
                { label: 'Voter Turnout', value: `${results.turnoutPercent}%`, color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Winner Banner */}
            {results.winner && (
              <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.08) 100%)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <Trophy size={40} color="#f59e0b" />
                <div>
                  <p style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Winner</p>
                  <h3>{results.winner.name}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{results.winner.party} — {results.winner.voteCount} votes</p>
                </div>
                <img src={results.winner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(results.winner.name)}&background=f59e0b&color=fff&size=200`}
                  alt={results.winner.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginLeft: 'auto', border: '3px solid rgba(245,158,11,0.4)' }} />
              </div>
            )}

            {/* Charts */}
            <div className="grid-2">
              <div className="card">
                <h4 style={{ marginBottom: '1rem' }}>Votes by Candidate</h4>
                {barData && <Bar data={barData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />}
              </div>
              <div className="card">
                <h4 style={{ marginBottom: '1rem' }}>Online vs Offline</h4>
                {pieData && <Pie data={pieData} options={{ plugins: { legend: { labels: { color: '#94a3b8' } } } }} />}
              </div>
            </div>

            {/* Detailed Table */}
            <div className="table-wrapper" style={{ marginTop: '2rem' }}>
              <table>
                <thead>
                  <tr><th>#</th><th>Candidate</th><th>Party</th><th>Votes</th><th>Percentage</th><th>Progress</th></tr>
                </thead>
                <tbody>
                  {results.chartData.map((c, i) => (
                    <tr key={c.id}>
                      <td><strong style={{ color: i === 0 ? '#f59e0b' : 'var(--text-muted)' }}>{i + 1}</strong></td>
                      <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span></td>
                      <td>{c.party}</td>
                      <td><strong style={{ color: 'var(--primary-400)' }}>{c.votes}</strong></td>
                      <td>{c.percentage}%</td>
                      <td style={{ width: 150 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${c.percentage}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!results && !loading && selected && (
          <div className="alert alert-info">Loading results for selected election...</div>
        )}
      </div>
    </AdminLayout>
  );
}
