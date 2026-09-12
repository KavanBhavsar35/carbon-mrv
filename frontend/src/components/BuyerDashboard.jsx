import React, { useState } from 'react';
import { Building, Send, Flame, CheckCircle2, ShieldCheck, ArrowRight, Award, ExternalLink, Hash } from 'lucide-react';

export default function BuyerDashboard({ credits, onRefresh, onSelectVerification }) {
  const [transferModalCredit, setTransferModalCredit] = useState(null);
  const [retireModalCredit, setRetireModalCredit] = useState(null);
  const [transferAddress, setTransferAddress] = useState('0x90F79bf6EB2c4f870365E785982E1f101E93b906');
  const [retireReason, setRetireReason] = useState('Corporate Net-Zero 2026 Scope 3 Carbon Neutrality');
  const [isProcessing, setIsProcessing] = useState(false);
  const [celebrationCert, setCelebrationCert] = useState(null);

  const activeCredits = credits.filter(c => c.status === 'ACTIVE');
  const retiredCredits = credits.filter(c => c.status === 'RETIRED');

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferModalCredit) return;
    setIsProcessing(true);
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'buyer@microsoft-esg.com', password: 'buyer123' })
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(`/api/credits/${transferModalCredit.id}/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to_address: transferAddress })
      });
      if (res.ok) {
        setTransferModalCredit(null);
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Transfer failed: ${err.detail}`);
      }
    } catch (err) {
      alert(`Transfer failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetire = async (e) => {
    e.preventDefault();
    if (!retireModalCredit) return;
    setIsProcessing(true);
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'buyer@microsoft-esg.com', password: 'buyer123' })
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(`/api/credits/${retireModalCredit.id}/retire`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: retireReason })
      });
      if (res.ok) {
        const updated = await res.json();
        setCelebrationCert(updated);
        setRetireModalCredit(null);
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Retirement failed: ${err.detail}`);
      }
    } catch (err) {
      alert(`Retirement failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Building size={28} color="#06b6d4" />
          <span>Corporate Buyer & Offset Marketplace</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Browse audited, active blue carbon credits. Transfer custody or execute permanent one-way retirement to claim ESG offsets.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Credits</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
            {activeCredits.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Batches</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {activeCredits.reduce((acc, c) => acc + c.amount, 0).toFixed(1)} tCO₂e Available
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Permanently Retired</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f43f5e' }}>
            {retiredCredits.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Certificates</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {retiredCredits.reduce((acc, c) => acc + c.amount, 0).toFixed(1)} tCO₂e Offset
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Smart Contract Guarantee</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
            No Double-Counting
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
            ✓ Cryptographically Burned Upon Retirement
          </div>
        </div>
      </div>

      {/* Active Credits Section */}
      <div>
        <h2 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} color="#10b981" />
          <span>Active, Audited Carbon Credits</span>
        </h2>

        {activeCredits.length === 0 ? (
          <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No active credits available right now. Run Demo 1 to issue verified mangrove carbon credits!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {activeCredits.map((c) => (
              <div key={c.id} className="glass-card" style={{ padding: '1.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-low">ACTIVE CREDIT #{c.onchain_credit_id}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vintage {c.vintage_year}</span>
                </div>

                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                  {c.amount} <span style={{ fontSize: '1rem', color: '#34d399' }}>tCO₂e</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Verified Sundarbans Tidal Mangrove Carbon Sequestration
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
                  <div>Current Owner: {c.current_owner.slice(0, 16)}...</div>
                  <div>Mint Tx: {c.mint_tx_hash ? c.mint_tx_hash.slice(0, 16) + '...' : '0xabc123...'}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setTransferModalCredit(c)}
                    className="btn-secondary" 
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                  >
                    <Send size={14} />
                    <span>Transfer</span>
                  </button>
                  <button 
                    onClick={() => setRetireModalCredit(c)}
                    className="btn-primary" 
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}
                  >
                    <Flame size={14} color="#fcd34d" />
                    <span>Retire (Burn)</span>
                  </button>
                  <button 
                    onClick={() => onSelectVerification(c.onchain_credit_id)}
                    className="btn-secondary" 
                    style={{ padding: '0.65rem', justifyContent: 'center' }}
                    title="Inspect Provenance"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retired Credits / Offset Certificates */}
      {retiredCredits.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={18} color="#f43f5e" />
            <span>Permanent Retirement Certificates</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {retiredCredits.map((c) => (
              <div key={c.id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-high" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                    RETIRED #{c.onchain_credit_id}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {c.retired_at ? new Date(c.retired_at).toLocaleDateString() : '2026-09-12'}
                  </span>
                </div>

                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                  {c.amount} tCO₂e Offset
                </div>
                <div style={{ fontSize: '0.8rem', color: '#fecdd3', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                  "{c.retired_reason || 'Corporate Net-Zero Offset'}"
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
                  <div>Retired By: {c.retired_by ? c.retired_by.slice(0, 20) + '...' : '0x90F7...'}</div>
                  <div>Retire Tx: {c.retire_tx_hash ? c.retire_tx_hash.slice(0, 18) + '...' : '0xdef456...'}</div>
                </div>

                <button onClick={() => onSelectVerification(c.onchain_credit_id)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}>
                  <ExternalLink size={13} />
                  <span>Inspect Immutable Certificate</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalCredit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '90%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '0.5rem' }}>Transfer Carbon Credit</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Transfer ownership of Credit #{transferModalCredit.onchain_credit_id} ({transferModalCredit.amount} tCO₂e) on Ethereum/Hardhat.
            </p>
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Recipient Wallet Address (0x...)</label>
                <input 
                  type="text" 
                  required 
                  value={transferAddress} 
                  onChange={(e) => setTransferAddress(e.target.value)} 
                  className="form-input" 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setTransferModalCredit(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isProcessing} className="btn-primary">
                  {isProcessing ? 'Transferring...' : 'Execute On-Chain Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Retire Modal */}
      {retireModalCredit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '90%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flame size={20} color="#f43f5e" />
              <span>Permanently Retire Credit</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Retiring Credit #{retireModalCredit.onchain_credit_id} ({retireModalCredit.amount} tCO₂e) permanently removes it from circulation on the blockchain. It can never be transferred or retired again.
            </p>
            <form onSubmit={handleRetire} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Corporate Retirement Purpose</label>
                <textarea 
                  rows={3} 
                  required 
                  value={retireReason} 
                  onChange={(e) => setRetireReason(e.target.value)} 
                  className="form-input" 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setRetireModalCredit(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isProcessing} className="btn-danger">
                  {isProcessing ? 'Retiring on Chain...' : 'Confirm Permanent Retirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Celebration Certificate Modal */}
      {celebrationCert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div className="glass-card" style={{ maxWidth: '520px', width: '90%', padding: '2rem', textAlign: 'center', border: '1px solid #10b981', boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Award size={32} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.35rem' }}>
              Carbon Offset Certificate Issued!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600, marginBottom: '1.25rem' }}>
              {celebrationCert.amount} tCO₂e Permanently Retired
            </p>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
              <div>Credit ID: #{celebrationCert.onchain_credit_id}</div>
              <div>Beneficiary: {celebrationCert.retired_by}</div>
              <div>Reason: "{celebrationCert.retired_reason}"</div>
              <div>Tx Hash: {celebrationCert.retire_tx_hash ? celebrationCert.retire_tx_hash.slice(0, 24) + '...' : '0xdef...'}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => { setCelebrationCert(null); onSelectVerification(celebrationCert.onchain_credit_id); }} className="btn-primary">
                View Public Audit Trail
              </button>
              <button onClick={() => setCelebrationCert(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
