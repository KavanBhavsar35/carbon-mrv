'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Shield, FileCheck, ArrowRight } from 'lucide-react';
import { ClaimReviewData } from '@/lib/demo-data';

interface AuditorQuorumProps {
  claim: ClaimReviewData;
  onApprove?: () => void;
  onReject?: () => void;
  className?: string;
  readOnly?: boolean;
}

export function AuditorQuorum({
  claim,
  onApprove,
  onReject,
  className = '',
  readOnly = false
}: AuditorQuorumProps) {
  const [auditorList, setAuditorList] = useState(claim.auditors);
  const [approvalsCount, setApprovalsCount] = useState(claim.approvalsCurrent);
  const [userActionMessage, setUserActionMessage] = useState<string | null>(null);

  const isQuorumReached = approvalsCount >= claim.quorumRequired;

  const handleApprove = () => {
    // If auditor 3 is pending, approve it
    const updated = auditorList.map((a) => {
      if (a.id === 'auditor-3') {
        return {
          ...a,
          status: 'APPROVED' as const,
          approvedAt: 'Just now',
          signatureHash: '0x3f198ac90184b91238914028394018e790184b9123'
        };
      }
      return a;
    });
    setAuditorList(updated);
    setApprovalsCount(3);
    setUserActionMessage('Auditor consensus 3/3 recorded on-chain. Claim certified for ERC-1155 issuance.');
    if (onApprove) onApprove();
  };

  const handleReject = () => {
    setUserActionMessage('Rejection registered. Claim flagged for resubmission.');
    if (onReject) onReject();
  };

  return (
    <div
      className={`bg-[#0c1410] border border-emerald-950/70 rounded-2xl p-6 shadow-xl text-neutral-100 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-emerald-950/60">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
            Multi-Party Governance
          </span>
          <h3 className="text-xl font-bold text-white font-sans mt-0.5">
            Independent Auditor Consensus
          </h3>
        </div>

        {/* Quorum Progress Indicator */}
        <div className="flex items-center gap-3 bg-neutral-950/70 px-4 py-2 rounded-xl border border-emerald-950/50">
          {/* Visual dots ● ● ○ */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: claim.quorumTotal }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  i < approvalsCount
                    ? 'bg-emerald-400 ring-2 ring-emerald-400/30'
                    : 'bg-neutral-800 border border-neutral-700'
                }`}
              />
            ))}
          </div>
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-white">
              {approvalsCount} / {claim.quorumTotal} APPROVALS
            </div>
            <div className="text-[10px] font-mono text-emerald-400">
              {isQuorumReached ? '✓ Quorum Reached (2 required)' : `${claim.quorumRequired} required for minting`}
            </div>
          </div>
        </div>
      </div>

      {/* Auditor Cards */}
      <div className="mt-5 space-y-3">
        {auditorList.map((auditor) => (
          <div
            key={auditor.id}
            className={`p-4 rounded-xl border transition-all ${
              auditor.status === 'APPROVED'
                ? 'bg-neutral-950/50 border-emerald-950/60'
                : 'bg-neutral-950/30 border-neutral-800/80'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    auditor.status === 'APPROVED'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white font-sans">
                    {auditor.name}
                  </h4>
                  <p className="text-xs text-neutral-400">{auditor.organization}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                {auditor.status === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Approved
                  </span>
                ) : auditor.status === 'REJECTED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-red-950/80 text-red-300 border border-red-700/60">
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/60 text-amber-300 border border-amber-700/50">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Verification notes & signature */}
            <p className="mt-2 text-xs text-neutral-300 leading-relaxed pl-11">
              "{auditor.notes}"
            </p>

            {auditor.approvedAt && (
              <div className="mt-2 pl-11 flex flex-wrap items-center gap-4 text-[11px] font-mono text-neutral-500">
                <span>Timestamp: {auditor.approvedAt}</span>
                {auditor.signatureHash && (
                  <span className="text-emerald-400/80 truncate max-w-xs">
                    Sig: {auditor.signatureHash.slice(0, 18)}...
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Notification */}
      {userActionMessage && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{userActionMessage}</span>
        </div>
      )}

      {/* Actions (if not readOnly) */}
      {!readOnly && (
        <div className="mt-6 pt-5 border-t border-emerald-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-400 font-sans">
            Independent audit verification enforces on-chain anti-self-approval and multi-signature quorum.
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleReject}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-semibold font-sans transition cursor-pointer"
            >
              Reject Claim
            </button>
            <button
              onClick={handleApprove}
              disabled={approvalsCount >= claim.quorumTotal}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-semibold font-sans transition cursor-pointer flex items-center justify-center gap-1.5 ${
                approvalsCount >= claim.quorumTotal
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Approve Claim</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
