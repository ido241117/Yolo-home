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
          if (!nextModes[device.key]) {
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

  const isRoomMissing = error === 'No room assigned to current user';

  const setDeviceMode = useCallback(
    async (deviceKey: string, mode: DeviceMode) => {
      if (!room) return;
      setDeviceModes((current) => ({ ...current, [deviceKey]: mode }));

      try {
        let nextValue = toDeviceValue(deviceKey, mode);

        if (mode === 'auto' && (deviceKey === 'led' || deviceKey === 'fan')) {
          const response = await autoControlRoomDevice(room.id, deviceKey);
          nextValue = response.value;
        } else {
          await commandRoomDevice(room.id, deviceKey, nextValue);
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
    [refresh, room],
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
