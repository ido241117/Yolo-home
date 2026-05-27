import { useCallback, useEffect, useState } from 'react';
import { commandRoomDevice, getMyDevices, getMyRoom, getMySensors, predictAutoControl } from '../apis';
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

function readNumber(sensors: SensorSummary[], key: string, fallback: number) {
  const raw = sensors.find((sensor) => sensor.label === key)?.value;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readDeviceState(devices: DeviceSummary[], key: string) {
  const device = devices.find((item) => item.key === key);
  return isOnValue(device?.value ?? null);
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

  const setDeviceMode = useCallback(
    async (deviceKey: string, mode: DeviceMode) => {
      if (!room) return;
      setDeviceModes((current) => ({ ...current, [deviceKey]: mode }));

      try {
        let nextValue = toDeviceValue(deviceKey, mode);

        if (mode === 'auto') {
          const prediction = await predictAutoControl({
            sensor_data: {
              temperature: readNumber(sensors, 'temp', 25),
              humidity: readNumber(sensors, 'humi', 50),
              light: readNumber(sensors, 'light', 400),
            },
            device_states: {
              fan: readDeviceState(devices, 'fan'),
              light: readDeviceState(devices, 'led'),
            },
          });

          const action = deviceKey === 'fan' ? prediction.fan?.action : prediction.light?.action;
          if (action === 'ON' || action === 'OFF') {
            nextValue = action;
          }
        }

        await commandRoomDevice(room.id, deviceKey, nextValue);
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
    [devices, refresh, room, sensors],
  );

  return {
    room,
    sensors,
    devices,
    deviceModes,
    loading,
    error,
    refresh,
    setDeviceMode,
  };
}
