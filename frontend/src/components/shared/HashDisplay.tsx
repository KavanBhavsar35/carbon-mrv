import React, { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface HashDisplayProps {
  hash: string | null | undefined;
  truncate?: boolean;
  startChars?: number;
  endChars?: number;
  onVerify?: (hash: string) => void;
  copyable?: boolean;
  className?: string;
}

export const HashDisplay: React.FC<HashDisplayProps> = ({
  hash,
  truncate = true,
  startChars = 6,
  endChars = 4,
  onVerify,
  copyable = true,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  if (!hash) return <span className="text-muted-foreground text-xs">—</span>;

  const display =
    truncate && hash.length > startChars + endChars + 2
      ? `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`
      : hash;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground bg-muted/40 hover:bg-muted/70 px-2 py-0.5 rounded border border-border/50 transition-colors",
        className
      )}
      title={hash}
    >
      <span className="select-all">{display}</span>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          title="Copy full hash"
        >
          {copied ? (
            <Check size={12} className="text-emerald-400" />
          ) : (
            <Copy size={12} />
          )}
        </button>
      )}
      {onVerify && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onVerify(hash);
          }}
          className="cursor-pointer text-primary hover:text-primary/80 transition-colors ml-0.5"
          title="View on-chain proof"
        >
          <ExternalLink size={12} />
        </button>
      )}
    </span>
  );
};
