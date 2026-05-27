import { apiDelete, apiGet, apiPost } from '../http';
import type { DeviceSummary, FaceSummary, RoomEventSummary, RoomOverview, SensorSummary } from '../../types';

interface DeviceStateResponse {
  value: string;
  updatedAt: string;
}

interface SensorStateResponse {
  value: string;
  unit: string | null;
  updatedAt: string;
}

interface MyDevicesResponse {
  room: Pick<RoomOverview, 'id' | 'name'>;
  devices: Record<string, DeviceStateResponse | null>;
}

interface MySensorsResponse {
  room: Pick<RoomOverview, 'id' | 'name'>;
  sensors: Record<string, SensorStateResponse | null>;
}

interface AutoControlResponse {
  fan?: {
    action?: string;
    changed?: boolean;
    reason?: string;
  };
  light?: {
    action?: string;
    changed?: boolean;
    reason?: string;
  };
  error?: string;
}

interface RawFace {
  id?: string;
  label?: string;
  name?: string;
  displayName?: string | null;
  createdAt?: string | null;
  addedAt?: string | null;
}

interface FaceRecognitionResponse {
  recognized?: boolean;
  label?: string | null;
  confidence?: number;
  doorUnlocked?: boolean;
  error?: string;
}

interface RawEvent {
  id?: string;
  type?: string;
  eventType?: string;
  deviceKey?: string;
  sensorKey?: string;
  title?: string;
  message?: string;
  description?: string;
  value?: string;
  createdAt?: string;
  timestamp?: string;
  severity?: string;
}

export function getMyRoom() {
  return apiGet<RoomOverview>('/mobile/my-room');
}

export async function getMyDevices() {
  const response = await apiGet<MyDevicesResponse>('/mobile/my-devices');
  return Object.entries(response.devices).map<DeviceSummary>(([key, state]) => ({
    key,
    label: key,
    active: state?.value === 'ON' || state?.value === 'UNLOCKED' || state?.value === '1',
    value: state?.value ?? null,
  }));
}

export async function getMySensors() {
  const response = await apiGet<MySensorsResponse>('/mobile/my-sensors');
  return Object.entries(response.sensors).map<SensorSummary>(([label, state]) => ({
    label,
    value: state?.value ?? null,
    unit: state?.unit ?? null,
  }));
}

export function commandRoomDevice(roomId: string, deviceKey: string, value: string) {
  return apiPost(`/rooms/${roomId}/devices/${deviceKey}/command`, { value });
}

export async function getRoomFaces(roomId: string) {
  const response = await apiGet<RawFace[] | { faces?: RawFace[] }>(`/rooms/${roomId}/faces`);
  const faces = Array.isArray(response) ? response : response.faces ?? [];
  return faces.map<FaceSummary>((face, index) => {
    const label = face.label ?? face.name ?? `face_${index + 1}`;
    return {
      id: face.id ?? label,
      label,
      name: face.displayName ?? toDisplayName(face.name ?? label),
      addedAt: face.addedAt ?? face.createdAt ?? null,
    };
  });
}

export function registerRoomFace(roomId: string, label: string, image: string) {
  return apiPost<RawFace>(`/rooms/${roomId}/faces`, { label, image });
}

export function recognizeRoomFace(roomId: string, image: string) {
  return apiPost<FaceRecognitionResponse>(`/rooms/${roomId}/face-recognition`, { image });
}

export function deleteRoomFace(roomId: string, faceId: string) {
  return apiDelete(`/rooms/${roomId}/faces/${faceId}`);
}

export function retrainRoomFaces(roomId: string) {
  return apiPost(`/rooms/${roomId}/faces/retrain`);
}

export async function getRoomEvents(roomId: string) {
  const response = await apiGet<RawEvent[] | { events?: RawEvent[] }>(`/rooms/${roomId}/events`);
  const events = Array.isArray(response) ? response : response.events ?? [];
  return events.map<RoomEventSummary>((event, index) => {
    const eventType = event.type ?? event.eventType ?? '';
    const type = inferEventType(eventType, event.deviceKey, event.sensorKey);
    const title = event.title ?? buildEventTitle(type, event.deviceKey, event.sensorKey, event.value);
    return {
      id: event.id ?? `${type}-${index}`,
      type,
      title,
      description: event.description ?? event.message ?? buildEventDescription(event.deviceKey, event.sensorKey, event.value),
      time: formatEventTime(event.createdAt ?? event.timestamp),
      severity: inferSeverity(type, event.severity),
    };
  });
}

export function predictAutoControl(payload: {
  sensor_data: {
    temperature: number;
    humidity: number;
    light: number;
  };
  device_states: {
    fan: boolean;
    light: boolean;
  };
}) {
  return apiPost<AutoControlResponse>('/ai/auto-control/predict', payload);
}

function toDisplayName(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferEventType(type: string, deviceKey?: string, sensorKey?: string): RoomEventSummary['type'] {
  if (type.toLowerCase().includes('face') || deviceKey === 'door') {
    return 'door';
  }
  if (sensorKey || type.toLowerCase().includes('sensor') || type.toLowerCase().includes('alert')) {
    return 'sensor';
  }
  if (type.toLowerCase().includes('security')) {
    return 'security';
  }
  return 'device';
}

function buildEventTitle(type: RoomEventSummary['type'], deviceKey?: string, sensorKey?: string, value?: string) {
  if (type === 'door') return 'Door access event';
  if (type === 'sensor') return `${toDisplayName(sensorKey ?? 'sensor')} alert`;
  if (type === 'security') return 'Security update';
  return `${toDisplayName(deviceKey ?? 'device')} ${value ?? 'updated'}`;
}

function buildEventDescription(deviceKey?: string, sensorKey?: string, value?: string) {
  if (sensorKey) return `${toDisplayName(sensorKey)} reported ${value ?? 'a new value'}`;
  if (deviceKey) return `${toDisplayName(deviceKey)} command was recorded`;
  return 'Room event recorded by backend';
}

function formatEventTime(value?: string) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function inferSeverity(type: RoomEventSummary['type'], severity?: string): RoomEventSummary['severity'] {
  if (severity === 'error' || severity === 'warning' || severity === 'success') return severity;
  if (type === 'sensor') return 'warning';
  if (type === 'door') return 'success';
  return 'info';
}
