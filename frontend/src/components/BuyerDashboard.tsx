import React, { useState } from "react";
import { 
  Building, 
  Send, 
  Flame, 
  Award, 
  ExternalLink, 
  Coins, 
  ShieldCheck, 
  CheckCircle2 
} from "lucide-react";
import { Card } from "@/components/ui/card";
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

interface Credit {
  id: string;
  onchain_credit_id: number;
  amount: number;
  status: string;
  current_owner: string;
  vintage_year: number;
  mint_tx_hash?: string;
  retired_at?: string;
  retired_by?: string;
  retired_reason?: string;
  retire_tx_hash?: string;
}

interface BuyerDashboardProps {
  credits: Credit[];
  onRefresh: () => void;
  onSelectVerification: (id: string | number) => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  credits,
  onRefresh,
  onSelectVerification,
}) => {
  const [transferModalCredit, setTransferModalCredit] = useState<Credit | null>(null);
  const [retireModalCredit, setRetireModalCredit] = useState<Credit | null>(null);
  const [transferAddress, setTransferAddress] = useState(
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  );
  const [retireReason, setRetireReason] = useState(
    "Corporate Net-Zero 2026 Scope 3 Carbon Neutrality"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [celebrationCert, setCelebrationCert] = useState<Credit | null>(null);

  const activeCredits = credits.filter((c) => c.status === "ACTIVE");
  const retiredCredits = credits.filter((c) => c.status === "RETIRED");

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalCredit) return;
    setIsProcessing(true);
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "buyer@microsoft-esg.com", password: "buyer123" }),
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(`/api/credits/${transferModalCredit.id}/transfer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to_address: transferAddress }),
      });
      if (res.ok) {
        setTransferModalCredit(null);
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Transfer failed: ${err.detail}`);
      }
    } catch (err: any) {
      alert(`Transfer failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retireModalCredit) return;
    setIsProcessing(true);
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "buyer@microsoft-esg.com", password: "buyer123" }),
      });
      const token = (await loginRes.json()).access_token;

      const res = await fetch(`/api/credits/${retireModalCredit.id}/retire`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: retireReason }),
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
    } catch (err: any) {
      alert(`Retirement failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <PageHeader
        title="Corporate Buyer & Offset Marketplace"
        badge="TECH ZERO PROCUREMENT"
        badgeVariant="cyan"
        description="Browse audited, active blue carbon credits. Transfer custody or execute permanent one-way retirement to claim corporate ESG carbon offsets."
      />

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Available Credits"
          value={`${activeCredits.length} Batches`}
          subtitle={`${activeCredits.reduce((acc, c) => acc + c.amount, 0).toFixed(1)} tCO₂e Total Available`}
          variant="emerald"
          icon={Coins}
        />
        <StatCard
          title="Permanently Retired"
          value={`${retiredCredits.length} Certificates`}
          subtitle={`${retiredCredits.reduce((acc, c) => acc + c.amount, 0).toFixed(1)} tCO₂e Total Offset`}
          variant="rose"
          icon={Flame}
        />
        <StatCard
          title="Smart Contract Guarantee"
          value="No Double-Counting"
          subtitle="✓ Cryptographically Burned Upon Retirement"
          variant="cyan"
          icon={ShieldCheck}
        />
      </div>

      {/* Active Credits Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-emerald-400" />
          <h2 className="text-lg font-bold text-foreground font-['Outfit']">
            Active, Audited Carbon Credits
          </h2>
        </div>

        {activeCredits.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground border-dashed">
            No active credits available right now. Run Demo 1 to issue verified mangrove carbon credits!
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeCredits.map((c) => (
              <Card
                key={c.id}
                className="p-5 flex flex-col justify-between border-border/50 bg-card/75 hover:border-border hover:bg-card/90 transition-all duration-300 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="emerald" className="font-semibold text-[11px]">
                      ACTIVE CREDIT #{c.onchain_credit_id}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Vintage {c.vintage_year}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-foreground mb-1 font-['Outfit']">
                    {c.amount}{" "}
                    <span className="text-sm font-semibold text-emerald-400">
                      tCO₂e
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Verified Sundarbans Tidal Mangrove Carbon Sequestration
                  </p>

                  <div className="rounded-lg bg-muted/40 border border-border/40 p-3 text-xs space-y-1.5 font-mono text-muted-foreground mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">Owner:</span>
                      <HashDisplay hash={c.current_owner} copyable={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">Mint Tx:</span>
                      <HashDisplay hash={c.mint_tx_hash || "0xabc123..."} copyable={false} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <Button
                    onClick={() => setTransferModalCredit(c)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 border-border/70 hover:border-cyan-500/50 hover:text-cyan-400"
                  >
                    <Send size={13} />
                    <span>Transfer</span>
                  </Button>
                  <Button
                    onClick={() => setRetireModalCredit(c)}
                    variant="emerald"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20"
                  >
                    <Flame size={13} className="text-amber-300" />
                    <span>Retire (Burn)</span>
                  </Button>
                  <Button
                    onClick={() => onSelectVerification(c.onchain_credit_id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                    title="Inspect Provenance"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Retired Credits / Offset Certificates */}
      {retiredCredits.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-rose-400" />
            <h2 className="text-lg font-bold text-foreground font-['Outfit']">
              Permanent Retirement Certificates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {retiredCredits.map((c) => (
              <Card
                key={c.id}
                className="p-5 border-rose-500/30 bg-rose-500/[0.03] flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="rose" className="font-semibold text-[11px]">
                      RETIRED #{c.onchain_credit_id}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {c.retired_at ? new Date(c.retired_at).toLocaleDateString() : "2026-09-12"}
                    </span>
                  </div>

                  <div className="text-xl font-bold text-foreground mb-1 font-['Outfit']">
                    {c.amount} tCO₂e Offset
                  </div>
                  <p className="text-xs text-rose-300/90 italic mb-4">
                    "{c.retired_reason || "Corporate Net-Zero Offset"}"
                  </p>

                  <div className="rounded-lg bg-black/30 border border-border/40 p-3 text-xs space-y-1.5 font-mono text-muted-foreground mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">Retired By:</span>
                      <HashDisplay hash={c.retired_by || "0x90F7..."} copyable={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">Burn Tx:</span>
                      <HashDisplay hash={c.retire_tx_hash || "0xdef456..."} copyable={false} />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => onSelectVerification(c.onchain_credit_id)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5 border-rose-500/30 text-rose-300 hover:bg-rose-500/15"
                >
                  <ExternalLink size={13} />
                  <span>Inspect Immutable Certificate</span>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      <Dialog
        open={!!transferModalCredit}
        onOpenChange={(open) => !open && setTransferModalCredit(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Carbon Credit</DialogTitle>
            <DialogDescription>
              Transfer ownership of Credit #{transferModalCredit?.onchain_credit_id} ({transferModalCredit?.amount} tCO₂e) on Ethereum.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTransfer} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="transfer-address">Recipient Wallet Address</Label>
              <Input
                id="transfer-address"
                required
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferModalCredit(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing} variant="emerald">
                {isProcessing ? "Transferring..." : "Execute On-Chain Transfer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Retire Dialog */}
      <Dialog
        open={!!retireModalCredit}
        onOpenChange={(open) => !open && setRetireModalCredit(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <Flame size={18} />
              <span>Permanently Retire Credit</span>
            </DialogTitle>
            <DialogDescription>
              Retiring Credit #{retireModalCredit?.onchain_credit_id} ({retireModalCredit?.amount} tCO₂e) permanently burns it from circulation. It cannot be transferred or reused again.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRetire} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="retire-reason">Corporate Retirement Purpose</Label>
              <Textarea
                id="retire-reason"
                rows={3}
                required
                value={retireReason}
                onChange={(e) => setRetireReason(e.target.value)}
                placeholder="State ESG reporting or corporate offset rationale..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRetireModalCredit(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                variant="destructive"
                className="bg-rose-600 hover:bg-rose-500"
              >
                {isProcessing ? "Retiring on Chain..." : "Confirm Permanent Retirement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Celebration Certificate Dialog */}
      <Dialog
        open={!!celebrationCert}
        onOpenChange={(open) => !open && setCelebrationCert(null)}
      >
        <DialogContent className="max-w-lg text-center p-8 border-emerald-500/50 shadow-2xl shadow-emerald-500/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-2 border border-emerald-500/30">
            <Award size={28} />
          </div>

          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-extrabold text-foreground font-['Outfit']">
              Carbon Offset Certificate Issued!
            </DialogTitle>
            <DialogDescription className="text-emerald-400 font-semibold text-sm">
              {celebrationCert?.amount} tCO₂e Permanently Retired
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border/50 bg-muted/40 p-4 text-left font-mono text-xs text-muted-foreground space-y-2 my-2">
            <div className="flex justify-between">
              <span>Credit ID:</span>
              <span className="text-foreground">#{celebrationCert?.onchain_credit_id}</span>
            </div>
            <div className="flex justify-between">
              <span>Beneficiary:</span>
              <HashDisplay hash={celebrationCert?.retired_by} copyable={false} />
            </div>
            <div className="text-xs italic text-emerald-300">
              "{celebrationCert?.retired_reason}"
            </div>
            <div className="flex justify-between pt-1 border-t border-border/40">
              <span>Tx Hash:</span>
              <HashDisplay hash={celebrationCert?.retire_tx_hash || "0xdef..."} />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => {
                const id = celebrationCert?.onchain_credit_id;
                setCelebrationCert(null);
                if (id) onSelectVerification(id);
              }}
              variant="emerald"
            >
              View Public Audit Trail
            </Button>
            <Button
              onClick={() => setCelebrationCert(null)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerDashboard;
