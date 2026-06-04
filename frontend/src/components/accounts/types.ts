import type { PermissionDto, UserDto, UserRole } from '@/apis';

export interface AccountRow extends UserDto {
  assignedRooms: string[];
  roomAssignments: PermissionDto[];
}

export const roleLabels: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  tenant: 'Tenant',
};

export const roleClassNames: Record<UserRole, string> = {
  owner: 'badge-role-owner',
  admin: 'badge-role-admin',
  tenant: 'badge-role-tenant',
};
