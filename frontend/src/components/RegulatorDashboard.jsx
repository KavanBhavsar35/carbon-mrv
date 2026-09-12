import React, { useState, useEffect } from 'react';
import { Eye, Shield, Activity, Database, CheckCircle2, XCircle, Flame, Send, Hash, ExternalLink } from 'lucide-react';

export default function RegulatorDashboard({ projects, claims, credits, onSelectVerification }) {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch('/api/dashboard/regulator')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, [projects, claims, credits]);

  const activeCount = credits.filter(c => c.status === 'ACTIVE').length;
  const retiredCount = credits.filter(c => c.status === 'RETIRED').length;
  const rejectedCount = claims.filter(c => c.status === 'REJECTED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Eye size={28} color="#a855f7" />
          <span>Regulator & Public Ecosystem Explorer</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Transparent global ledger view. Inspect all projects, remote-sensing hashes, auditor verifications, smart contract transactions, and retirement logs.
        </p>
      </div>

      {/* Global Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Projects</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{projects.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#34d399' }}>Blue Carbon Reserves</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Claims Evaluated</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{claims.length}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Remote Sensing Verified</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credits Issued</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{credits.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>Unique On-Chain IDs</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credits Retired</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e' }}>{retiredCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#fecdd3' }}>Permanent Burn State</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fraud Rejections</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>{rejectedCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#fef08a' }}>Flagged by ML & Auditor</div>
        </div>
      </div>

      {/* Claims & Lifecycle Overview Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="#10b981" />
          <span>Carbon MRV Lifecycle Master Table</span>
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Claim / Project</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Reported CO₂e</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>ML Estimate</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Risk Level</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Verification %</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Evidence Hash</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Audit Trail</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#ffffff' }}>
                    #{c.id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#ffffff' }}>
                    {c.reported_tco2e} tCO₂e
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#38bdf8' }}>
                    {c.ml_estimated_tco2e.toFixed(1)} tCO₂e
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span className={`badge ${c.risk_level === 'HIGH' ? 'badge-high' : (c.risk_level === 'MEDIUM' ? 'badge-medium' : 'badge-low')}`}>
                      {c.risk_level}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#34d399', fontWeight: 600 }}>
                    {(c.verification_score * 100).toFixed(0)}%
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{ 
                      fontWeight: 700, 
                      color: c.status === 'REJECTED' ? '#f43f5e' : (c.status === 'ISSUED' ? '#10b981' : '#f59e0b') 
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {c.evidence_hash.slice(0, 10)}...
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <button 
                      onClick={() => onSelectVerification(c.id)} 
                      className="btn-secondary" 
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                    >
                      <span>Inspect</span>
                      <ExternalLink size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
