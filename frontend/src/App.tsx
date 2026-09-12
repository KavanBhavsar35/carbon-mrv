import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import DemoController from "./components/DemoController";
import IssuerDashboard from "./components/IssuerDashboard";
import AuditorDashboard from "./components/AuditorDashboard";
import BuyerDashboard from "./components/BuyerDashboard";
import RegulatorDashboard from "./components/RegulatorDashboard";
import VerificationModal from "./components/VerificationModal";

export default function App() {
  const [activeRole, setActiveRole] = useState("ISSUER"); // ISSUER, AUDITOR, BUYER, REGULATOR
  const [showDemoConsole, setShowDemoConsole] = useState(true);
  const [verificationQuery, setVerificationQuery] = useState<string | number | null>(null);

  // Global shared state
  const [projects, setProjects] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [projRes, claimsRes, credsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/claims"),
        fetch("/api/credits"),
      ]);

      if (projRes.ok) setProjects(await projRes.json());
      if (claimsRes.ok) setClaims(await claimsRes.json());
      if (credsRes.ok) setCredits(await credsRes.json());
    } catch (err) {
      console.error("Data sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8s auto-poll
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onSearchVerify={(id) => setVerificationQuery(id)}
        onOpenDemoConsole={() => setShowDemoConsole((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Interactive Demo Controller */}
        {showDemoConsole && (
          <DemoController
            onRefreshAll={fetchData}
            onSelectVerification={(id) => setVerificationQuery(id)}
          />
        )}

        {/* Dynamic Role Dashboard */}
        {activeRole === "ISSUER" && (
          <IssuerDashboard
            projects={projects}
            claims={claims}
            onRefresh={fetchData}
            onSelectVerification={(id) => setVerificationQuery(id)}
          />
        )}

        {activeRole === "AUDITOR" && (
          <AuditorDashboard
            claims={claims}
            onRefresh={fetchData}
            onSelectVerification={(id) => setVerificationQuery(id)}
          />
        )}

        {activeRole === "BUYER" && (
          <BuyerDashboard
            credits={credits}
            onRefresh={fetchData}
            onSelectVerification={(id) => setVerificationQuery(id)}
          />
        )}

        {activeRole === "REGULATOR" && (
          <RegulatorDashboard
            projects={projects}
            claims={claims}
            credits={credits}
            onSelectVerification={(id) => setVerificationQuery(id)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/95 backdrop-blur-md px-4 sm:px-6 py-5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            <strong className="text-foreground">Circular Carbon MRV Ecosystem</strong> — Verifiable Nature-Based Carbon Registry
          </div>
          <div className="flex items-center gap-4 flex-wrap font-mono text-[11px]">
            <span>Solidity 0.8.24</span>
            <span className="text-border">•</span>
            <span>Hardhat #31337</span>
            <span className="text-border">•</span>
            <span>IPCC Tier 2 Blue Carbon</span>
            <span className="text-border">•</span>
            <span>Isolation Forest Anomaly ML</span>
          </div>
        </div>
      </footer>

      {/* Verification / Proof of Provenance Modal */}
      {verificationQuery && (
        <VerificationModal
          identifier={verificationQuery}
          onClose={() => setVerificationQuery(null)}
        />
      )}
    </div>
  );
}
