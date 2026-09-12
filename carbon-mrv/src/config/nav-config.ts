import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: 'Generator',
    items: [
      {
        title: 'My Parcels',
        url: '/dashboard/generator/parcels',
        icon: 'mapPin',
        access: { appRole: 'GENERATOR' }
      },
      {
        title: 'Register Land',
        url: '/dashboard/generator/parcels/new',
        icon: 'plus',
        access: { appRole: 'GENERATOR' }
      }
    ]
  },
  {
    label: 'Marketplace',
    items: [
      {
        title: 'Browse Credits',
        url: '/dashboard/buyer/marketplace',
        icon: 'store',
        access: { appRole: 'BUYER' }
      },
      {
        title: 'My Holdings',
        url: '/dashboard/buyer/holdings',
        icon: 'wallet',
        access: { appRole: 'BUYER' }
      },
      {
        title: 'Order History',
        url: '/dashboard/buyer/orders',
        icon: 'list',
        access: { appRole: 'BUYER' }
      }
    ]
  },
  {
    label: 'Review',
    items: [
      {
        title: 'Review Queue',
        url: '/dashboard/review/queue',
        icon: 'checkCircle',
        access: { appRole: 'APPROVER' }
      }
    ]
  },
  {
    label: 'Administration',
    items: [
      {
        title: 'Users',
        url: '/dashboard/admin/users',
        icon: 'user',
        access: { appRole: 'ADMIN' }
      },
      {
        title: 'All Parcels',
        url: '/dashboard/admin/parcels',
        icon: 'map',
        access: { appRole: 'ADMIN' }
      },
      {
        title: 'All Credits',
        url: '/dashboard/admin/credits',
        icon: 'creditCard',
        access: { appRole: 'ADMIN' }
      },
      {
        title: 'Transactions',
        url: '/dashboard/admin/transactions',
        icon: 'activity',
        access: { appRole: 'ADMIN' }
      },
      {
        title: 'Analytics',
        url: '/dashboard/admin/analytics',
        icon: 'chart',
        access: { appRole: 'ADMIN' }
      }
    ]
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'profile',
        shortcut: ['m', 'm']
      }
    ]
  }
];
