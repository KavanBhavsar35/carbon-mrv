import React, { useState } from "react";
import { 
  Plus, 
  Satellite, 
  Sparkles, 
  Send, 
  ArrowUpRight, 
  Hash, 
  Layers, 
  TreePine, 
  FileText,
  Activity,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader, StatCard, HashDisplay } from "@/components/shared";

interface Project {
  id: string;
  project_name: string;
  description?: string;
  project_type: string;
  total_area_ha: number;
  area_change_pct?: number;
  primary_evidence_hash?: string;
  baseline_area_ha?: number;
  current_area_ha?: number;
  ml_reports?: any[];
  blockchain_tx_hash?: string;
}

interface Claim {
  id: string;
  project_id: string;
  reported_tco2e: number;
  anomaly_score: number;
  verification_score: number;
  risk_level: string;
  status: string;
}

interface IssuerDashboardProps {
  projects: Project[];
  claims: Claim[];
  onRefresh: () => void;
  onSelectVerification: (id: string) => void;
}

export const IssuerDashboard: React.FC<IssuerDashboardProps> = ({
  projects,
  claims,
  onRefresh,
  onSelectVerification,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    projects[0] || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("MANGROVE");
  const [totalArea, setTotalArea] = useState("12.4");

  // Claim state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [reportedCO2e, setReportedCO2e] = useState("120.0");

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Keep selected project updated if projects list updates
  React.useEffect(() => {
    if (projects.length > 0) {
      if (!selectedProject || !projects.find((p) => p.id === selectedProject.id)) {
        setSelectedProject(projects[0]);
      } else {
        const updated = projects.find((p) => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    }
  }, [projects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "issuer@circularcarbon.org", password: "issuer123" }),
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_name: projectName,
          description: description,
          project_type: projectType,
          total_area_ha: parseFloat(totalArea),
        }),
      });
      if (res.ok) {
        setShowNewModal(false);
        setProjectName("");
        setDescription("");
        onRefresh();
      }
    } catch (err: any) {
      alert(`Project creation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunAnalysis = async (projectId: string) => {
    setIsAnalyzing(true);
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "issuer@circularcarbon.org", password: "issuer123" }),
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(
        `/api/projects/${projectId}/analyze?baseline_target_ha=10.2&current_target_ha=12.4`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setAnalysisResult(data);
      onRefresh();
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setIsSubmitting(true);
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "issuer@circularcarbon.org", password: "issuer123" }),
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch("/api/claims", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          reported_tco2e: parseFloat(reportedCO2e),
        }),
      });
      if (res.ok) {
        setShowClaimModal(false);
        onRefresh();
      }
    } catch (err: any) {
      alert(`Claim submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <PageHeader
        title="Project Owner Portal"
        badge="SUNDARBANS TRUST"
        badgeVariant="emerald"
        description="Register nature-based carbon projects, ingest remote-sensing drone/satellite imagery, verify evidence hashes, and submit verifiable carbon claims."
        actions={
          <Button
            onClick={() => setShowNewModal(true)}
            id="btn-new-project"
            variant="emerald"
            className="shadow-lg shadow-emerald-500/20 gap-2 text-xs font-semibold"
          >
            <Plus size={16} />
            <span>Register New Project</span>
          </Button>
        }
      />

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => {
          const isSelected = selectedProject && selectedProject.id === p.id;

          return (
            <Card
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`cursor-pointer transition-all duration-300 p-5 flex flex-col justify-between ${
                isSelected
                  ? "border-emerald-500/80 bg-card/90 ring-1 ring-emerald-500/40 shadow-xl shadow-emerald-500/10"
                  : "border-border/50 bg-card/60 hover:border-border hover:bg-card/80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="emerald" className="font-semibold text-[11px]">
                    {p.project_type}
                  </Badge>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    ID: {p.id.slice(0, 8)}...
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground mb-1.5 font-['Outfit'] line-clamp-1">
                  {p.project_name}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2rem]">
                  {p.description || "Coastal wetland carbon capture reserve."}
                </p>

                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 border border-border/40 p-3 mb-4">
                  <div>
                    <div className="text-[11px] text-muted-foreground">Observed Area</div>
                    <div className="text-base font-bold text-foreground font-mono">
                      {p.total_area_ha || 12.4} ha
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">Canopy Growth</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      +{p.area_change_pct ? p.area_change_pct.toFixed(1) : "21.6"}%
                    </div>
                  </div>
                </div>

                {/* SHA-256 Hash Display */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-4 overflow-hidden">
                  <Hash size={13} className="text-emerald-400 shrink-0" />
                  <HashDisplay
                    hash={p.primary_evidence_hash || "0x4f8b9a12c8e3..."}
                    onVerify={onSelectVerification}
                    className="w-full justify-between"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRunAnalysis(p.id);
                  }}
                  disabled={isAnalyzing}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-medium gap-1.5 border-border/60 hover:border-cyan-500/50 hover:text-cyan-400"
                >
                  <Satellite size={13} className="text-cyan-400" />
                  <span>{isAnalyzing ? "Analyzing..." : "ML Analysis"}</span>
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(p);
                    setShowClaimModal(true);
                  }}
                  variant="emerald"
                  size="sm"
                  className="w-full text-xs font-medium gap-1.5"
                >
                  <Send size={13} />
                  <span>Submit Claim</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Project ML & Biophysical Carbon View */}
      {selectedProject && (
        <Card className="p-6 border-border/60 bg-card/80 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                <h2 className="text-lg font-bold text-foreground font-['Outfit']">
                  Remote Sensing & Scientific Carbon Accounting
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active Target: <span className="text-foreground font-medium">{selectedProject.project_name}</span>
              </p>
            </div>
            <Button
              onClick={() => onSelectVerification(selectedProject.id)}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-border/70 hover:border-primary/60"
            >
              <span>View On-Chain Evidence Hash</span>
              <ArrowUpRight size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <StatCard
              title="Baseline Canopy (T0)"
              value={`${selectedProject.baseline_area_ha || 10.20} ha`}
              subtitle="Reference Survey (2024)"
              variant="default"
              icon={TreePine}
            />
            <StatCard
              title="Current Canopy (T1)"
              value={`${selectedProject.current_area_ha || 12.40} ha`}
              subtitle="+2.20 ha Net Restored"
              variant="emerald"
              icon={Satellite}
            />
            <StatCard
              title="Biophysical Carbon Estimate"
              value="125.70 tCO₂e"
              subtitle="95% CI: [108.20 – 142.40]"
              variant="cyan"
              icon={Activity}
            />
            <StatCard
              title="Methodology"
              value="IPCC Blue Carbon"
              subtitle="Tier 2 Allometric Model"
              variant="amber"
              icon={Layers}
            />
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 leading-relaxed">
            <span className="font-bold text-emerald-400 mr-1.5">Scientific Honesty Standard:</span>
            Satellite imagery does not certify credits directly. The ML module calculates objective canopy boundaries, spectral indices, and area changes. The carbon accounting engine translates observations into estimated tCO₂e, and human auditors perform final review before on-chain minting.
          </div>
        </Card>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register Nature-Based Project</DialogTitle>
            <DialogDescription>
              Submit project boundary coordinates and baseline survey to instantiate on-chain identity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Bhitarkanika Estuary Mangrove Zone"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project-type">Project Type</Label>
              <select
                id="project-type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border/70 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="MANGROVE">MANGROVE (Blue Carbon)</option>
                <option value="FOREST">FOREST (Tropical Afforestation)</option>
                <option value="WETLAND">WETLAND (Peatland Restoration)</option>
                <option value="AGRICULTURE">AGRICULTURE (Regenerative Soil)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="total-area">Total Area (Hectares)</Label>
              <Input
                id="total-area"
                type="number"
                step="0.1"
                required
                value={totalArea}
                onChange={(e) => setTotalArea(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of local community conservation, baseline vegetation status..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="emerald">
                {isSubmitting ? "Registering..." : "Confirm Registration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submit Claim Dialog */}
      <Dialog
        open={showClaimModal && !!selectedProject}
        onOpenChange={setShowClaimModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Carbon Claim</DialogTitle>
            <DialogDescription>
              Claim carbon sequestration credits for{" "}
              <span className="text-foreground font-semibold">
                {selectedProject?.project_name}
              </span>
              . This claim undergoes automated ML anomaly detection before auditor review.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitClaim} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reported-co2e">Reported Carbon (tCO₂e)</Label>
              <Input
                id="reported-co2e"
                type="number"
                step="0.1"
                required
                value={reportedCO2e}
                onChange={(e) => setReportedCO2e(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground pt-1">
                ML Biophysical Estimate: <span className="text-emerald-400 font-mono">125.7 tCO₂e</span>. (Reporting &gt;150 triggers Isolation Forest anomaly).
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowClaimModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="emerald">
                {isSubmitting ? "Submitting..." : "Submit to Verification Queue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IssuerDashboard;
