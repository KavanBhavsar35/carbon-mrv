import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  badge?: string;
  badgeVariant?: "default" | "emerald" | "cyan" | "amber" | "rose" | "outline";
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  badge,
  badgeVariant = "emerald",
  description,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border/40",
        className
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-['Outfit']">
            {title}
          </h1>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-wrap">{actions}</div>
      )}
    </div>
  );
};
