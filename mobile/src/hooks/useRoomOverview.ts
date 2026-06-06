import { useCallback, useEffect, useState } from 'react';
import { autoControlRoomDevice, commandRoomDevice, getMyDevices, getMyRoom, getMySensors } from '../apis';
import type { DeviceSummary, RoomOverview, SensorSummary } from '../types';

type DeviceMode = 'on' | 'off' | 'auto';

function isOnValue(value: string | null) {
  return value === 'ON' || value === 'UNLOCKED' || value === '1';
}

function toDeviceValue(deviceKey: string, mode: DeviceMode) {
  if (deviceKey === 'door') {
    return mode === 'on' ? 'UNLOCKED' : 'LOCKED';
  }
  return mode === 'on' ? 'ON' : 'OFF';
}

export function useRoomOverview() {
  const [room, setRoom] = useState<RoomOverview | null>(null);
  const [sensors, setSensors] = useState<SensorSummary[]>([]);
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [deviceModes, setDeviceModes] = useState<Record<string, DeviceMode>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextRoom, nextSensors, nextDevices] = await Promise.all([
        getMyRoom(),
        getMySensors(),
        getMyDevices(),
      ]);

      setRoom(nextRoom);
      setSensors(nextSensors);
      setDevices(nextDevices);
      setDeviceModes((current) => {
        const nextModes = { ...current };
        for (const device of nextDevices) {
          if (device.autoEnabled) {
            nextModes[device.key] = 'auto';
          } else {
            nextModes[device.key] = isOnValue(device.value) ? 'on' : 'off';
          }
        }
        return nextModes;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load room data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isRoomMissing =
    error === 'No room assigned to current user' ||
    error === 'Người dùng hiện tại chưa được gán phòng' ||
    error === 'mobile.roomNotAssigned';

  const setDeviceMode = useCallback(
    async (deviceKey: string, mode: DeviceMode) => {
      if (!room) return;
      const roomRef = room.code ?? room.id;
      setDeviceModes((current) => ({ ...current, [deviceKey]: mode }));

      try {
        let nextValue = toDeviceValue(deviceKey, mode);

        if (mode === 'auto' && (deviceKey === 'led' || deviceKey === 'fan')) {
          const response = await autoControlRoomDevice(roomRef, deviceKey);
          if (!response.enabled) {
            const currentDevice = devices.find((device) => device.key === deviceKey);
            setDeviceModes((current) => ({
              ...current,
              [deviceKey]: isOnValue(currentDevice?.value ?? null) ? 'on' : 'off',
            }));
          }
          await refresh();
          return;
        } else {
          await commandRoomDevice(roomRef, deviceKey, nextValue);
        }
        setDevices((current) =>
          current.map((device) =>
            device.key === deviceKey
              ? { ...device, active: isOnValue(nextValue), value: nextValue }
              : device,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to update device');
        await refresh();
      }
    },
    [devices, refresh, room],
  );

  return {
    room,
    sensors,
    devices,
    deviceModes,
    loading,
    error,
    isRoomMissing,
    refresh,
    setDeviceMode,
  };
}
