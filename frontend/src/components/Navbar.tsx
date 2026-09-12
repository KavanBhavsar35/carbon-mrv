import React, { useState } from "react";
import { 
  ShieldCheck, 
  Satellite, 
  Building, 
  Eye, 
  Search, 
  Layers,
  Terminal,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavbarProps {
  activeRole: string;
  setActiveRole: (role: string) => void;
  onSearchVerify: (query: string) => void;
  onOpenDemoConsole: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRole,
  setActiveRole,
  onSearchVerify,
  onOpenDemoConsole,
}) => {
  const [searchInput, setSearchInput] = useState("");

  const roles = [
    { id: "ISSUER", label: "Project Issuer", icon: Layers, desc: "Sundarbans Marine Trust" },
    { id: "AUDITOR", label: "Auditor & Verifier", icon: ShieldCheck, desc: "Global Carbon Standards" },
    { id: "BUYER", label: "Corporate Buyer", icon: Building, desc: "Tech Zero Procurement" },
    { id: "REGULATOR", label: "Public Explorer", icon: Eye, desc: "UNFCCC Chain of Custody" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchVerify(searchInput.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 flex-wrap">
        
        {/* Logo & Platform Name */}
        <div className="flex items-center gap-3 cursor-pointer select-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-white/20">
            <Satellite size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-foreground font-['Outfit']">
                CIRCULAR CARBON
              </span>
              <Badge variant="emerald" className="text-[10px] px-1.5 py-0.2 tracking-wider">
                MRV 2.0
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              Verifiable Carbon Credit & Offset Tracking System
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <nav className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/60 p-1 backdrop-blur-md">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = activeRole === r.id;
            return (
              <button
                key={r.id}
                id={`role-btn-${r.id.toLowerCase()}`}
                onClick={() => setActiveRole(r.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <Icon size={15} />
                <span className="hidden md:inline">{r.label}</span>
                <span className="md:hidden">{r.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </nav>

        {/* Search & Indicators */}
        <div className="flex items-center gap-2.5">
          <form onSubmit={handleSearch} className="relative w-44 md:w-60">
            <Input
              type="text"
              placeholder="Verify Credit or Tx..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 pr-8 text-xs bg-muted/40 border-border/60 focus-visible:ring-primary/40 rounded-lg"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Search size={14} />
            </button>
          </form>

          {/* Blockchain Node Pill */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px]">#31337</span>
          </div>

          {/* Demo Console Toggle Button */}
          <Button
            onClick={onOpenDemoConsole}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium border-border/70 hover:border-primary/50"
            title="Toggle Interactive Demo Scenarios"
          >
            <Terminal size={14} className="text-primary" />
            <span className="hidden sm:inline">Demos</span>
          </Button>

          {/* Theme Switcher Toggle */}
          <ThemeToggle />
        </div>

      </div>
    </header>
  );
};

export default Navbar;
