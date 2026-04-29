import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LabShell } from './components/layout/LabShell';
import { Landing } from './pages/Landing';
import { AppDashboard } from './pages/AppDashboard';
import { AlgorithmLab } from './pages/AlgorithmLab';
import { LabGallery } from './pages/LabGallery';
import { MstLab } from './pages/MstLab';
import { CriticalLab } from './pages/CriticalLab';
import { AssignmentLab } from './pages/AssignmentLab';
import { HeapLab } from './pages/HeapLab';
import { Dispatcher } from './pages/Dispatcher';
import { Resilience } from './pages/Resilience';
import { Reporter } from './pages/Reporter';
import { Analytics } from './pages/Analytics';
import { ActiveBoard } from './pages/ActiveBoard';

function AppRoutes() {
  const location = useLocation();
  const isApp = location.pathname.startsWith('/app');
  const isLab = location.pathname.startsWith('/lab');
  const isLanding = location.pathname === '/';

  // Choose layout
  if (isApp) {
    return (
      <AppShell>
        <Routes>
          <Route path="/app/dashboard" element={<AppDashboard />} />
          <Route path="/app/report" element={<Reporter />} />
          <Route path="/app/operations" element={<Dispatcher />} />
          <Route path="/app/active" element={<ActiveBoard />} />
          <Route path="/app/analytics" element={<Analytics />} />
          <Route path="/app/planner" element={<Resilience />} />
        </Routes>
      </AppShell>
    );
  }

  if (isLab) {
    return (
      <LabShell>
        <Routes>
          <Route path="/lab" element={<LabGallery />} />
          <Route path="/lab/routing" element={<AlgorithmLab />} />
          <Route path="/lab/mst" element={<MstLab />} />
          <Route path="/lab/critical" element={<CriticalLab />} />
          <Route path="/lab/assignment" element={<AssignmentLab />} />
          <Route path="/lab/heap" element={<HeapLab />} />
        </Routes>
      </LabShell>
    );
  }

  // Landing page (no shell)
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {/* Backwards compat redirects */}
      <Route path="/dispatch" element={<Navigate to="/app/operations" replace />} />
      <Route path="/resilience" element={<Navigate to="/app/planner" replace />} />
      <Route path="/report" element={<Navigate to="/app/report" replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
