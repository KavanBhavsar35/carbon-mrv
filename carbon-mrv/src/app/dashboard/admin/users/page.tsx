'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, ShieldCheck, Leaf, ShoppingCart } from 'lucide-react';
import { getAllUsersAction } from '@/features/buyer/actions/buyer-actions';
import { toast } from 'sonner';

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  ADMIN: {
    label: 'Admin',
    badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    icon: <ShieldCheck className='h-3.5 w-3.5' />
  },
  APPROVER: {
    label: 'Approver',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: <ShieldCheck className='h-3.5 w-3.5' />
  },
  GENERATOR: {
    label: 'Generator',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    icon: <Leaf className='h-3.5 w-3.5' />
  },
  BUYER: {
    label: 'Buyer',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    icon: <ShoppingCart className='h-3.5 w-3.5' />
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getAllUsersAction();
      if (res.success) {
        setUsers(res.data ?? []);
      } else {
        toast.error(res.error || 'Failed to load users');
      }
      setLoading(false);
    })();
  }, []);

  const roleCounts = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <PageContainer>
      <div className='space-y-6 animate-in fade-in-50 duration-300'>
        {/* Header */}
        <div className='border-b pb-5'>
          <Badge variant='outline' className='bg-purple-500/10 text-purple-600 border-purple-500/30 text-xs font-semibold mb-2'>
            Admin Dashboard
          </Badge>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>User Management</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            All registered platform users with their role, profile status, and activity.
          </p>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card className='border shadow-xs'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-primary/10 text-primary'>
                  <Users className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-xs text-muted-foreground font-medium'>Total Users</div>
                  <div className='text-xl font-bold'>{loading ? '...' : users.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
            <Card key={role} className='border shadow-xs'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className={`p-2.5 rounded-lg ${cfg.badgeClass.replace('border-', 'ring-').replace('text-', 'text-')} bg-opacity-10`}>
                    {cfg.icon}
                  </div>
                  <div>
                    <div className='text-xs text-muted-foreground font-medium'>{cfg.label}s</div>
                    <div className='text-xl font-bold'>{loading ? '...' : (roleCounts[role] || 0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Table */}
        {loading ? (
          <div className='flex flex-col items-center justify-center h-64 border rounded-xl bg-card'>
            <Loader2 className='h-8 w-8 animate-spin text-primary mb-2' />
            <p className='text-sm text-muted-foreground'>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className='bg-card border rounded-xl p-12 text-center'>
            <Users className='h-10 w-10 text-muted-foreground mx-auto mb-3' />
            <h3 className='font-semibold text-lg'>No Users Registered</h3>
            <p className='text-sm text-muted-foreground mt-1'>Users will appear here after they sign up and complete onboarding.</p>
          </div>
        ) : (
          <div className='bg-card border rounded-xl overflow-hidden shadow-xs'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead className='bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground'>
                  <tr>
                    <th className='px-6 py-3.5 font-semibold'>Name</th>
                    <th className='px-6 py-3.5 font-semibold'>Email</th>
                    <th className='px-6 py-3.5 font-semibold'>Role</th>
                    <th className='px-6 py-3.5 font-semibold'>Profile</th>
                    <th className='px-6 py-3.5 font-semibold'>Status</th>
                    <th className='px-6 py-3.5 font-semibold text-right'>Joined</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {users.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.GENERATOR;
                    const hasProfile =
                      (user.role === 'GENERATOR' && !!user.generatorProfile) ||
                      (user.role === 'BUYER' && !!user.buyerProfile) ||
                      user.role === 'ADMIN' ||
                      user.role === 'APPROVER';

                    return (
                      <tr key={user.id} className='hover:bg-muted/30 transition'>
                        <td className='px-6 py-4 font-medium text-foreground'>
                          {user.name}
                        </td>
                        <td className='px-6 py-4 text-muted-foreground text-xs'>
                          {user.email}
                        </td>
                        <td className='px-6 py-4'>
                          <Badge variant='outline' className={`gap-1.5 text-xs font-semibold ${roleConfig.badgeClass}`}>
                            {roleConfig.icon}
                            {roleConfig.label}
                          </Badge>
                        </td>
                        <td className='px-6 py-4'>
                          {hasProfile ? (
                            <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs'>
                              Onboarded
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs'>
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className='px-6 py-4'>
                          <Badge
                            variant='outline'
                            className={
                              user.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs'
                                : 'bg-rose-500/10 text-rose-600 border-rose-500/30 text-xs'
                            }
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className='px-6 py-4 text-right text-xs text-muted-foreground'>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
