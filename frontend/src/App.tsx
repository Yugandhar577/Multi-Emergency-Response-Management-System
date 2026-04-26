import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AlgorithmLab } from './pages/AlgorithmLab';
import { Dispatcher } from './pages/Dispatcher';
import { Resilience } from './pages/Resilience';
import { Reporter } from './pages/Reporter';
import { Analytics } from './pages/Analytics';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/lab" replace />} />
          <Route path="/lab" element={<AlgorithmLab />} />
          <Route path="/dispatch" element={<Dispatcher />} />
          <Route path="/resilience" element={<Resilience />} />
          <Route path="/report" element={<Reporter />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
