import React, { useState, useEffect } from "react";
import { 
  Eye, 
  Activity, 
  ExternalLink, 
  FileCheck2, 
  Flame, 
  ShieldAlert, 
  Coins, 
  TreePine 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PageHeader, StatCard, RiskBadge, HashDisplay } from "@/components/shared";

interface Project {
  id: string;
  project_name: string;
  project_type: string;
  total_area_ha: number;
}

interface Claim {
  id: string;
  project_id: string;
  reported_tco2e: number;
  ml_estimated_tco2e: number;
  anomaly_score: number;
  verification_score: number;
  risk_level: string;
  status: string;
  evidence_hash?: string;
  blockchain_tx_hash?: string;
}

interface Credit {
  id: string;
  onchain_credit_id: number;
  amount: number;
  status: string;
}

interface RegulatorDashboardProps {
  projects: Project[];
  claims: Claim[];
  credits: Credit[];
  onSelectVerification: (id: string | number) => void;
}

export const RegulatorDashboard: React.FC<RegulatorDashboardProps> = ({
  projects,
  claims,
  credits,
  onSelectVerification,
}) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/regulator")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, [projects, claims, credits]);

  const activeCount = credits.filter((c) => c.status === "ACTIVE").length;
  const retiredCount = credits.filter((c) => c.status === "RETIRED").length;
  const rejectedCount = claims.filter((c) => c.status === "REJECTED").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <PageHeader
        title="Regulator & Public Ecosystem Explorer"
        badge="UNFCCC CHAIN OF CUSTODY"
        badgeVariant="default"
        description="Transparent global ledger view. Inspect all projects, remote-sensing hashes, auditor verifications, smart contract transactions, and permanent retirement logs."
      />

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Registered Projects"
          value={projects.length}
          subtitle="Blue Carbon Reserves"
          variant="default"
          icon={TreePine}
        />
        <StatCard
          title="Claims Evaluated"
          value={claims.length}
          subtitle="Remote Sensing Verified"
          variant="cyan"
          icon={Activity}
        />
        <StatCard
          title="Credits Issued"
          value={credits.length}
          subtitle="Unique On-Chain IDs"
          variant="emerald"
          icon={Coins}
        />
        <StatCard
          title="Credits Retired"
          value={retiredCount}
          subtitle="Permanent Burn State"
          variant="rose"
          icon={Flame}
        />
        <StatCard
          title="Fraud Rejections"
          value={rejectedCount}
          subtitle="Flagged by ML & Auditor"
          variant="amber"
          icon={ShieldAlert}
        />
      </div>

      {/* Claims & Lifecycle Overview Table */}
      <Card className="p-6 border-border/60 bg-card/80 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-emerald-400" />
          <h2 className="text-lg font-bold text-foreground font-['Outfit']">
            Carbon MRV Lifecycle Master Table
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim / Project</TableHead>
              <TableHead>Reported CO₂e</TableHead>
              <TableHead>ML Estimate</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Evidence Hash</TableHead>
              <TableHead className="text-right">Audit Trail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No claims available in ledger. Run a Demo scenario or submit a project claim to populate.
                </TableCell>
              </TableRow>
            ) : (
              claims.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold font-mono text-foreground">
                    #{c.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono text-foreground">
                    {c.reported_tco2e} tCO₂e
                  </TableCell>
                  <TableCell className="font-mono text-cyan-400">
                    {c.ml_estimated_tco2e.toFixed(1)} tCO₂e
                  </TableCell>
                  <TableCell>
                    <RiskBadge level={c.risk_level} />
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-400 font-mono">
                    {(c.verification_score * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell>
                    <RiskBadge level={c.status} label={c.status} />
                  </TableCell>
                  <TableCell>
                    <HashDisplay
                      hash={c.evidence_hash || "0x4f8b9a12c8e3..."}
                      startChars={6}
                      endChars={4}
                      copyable={false}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => onSelectVerification(c.id)}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1 border-border/60 hover:border-primary/50"
                    >
                      <span>Inspect</span>
                      <ExternalLink size={12} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default RegulatorDashboard;
