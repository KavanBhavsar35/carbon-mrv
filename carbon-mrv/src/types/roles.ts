export type Role = 'ADMIN' | 'APPROVER' | 'GENERATOR' | 'BUYER';

export interface UserRoleData {
  role?: Role;
}
