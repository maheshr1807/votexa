import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Vote, Building2, BarChart3, LogOut, Shield, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../ErrorBoundary';

const navItems = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/candidates',    icon: Users,            label: 'Candidates' },
  { to: '/admin/elections',     icon: Vote,             label: 'Elections' },
  { to: '/admin/officers',      icon: UserCheck,        label: 'Officers' },
  { to: '/admin/results',       icon: BarChart3,        label: 'Results' },
  { to: '/admin/officer-audit', icon: ShieldAlert,      label: 'Officer Audit' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem' }}>Votexa</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Admin Panel</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 700, color: 'white'
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Administrator</p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm btn-full" onClick={() => { logout(); navigate('/admin/login'); }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <main className="content-area">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
