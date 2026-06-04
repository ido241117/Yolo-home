import type { RoomStatus } from '@/apis';

export type FilterTab = 'all' | RoomStatus;

export interface TenantAvatar {
  initials: string;
  color: string;
}

export interface RoomRow {
  id: string;
  code: string;
  name: string;
  location: string;
  status: RoomStatus;
  tenants: TenantAvatar[];
  extraTenants?: number;
  adafruit: string;
  lastActivity: string;
  lastSensor: string;
}

export const ROOM_STATUS_CONFIG: Record<RoomStatus, { dot: string; badge: string; label: string }> = {
  occupied:    { dot: 'badge-dot-occupied',    badge: 'badge-status-occupied',    label: 'Occupied' },
  vacant:      { dot: 'badge-dot-vacant',      badge: 'badge-status-vacant',      label: 'Vacant' },
  maintenance: { dot: 'badge-dot-maintenance', badge: 'badge-status-maintenance', label: 'Maintenance' },
};

export const ROOM_FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'occupied',    label: 'Occupied' },
  { key: 'vacant',      label: 'Vacant' },
  { key: 'maintenance', label: 'Maintenance' },
];
