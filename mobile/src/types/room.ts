export interface RoomOverview {
  id: string;
  name: string;
  status?: string;
  description?: string | null;
}

export interface SensorSummary {
  label: string;
  value: string | null;
  unit?: string | null;
}

export interface DeviceSummary {
  key: string;
  label: string;
  value: string | null;
  active: boolean;
}

export interface FaceSummary {
  id: string;
  label: string;
  name: string;
  addedAt?: string | null;
}

export interface RoomEventSummary {
  id: string;
  type: 'device' | 'door' | 'sensor' | 'security';
  title: string;
  description: string;
  time: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
}
