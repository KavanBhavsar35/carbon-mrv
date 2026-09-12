import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Satellite, 
  Cpu, 
  Building, 
  Eye, 
  Search, 
  CheckCircle2, 
  Layers,
  Terminal
} from 'lucide-react';

export default function Navbar({ activeRole, setActiveRole, onSearchVerify, onOpenDemoConsole }) {
  const [searchInput, setSearchInput] = useState('');

  const roles = [
    { id: 'ISSUER', label: 'Project Issuer', icon: Layers, desc: 'Sundarbans Marine Trust' },
    { id: 'AUDITOR', label: 'Auditor & Verifier', icon: ShieldCheck, desc: 'Global Carbon Standards' },
    { id: 'BUYER', label: 'Corporate Buyer', icon: Building, desc: 'Tech Zero Procurement' },
    { id: 'REGULATOR', label: 'Public Explorer', icon: Eye, desc: 'UNFCCC Chain of Custody' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchVerify(searchInput.trim());
    }
  };

  return (
    <header style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(6, 9, 14, 0.85)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Logo & Platform Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)'
          }}>
            <Satellite size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                CIRCULAR CARBON
              </span>
              <span style={{ 
                background: 'rgba(16, 185, 129, 0.15)', 
                color: '#34d399', 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                padding: '0.15rem 0.45rem', 
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                MRV 2.0
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Verifiable Carbon Credit & Offset Tracking System
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <div style={{ 
          display: 'flex', 
          background: 'rgba(15, 23, 42, 0.7)', 
          padding: '0.3rem', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)',
          gap: '0.25rem'
        }}>
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = activeRole === r.id;
            return (
              <button
                key={r.id}
                id={`role-btn-${r.id.toLowerCase()}`}
                onClick={() => setActiveRole(r.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.2))' : 'transparent',
                  color: isActive ? '#34d399' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent'
                }}
              >
                <Icon size={16} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Blockchain Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Verify Credit or Tx Hash..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-input"
              style={{ width: '220px', padding: '0.45rem 2rem 0.45rem 0.85rem', fontSize: '0.8rem' }}
            />
            <button 
              type="submit" 
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <Search size={15} />
            </button>
          </form>

          {/* Chain Status Pill */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.4rem 0.75rem', 
            borderRadius: '9999px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.75rem',
            color: '#34d399',
            fontWeight: 500
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            <span>Hardhat #31337</span>
          </div>

          {/* Live Demo Console Button */}
          <button 
            onClick={onOpenDemoConsole} 
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
            title="Open Interactive Demo Scenarios"
          >
            <Terminal size={14} color="#10b981" />
            <span>Demos</span>
          </button>
        </div>

      </div>
    </header>
  );
}
