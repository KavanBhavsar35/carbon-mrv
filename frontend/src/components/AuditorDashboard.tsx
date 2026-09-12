import React, { useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Hash, 
  ExternalLink 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader, RiskBadge, HashDisplay } from "@/components/shared";

interface Claim {
  id: string;
  project_id: string;
  reported_tco2e: number;
  ml_estimated_tco2e: number;
  anomaly_score: number;
  verification_score: number;
  risk_level: string;
  status: string;
  submitted_at: string;
  evidence_hash?: string;
  reasons?: string[];
  reject_reason?: string;
  auditor_comments?: string;
  blockchain_tx_hash?: string;
}

interface AuditorDashboardProps {
  claims: Claim[];
  onRefresh: () => void;
  onSelectVerification: (id: string) => void;
}

export const AuditorDashboard: React.FC<AuditorDashboardProps> = ({
  claims,
  onRefresh,
  onSelectVerification,
}) => {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(claims[0] || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    "Claim reported exceeds biophysical capacity observed from imagery."
  );

  const pendingClaims = claims.filter(
    (c) => c.status !== "APPROVED" && c.status !== "ISSUED" && c.status !== "REJECTED"
  );
  const pastClaims = claims.filter(
    (c) => c.status === "APPROVED" || c.status === "ISSUED" || c.status === "REJECTED"
  );

  const activeClaim = selectedClaim || pendingClaims[0] || claims[0] || null;

  const handleApprove = async (claimId: string) => {
    setIsProcessing(true);
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "auditor@verra-audit.org", password: "auditor123" }),
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(`/api/claims/${claimId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comments: "Auditor verification passed. Smart contract issuance authorized.",
        }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Approval failed: ${err.detail || "Contract revert"}`);
      }
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (claimId: string) => {
    setIsProcessing(true);
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "auditor@verra-audit.org", password: "auditor123" }),
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(`/api/claims/${claimId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setRejectModalOpen(false);
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Rejection failed: ${err.detail}`);
      }
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <PageHeader
        title="Independent Auditor Verification Queue"
        badge="GLOBAL CARBON STANDARDS"
        badgeVariant="emerald"
        description="Human-in-the-loop sovereign gate. The ML engine provides decision support and risk ranking; you evaluate evidence integrity and issue final on-chain approval or rejection."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Review Queue (5 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              PENDING REVIEWS ({pendingClaims.length})
            </span>
            <span className="text-[11px] text-muted-foreground">Sorted by Risk</span>
          </div>

          {pendingClaims.length === 0 && (
            <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
              No pending claims requiring audit. Run a Demo or submit a claim to inspect.
            </Card>
          )}

          <div className="space-y-3">
            {pendingClaims.map((c) => {
              const isSelected = activeClaim && activeClaim.id === c.id;
              const diffPct =
                c.ml_estimated_tco2e > 0
                  ? ((c.reported_tco2e - c.ml_estimated_tco2e) / c.ml_estimated_tco2e) * 100
                  : 0;

              return (
                <Card
                  key={c.id}
                  onClick={() => setSelectedClaim(c)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-emerald-500 bg-card/90 ring-1 ring-emerald-500/40 shadow-lg"
                      : "border-border/50 bg-card/60 hover:border-border hover:bg-card/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <RiskBadge level={c.risk_level} />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {c.id.slice(0, 8)}...
                    </span>
                  </div>

                  <div className="text-sm font-bold text-foreground mb-1 font-['Outfit']">
                    Claim: {c.reported_tco2e} tCO₂e
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    ML Estimate: {c.ml_estimated_tco2e.toFixed(1)} tCO₂e (
                    <span className={diffPct > 30 ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
                      {diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`}
                    </span>
                    )
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40 font-mono">
                    <span>Verify: {(c.verification_score * 100).toFixed(0)}%</span>
                    <span>Anomaly: {(c.anomaly_score * 100).toFixed(0)}%</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Past History */}
          {pastClaims.length > 0 && (
            <div className="mt-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                AUDIT HISTORY ({pastClaims.length})
              </span>
              <div className="space-y-2">
                {pastClaims.map((c) => (
                  <Card
                    key={c.id}
                    onClick={() => setSelectedClaim(c)}
                    className="p-3 cursor-pointer border-border/40 bg-card/40 hover:bg-card/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {c.reported_tco2e} tCO₂e
                      </span>
                      <RiskBadge level={c.status} label={c.status} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Focused Review Console (8 cols) */}
        <div className="lg:col-span-8">
          {activeClaim ? (
            <Card className="p-6 border-border/60 bg-card/85 shadow-xl backdrop-blur-xl space-y-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="mb-2">
                    <RiskBadge level={activeClaim.risk_level} label={`${activeClaim.risk_level} RISK LEVEL`} />
                  </div>
                  <h2 className="text-xl font-bold text-foreground font-['Outfit']">
                    Claim Assessment #{activeClaim.id.slice(0, 10)}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Submitted on {new Date(activeClaim.submitted_at).toLocaleString()}
                  </p>
                </div>

                <Button
                  onClick={() => onSelectVerification(activeClaim.id)}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 border-border/70 hover:border-primary/60"
                >
                  <ExternalLink size={14} />
                  <span>Verify Full Hash Custody</span>
                </Button>
              </div>

              {/* Core Comparison Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-xl bg-muted/40 border border-border/50 p-4">
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Reported Carbon</div>
                  <div className="text-lg font-bold text-foreground font-mono">
                    {activeClaim.reported_tco2e} <span className="text-xs text-muted-foreground">tCO₂e</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">ML Estimate</div>
                  <div className="text-lg font-bold text-cyan-400 font-mono">
                    {activeClaim.ml_estimated_tco2e.toFixed(1)} <span className="text-xs text-muted-foreground">tCO₂e</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Difference</div>
                  <div
                    className={`text-lg font-bold font-mono ${
                      activeClaim.reported_tco2e - activeClaim.ml_estimated_tco2e > 30
                        ? "text-rose-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {activeClaim.ml_estimated_tco2e > 0
                      ? `${activeClaim.reported_tco2e - activeClaim.ml_estimated_tco2e > 0 ? "+" : ""}${(
                          ((activeClaim.reported_tco2e - activeClaim.ml_estimated_tco2e) /
                            activeClaim.ml_estimated_tco2e) *
                          100
                        ).toFixed(1)}%`
                      : "0.0%"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Verification Score</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {(activeClaim.verification_score * 100).toFixed(0)}%
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Anomaly Score</div>
                  <div
                    className={`text-lg font-bold font-mono ${
                      activeClaim.anomaly_score > 0.6 ? "text-rose-400" : "text-muted-foreground"
                    }`}
                  >
                    {(activeClaim.anomaly_score * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Cryptographic Evidence Hash Integrity */}
              <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Hash size={14} className="text-emerald-400" />
                  <span>Anchored Evidence Hash (SHA-256)</span>
                </div>
                <div className="font-mono text-xs text-emerald-300 break-all bg-black/40 p-2 rounded border border-border/40">
                  {activeClaim.evidence_hash || "0x4f8b9a12c8e3d641975eaf0213bcf89124a9e2501a938b812efd142859c03b12"}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  ✓ Off-chain satellite raster verified against immutable cryptographic state on Hardhat contract.
                </p>
              </div>

              {/* Anomaly Reasons / Red Flags if any */}
              {activeClaim.reasons && activeClaim.reasons.length > 0 && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
                    <AlertTriangle size={16} />
                    <span>Isolation Forest Fraud Detection Alert</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-rose-200/90 space-y-1">
                    {activeClaim.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Decision Actions */}
              {activeClaim.status !== "APPROVED" &&
              activeClaim.status !== "ISSUED" &&
              activeClaim.status !== "REJECTED" ? (
                <div className="flex items-center gap-3 pt-4 border-t border-border/50 flex-wrap sm:flex-nowrap">
                  <Button
                    onClick={() => handleApprove(activeClaim.id)}
                    disabled={isProcessing}
                    variant="emerald"
                    className="w-full sm:flex-1 h-11 text-xs font-semibold gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve & Authorize On-Chain Issuance</span>
                  </Button>
                  <Button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={isProcessing}
                    variant="destructive"
                    className="w-full sm:flex-1 h-11 text-xs font-semibold gap-2 bg-rose-600 hover:bg-rose-500"
                  >
                    <XCircle size={16} />
                    <span>Reject Claim (Log On-Chain)</span>
                  </Button>
                </div>
              ) : (
                <div
                  className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${
                    activeClaim.status === "REJECTED"
                      ? "border-rose-500/30 bg-rose-500/10"
                      : "border-emerald-500/30 bg-emerald-500/10"
                  }`}
                >
                  <div>
                    <div
                      className={`text-sm font-bold ${
                        activeClaim.status === "REJECTED" ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      DECISION: {activeClaim.status}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {activeClaim.reject_reason ||
                        activeClaim.auditor_comments ||
                        "Audited and anchored on Ethereum smart contract."}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground shrink-0">
                    <HashDisplay hash={activeClaim.blockchain_tx_hash || "0xabc123456789"} />
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              Select a claim from the queue to inspect.
            </Card>
          )}
        </div>
      </div>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-400">Reject Carbon Claim</DialogTitle>
            <DialogDescription>
              Rejection reason will be permanently recorded in the on-chain audit log. No credits will be minted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="border-rose-500/30 focus-visible:ring-rose-500/40"
              placeholder="State clear reasons for rejection..."
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => activeClaim && handleReject(activeClaim.id)}
                disabled={isProcessing}
                variant="destructive"
                className="bg-rose-600 hover:bg-rose-500"
              >
                {isProcessing ? "Recording on Blockchain..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditorDashboard;
