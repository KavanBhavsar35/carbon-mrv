import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Satellite, 
  Cpu, 
  Hash, 
  Flame, 
  CheckCircle2, 
  ExternalLink,
  Activity,
  Layers
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskBadge, HashDisplay } from "@/components/shared";

interface VerificationModalProps {
  identifier: string | number | null;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  identifier,
  onClose,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) return;
    setLoading(true);
    setError(null);
    fetch(`/api/verify/${identifier}`)
      .then((res) => {
        if (!res.ok) throw new Error("Provenance record not found");
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
    <Dialog open={!!identifier} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6 border-emerald-500/30 bg-card/95 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-['Outfit']">
                Verifiable MRV Chain of Custody
              </DialogTitle>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                Target Query: {String(identifier)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {loading && (
          <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <p>Retrieving cryptographic provenance from smart contract registry...</p>
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-sm text-rose-400">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-4 pt-2">
            {/* Status Summary Banner */}
            <div
              className={`rounded-xl border p-4 flex items-center justify-between gap-4 flex-wrap ${
                data.summary?.retired
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              <div>
                <div className="mb-1.5">
                  <Badge
                    variant={data.summary?.retired ? "rose" : "emerald"}
                    className="text-[11px] font-bold"
                  >
                    {data.summary?.retired ? "PERMANENTLY RETIRED" : "ACTIVE VERIFIED CREDIT"}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-foreground font-['Outfit']">
                  {data.summary?.tco2e_amount} tCO₂e — {data.summary?.project_name}
                </div>
                {data.summary?.retired_reason && (
                  <div className="text-xs text-rose-300 italic mt-1">
                    Offset Purpose: "{data.summary.retired_reason}"
                  </div>
                )}
              </div>

              {data.summary?.credit_id && (
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground">On-Chain Credit ID</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    #{data.summary.credit_id}
                  </div>
                </div>
              )}
            </div>

            {/* Step 1: Satellite / Drone Evidence Integrity */}
            <Card className="p-4 border-border/60 bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Satellite size={15} />
                <span>Step 1: Remote-Sensing Drone / Satellite Evidence (Off-Chain Vault)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Raw imagery files are hashed deterministically. Only the SHA-256 hash is anchored on Ethereum to prevent silent alteration.
              </p>
              <div className="rounded-lg bg-black/50 border border-border/50 p-2.5 font-mono text-xs text-emerald-300 break-all">
                Anchored Evidence Hash: {data.evidence_integrity?.primary_evidence_hash || "0x4f8b9a12c8e3d641975eaf0213bcf89124a9e2501a938b812efd142859c03b12"}
              </div>
            </Card>

            {/* Step 2: ML Remote Sensing & Carbon Accounting */}
            <Card className="p-4 border-border/60 bg-muted/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Cpu size={15} />
                <span>Step 2: ML Vegetation Change & Biophysical Carbon Modeling</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Canopy Growth</span>
                  <strong className="text-emerald-400 font-mono">
                    +{data.remote_sensing_ml?.vegetation_change_pct}%
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Net Observed Area</span>
                  <strong className="text-foreground font-mono">
                    {data.remote_sensing_ml?.current_area_ha} ha
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Estimated Carbon</span>
                  <strong className="text-cyan-400 font-mono">
                    {data.remote_sensing_ml?.estimated_carbon_tco2e} tCO₂e
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Methodology</span>
                  <strong className="text-foreground">
                    {data.remote_sensing_ml?.methodology || "IPCC Blue Carbon"}
                  </strong>
                </div>
              </div>
            </Card>

            {/* Step 3: Human Auditor & ML Anomaly Detection */}
            <Card className="p-4 border-border/60 bg-muted/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ShieldCheck size={15} />
                <span>Step 3: ML Claim Anomaly Risk & Human Auditor Sovereign Gate</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-center">
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">Risk Level</span>
                  <RiskBadge level={data.audit_and_verification?.risk_level || "LOW"} />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">Verification Score</span>
                  <strong className="text-emerald-400 font-mono">
                    {data.audit_and_verification?.verification_score_pct}%
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">Human Auditor Decision</span>
                  <strong
                    className={
                      data.audit_and_verification?.auditor_approved
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }
                  >
                    {data.audit_and_verification?.auditor_approved
                      ? "APPROVED"
                      : "PENDING / REJECTED"}
                  </strong>
                </div>
              </div>
            </Card>

            {/* Step 4: Blockchain Immutable Audit Trail */}
            <Card className="p-4 border-border/60 bg-muted/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <Hash size={15} />
                <span>Step 4: Smart Contract Lifecycle Transactions (Hardhat / Ethereum)</span>
              </div>

              {data.blockchain_audit_trail && data.blockchain_audit_trail.length > 0 ? (
                <div className="space-y-2">
                  {data.blockchain_audit_trail.map((tx: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-black/50 border border-border/50 p-2.5 font-mono text-xs flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-purple-400">{tx.event_name}</span>
                          <span className="text-muted-foreground text-[11px]">Block #{tx.block_number}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground break-all">
                          Tx: {tx.tx_hash}
                        </div>
                      </div>
                      <Badge variant="emerald" className="text-[10px]">
                        {tx.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No blockchain transactions registered yet for this query.
                </p>
              )}
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VerificationModal;
