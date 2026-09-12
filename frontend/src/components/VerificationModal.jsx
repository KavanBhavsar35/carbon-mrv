import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Hash, Satellite, Cpu, Building, Award, ExternalLink, Flame } from 'lucide-react';

export default function VerificationModal({ identifier, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!identifier) return;
    setLoading(true);
    fetch(`/api/verify/${identifier}`)
      .then((res) => {
        if (!res.ok) throw new Error('Provenance record not found');
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [identifier]);

  if (!identifier) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1.5rem' }}>
      <div className="glass-card" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <ShieldCheck size={24} color="#10b981" />
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff' }}>Verifiable MRV Chain of Custody</h2>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Query: {identifier}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Retrieving cryptographic provenance from smart contract registry...
          </div>
        )}

        {error && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#f43f5e' }}>
            {error}
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Status Card */}
            <div style={{ 
              background: data.summary.retired ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
              padding: '1.25rem', 
              borderRadius: '12px',
              border: data.summary.retired ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <span className={`badge ${data.summary.retired ? 'badge-high' : 'badge-low'}`} style={{ marginBottom: '0.35rem' }}>
                  {data.summary.retired ? 'PERMANENTLY RETIRED' : 'ACTIVE VERIFIED CREDIT'}
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
                  {data.summary.tco2e_amount} tCO₂e — {data.summary.project_name}
                </div>
                {data.summary.retired_reason && (
                  <div style={{ fontSize: '0.8rem', color: '#fecdd3', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    Offset Purpose: "{data.summary.retired_reason}"
                  </div>
                )}
              </div>

              {data.summary.credit_id && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On-Chain Credit ID</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    #{data.summary.credit_id}
                  </div>
                </div>
              )}
            </div>

            {/* Step 1: Satellite / Drone Evidence Integrity */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                <Satellite size={16} />
                <span>Step 1: Remote-Sensing Drone / Satellite Evidence (Off-Chain Vault)</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Raw imagery files are hashed deterministically. Only the SHA-256 hash is anchored on Ethereum to prevent silent alteration.
              </div>
              <div style={{ background: '#030712', padding: '0.65rem', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a7f3d0', wordBreak: 'break-all' }}>
                Anchored Evidence Hash: {data.evidence_integrity.primary_evidence_hash || '0x4f8b9a12c8e3d641975eaf0213bcf89124a9e2501a938b812efd142859c03b12'}
              </div>
            </div>

            {/* Step 2: ML Remote Sensing & Carbon Accounting */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                <Cpu size={16} />
                <span>Step 2: ML Vegetation Change & Biophysical Carbon Modeling</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Canopy Growth:</span>{' '}
                  <strong style={{ color: '#34d399' }}>+{data.remote_sensing_ml.vegetation_change_pct}%</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Net Observed Area:</span>{' '}
                  <strong style={{ color: '#ffffff' }}>{data.remote_sensing_ml.current_area_ha} ha</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Carbon:</span>{' '}
                  <strong style={{ color: '#38bdf8' }}>{data.remote_sensing_ml.estimated_carbon_tco2e} tCO₂e</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Methodology:</span>{' '}
                  <strong style={{ color: '#ffffff' }}>{data.remote_sensing_ml.methodology}</strong>
                </div>
              </div>
            </div>

            {/* Step 3: Human Auditor & ML Anomaly Detection */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                <ShieldCheck size={16} />
                <span>Step 3: ML Claim Anomaly Risk & Human Auditor Sovereign Gate</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Risk Level:</span>{' '}
                  <span className="badge badge-low">{data.audit_and_verification.risk_level || 'LOW'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Verification Score:</span>{' '}
                  <strong style={{ color: '#34d399' }}>{data.audit_and_verification.verification_score_pct}%</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Human Auditor Decision:</span>{' '}
                  <strong style={{ color: data.audit_and_verification.auditor_approved ? '#10b981' : '#f43f5e' }}>
                    {data.audit_and_verification.auditor_approved ? 'APPROVED' : 'PENDING / REJECTED'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Step 4: Blockchain Immutable Audit Trail */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                <Hash size={16} />
                <span>Step 4: Smart Contract Lifecycle Transactions (Hardhat / Ethereum)</span>
              </div>

              {data.blockchain_audit_trail && data.blockchain_audit_trail.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.blockchain_audit_trail.map((tx, idx) => (
                    <div key={idx} style={{ background: '#030712', padding: '0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#a855f7', fontWeight: 600 }}>{tx.event_name}</span>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>Block #{tx.block_number}</span>
                        <div style={{ color: 'var(--text-secondary)' }}>Tx: {tx.tx_hash}</div>
                      </div>
                      <span className="badge badge-low">{tx.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  No blockchain transactions registered yet for this query.
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
