export type RoomStatus = 'occupied' | 'vacant' | 'maintenance';

export interface RoomSummary {
  key: string;
  name: string;
  status: RoomStatus;
  tenants: number;
  temp: number;
  human: boolean;
}
