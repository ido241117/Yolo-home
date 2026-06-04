import { Pressable, Text, View } from 'react-native';
import { styles, theme } from '../../styles';
import type { DeviceSummary } from '../../types';

type DeviceMode = 'on' | 'off' | 'auto';

interface DeviceControlProps {
  device: DeviceSummary;
  mode: DeviceMode;
  onModeChange: (mode: DeviceMode) => void;
}

export default function DeviceControl({ device, mode, onModeChange }: DeviceControlProps) {
  const value =
    device.label === 'Door'
      ? device.active
        ? 'Unlocked'
        : 'Locked'
      : mode === 'auto'
        ? 'Auto'
        : device.active
          ? 'On'
          : 'Off';
  const modes: DeviceMode[] = device.key === 'door' ? ['off', 'on'] : ['on', 'off', 'auto'];

  return (
    <View style={styles.deviceRow}>
      <View>
        <Text style={styles.deviceName}>{device.label}</Text>
        <Text style={styles.deviceState}>{value}</Text>
      </View>
      <View style={styles.segmentedControl}>
        {modes.map((item) => {
          const selected = item === mode;
          const label =
            device.key === 'door'
              ? item === 'on'
                ? 'Unlock'
                : 'Lock'
              : item === 'on'
                ? 'On'
                : item === 'off'
                  ? 'Off'
                  : 'Auto';

          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onModeChange(item)}
              style={[styles.segmentedItem, selected && styles.segmentedItemActive]}
            >
              <Text style={[styles.segmentedText, selected && { color: theme.colors.onPrimary }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
