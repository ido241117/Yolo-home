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
  autoModes?: Record<string, boolean>;
}

interface MySensorsResponse {
  room: Pick<RoomOverview, 'id' | 'name'>;
  sensors: Record<string, SensorStateResponse | null>;
}

interface AutoControlPredictResponse {
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

interface AutoModeResponse {
  deviceKey: string;
  enabled: boolean;
  updatedAt: string;
}

interface RawFace {
  id?: string;
  label?: string;
  name?: string;
  displayName?: string | null;
  previewImage?: string | null;
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
  return Object.entries(response.devices).map<DeviceSummary>(([key, state]) => {
    const autoEnabled = Boolean(response.autoModes?.[key]);
    return {
      key,
      label: key,
      active: state?.value === 'ON' || state?.value === 'UNLOCKED' || state?.value === '1',
      value: state?.value ?? null,
      autoEnabled,
    };
  });
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

export function autoControlRoomDevice(roomId: string, deviceKey: 'led' | 'fan') {
  return apiPost<AutoModeResponse>(
    `/rooms/${roomId}/devices/${deviceKey}/auto`,
  );
}

export async function getRoomFaces(roomId: string) {
  const response = await apiGet<RawFace[] | { faces?: RawFace[] }>(`/rooms/${roomId}/faces`);
  const faces = Array.isArray(response) ? response : response.faces ?? [];
  return faces.map<FaceSummary>((face, index) => {
    const label = face.label ?? face.name ?? `face_${index + 1}`;
    return {
      id: face.id ?? label,
      label,
      name: face.displayName ?? `Face ${index + 1}`,
      previewImage: face.previewImage ?? null,
    };
  });
}

export function registerRoomFace(roomId: string, images: string | string[]) {
  const payload = Array.isArray(images) ? { images } : { image: images };
  return apiPost<RawFace>(`/rooms/${roomId}/faces`, payload);
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
    const title = event.title ?? buildEventTitle(type, eventType, event.deviceKey, event.sensorKey, event.value);
    return {
      id: event.id ?? `${type}-${index}`,
      type,
      title,
      description:
        event.description ??
        event.message ??
        buildEventDescription(type, eventType, event.deviceKey, event.sensorKey, event.value),
      time: formatEventTime(event.createdAt ?? event.timestamp),
      severity: inferSeverity(type, eventType, event.severity),
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
  return apiPost<AutoControlPredictResponse>('/ai/auto-control/predict', payload);
}

function toDisplayName(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferEventType(type: string, deviceKey?: string, sensorKey?: string): RoomEventSummary['type'] {
  if (type.toLowerCase().includes('face')) {
    return 'face';
  }
  if (deviceKey === 'door') {
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

function buildEventTitle(
  type: RoomEventSummary['type'],
  rawType: string,
  deviceKey?: string,
  sensorKey?: string,
  value?: string,
) {
  if (type === 'face') {
    if (rawType.includes('register')) return 'Face registered';
    if (rawType.includes('denied')) return 'Face unlock failed';
    if (rawType.includes('recognized')) return 'Door unlocked by face';
    if (rawType.includes('retrain')) return 'Face model retrained';
    return 'Face event';
  }
  if (type === 'door') return 'Door access event';
  if (type === 'sensor') return `${toDisplayName(sensorKey ?? 'sensor')} alert`;
  if (type === 'security') return 'Security update';
  return `${toDisplayName(deviceKey ?? 'device')} ${value ?? 'updated'}`;
}

function buildEventDescription(
  type: RoomEventSummary['type'],
  rawType: string,
  deviceKey?: string,
  sensorKey?: string,
  value?: string,
) {
  if (type === 'face') {
    if (rawType.includes('register')) return 'A new face profile was registered';
    if (rawType.includes('denied')) return 'A face unlock attempt failed';
    if (rawType.includes('recognized')) return 'A face unlock attempt succeeded';
    if (rawType.includes('retrain')) return 'The face model was retrained';
    return 'Face activity recorded by backend';
  }
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

function inferSeverity(type: RoomEventSummary['type'], rawType: string, severity?: string): RoomEventSummary['severity'] {
  if (severity === 'error' || severity === 'warning' || severity === 'success') return severity;
  if (type === 'face') {
    if (rawType.includes('denied')) return 'error';
    if (rawType.includes('recognized')) return 'success';
    return 'info';
  }
  if (type === 'sensor') return 'warning';
  if (type === 'door') return 'success';
  return 'info';
}
