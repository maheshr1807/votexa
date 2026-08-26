import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, RefreshCw, User } from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

/* ── Action label map ─────────────────────────────────────── */
const ACTION_LABELS = {
  session_started:       { icon: '🟢', text: 'Session started' },
  candidate_selected:    { icon: '📋', text: 'Candidate selected' },
  voter_requested_change:{ icon: '🔄', text: 'Voter requested change' },
  candidate_reselected:  { icon: '📋', text: 'Candidate re-selected' },
  voter_confirmed:       { icon: '✅', text: 'Voter confirmed — VOTE LOCKED' }
};

const STATUS_COLORS = {
  voter_confirmed: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: '#10b981', label: 'Confirmed' },
  abandoned:       { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)',   text: '#ef4444', label: 'Abandoned' },
  pending_selection: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b', label: 'In Progress' },
  candidate_sent:  { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.2)', text: '#818cf8', label: 'Awaiting Voter' },
  change_requested:{ bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b', label: 'Change Requested' },
};

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

/* ── Session Timeline ─────────────────────────────────────── */
function SessionTimeline({ session }) {
  const sc = STATUS_COLORS[session.status] || STATUS_COLORS.pending_selection;
  return (
    <div style={{
      marginBottom: '1rem',
      border: `1px solid ${sc.border}`,
      borderRadius: 'var(--radius-md)',
      background: sc.bg,
      overflow: 'hidden'
    }}>
      {/* Session header */}
      <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: `1px solid ${sc.border}` }}>
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
            {session.voterName}
          </span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
            ({session.voterIdStr})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {session.changeCount > 0 && (
            <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(245,158,11,0.15)', color: 'var(--warning-400)', fontSize: '0.7rem', fontWeight: 700 }}>
              🔄 {session.changeCount} change{session.changeCount > 1 ? 's' : ''}
            </span>
          )}
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontSize: '0.7rem', fontWeight: 700 }}>
            {sc.label}
          </span>
          {session.receiptId && (
            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-400)', fontWeight: 700 }}>
              {session.receiptId}
            </span>
          )}
        </div>
      </div>

      {/* Events timeline */}
      <div style={{ padding: '0.75rem 1rem' }}>
        {session.events.map((ev, i) => {
          const a = ACTION_LABELS[ev.action] || { icon: '•', text: ev.action };
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: i < session.events.length - 1 ? '0.6rem' : 0 }}>
              <div style={{ width: 24, textAlign: 'center', flexShrink: 0, fontSize: '0.85rem' }}>{a.icon}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{a.text}</span>
                {ev.candidateName && (
                  <span style={{ marginLeft: '0.35rem', fontSize: '0.8rem', color: 'var(--primary-400)', fontWeight: 600 }}>
                    → {ev.candidateName} ({ev.partyName})
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Officer Row ─────────────────────────────────────────── */
function OfficerRow({ officer }) {
  const [expanded, setExpanded] = useState(false);
  const isFlagged = officer.flagged;

  return (
    <div style={{
      border: `1px solid ${isFlagged ? 'rgba(239,68,68,0.4)' : 'var(--border-color)'}`,
      borderRadius: 'var(--radius-lg)',
      marginBottom: '0.75rem',
      overflow: 'hidden',
      background: isFlagged ? 'rgba(239,68,68,0.03)' : 'var(--bg-card)'
    }}>
      {/* Officer summary row */}
      <div
        style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flexWrap: 'wrap' }}
        onClick={() => setExpanded(e => !e)}>

        {/* Icon */}
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: isFlagged ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isFlagged ? <AlertTriangle size={18} color="var(--danger-400)" /> : <User size={18} color="var(--primary-400)" />}
        </div>

        {/* Name / email */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {officer.officerName}
            {isFlagged && (
              <span style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.15)', color: 'var(--danger-400)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                ⚠ HIGH CHANGE RATE
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{officer.officerEmail}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Sessions', value: officer.totalSessions, color: 'var(--text-primary)' },
            { label: 'Confirmed', value: officer.confirmedVotes, color: 'var(--accent-400)' },
            { label: 'Changes', value: officer.totalChanges, color: officer.totalChanges > 0 ? 'var(--warning-400)' : 'var(--text-muted)' },
            {
              label: 'Change Rate',
              value: `${officer.changeRate}%`,
              color: officer.changeRate > 15 ? 'var(--danger-400)' : officer.changeRate > 8 ? 'var(--warning-400)' : 'var(--accent-400)'
            },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', minWidth: 50 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Expand chevron */}
        <div style={{ color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Sessions list */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '1rem 1.25rem', background: 'rgba(0,0,0,0.15)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
            Session Audit Log ({officer.sessions.length} sessions)
          </p>
          {officer.sessions.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No sessions recorded.</p>
            : officer.sessions.map((s, i) => <SessionTimeline key={i} session={s} />)
          }
        </div>
      )}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function OfficerAudit() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | flagged | ok

  const load = () => {
    setLoading(true);
    api.get('/admin/officer-audit')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const officers = data?.officers || [];
  const flaggedCount = officers.filter(o => o.flagged).length;

  const filtered = officers.filter(o => {
    if (filter === 'flagged') return o.flagged;
    if (filter === 'ok') return !o.flagged;
    return true;
  });

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <Shield size={22} color="var(--primary-400)" />
              <h2 style={{ margin: 0 }}>Officer Audit Dashboard</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Voter-Controlled Final Confirmation &amp; Polling Officer Audit System
            </p>
          </div>
          <button id="refresh-audit-btn" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Officers', value: officers.length, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
              { label: 'Total Sessions', value: data.totalSessions, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
              { label: 'Confirmed Votes', value: officers.reduce((s, o) => s + o.confirmedVotes, 0), color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
              { label: 'Total Changes', value: officers.reduce((s, o) => s + o.totalChanges, 0), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              {
                label: 'Flagged Officers',
                value: flaggedCount,
                color: flaggedCount > 0 ? '#ef4444' : '#10b981',
                bg:  flaggedCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'
              },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginBottom: '0.25rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Flagged alert */}
        {flaggedCount > 0 && (
          <div style={{
            padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem'
          }}>
            <AlertTriangle size={18} color="var(--danger-400)" />
            <div>
              <p style={{ fontWeight: 700, color: 'var(--danger-400)', marginBottom: '0.15rem' }}>
                {flaggedCount} officer{flaggedCount > 1 ? 's' : ''} flagged for high change rate (&gt;15%)
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Officers with a high change rate may be intervening in voter selections. Review their session logs below.
              </p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { key: 'all',     label: `All Officers (${officers.length})` },
            { key: 'flagged', label: `⚠ Flagged (${flaggedCount})` },
            { key: 'ok',      label: `✓ Normal (${officers.length - flaggedCount})` },
          ].map(t => (
            <button
              key={t.key}
              id={`filter-${t.key}-btn`}
              className={filter === t.key ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              onClick={() => setFilter(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Officer list */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
            <div className="loader" />
            <span style={{ color: 'var(--text-muted)' }}>Loading audit data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="alert alert-info">
            <CheckCircle size={15} />
            {filter === 'flagged' ? 'No flagged officers. All change rates are within normal limits.' : 'No officer sessions recorded yet.'}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Clock size={13} />
              Sorted by change rate (highest first). Click any officer row to expand session logs.
            </div>
            {filtered.map(o => <OfficerRow key={o.officerId} officer={o} />)}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
