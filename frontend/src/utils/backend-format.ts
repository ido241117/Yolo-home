import type { EventDto, PermissionDto, SensorMap, ValueState } from '@/apis';

export function isActiveValue(state?: ValueState | null) {
  if (!state) return null;
  return ['1', 'true', 'on', 'yes', 'detected'].includes(String(state.value).trim().toLowerCase());
}

export function isLockedValue(state?: ValueState | null) {
  if (!state) return null;
  return !['0', 'false', 'off', 'unlocked', 'open'].includes(String(state.value).trim().toLowerCase());
}

export function formatDateTime(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatClock(value?: string, includeSeconds = false) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
  }).format(new Date(value));
}

export function sensorValue(sensors: SensorMap | undefined, key: keyof SensorMap, fallback = 'N/A') {
  const state = sensors?.[key];
  if (!state) return fallback;
  return `${state.value}${state.unit ?? ''}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U';
}

export function eventLabel(event: EventDto) {
  const deviceKey = event.payload?.deviceKey;
  const value = event.payload?.value;
  const label = event.payload?.label;
  if (event.type === 'device_command' && deviceKey) return `${String(deviceKey).toUpperCase()} changed to ${value ?? '-'}`;
  if (event.type === 'face_registered') return `Face registered${label ? `: ${String(label)}` : ''}`;
  if (event.type === 'face_deleted') return `Face deleted${label ? `: ${String(label)}` : ''}`;
  if (event.type === 'face_retrain') return 'Face model retrained';
  if (event.type === 'face_recognized') return `Face recognized${label ? `: ${String(label)}` : ''}`;
  if (event.type === 'face_recognition_denied') return 'Face recognition denied';
  return event.type.replaceAll('_', ' ');
}

export function permissionLabels(member: PermissionDto) {
  const labels = [];
  if (member.isRoomAdmin) labels.push('roomAdmin');
  if (member.canControlLed) labels.push('canControlLed');
  if (member.canControlFan) labels.push('canControlFan');
  if (member.canControlDoor) labels.push('canControlDoor');
  if (member.canViewSensors) labels.push('canViewSensors');
  if (member.canManageFaces) labels.push('canManageFaces');
  return labels;
}
