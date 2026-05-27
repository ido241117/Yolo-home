import { Text, View } from 'react-native';
import { styles } from '../../styles/app.styles';
import type { SensorSummary } from '../../types';

interface SensorCardProps {
  sensor: SensorSummary;
}

export default function SensorCard({ sensor }: SensorCardProps) {
  return (
    <View style={styles.sensor}>
      <Text style={styles.sensorLabel}>{sensor.label}</Text>
      <Text style={styles.sensorValue}>{sensor.value}</Text>
    </View>
  );
}
