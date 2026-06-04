import { http } from './http';

export type RoomStatus = 'occupied' | 'vacant' | 'maintenance';

export interface RoomDto {
  id: string;
  code: string;
  name: string;
  status: RoomStatus;
  description?: string | null;
  adafruitUsername?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValueState {
  value: string;
  updatedAt: string;
}

export interface HistoryValueState {
  value: string;
  createdAt: string;
}

export interface AutoModeMap {
  led: boolean;
  fan: boolean;
}

export interface SensorState extends ValueState {
  unit: string | null;
}

export type DeviceMap = Record<'led' | 'fan' | 'door', ValueState | null>;
export type SensorMap = Record<'temp' | 'humi' | 'light' | 'human', SensorState | null>;

export interface DashboardSummary {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  totalTenants: number;
  humanDetectedRooms: number;
  globalDevices: Record<'led' | 'fan', ValueState | null>;
}

export interface GlobalDevicesResponse {
  configured: boolean;
  devices: Record<'led' | 'fan', ValueState | null>;
  sensors: Record<'temp' | 'humi', ValueState | null>;
  history: Record<'temp' | 'humi', HistoryValueState[]>;
  autoModes: AutoModeMap;
}

export interface DashboardOccupancy {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  rooms: RoomDto[];
}

export interface DashboardAlert {
  room: RoomDto;
  sensorKey: 'human';
  value: string;
  updatedAt: string;
}

export interface EventDto {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  room?: RoomDto | null;
  actor?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export interface HardwareConfigDto {
  id: string;
  adafruitUsername: string;
  adafruitKeyMasked: string;
  feedMapping: Record<string, string>;
}

export interface UpsertHardwareConfigPayload {
  adafruitUsername: string;
  adafruitKey: string;
  feedMapping?: Record<string, string>;
}

export interface GlobalHardwareConfigDto {
  id: string;
  adafruitUsername: string;
  adafruitKeyMasked: string;
  feedMapping: Record<string, string>;
}

export interface UpsertGlobalHardwareConfigPayload {
  adafruitUsername: string;
  adafruitKey: string;
  feedMapping?: Record<string, string>;
}

export interface AutoControlRetrainResponse {
  success: boolean;
  bundleId?: string;
  bundleDir?: string;
  samples?: {
    fan: number;
    light: number;
  };
  latestManifest?: string;
  defaultModelsPreserved?: boolean;
  error?: string;
}

export interface PermissionDto {
  id: string;
  canControlLed: boolean;
  canControlFan: boolean;
  canControlDoor: boolean;
  canViewSensors: boolean;
  canManageFaces: boolean;
  isRoomAdmin: boolean;
  room?: RoomDto;
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
}

export interface FaceDto {
  id: string;
  label: string;
  displayName?: string | null;
  createdAt: string;
  ai?: unknown;
}

export type UserRole = 'owner' | 'admin' | 'tenant';

export interface UserDto {
  id: string;
  name: string;
  username: string;
  phone?: string | null;
  role: UserRole;
  active: boolean;
  isGlobalAdmin: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdatePermissionPayload {
  canControlLed?: boolean;
  canControlFan?: boolean;
  canControlDoor?: boolean;
  canViewSensors?: boolean;
  canManageFaces?: boolean;
  isRoomAdmin?: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface RoomSummaryDto {
  room: RoomDto;
  members: Array<{
    userId: string;
    name: string;
    role: string;
    isRoomAdmin: boolean;
  }>;
  devices: DeviceMap;
  autoModes: AutoModeMap;
  sensors: SensorMap;
  recentEvents: EventDto[];
}

export interface CreateRoomPayload {
  name: string;
  status: RoomStatus;
  description?: string;
}

export async function getDashboardSummary() {
  const response = await http.get<DashboardSummary>('/dashboard/summary');
  return response.data;
}

export async function getDashboardOccupancy() {
  const response = await http.get<DashboardOccupancy>('/dashboard/occupancy');
  return response.data;
}

export async function getDashboardAlerts() {
  const response = await http.get<DashboardAlert[]>('/dashboard/alerts');
  return response.data;
}

export async function getEvents(limit = 10) {
  const response = await http.get<EventDto[]>('/events', { params: { limit } });
  return response.data;
}

export async function getEventsWithParams(params: { limit?: number; roomId?: string; from?: string; to?: string }) {
  const response = await http.get<EventDto[]>('/events', { params });
  return response.data;
}

export async function login(payload: LoginPayload) {
  const response = await http.post<LoginResponse>('/auth/login', payload);
  return response.data;
}

export async function getMe() {
  const response = await http.get<UserDto>('/auth/me');
  return response.data;
}

export async function getUsers() {
  const response = await http.get<UserDto[]>('/users');
  return response.data;
}

export async function createUser(payload: CreateUserPayload) {
  const response = await http.post<UserDto>('/users', payload);
  return response.data;
}

export async function updateUser(userId: string, payload: UpdateUserPayload) {
  const response = await http.patch<UserDto>(`/users/${userId}`, payload);
  return response.data;
}

export async function revokeUser(userId: string) {
  const response = await http.post<{ message: string }>(`/users/${userId}/revoke`);
  return response.data;
}

export async function resetUserPassword(userId: string) {
  const response = await http.post<{ newPassword: string }>(`/users/${userId}/reset-password`);
  return response.data;
}

export async function getUserRoomAssignments(userId: string) {
  const response = await http.get<PermissionDto[]>(`/users/${userId}/rooms`);
  return response.data;
}

export async function assignUserRoom(userId: string, payload: { roomId: string } & UpdatePermissionPayload) {
  const response = await http.post<PermissionDto>(`/users/${userId}/rooms`, payload);
  return response.data;
}

export async function removeUserRoomAssignment(userId: string, roomId: string) {
  const response = await http.delete<{ deleted: boolean }>(`/users/${userId}/rooms/${roomId}`);
  return response.data;
}

export async function getRooms() {
  const response = await http.get<RoomDto[]>('/rooms');
  return response.data;
}

export async function createRoom(payload: CreateRoomPayload) {
  const response = await http.post<RoomDto>('/rooms', payload);
  return response.data;
}

export async function getRoomSummary(roomId: string) {
  const response = await http.get<RoomSummaryDto>(`/rooms/${roomId}/summary`);
  return response.data;
}

export async function getRoomHardware(roomId: string) {
  const response = await http.get<HardwareConfigDto | null>(`/rooms/${roomId}/hardware`);
  return response.data;
}

export async function upsertRoomHardware(roomId: string, payload: UpsertHardwareConfigPayload) {
  const response = await http.patch<HardwareConfigDto>(`/rooms/${roomId}/hardware`, payload);
  return response.data;
}

export async function getRoomMembers(roomId: string) {
  const response = await http.get<PermissionDto[]>(`/rooms/${roomId}/members`);
  return response.data;
}

export async function addRoomMember(roomId: string, userId: string) {
  const response = await http.post<PermissionDto>(`/rooms/${roomId}/members`, { userId });
  return response.data;
}

export async function updateRoomPermissions(roomId: string, userId: string, payload: UpdatePermissionPayload) {
  const response = await http.patch<PermissionDto>(`/rooms/${roomId}/permissions/${userId}`, payload);
  return response.data;
}

export async function getRoomFaces(roomId: string) {
  const response = await http.get<FaceDto[]>(`/rooms/${roomId}/faces`);
  return response.data;
}

export async function getRoomEvents(roomId: string, limit = 20) {
  const response = await http.get<EventDto[]>(`/rooms/${roomId}/events`, { params: { limit } });
  return response.data;
}

export async function commandRoomDevice(roomId: string, deviceKey: 'led' | 'fan' | 'door', value: string) {
  const response = await http.post<ValueState & { deviceKey: string }>(
    `/rooms/${roomId}/devices/${deviceKey}/command`,
    { value },
  );
  return response.data;
}

export async function autoControlRoomDevice(roomId: string, deviceKey: 'led' | 'fan') {
  const response = await http.post<{ deviceKey: string; enabled: boolean; updatedAt: string }>(
    `/rooms/${roomId}/devices/${deviceKey}/auto`,
  );
  return response.data;
}

export async function commandGlobalDevice(deviceKey: 'led' | 'fan', value: string) {
  const response = await http.post<ValueState & { deviceKey: string }>(
    `/global-devices/${deviceKey}/command`,
    { value },
  );
  return response.data;
}

export async function autoControlGlobalDevice(deviceKey: 'led' | 'fan') {
  const response = await http.post<{ deviceKey: string; enabled: boolean; updatedAt: string }>(
    `/global-devices/${deviceKey}/auto`,
  );
  return response.data;
}

export async function getGlobalDevices() {
  const response = await http.get<GlobalDevicesResponse>('/global-devices');
  return response.data;
}

export async function retrainGlobalAutoControl() {
  const response = await http.post<AutoControlRetrainResponse>('/global-devices/auto-control/retrain');
  return response.data;
}

export async function getGlobalDeviceHardware() {
  const response = await http.get<GlobalHardwareConfigDto | null>('/global-devices/hardware');
  return response.data;
}

export async function upsertGlobalDeviceHardware(payload: UpsertGlobalHardwareConfigPayload) {
  const response = await http.patch<GlobalHardwareConfigDto>('/global-devices/hardware', payload);
  return response.data;
}
