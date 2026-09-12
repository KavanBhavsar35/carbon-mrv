import React from "react";
import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
  level?: string | number;
  label?: string;
  isAnomaly?: boolean;
  score?: number;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  label,
  isAnomaly,
  score,
  className,
}) => {
  if (isAnomaly) {
    return (
      <Badge variant="rose" className={className}>
        ANOMALY {score !== undefined ? `(${(score * 100).toFixed(1)}%)` : ""}
      </Badge>
    );
  }

  const text = (label || String(level || "")).toUpperCase();

  if (text.includes("LOW") || text.includes("VERIFIED") || text.includes("ACTIVE") || text.includes("APPROVED") || text.includes("MINTED")) {
    return (
      <Badge variant="emerald" className={className}>
        {label || text}
      </Badge>
    );
  }

  if (text.includes("MEDIUM") || text.includes("PENDING") || text.includes("SUBMITTED") || text.includes("IN_REVIEW")) {
    return (
      <Badge variant="amber" className={className}>
        {label || text}
      </Badge>
    );
  }

  if (text.includes("HIGH") || text.includes("REJECTED") || text.includes("FLAGGED") || text.includes("FAILED")) {
    return (
      <Badge variant="rose" className={className}>
        {label || text}
      </Badge>
    );
  }

  if (text.includes("RETIRED") || text.includes("TRANSFERRED")) {
    return (
      <Badge variant="cyan" className={className}>
        {label || text}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      {label || text}
    </Badge>
  );
};
