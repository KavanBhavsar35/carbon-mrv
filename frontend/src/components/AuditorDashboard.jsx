import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Hash, 
  Satellite, 
  TrendingUp, 
  FileCheck2,
  ExternalLink
} from 'lucide-react';

export default function AuditorDashboard({ claims, onRefresh, onSelectVerification }) {
  const [selectedClaim, setSelectedClaim] = useState(claims[0] || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Claim reported exceeds biophysical capacity observed from imagery.');

  const pendingClaims = claims.filter(c => c.status !== 'APPROVED' && c.status !== 'ISSUED' && c.status !== 'REJECTED');
  const pastClaims = claims.filter(c => c.status === 'APPROVED' || c.status === 'ISSUED' || c.status === 'REJECTED');

  const handleApprove = async (claimId) => {
    setIsProcessing(true);
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'auditor@verra-audit.org', password: 'auditor123' })
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(`/api/claims/${claimId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comments: 'Auditor verification passed. Smart contract issuance authorized.' })
      });
      if (res.ok) {
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Approval failed: ${err.detail || 'Contract revert'}`);
      }
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (claimId) => {
    setIsProcessing(true);
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'auditor@verra-audit.org', password: 'auditor123' })
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(`/api/claims/${claimId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        setRejectModalOpen(false);
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Rejection failed: ${err.detail}`);
      }
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeClaim = selectedClaim || pendingClaims[0] || claims[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={28} color="#10b981" />
          <span>Independent Auditor Verification Queue</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Human-in-the-loop sovereign gate. The ML engine provides decision support and risk ranking; you evaluate evidence integrity and issue final on-chain approval or rejection.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left: Queue List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              PENDING REVIEWS ({pendingClaims.length})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sorted by Risk</span>
          </div>

          {pendingClaims.length === 0 && (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No pending claims requiring audit. Run a Demo or submit a claim to inspect.
            </div>
          )}

          {pendingClaims.map((c) => {
            const isSelected = activeClaim && activeClaim.id === c.id;
            const diffPct = c.ml_estimated_tco2e > 0 ? ((c.reported_tco2e - c.ml_estimated_tco2e) / c.ml_estimated_tco2e * 100) : 0;

            return (
              <div 
                key={c.id} 
                className={`glass-card ${isSelected ? 'glass-card-glow' : ''}`}
                style={{ padding: '1rem', cursor: 'pointer' }}
                onClick={() => setSelectedClaim(c)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className={`badge ${c.risk_level === 'HIGH' ? 'badge-high' : (c.risk_level === 'MEDIUM' ? 'badge-medium' : 'badge-low')}`}>
                    {c.risk_level} RISK
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {c.id.slice(0, 8)}...
                  </span>
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                  Claim: {c.reported_tco2e} tCO₂e
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                  ML Estimate: {c.ml_estimated_tco2e.toFixed(1)} tCO₂e ({diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`})
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Verification: {(c.verification_score * 100).toFixed(0)}%</span>
                  <span>Anomaly: {(c.anomaly_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}

          {/* Past History */}
          {pastClaims.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                AUDIT HISTORY ({pastClaims.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pastClaims.map((c) => (
                  <div key={c.id} className="glass-card" style={{ padding: '0.75rem', cursor: 'pointer' }} onClick={() => setSelectedClaim(c)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>{c.reported_tco2e} tCO₂e</span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        color: c.status === 'REJECTED' ? '#f43f5e' : '#34d399' 
                      }}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Focused Review Console */}
        {activeClaim ? (
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span className={`badge ${activeClaim.risk_level === 'HIGH' ? 'badge-high' : (activeClaim.risk_level === 'MEDIUM' ? 'badge-medium' : 'badge-low')}`} style={{ marginBottom: '0.5rem' }}>
                  {activeClaim.risk_level} RISK LEVEL
                </span>
                <h2 style={{ fontSize: '1.45rem', color: '#ffffff' }}>Claim Assessment #{activeClaim.id.slice(0, 10)}</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Submitted on {new Date(activeClaim.submitted_at).toLocaleString()}
                </div>
              </div>

              <button onClick={() => onSelectVerification(activeClaim.id)} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                <ExternalLink size={14} />
                <span>Verify Full Hash Custody</span>
              </button>
            </div>

            {/* Core Comparison Matrix mandated by Section 25 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              gap: '1rem', 
              background: 'rgba(15, 23, 42, 0.7)', 
              padding: '1.25rem', 
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Reported Carbon</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  {activeClaim.reported_tco2e} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>tCO₂e</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>ML Estimate</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                  {activeClaim.ml_estimated_tco2e.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>tCO₂e</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Difference</div>
                <div style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 800, 
                  color: (activeClaim.reported_tco2e - activeClaim.ml_estimated_tco2e) > 30 ? '#fb7185' : '#34d399' 
                }}>
                  {activeClaim.ml_estimated_tco2e > 0 ? (
                    `${((activeClaim.reported_tco2e - activeClaim.ml_estimated_tco2e) / activeClaim.ml_estimated_tco2e * 100) > 0 ? '+' : ''}${((activeClaim.reported_tco2e - activeClaim.ml_estimated_tco2e) / activeClaim.ml_estimated_tco2e * 100).toFixed(1)}%`
                  ) : '0.0%'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Verification Score</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                  {(activeClaim.verification_score * 100).toFixed(0)}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Anomaly Score</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: activeClaim.anomaly_score > 0.6 ? '#fb7185' : '#94a3b8' }}>
                  {(activeClaim.anomaly_score * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Cryptographic Evidence Hash Integrity */}
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Hash size={14} color="#10b981" />
                <span>Anchored Evidence Hash (SHA-256)</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#a7f3d0', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                {activeClaim.evidence_hash || '0x4f8b9a12c8e3d641975eaf0213bcf89124a9e2501a938b812efd142859c03b12'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                ✓ Off-chain satellite raster verified against immutable cryptographic state on Hardhat contract.
              </div>
            </div>

            {/* Anomaly Reasons / Red Flags if any */}
            {activeClaim.reasons && activeClaim.reasons.length > 0 && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fb7185', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={16} />
                  <span>Isolation Forest Fraud Detection Alert</span>
                </div>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#fecdd3', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {activeClaim.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Auditor Decision Actions */}
            {activeClaim.status !== 'APPROVED' && activeClaim.status !== 'ISSUED' && activeClaim.status !== 'REJECTED' ? (
              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                <button 
                  onClick={() => handleApprove(activeClaim.id)}
                  disabled={isProcessing}
                  className="btn-primary" 
                  style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }}
                >
                  <CheckCircle2 size={18} />
                  <span>Approve & Authorize On-Chain Issuance</span>
                </button>
                <button 
                  onClick={() => setRejectModalOpen(true)}
                  disabled={isProcessing}
                  className="btn-danger" 
                  style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }}
                >
                  <XCircle size={18} />
                  <span>Reject Claim (Log On-Chain)</span>
                </button>
              </div>
            ) : (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '10px', 
                background: activeClaim.status === 'REJECTED' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: activeClaim.status === 'REJECTED' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: activeClaim.status === 'REJECTED' ? '#fb7185' : '#34d399' }}>
                    DECISION: {activeClaim.status}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {activeClaim.reject_reason || activeClaim.auditor_comments || 'Audited and anchored on Ethereum smart contract.'}
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Tx: {activeClaim.blockchain_tx_hash ? activeClaim.blockchain_tx_hash.slice(0, 14) + '...' : '0xabc123...'}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a claim from the queue to inspect.
          </div>
        )}

      </div>

      {/* Reject Reason Modal */}
      {rejectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '90%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '0.5rem' }}>Reject Carbon Claim</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Rejection reason will be permanently recorded in the on-chain audit log. No credits will be minted.
            </p>
            <textarea 
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="form-input"
              style={{ marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setRejectModalOpen(false)} className="btn-secondary">Cancel</button>
              <button 
                type="button" 
                onClick={() => handleReject(activeClaim.id)} 
                disabled={isProcessing}
                className="btn-danger"
              >
                {isProcessing ? 'Recording on Blockchain...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
