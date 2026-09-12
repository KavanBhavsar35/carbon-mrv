'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trees, ShieldCheck, Briefcase, Zap } from 'lucide-react';

export type AppRole = 'GENERATOR' | 'APPROVER' | 'BUYER' | 'ADMIN';

export default function RoleSwitcher() {
  const [currentRole, setCurrentRole] = useState<AppRole>('GENERATOR');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('active_app_role') as AppRole;
    if (saved) {
      setCurrentRole(saved);
    }
  }, []);

  const handleRoleChange = (newRole: AppRole) => {
    setCurrentRole(newRole);
    localStorage.setItem('active_app_role', newRole);
    window.dispatchEvent(new Event('role_changed'));

    // Route smartly based on role
    if (newRole === 'GENERATOR') {
      router.push('/dashboard/generator/parcels');
    } else if (newRole === 'APPROVER') {
      router.push('/dashboard/review/queue');
    } else if (newRole === 'BUYER') {
      router.push('/dashboard/buyer/marketplace');
    } else if (newRole === 'ADMIN') {
      router.push('/dashboard/admin/parcels');
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-muted/60 border rounded-lg p-1 text-xs">
      <span className="text-muted-foreground font-semibold px-1 hidden lg:inline">Role:</span>
      <button
        onClick={() => handleRoleChange('GENERATOR')}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-medium transition ${
          currentRole === 'GENERATOR'
            ? 'bg-emerald-600 text-white shadow-xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Generator Role"
      >
        <Trees className="h-3.5 w-3.5" />
        <span>Generator</span>
      </button>
      <button
        onClick={() => handleRoleChange('APPROVER')}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-medium transition ${
          currentRole === 'APPROVER'
            ? 'bg-indigo-600 text-white shadow-xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Approver / Auditor Role"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Approver</span>
      </button>
      <button
        onClick={() => handleRoleChange('BUYER')}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-medium transition ${
          currentRole === 'BUYER'
            ? 'bg-purple-600 text-white shadow-xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Buyer Role"
      >
        <Briefcase className="h-3.5 w-3.5" />
        <span>Buyer</span>
      </button>
      <button
        onClick={() => handleRoleChange('ADMIN')}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-medium transition ${
          currentRole === 'ADMIN'
            ? 'bg-amber-600 text-white shadow-xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Admin Master Role"
      >
        <Zap className="h-3.5 w-3.5" />
        <span>Admin</span>
      </button>
    </div>
  );
}
