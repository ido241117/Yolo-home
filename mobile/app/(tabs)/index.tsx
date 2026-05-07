import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type SensorCardProps = {
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
};

function SensorCard({ label, value, unit, status }: SensorCardProps) {
  const tint =
    status === 'danger' ? Colors.danger :
    status === 'warning' ? Colors.warning :
    Colors.success;
  const bg =
    status === 'danger' ? Colors.bgDanger :
    status === 'warning' ? Colors.bgWarning :
    Colors.bgSuccess;
  const border =
    status === 'danger' ? Colors.borderDanger :
    status === 'warning' ? Colors.borderWarning :
    Colors.borderSuccess;

  return (
    <View style={[s.sensorCard, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[s.sensorLabel, { color: tint }]}>{label}</Text>
      <Text style={[s.sensorValue, { color: tint }]}>
        {value}<Text style={s.sensorUnit}> {unit}</Text>
      </Text>
    </View>
  );
}

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress?: () => void;
};

function QuickAction({ icon, label, color = Colors.info, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={s.qaBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.qaIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={s.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* App Bar */}
      <View style={s.appBar}>
        <View>
          <Text style={s.appTitle}>YoloHome</Text>
          <Text style={s.appSub}>Xin chào, Thiên Nguyễn</Text>
        </View>
        <View style={[s.statusDot, { backgroundColor: Colors.bgSuccess, borderColor: Colors.borderSuccess }]}>
          <View style={[s.dot, { backgroundColor: Colors.success }]} />
          <Text style={[s.statusText, { color: Colors.success }]}>Online</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Alert Banner */}
        <View style={s.alertBanner}>
          <Ionicons name="warning" size={16} color={Colors.danger} />
          <Text style={s.alertText}>1 cảnh báo đang hoạt động · Người lạ</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.danger} />
        </View>

        {/* Section: Cảm biến */}
        <Text style={s.sectionLabel}>Cảm biến</Text>
        <View style={s.sensorGrid}>
          <SensorCard label="DHT20 Nhiệt" value="32" unit="°C" status="normal" />
          <SensorCard label="DHT20 Ẩm" value="65" unit="%" status="normal" />
          <SensorCard label="PIR Cửa" value="Phát hiện" unit="" status="warning" />
        </View>

        {/* Section: Trạng thái thiết bị */}
        <Text style={s.sectionLabel}>Thiết bị</Text>
        <View style={s.deviceCard}>
          {[
            { icon: 'lock-closed-outline' as const, name: 'Khóa cửa', state: 'Đã khóa', ok: true },
            { icon: 'bulb-outline' as const, name: 'Đèn phòng khách', state: 'Tắt', ok: true },
            { icon: 'thermometer-outline' as const, name: 'Buzzer', state: 'Đang kêu', ok: false },
          ].map((d, i) => (
            <View key={i} style={[s.deviceRow, i > 0 && s.deviceBorder]}>
              <View style={[s.deviceIcon, { backgroundColor: Colors.bgSecondary }]}>
                <Ionicons name={d.icon} size={18} color={Colors.textSecondary} />
              </View>
              <Text style={s.deviceName}>{d.name}</Text>
              <View style={[s.badge, { backgroundColor: d.ok ? Colors.bgSuccess : Colors.bgDanger, borderColor: d.ok ? Colors.borderSuccess : Colors.borderDanger }]}>
                <View style={[s.dot, { backgroundColor: d.ok ? Colors.success : Colors.danger }]} />
                <Text style={[s.badgeText, { color: d.ok ? Colors.success : Colors.danger }]}>{d.state}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section: Thao tác nhanh */}
        <Text style={s.sectionLabel}>Thao tác nhanh</Text>
        <View style={s.qaRow}>
          <QuickAction icon="lock-open-outline" label="Mở cửa" color={Colors.success} />
          <QuickAction icon="lock-closed-outline" label="Đóng cửa" color={Colors.danger} />
          <QuickAction icon="mic-outline" label="Giọng nói" color={Colors.info} />
          <QuickAction icon="person-circle-outline" label="Khuôn mặt" color={Colors.warning} />
        </View>

        {/* Section: Nhật ký gần đây */}
        <Text style={s.sectionLabel}>Nhật ký gần đây</Text>
        <View style={s.logWrap}>
          {[
            { time: '14:10', desc: 'Người lạ tại cửa — 34% tin cậy', type: 'warning' },
            { time: '13:55', desc: 'Thiên Nguyễn mở cửa — giọng nói', type: 'success' },
            { time: '13:40', desc: 'An Nguyễn mở cửa — khuôn mặt 93%', type: 'success' },
          ].map((log, i) => {
            const c = log.type === 'danger' ? Colors.danger : log.type === 'warning' ? Colors.warning : Colors.success;
            return (
              <View key={i} style={[s.logRow, i > 0 && s.logBorder]}>
                <View style={[s.logDot, { backgroundColor: c }]} />
                <Text style={s.logTime}>{log.time}</Text>
                <Text style={s.logDesc}>{log.desc}</Text>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgPrimary },
  appBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary,
  },
  appTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  appSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 0.5 },
  statusText: { fontSize: 11, fontWeight: '500' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  content: { padding: 20, paddingBottom: 32 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.bgDanger, borderWidth: 0.5, borderColor: Colors.borderDanger,
    borderRadius: 12, padding: 12, marginBottom: 20,
  },
  alertText: { flex: 1, fontSize: 12, color: Colors.danger, fontWeight: '500' },
  sectionLabel: {
    fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, marginTop: 4,
  },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  sensorCard: { width: '47.5%', borderRadius: 14, padding: 14, borderWidth: 0.5 },
  sensorLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sensorValue: { fontSize: 22, fontWeight: '700' },
  sensorUnit: { fontSize: 12, fontWeight: '400' },
  deviceCard: { backgroundColor: Colors.bgSecondary, borderRadius: 16, borderWidth: 0.5, borderColor: Colors.borderTertiary, marginBottom: 20 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  deviceBorder: { borderTopWidth: 0.5, borderTopColor: Colors.borderTertiary },
  deviceIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deviceName: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 0.5 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  qaRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  qaBtn: { flex: 1, alignItems: 'center', gap: 6 },
  qaIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  logWrap: { backgroundColor: Colors.bgSecondary, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: Colors.borderTertiary },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  logBorder: { borderTopWidth: 0.5, borderTopColor: Colors.borderTertiary },
  logDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  logTime: { fontSize: 11, color: Colors.textTertiary, fontVariant: ['tabular-nums'], width: 42, flexShrink: 0 },
  logDesc: { flex: 1, fontSize: 12, color: Colors.textPrimary },
});
