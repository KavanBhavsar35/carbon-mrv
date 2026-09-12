import React, { useRef, useEffect } from "react";
import { Terminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LogEntry {
  id?: string | number;
  time?: string;
  type?: "info" | "success" | "warning" | "error" | string;
  text: string;
}

interface ConsoleLogProps {
  logs: LogEntry[];
  onClear?: () => void;
  title?: string;
  maxHeight?: string;
  className?: string;
}

export const ConsoleLog: React.FC<ConsoleLogProps> = ({
  logs,
  onClear,
  title = "System Pipeline Execution Logs",
  maxHeight = "320px",
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "success":
        return "text-emerald-400";
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-rose-400";
      default:
        return "text-cyan-300";
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-black/80 font-mono text-xs shadow-inner backdrop-blur-md overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-emerald-400" />
          <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
            {title}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {logs.length} events
          </span>
        </div>
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-rose-400 cursor-pointer"
          >
            <Trash2 size={12} className="mr-1" /> Clear
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        style={{ maxHeight }}
        className="p-3 overflow-y-auto space-y-1 select-text scroll-smooth"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground/60 py-6 text-center italic">
            Waiting for trigger actions... Select a demo scenario above to test end-to-end pipeline.
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id || index}
              className="flex items-start gap-2.5 leading-relaxed hover:bg-white/[0.02] px-1 py-0.5 rounded"
            >
              <span className="text-muted-foreground/60 shrink-0 text-[11px]">
                [{log.time || new Date().toLocaleTimeString()}]
              </span>
              <span
                className={cn(
                  "font-medium shrink-0 uppercase text-[10px] px-1.5 py-0.2 rounded border",
                  log.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : log.type === "error"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : log.type === "warning"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                )}
              >
                {log.type || "INFO"}
              </span>
              <span className={cn("flex-1 break-all", getTypeColor(log.type))}>
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
