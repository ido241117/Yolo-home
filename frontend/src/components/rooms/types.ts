import type { RoomStatus } from '@/apis';

export type FilterTab = 'all' | RoomStatus;

export interface TenantAvatar {
  initials: string;
  color: string;
}

export interface RoomRow {
  id: string;
  name: string;
  location: string;
  status: RoomStatus;
  tenants: TenantAvatar[];
  extraTenants?: number;
  adafruit: string;
  lastActivity: string;
  lastSensor: string;
}

export const ROOM_STATUS_CONFIG: Record<RoomStatus, { dot: string; text: string; bg: string; label: string }> = {
  occupied:    { dot: 'bg-blue-500',  text: 'text-blue-400',  bg: 'bg-blue-500/15',  label: 'Occupied' },
  vacant:      { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/15', label: 'Vacant' },
  maintenance: { dot: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Maintenance' },
};

export const ROOM_FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'occupied',    label: 'Occupied' },
  { key: 'vacant',      label: 'Vacant' },
  { key: 'maintenance', label: 'Maintenance' },
];
