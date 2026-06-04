import { Pressable, Text, View } from 'react-native';
import { DeviceControl, RoomAccessNotice, SensorCard } from '../../components';
import { useRoomOverview } from '../../hooks';
import { styles } from '../../styles/app.styles';
import type { DeviceSummary, SensorSummary } from '../../types';

function getSensorLabel(feedKey: string) {
  if (feedKey === 'temp') {
    return 'Temperature';
  }
  if (feedKey === 'humi') {
    return 'Humidity';
  }
  if (feedKey === 'human') {
    return 'Occupancy';
  }
  if (feedKey === 'light') {
    return 'Light Level';
  }
  return 'Unknown Sensor';
}

function getSensorValue(sensor: SensorSummary) {
  if (sensor.value === null) {
    return 'Offline';
  }
  if (sensor.label === 'temp') {
    return `${sensor.value} C`;
  }
  if (sensor.label === 'humi') {
    return `${sensor.value}%`;
  }
  if (sensor.label === 'human') {
    return sensor.value === '1' ? 'Detected' : 'Clear';
  }
  if (sensor.label === 'light') {
    return `${sensor.value} lux`;
  }
  return sensor.value;
}

function getDeviceLabel(feedKey: string) {
  if (feedKey === 'led') {
    return 'Light';
  }
  if (feedKey === 'fan') {
    return 'Fan';
  }
  if (feedKey === 'door') {
    return 'Door';
  }
  return 'Unknown Device';
}

export default function MyRoomPage() {
  const { room, sensors, devices, deviceModes, loading, error, isRoomMissing, refresh, setDeviceMode } = useRoomOverview();

  if (isRoomMissing) {
    return <RoomAccessNotice />;
  }

  const sensorCards: SensorSummary[] = (loading
    ? ['temp', 'humi', 'human', 'light'].map((key) => ({
        label: getSensorLabel(key),
        value: '0',
      }))
    : sensors.map((sensor) => ({
        label: getSensorLabel(sensor.label),
        value: getSensorValue(sensor),
      }))) as SensorSummary[];
  const deviceControls: DeviceSummary[] = (loading
    ? [
        { key: 'led', label: 'Light', value: '0', active: false },
        { key: 'fan', label: 'Fan', value: '0', active: false },
        { key: 'door', label: 'Door', value: '0', active: false },
      ]
    : devices.map((device) => ({
        ...device,
        label: getDeviceLabel(device.key),
      }))) as DeviceSummary[];

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DADN Mobile</Text>
        <Text style={styles.title}>{room?.name ?? 'My Room'}</Text>
        <Text style={styles.subtitle}>Tenant accounts can control room devices through the NestJS API.</Text>
      </View>

      {error ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Unable to Load Data</Text>
          <Text style={styles.hint}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={refresh}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.statusRow}>
        {sensorCards.map((sensor) => (
          <SensorCard key={sensor.label} sensor={sensor} />
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Room Controls</Text>
        {deviceControls.map((device) => (
          <DeviceControl
            key={device.label}
            device={device}
            mode={deviceModes[device.key] ?? (device.active ? 'on' : 'off')}
            onModeChange={(mode) => setDeviceMode(device.key, mode)}
          />
        ))}
      </View>

    </>
  );
}
