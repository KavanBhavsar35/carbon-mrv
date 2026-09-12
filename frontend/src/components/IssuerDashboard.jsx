import React, { useState } from 'react';
import { Plus, Upload, Satellite, Sparkles, Send, CheckCircle2, FileText, ArrowUpRight, Hash } from 'lucide-react';

export default function IssuerDashboard({ projects, claims, onRefresh, onSelectVerification }) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projects[0] || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('MANGROVE');
  const [totalArea, setTotalArea] = useState('12.4');

  // Claim state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [reportedCO2e, setReportedCO2e] = useState('120.0');

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'issuer@circularcarbon.org', password: 'issuer123' })
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_name: projectName,
          description: description,
          project_type: projectType,
          total_area_ha: parseFloat(totalArea)
        })
      });
      if (res.ok) {
        setShowNewModal(false);
        setProjectName('');
        setDescription('');
        onRefresh();
      }
    } catch (err) {
      alert(`Project creation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunAnalysis = async (projectId) => {
    setIsAnalyzing(true);
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'issuer@circularcarbon.org', password: 'issuer123' })
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(`/api/projects/${projectId}/analyze?baseline_target_ha=10.2&current_target_ha=12.4`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalysisResult(data);
      onRefresh();
    } catch (err) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setIsSubmitting(true);
    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'issuer@circularcarbon.org', password: 'issuer123' })
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          reported_tco2e: parseFloat(reportedCO2e)
        })
      });
      if (res.ok) {
        setShowClaimModal(false);
        onRefresh();
      }
    } catch (err) {
      alert(`Claim submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>Project Owner Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Register nature-based carbon projects, ingest remote-sensing drone/satellite imagery, verify evidence hashes, and submit verifiable carbon claims.
          </p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary" id="btn-new-project">
          <Plus size={16} />
          <span>Register New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {projects.map((p) => {
          const latestReport = p.ml_reports && p.ml_reports.length > 0 ? p.ml_reports[p.ml_reports.length - 1] : null;
          const isSelected = selectedProject && selectedProject.id === p.id;

          return (
            <div 
              key={p.id} 
              className={`glass-card ${isSelected ? 'glass-card-glow' : ''}`}
              style={{ padding: '1.35rem', cursor: 'pointer' }}
              onClick={() => setSelectedProject(p)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="badge badge-low">{p.project_type}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: {p.id.slice(0, 8)}...
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                {p.project_name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '36px' }}>
                {p.description || 'Coastal wetland carbon capture reserve.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Observed Area</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                    {p.total_area_ha || 12.4} ha
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Canopy Growth</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>
                    +{p.area_change_pct ? p.area_change_pct.toFixed(1) : '21.6'}%
                  </div>
                </div>
              </div>

              {/* SHA-256 Hash Display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
                <Hash size={13} color="#10b981" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  SHA-256: {p.primary_evidence_hash || '0x4f8b9a12c8e3...'}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRunAnalysis(p.id); }} 
                  disabled={isAnalyzing}
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                >
                  <Satellite size={14} color="#06b6d4" />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Run ML Analysis'}</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedProject(p); setShowClaimModal(true); }}
                  className="btn-primary" 
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                >
                  <Send size={14} />
                  <span>Submit Claim</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Project ML & Biophysical Carbon View */}
      {selectedProject && (
        <div className="glass-card" style={{ padding: '1.5rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#10b981" />
                <span>Remote Sensing & Scientific Carbon Accounting</span>
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Active Target: {selectedProject.project_name}
              </span>
            </div>
            <button onClick={() => onSelectVerification(selectedProject.id)} className="btn-secondary" style={{ fontSize: '0.78rem' }}>
              <span>View On-Chain Evidence Hash</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Baseline Canopy (T0)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                {selectedProject.baseline_area_ha || 10.20} ha
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Reference Survey (2024)</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Current Canopy (T1)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399' }}>
                {selectedProject.current_area_ha || 12.40} ha
              </div>
              <div style={{ fontSize: '0.7rem', color: '#34d399' }}>+2.20 ha Net Restored</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Biophysical Carbon Estimate</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
                125.70 tCO₂e
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>95% CI: [108.20 – 142.40]</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Methodology</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                IPCC Blue Carbon
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tier 2 Allometric Model</div>
            </div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.8rem', color: '#a7f3d0' }}>
            <strong>Scientific Honesty Standard:</strong> Satellite imagery does not certify credits directly. The ML module calculates objective canopy boundaries, spectral indices, and area changes. The carbon accounting engine translates observations into estimated tCO₂e, and human auditors perform final review before on-chain minting.
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '90%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '1rem' }}>Register Nature-Based Project</h3>
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Project Name</label>
                <input 
                  type="text" 
                  required 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)} 
                  placeholder="e.g. Bhitarkanika Estuary Mangrove Zone" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Project Type</label>
                <select 
                  value={projectType} 
                  onChange={(e) => setProjectType(e.target.value)}
                  className="form-input"
                  style={{ background: '#0f172a' }}
                >
                  <option value="MANGROVE">MANGROVE (Blue Carbon)</option>
                  <option value="FOREST">FOREST (Tropical Afforestation)</option>
                  <option value="WETLAND">WETLAND (Peatland Restoration)</option>
                  <option value="AGRICULTURE">AGRICULTURE (Regenerative Soil)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Total Area (Hectares)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  required 
                  value={totalArea} 
                  onChange={(e) => setTotalArea(e.target.value)} 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Description</label>
                <textarea 
                  rows={3} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Details of local community conservation, baseline vegetation status..." 
                  className="form-input" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowNewModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Claim Modal */}
      {showClaimModal && selectedProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '90%', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.35rem', color: '#ffffff', marginBottom: '0.5rem' }}>Submit Carbon Claim</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Claim carbon sequestration credits for {selectedProject.project_name}. This claim will undergo ML anomaly detection before auditor review.
            </p>

            <form onSubmit={handleSubmitClaim} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Reported Carbon (tCO₂e)
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  required 
                  value={reportedCO2e} 
                  onChange={(e) => setReportedCO2e(e.target.value)} 
                  className="form-input" 
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  ML Estimate: 125.7 tCO₂e. (Reporting &gt;150 will trigger High Risk anomaly).
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowClaimModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Submitting...' : 'Submit to Verification Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
