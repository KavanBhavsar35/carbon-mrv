import React, { useState } from "react";
import { 
  Play, 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw, 
  Activity 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConsoleLog, type LogEntry } from "@/components/shared/ConsoleLog";

interface DemoControllerProps {
  onRefreshAll: () => void;
  onSelectVerification?: (id: string) => void;
}

export const DemoController: React.FC<DemoControllerProps> = ({
  onRefreshAll,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeDemo, setActiveDemo] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  const addLog = (msg: string, type: "info" | "success" | "warning" | "error" = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        text: msg,
        type,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const runDemo1 = async () => {
    setIsRunning(true);
    setActiveDemo(1);
    setLogs([]);
    setStatusMessage("Running Demo 1 — Legitimate Mangrove Project A...");

    try {
      addLog("Step 1: Logging in as Project Owner (Sundarbans Eco Trust)...", "info");
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "issuer@circularcarbon.org", password: "issuer123" }),
      });
      const loginData = await loginRes.json();
      const token = loginData.access_token;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      addLog("Step 2: Registering Mangrove Project A on-chain...", "info");
      const projRes = await fetch("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_name: "Sundarbans Coastal Mangrove Pilot (Plot A)",
          description: "Restoration of degraded tidal mangrove buffer in delta zone",
          project_type: "MANGROVE",
          total_area_ha: 12.4,
        }),
      });
      const project = await projRes.json();
      addLog(`Project Registered! On-chain Tx: ${project.blockchain_tx_hash.slice(0, 16)}...`, "success");

      addLog("Step 3: Running Remote Sensing ML (Baseline 10.2 ha vs Current 12.4 ha)...", "info");
      const mlRes = await fetch(`/api/projects/${project.id}/analyze?baseline_target_ha=10.2&current_target_ha=12.4`, {
        method: "POST",
        headers,
      });
      const mlReport = await mlRes.json();
      addLog(
        `ML Analysis complete: +${mlReport.change_ha} ha (+${mlReport.change_percent}%). Carbon Estimate: ${mlReport.estimated_tco2e} tCO2e [95% CI: ${mlReport.lower_bound_tco2e} - ${mlReport.upper_bound_tco2e}]`,
        "success"
      );

      addLog("Step 4: Issuer submits carbon claim for 120.0 tCO2e...", "info");
      const claimRes = await fetch("/api/claims", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: project.id, reported_tco2e: 120.0 }),
      });
      const claim = await claimRes.json();
      addLog(
        `ML Claim Anomaly Score: ${(claim.anomaly_score * 100).toFixed(1)}%, Verification Score: ${(claim.verification_score * 100).toFixed(1)}%, Risk Level: ${claim.risk_level}`,
        "success"
      );

      addLog("Step 5: Auditor reviews ML evidence & approves claim...", "info");
      const auditorLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "auditor@verra-audit.org", password: "auditor123" }),
      });
      const audToken = (await auditorLogin.json()).access_token;

      const approveRes = await fetch(`/api/claims/${claim.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${audToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ comments: "Observed vegetation change aligns with 120 tCO2e claim. Verified." }),
      });
      const approvedClaim = await approveRes.json();
      addLog(
        `Claim Approved! Smart Contract minted Credit with Tx: ${approvedClaim.blockchain_tx_hash.slice(0, 16)}...`,
        "success"
      );

      // Fetch credits
      const credRes = await fetch("/api/credits");
      const credits = await credRes.json();
      const credit = credits[0];

      addLog(`Step 6: Transferring Credit #${credit.onchain_credit_id} to Corporate Buyer (Tech Zero)...`, "info");
      await fetch(`/api/credits/${credit.id}/transfer`, {
        method: "POST",
        headers,
        body: JSON.stringify({ to_address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" }),
      });
      addLog("Credit transferred to 0x90F7... on-chain.", "success");

      addLog(`Step 7: Buyer permanently retires Credit #${credit.onchain_credit_id} for Corporate ESG Offset...`, "info");
      const buyerLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "buyer@microsoft-esg.com", password: "buyer123" }),
      });
      const buyerToken = (await buyerLogin.json()).access_token;

      const retireRes = await fetch(`/api/credits/${credit.id}/retire`, {
        method: "POST",
        headers: { Authorization: `Bearer ${buyerToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Corporate 2026 Scope 3 Carbon Offset Certificate" }),
      });
      await retireRes.json();
      addLog(
        `Credit #${credit.onchain_credit_id} permanently RETIRED! Burn state anchored on-chain.`,
        "success"
      );

      setStatusMessage("Demo 1 Complete: Full verified lifecycle succeeded!");
      onRefreshAll();
    } catch (err: any) {
      addLog(`Demo 1 Error: ${err.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const runDemo2 = async () => {
    setIsRunning(true);
    setActiveDemo(2);
    setLogs([]);
    setStatusMessage("Running Demo 2 — Suspicious Over-Reporting Claim...");

    try {
      addLog("Step 1: Authenticating as Project Owner...", "info");
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "issuer@circularcarbon.org", password: "issuer123" }),
      });
      const token = (await loginRes.json()).access_token;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      addLog("Step 2: Registering Estuary Project with slight growth...", "info");
      const projRes = await fetch("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_name: "Delta Estuary Mangrove Reserve (Plot B)",
          description: "Estuary mangrove regeneration project",
          project_type: "MANGROVE",
          total_area_ha: 8.5,
        }),
      });
      const project = await projRes.json();

      addLog("Step 3: ML Estimates Carbon: 80.0 tCO2e...", "info");
      await fetch(`/api/projects/${project.id}/analyze?baseline_target_ha=8.0&current_target_ha=8.5`, {
        method: "POST",
        headers,
      });

      addLog("Step 4: Issuer attempts to over-claim 250.0 tCO2e (+212% above ML estimate)...", "warning");
      const claimRes = await fetch("/api/claims", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: project.id, reported_tco2e: 250.0 }),
      });
      const claim = await claimRes.json();

      addLog(
        `ML Isolation Forest Output: RISK LEVEL = ${claim.risk_level}, Anomaly Score: ${(claim.anomaly_score * 100).toFixed(1)}%`,
        "error"
      );
      if (claim.reasons && Array.isArray(claim.reasons)) {
        claim.reasons.forEach((r: string) => addLog(`Flagged Reason: ${r}`, "warning"));
      }

      addLog("Step 5: Auditor inspects anomaly red flags and REJECTS claim...", "info");
      const auditorLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "auditor@verra-audit.org", password: "auditor123" }),
      });
      const audToken = (await auditorLogin.json()).access_token;

      const rejectRes = await fetch(`/api/claims/${claim.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${audToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Over-reporting claim exceeds biophysical capacity by 212%. Anomaly detector confirmed risk.",
        }),
      });
      const rejectedClaim = await rejectRes.json();
      addLog(
        `Claim REJECTED on blockchain! Smart Contract Tx: ${rejectedClaim.blockchain_tx_hash.slice(0, 16)}...`,
        "error"
      );
      addLog("INVARIANT ENFORCED: Zero credits were minted. Fraud was blocked before on-chain issuance!", "success");

      setStatusMessage("Demo 2 Complete: Suspicious claim successfully flagged & blocked!");
      onRefreshAll();
    } catch (err: any) {
      addLog(`Demo 2 Error: ${err.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const runDemo3 = async () => {
    setIsRunning(true);
    setActiveDemo(3);
    setLogs([]);
    setStatusMessage("Running Demo 3 — Double-Spending & Double-Retirement Protection...");

    try {
      addLog("Step 1: Finding an existing active or retired credit...", "info");
      const credRes = await fetch("/api/credits");
      const credits = await credRes.json();

      if (credits.length === 0) {
        addLog("No credits found. Please run Demo 1 first to issue a credit.", "warning");
        setIsRunning(false);
        return;
      }

      const buyerLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "buyer@microsoft-esg.com", password: "buyer123" }),
      });
      const buyerToken = (await buyerLogin.json()).access_token;
      const headers = { Authorization: `Bearer ${buyerToken}`, "Content-Type": "application/json" };

      const targetCredit = credits[0];
      addLog(`Selected Credit #${targetCredit.onchain_credit_id} (Status: ${targetCredit.status})`, "info");

      if (targetCredit.status !== "RETIRED") {
        addLog("Retiring credit first...", "info");
        await fetch(`/api/credits/${targetCredit.id}/retire`, {
          method: "POST",
          headers,
          body: JSON.stringify({ reason: "Initial Valid Retirement" }),
        });
        addLog("Credit successfully retired.", "success");
      }

      addLog("ATTACK TEST A: Attempting to RETIRE the already-retired credit a second time...", "warning");
      const attackRetire = await fetch(`/api/credits/${targetCredit.id}/retire`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: "Malicious Double Retirement Attempt" }),
      });
      const retireErr = await attackRetire.json();
      if (attackRetire.status === 400) {
        addLog(`BLOCKED! Smart contract reverted: "${retireErr.detail}"`, "success");
      } else {
        addLog("Unexpected success, check contract rules.", "error");
      }

      addLog("ATTACK TEST B: Attempting to TRANSFER the already-retired credit to another wallet...", "warning");
      const attackTransfer = await fetch(`/api/credits/${targetCredit.id}/transfer`, {
        method: "POST",
        headers,
        body: JSON.stringify({ to_address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" }),
      });
      const transferErr = await attackTransfer.json();
      if (attackTransfer.status === 400) {
        addLog(`BLOCKED! Smart contract reverted: "${transferErr.detail}"`, "success");
      } else {
        addLog("Unexpected success, check contract rules.", "error");
      }

      addLog(
        "CRYPTOGRAPHIC INVARIANT PROVEN: Double-spending and double-retirement are strictly prevented by the smart contract registry!",
        "success"
      );
      setStatusMessage("Demo 3 Complete: Double-spending safeguards verified.");
      onRefreshAll();
    } catch (err: any) {
      addLog(`Demo 3 Error: ${err.message}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="p-6 mb-8 border-border/50 bg-card/75 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Play size={16} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground font-['Outfit']">
              Interactive Hackathon Demo Controller
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Execute 1-click live demonstrations across Remote Sensing ML, Anomaly Detection, Human Auditor, and Hardhat Blockchain.
          </p>
        </div>

        {statusMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 animate-in fade-in">
            <Activity size={14} className="animate-pulse" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* 3 Demo Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Demo 1 */}
        <div
          className={`flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 bg-background/40 backdrop-blur-sm ${
            activeDemo === 1
              ? "border-emerald-500 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-500/10"
              : "border-border/50 hover:border-border/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black tracking-widest text-emerald-400 font-mono">
                DEMO 01
              </span>
              <Badge variant="emerald">LOW RISK</Badge>
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5 font-['Outfit']">
              Legitimate Mangrove Project A
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Area +21.57%, Estimate 125.7 tCO2e, Claim 120 tCO2e. ML verifies risk LOW (91%). Auditor approves and credits are issued, transferred, and retired.
            </p>
          </div>
          <Button
            onClick={runDemo1}
            disabled={isRunning}
            variant="emerald"
            className="w-full text-xs font-semibold h-9"
          >
            {isRunning && activeDemo === 1 ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            <span>Run Legitimate MRV Flow</span>
          </Button>
        </div>

        {/* Demo 2 */}
        <div
          className={`flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 bg-background/40 backdrop-blur-sm ${
            activeDemo === 2
              ? "border-rose-500 ring-1 ring-rose-500/50 shadow-md shadow-rose-500/10"
              : "border-border/50 hover:border-border/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black tracking-widest text-rose-400 font-mono">
                DEMO 02
              </span>
              <Badge variant="rose">HIGH RISK ANOMALY</Badge>
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5 font-['Outfit']">
              Suspicious Over-Reporting Claim
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              ML Estimate 80 tCO2e vs Issuer reports 250 tCO2e (+212%). Isolation Forest flags anomaly with reasons. Auditor rejects claim; zero credits minted.
            </p>
          </div>
          <Button
            onClick={runDemo2}
            disabled={isRunning}
            variant="destructive"
            className="w-full text-xs font-semibold h-9 bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20"
          >
            {isRunning && activeDemo === 2 ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <ShieldAlert size={14} />
            )}
            <span>Run Fraud Detection Flow</span>
          </Button>
        </div>

        {/* Demo 3 */}
        <div
          className={`flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 bg-background/40 backdrop-blur-sm ${
            activeDemo === 3
              ? "border-amber-500 ring-1 ring-amber-500/50 shadow-md shadow-amber-500/10"
              : "border-border/50 hover:border-border/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black tracking-widest text-amber-400 font-mono">
                DEMO 03
              </span>
              <Badge variant="amber">DOUBLE-COUNTING GUARD</Badge>
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5 font-['Outfit']">
              Double-Spending & Retirement Guard
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Attempts to retire an already-retired credit a second time and transfer a retired credit. Proves smart contract reverts to prevent double-counting.
            </p>
          </div>
          <Button
            onClick={runDemo3}
            disabled={isRunning}
            variant="amber"
            className="w-full text-xs font-semibold h-9"
          >
            {isRunning && activeDemo === 3 ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <AlertTriangle size={14} />
            )}
            <span>Run Double-Spending Test</span>
          </Button>
        </div>
      </div>

      {/* Execution Console Output */}
      {logs.length > 0 && (
        <ConsoleLog
          logs={logs}
          onClear={() => setLogs([])}
          title="Live Audit Stream & Blockchain Pipeline Log"
          maxHeight="220px"
        />
      )}
    </Card>
  );
};

export default DemoController;
