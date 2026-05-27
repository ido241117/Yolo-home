import { Pressable, Text, View } from 'react-native';
import { DeviceControl, SensorCard } from '../../components';
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
  const { room, sensors, devices, deviceModes, loading, error, refresh, setDeviceMode } = useRoomOverview();
  const sensorCards: SensorSummary[] = sensors.map((sensor) => ({
    label: getSensorLabel(sensor.label),
    value: getSensorValue(sensor),
  }));
  const deviceControls: DeviceSummary[] = devices.map((device) => ({
    ...device,
    label: getDeviceLabel(device.key),
  }));

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DADN Mobile</Text>
        <Text style={styles.title}>{room?.name ?? 'My Room'}</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Loading live room data...' : 'Tenant accounts can control room devices through the NestJS API.'}
        </Text>
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

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Face Access</Text>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Open Enrollment Camera</Text>
        </Pressable>
        <Text style={styles.hint}>FaceAI runs through the backend instead of being called directly from the app.</Text>
      </View>
    </>
  );
}
