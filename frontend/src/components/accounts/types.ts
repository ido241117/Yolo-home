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
  owner: 'bg-purple-500/15 text-purple-300 border-purple-400/20',
  admin: 'bg-amber-500/15 text-amber-300 border-amber-400/20',
  tenant: 'bg-blue-500/15 text-blue-300 border-blue-400/20',
};
