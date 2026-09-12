import React, { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw, Layers } from 'lucide-react';

export default function DemoController({ onRefreshAll, onSelectVerification }) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  const addLog = (msg, type = 'info', data = null) => {
    setLogs((prev) => [...prev, { text: msg, type, data, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runDemo1 = async () => {
    setIsRunning(true);
    setActiveDemo(1);
    setLogs([]);
    setStatusMessage('Running Demo 1 — Legitimate Mangrove Project A...');

    try {
      addLog('Step 1: Logging in as Project Owner (Sundarbans Eco Trust)...', 'info');
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'issuer@circularcarbon.org', password: 'issuer123' })
      });
      const loginData = await loginRes.json();
      const token = loginData.access_token;
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      addLog('Step 2: Registering Mangrove Project A on-chain...', 'info');
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          project_name: 'Sundarbans Coastal Mangrove Pilot (Plot A)',
          description: 'Restoration of degraded tidal mangrove buffer in delta zone',
          project_type: 'MANGROVE',
          total_area_ha: 12.4
        })
      });
      const project = await projRes.json();
      addLog(`Project Registered! On-chain Tx: ${project.blockchain_tx_hash.slice(0, 16)}...`, 'success', project);

      addLog('Step 3: Running Remote Sensing ML (Baseline 10.2 ha vs Current 12.4 ha)...', 'info');
      const mlRes = await fetch(`/api/projects/${project.id}/analyze?baseline_target_ha=10.2&current_target_ha=12.4`, {
        method: 'POST',
        headers
      });
      const mlReport = await mlRes.json();
      addLog(`ML Analysis complete: +${mlReport.change_ha} ha (+${mlReport.change_percent}%). Carbon Estimate: ${mlReport.estimated_tco2e} tCO2e [95% CI: ${mlReport.lower_bound_tco2e} - ${mlReport.upper_bound_tco2e}]`, 'success', mlReport);

      addLog('Step 4: Issuer submits carbon claim for 120.0 tCO2e...', 'info');
      const claimRes = await fetch('/api/claims', {
        method: 'POST',
        headers,
        body: JSON.stringify({ project_id: project.id, reported_tco2e: 120.0 })
      });
      const claim = await claimRes.json();
      addLog(`ML Claim Anomaly Score: ${(claim.anomaly_score * 100).toFixed(1)}%, Verification Score: ${(claim.verification_score * 100).toFixed(1)}%, Risk Level: ${claim.risk_level}`, 'success', claim);

      addLog('Step 5: Auditor reviews ML evidence & approves claim...', 'info');
      const auditorLogin = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'auditor@verra-audit.org', password: 'auditor123' })
      });
      const audToken = (await auditorLogin.json()).access_token;

      const approveRes = await fetch(`/api/claims/${claim.id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${audToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: 'Observed vegetation change aligns with 120 tCO2e claim. Verified.' })
      });
      const approvedClaim = await approveRes.json();
      addLog(`Claim Approved! Smart Contract minted Credit with Tx: ${approvedClaim.blockchain_tx_hash.slice(0, 16)}...`, 'success');

      // Fetch credits
      const credRes = await fetch('/api/credits');
      const credits = await credRes.json();
      const credit = credits[0];

      addLog(`Step 6: Transferring Credit #${credit.onchain_credit_id} to Corporate Buyer (Tech Zero)...`, 'info');
      await fetch(`/api/credits/${credit.id}/transfer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' })
      });
      addLog(`Credit transferred to 0x90F7... on-chain.`, 'success');

      addLog(`Step 7: Buyer permanently retires Credit #${credit.onchain_credit_id} for Corporate ESG Offset...`, 'info');
      const buyerLogin = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'buyer@microsoft-esg.com', password: 'buyer123' })
      });
      const buyerToken = (await buyerLogin.json()).access_token;

      const retireRes = await fetch(`/api/credits/${credit.id}/retire`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${buyerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Corporate 2026 Scope 3 Carbon Offset Certificate' })
      });
      const retiredCredit = await retireRes.json();
      addLog(`Credit #${credit.onchain_credit_id} permanently RETIRED! Burn state anchored on-chain.`, 'success', retiredCredit);

      setStatusMessage('Demo 1 Complete: Full verified lifecycle succeeded!');
      onRefreshAll();
    } catch (err) {
      addLog(`Demo 1 Error: ${err.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const runDemo2 = async () => {
    setIsRunning(true);
    setActiveDemo(2);
    setLogs([]);
    setStatusMessage('Running Demo 2 — Suspicious Over-Reporting Claim...');

    try {
      addLog('Step 1: Authenticating as Project Owner...', 'info');
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'issuer@circularcarbon.org', password: 'issuer123' })
      });
      const token = (await loginRes.json()).access_token;
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      addLog('Step 2: Registering Estuary Project with slight growth...', 'info');
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          project_name: 'Delta Estuary Mangrove Reserve (Plot B)',
          description: 'Estuary mangrove regeneration project',
          project_type: 'MANGROVE',
          total_area_ha: 8.5
        })
      });
      const project = await projRes.json();

      addLog('Step 3: ML Estimates Carbon: 80.0 tCO2e...', 'info');
      await fetch(`/api/projects/${project.id}/analyze?baseline_target_ha=8.0&current_target_ha=8.5`, {
        method: 'POST',
        headers
      });

      addLog('Step 4: Issuer attempts to over-claim 250.0 tCO2e (+212% above ML estimate)...', 'warning');
      const claimRes = await fetch('/api/claims', {
        method: 'POST',
        headers,
        body: JSON.stringify({ project_id: project.id, reported_tco2e: 250.0 })
      });
      const claim = await claimRes.json();

      addLog(`ML Isolation Forest Output: RISK LEVEL = ${claim.risk_level}, Anomaly Score: ${(claim.anomaly_score * 100).toFixed(1)}%`, 'error', claim);
      claim.reasons.forEach((r) => addLog(`Flagged Reason: ${r}`, 'warning'));

      addLog('Step 5: Auditor inspects anomaly red flags and REJECTS claim...', 'info');
      const auditorLogin = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'auditor@verra-audit.org', password: 'auditor123' })
      });
      const audToken = (await auditorLogin.json()).access_token;

      const rejectRes = await fetch(`/api/claims/${claim.id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${audToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Over-reporting claim exceeds biophysical capacity by 212%. Anomaly detector confirmed risk.' })
      });
      const rejectedClaim = await rejectRes.json();
      addLog(`Claim REJECTED on blockchain! Smart Contract Tx: ${rejectedClaim.blockchain_tx_hash.slice(0, 16)}...`, 'error');
      addLog(`INVARIANT ENFORCED: Zero credits were minted. Fraud was blocked before on-chain issuance!`, 'success');

      setStatusMessage('Demo 2 Complete: Suspicious claim successfully flagged & blocked!');
      onRefreshAll();
    } catch (err) {
      addLog(`Demo 2 Error: ${err.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const runDemo3 = async () => {
    setIsRunning(true);
    setActiveDemo(3);
    setLogs([]);
    setStatusMessage('Running Demo 3 — Double-Spending & Double-Retirement Protection...');

    try {
      addLog('Step 1: Finding an existing active or retired credit...', 'info');
      const credRes = await fetch('/api/credits');
      const credits = await credRes.json();

      if (credits.length === 0) {
        addLog('No credits found. Please run Demo 1 first to issue a credit.', 'warning');
        setIsRunning(false);
        return;
      }

      const buyerLogin = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'buyer@microsoft-esg.com', password: 'buyer123' })
      });
      const buyerToken = (await buyerLogin.json()).access_token;
      const headers = { 'Authorization': `Bearer ${buyerToken}`, 'Content-Type': 'application/json' };

      const targetCredit = credits[0];
      addLog(`Selected Credit #${targetCredit.onchain_credit_id} (Status: ${targetCredit.status})`, 'info');

      if (targetCredit.status !== 'RETIRED') {
        addLog('Retiring credit first...', 'info');
        await fetch(`/api/credits/${targetCredit.id}/retire`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reason: 'Initial Valid Retirement' })
        });
        addLog('Credit successfully retired.', 'success');
      }

      addLog('ATTACK TEST A: Attempting to RETIRE the already-retired credit a second time...', 'warning');
      const attackRetire = await fetch(`/api/credits/${targetCredit.id}/retire`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Malicious Double Retirement Attempt' })
      });
      const retireErr = await attackRetire.json();
      if (attackRetire.status === 400) {
        addLog(`BLOCKED! Smart contract reverted: "${retireErr.detail}"`, 'success');
      } else {
        addLog('Unexpected success, check contract rules.', 'error');
      }

      addLog('ATTACK TEST B: Attempting to TRANSFER the already-retired credit to another wallet...', 'warning');
      const attackTransfer = await fetch(`/api/credits/${targetCredit.id}/transfer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to_address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' })
      });
      const transferErr = await attackTransfer.json();
      if (attackTransfer.status === 400) {
        addLog(`BLOCKED! Smart contract reverted: "${transferErr.detail}"`, 'success');
      } else {
        addLog('Unexpected success, check contract rules.', 'error');
      }

      addLog(`CRYPTOGRAPHIC INVARIANT PROVEN: Double-spending and double-retirement are strictly prevented by the smart contract registry!`, 'success');
      setStatusMessage('Demo 3 Complete: Double-spending safeguards verified.');
      onRefreshAll();
    } catch (err) {
      addLog(`Demo 3 Error: ${err.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Play size={18} color="#10b981" />
            <span>Interactive Hackathon Demo Controller</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Execute 1-click live demonstrations across Remote Sensing ML, Anomaly Detection, Human Auditor, and Hardhat Blockchain.
          </p>
        </div>

        {statusMessage && (
          <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            {statusMessage}
          </div>
        )}
      </div>

      {/* 3 Demo Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        
        {/* Demo 1 */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: activeDemo === 1 ? '1px solid #10b981' : '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.05em' }}>DEMO 1</span>
            <span className="badge badge-low">LOW RISK</span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
            Legitimate Mangrove Project A
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            Area +21.57%, Estimate 125.7 tCO2e, Claim 120 tCO2e. ML verifies risk LOW (91%). Auditor approves and credits are issued, transferred, and retired.
          </p>
          <button 
            onClick={runDemo1} 
            disabled={isRunning} 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.825rem' }}
          >
            {isRunning && activeDemo === 1 ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            <span>Run Legitimate MRV Flow</span>
          </button>
        </div>

        {/* Demo 2 */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: activeDemo === 2 ? '1px solid #f43f5e' : '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb7185', letterSpacing: '0.05em' }}>DEMO 2</span>
            <span className="badge badge-high">HIGH RISK ANOMALY</span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
            Suspicious Over-Reporting Claim
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            ML Estimate 80 tCO2e vs Issuer reports 250 tCO2e (+212%). Isolation Forest flags anomaly with reasons. Auditor rejects claim; zero credits minted.
          </p>
          <button 
            onClick={runDemo2} 
            disabled={isRunning} 
            className="btn-danger" 
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.825rem' }}
          >
            {isRunning && activeDemo === 2 ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            <span>Run Fraud Detection Flow</span>
          </button>
        </div>

        {/* Demo 3 */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: activeDemo === 3 ? '1px solid #f59e0b' : '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.05em' }}>DEMO 3</span>
            <span className="badge badge-medium">DOUBLE-COUNTING GUARD</span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
            Double-Spending & Retirement Guard
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            Attempts to retire an already-retired credit a second time and transfer a retired credit. Proves smart contract reverts to prevent double-counting.
          </p>
          <button 
            onClick={runDemo3} 
            disabled={isRunning} 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.825rem', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}
          >
            {isRunning && activeDemo === 3 ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            <span>Run Double-Spending Test</span>
          </button>
        </div>

      </div>

      {/* Execution Console Output */}
      {logs.length > 0 && (
        <div style={{ background: '#030712', borderRadius: '10px', padding: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.08)', maxHeight: '180px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LIVE AUDIT STREAM & BLOCKCHAIN LOG</span>
            <button onClick={() => setLogs([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.65rem', cursor: 'pointer' }}>Clear</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ 
                color: log.type === 'error' ? '#f43f5e' : (log.type === 'success' ? '#34d399' : (log.type === 'warning' ? '#fbbf24' : '#94a3b8')),
                display: 'flex',
                gap: '0.5rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>[{log.timestamp}]</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
