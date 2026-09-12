import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  variant?: "default" | "emerald" | "cyan" | "amber" | "rose";
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: "bg-primary/10 text-primary border-primary/20",
    glow: "hover:border-primary/40",
  },
  emerald: {
    iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10",
    glow: "hover:border-emerald-500/40",
  },
  cyan: {
    iconBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-cyan-500/10",
    glow: "hover:border-cyan-500/40",
  },
  amber: {
    iconBg: "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10",
    glow: "hover:border-amber-500/40",
  },
  rose: {
    iconBg: "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-rose-500/10",
    glow: "hover:border-rose-500/40",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "emerald",
  className,
}) => {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5",
        styles.glow,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="text-2xl font-bold tracking-tight text-foreground font-['Outfit']">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground/90">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm",
              styles.iconBg
            )}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
};
