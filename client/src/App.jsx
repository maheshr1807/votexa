import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Pages
import Home from './pages/Home';
import Login from './pages/voter/Login';
import Register from './pages/voter/Register';
import PublicResults from './pages/PublicResults';

// Voter Pages
import VoterDashboard from './pages/voter/VoterDashboard';
import FaceVerify from './pages/voter/FaceVerify';

import Vote from './pages/voter/Vote';
import VoteStatus from './pages/voter/VoteStatus';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCandidates from './pages/admin/ManageCandidates';
import ManageElections from './pages/admin/ManageElections';
import ManageOfficers from './pages/admin/ManageOfficers';
import AdminResults from './pages/admin/AdminResults';

// Officer Pages
import OfficerLogin from './pages/officer/OfficerLogin';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import SearchVoter from './pages/officer/SearchVoter';
import CastOfflineVote from './pages/officer/CastOfflineVote';
import VoterConfirmation from './pages/officer/VoterConfirmation';

// Admin Pages — Additional
import OfficerAudit from './pages/admin/OfficerAudit';

// Guards
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loader"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const PublicOnly = ({ children, allowedRole }) => {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loader"></div></div>;
  if (user) {
    // If user is logged in with a different role than this portal expects,
    // log them out so they can switch portals freely.
    if (allowedRole && user.role !== allowedRole) {
      logout();
      return children;
    }
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (user.role === 'officer') return <Navigate to="/officer/dashboard" />;
    return <Navigate to="/voter/dashboard" />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<PublicResults />} />
          <Route path="/login" element={<PublicOnly allowedRole="voter"><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly allowedRole="voter"><Register /></PublicOnly>} />
          <Route path="/admin/login" element={<PublicOnly allowedRole="admin"><AdminLogin /></PublicOnly>} />
          <Route path="/officer/login" element={<PublicOnly allowedRole="officer"><OfficerLogin /></PublicOnly>} />

          {/* Voter */}
          <Route path="/voter/dashboard" element={<PrivateRoute roles={['voter']}><VoterDashboard /></PrivateRoute>} />
          <Route path="/voter/verify-face" element={<PrivateRoute roles={['voter']}><FaceVerify /></PrivateRoute>} />

          <Route path="/voter/vote" element={<PrivateRoute roles={['voter']}><Vote /></PrivateRoute>} />
          <Route path="/voter/status" element={<PrivateRoute roles={['voter']}><VoteStatus /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/candidates" element={<PrivateRoute roles={['admin']}><ManageCandidates /></PrivateRoute>} />
          <Route path="/admin/elections" element={<PrivateRoute roles={['admin']}><ManageElections /></PrivateRoute>} />
          <Route path="/admin/officers" element={<PrivateRoute roles={['admin']}><ManageOfficers /></PrivateRoute>} />
          <Route path="/admin/results" element={<PrivateRoute roles={['admin']}><AdminResults /></PrivateRoute>} />

          {/* Officer */}
          <Route path="/officer/dashboard" element={<PrivateRoute roles={['officer']}><OfficerDashboard /></PrivateRoute>} />
          <Route path="/officer/search" element={<PrivateRoute roles={['officer']}><SearchVoter /></PrivateRoute>} />
          <Route path="/officer/cast-vote" element={<PrivateRoute roles={['officer']}><CastOfflineVote /></PrivateRoute>} />
          {/* Voter confirmation screen — public, no auth (voter has no account). Uses sessionId in URL. */}
          <Route path="/officer/voter-confirm" element={<VoterConfirmation />} />

          {/* Admin — Officer Audit */}
          <Route path="/admin/officer-audit" element={<PrivateRoute roles={['admin']}><OfficerAudit /></PrivateRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
