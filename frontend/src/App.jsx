import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DemoController from './components/DemoController';
import IssuerDashboard from './components/IssuerDashboard';
import AuditorDashboard from './components/AuditorDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import RegulatorDashboard from './components/RegulatorDashboard';
import VerificationModal from './components/VerificationModal';

export default function App() {
  const [activeRole, setActiveRole] = useState('ISSUER'); // ISSUER, AUDITOR, BUYER, REGULATOR
  const [showDemoConsole, setShowDemoConsole] = useState(true);
  const [verificationQuery, setVerificationQuery] = useState(null);

  // Global shared state
  const [projects, setProjects] = useState([]);
  const [claims, setClaims] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [projRes, claimsRes, credsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/claims'),
        fetch('/api/credits')
      ]);

      if (projRes.ok) setProjects(await projRes.json());
      if (claimsRes.ok) setClaims(await claimsRes.json());
      if (credsRes.ok) setCredits(await credsRes.json());
    } catch (err) {
      console.error('Data sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8s auto-poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation */}
      <Navbar 
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onSearchVerify={(id) => setVerificationQuery(id)}
        onOpenDemoConsole={() => setShowDemoConsole(prev => !prev)}
      />

      {/* Main Content Area */}
      <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem', flex: 1 }}>
        
        {/* Interactive Demo Controller */}
        {showDemoConsole && (
          <DemoController 
            onRefreshAll={fetchData} 
            onSelectVerification={(id) => setVerificationQuery(id)} 
          />
        )}

        {/* Dynamic Role Dashboard */}
        {activeRole === 'ISSUER' && (
          <IssuerDashboard 
            projects={projects}
            claims={claims}
            onRefresh={fetchData}
            onSelectVerification={(id) => setVerificationQuery(id)}
          />
        )}

        {activeRole === 'AUDITOR' && (
          <AuditorDashboard 
            claims={claims}
            onRefresh={fetchData}
            onSelectVerification={(id) => setVerificationQuery(id)}
          />
        )}

        {activeRole === 'BUYER' && (
          <BuyerDashboard 
            credits={credits}
            onRefresh={fetchData}
            onSelectVerification={(id) => setVerificationQuery(id)}
          />
        )}

        {activeRole === 'REGULATOR' && (
          <RegulatorDashboard 
            projects={projects}
            claims={claims}
            credits={credits}
            onSelectVerification={(id) => setVerificationQuery(id)}
          />
        )}

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(6, 9, 14, 0.95)', padding: '1.25rem 1.5rem', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div>
            <strong>Circular Carbon MRV Ecosystem</strong> — Verifiable Nature-Based Carbon Registry
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Solidity 0.8.24</span>
            <span>Hardhat Local #31337</span>
            <span>IPCC Tier 2 Blue Carbon</span>
            <span>Isolation Forest Anomaly Scoring</span>
          </div>
        </div>
      </footer>

      {/* Verification / Proof of Provenance Modal */}
      {verificationQuery && (
        <VerificationModal 
          identifier={verificationQuery} 
          onClose={() => setVerificationQuery(null)} 
        />
      )}

    </div>
  );
}
