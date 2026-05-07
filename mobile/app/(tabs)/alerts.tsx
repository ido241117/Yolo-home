import { useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

function BlinkDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 450, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[s.blinkDot, { opacity }]} />;
}

export default function AlertsScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* App Bar */}
      <View style={s.appBar}>
        <Text style={s.barTitle}>Cảnh báo</Text>
        <BlinkDot />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Sensor Status Grid */}
        <Text style={s.sectionLabel}>Trạng thái cảm biến</Text>
        <View style={s.sensorGrid}>
          {[
            { name: 'DHT20 Nhiệt', val: '32', unit: '°C', status: 'normal' as const },
            { name: 'DHT20 Ẩm', val: '65', unit: '%', status: 'normal' as const },
            { name: 'PIR Cửa', val: 'Phát hiện', unit: '', status: 'warning' as const },
          ].map((s2, i) => {
            const tint = s2.status === 'danger' ? Colors.danger : s2.status === 'warning' ? Colors.warning : Colors.textPrimary;
            const bg = s2.status === 'danger' ? Colors.bgDanger : s2.status === 'warning' ? Colors.bgWarning : Colors.bgSecondary;
            const border = s2.status === 'danger' ? Colors.borderDanger : s2.status === 'warning' ? Colors.borderWarning : Colors.borderTertiary;
            return (
              <View key={i} style={[s.sensorCard, { backgroundColor: bg, borderColor: border }]}>
                <Text style={[s.scName, { color: tint }]}>{s2.name}</Text>
                <Text style={[s.scVal, { color: tint }]}>{s2.val}{s2.unit ? <Text style={s.scUnit}> {s2.unit}</Text> : null}</Text>
              </View>
            );
          })}
        </View>

        {/* Stranger Alert */}
        <Text style={s.sectionLabel}>Cảnh báo người lạ</Text>
        <View style={s.strangerCard}>
          <View style={s.strangerIcon}>
            <Ionicons name="person-remove-outline" size={18} color={Colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.strangerTitle}>Phát hiện người lạ tại cửa</Text>
            <Text style={s.strangerSub}>Nhận diện khuôn mặt thất bại · 34% — dưới ngưỡng 90%</Text>
            <Text style={s.strangerTime}>14:10:33 · Buzzer + LED đỏ kích hoạt</Text>
          </View>
          <View style={s.strangerThumb}>
            <Ionicons name="camera-outline" size={18} color={Colors.textTertiary} />
          </View>
        </View>

        {/* Alert History Log */}
        <Text style={s.sectionLabel}>Lịch sử cảnh báo hôm nay</Text>
        <View style={s.logWrap}>
          {[
            { time: '14:10', desc: 'Người lạ tại cửa — nhận diện thất bại 34%', type: 'warning', badge: 'Cảnh báo' },
            { time: '13:40', desc: 'Người lạ tại cửa — nhận diện thất bại 41%', type: 'warning', badge: 'Cảnh báo' },
            { time: '09:00', desc: 'PIR báo động giả — không phát hiện khuôn mặt', type: 'neutral', badge: 'Auto reset' },
          ].map((log, i) => {
            const c = log.type === 'danger' ? Colors.danger : log.type === 'warning' ? Colors.warning : log.type === 'success' ? Colors.success : Colors.textTertiary;
            const bgB = log.type === 'danger' ? Colors.bgDanger : log.type === 'warning' ? Colors.bgWarning : log.type === 'success' ? Colors.bgSuccess : Colors.bgTertiary;
            return (
              <View key={i} style={[s.logRow, i > 0 && s.logBorder]}>
                <View style={[s.logDot, { backgroundColor: c }]} />
                <Text style={s.logTime}>{log.time}</Text>
                <Text style={s.logDesc}>{log.desc}</Text>
                <View style={[s.badge, { backgroundColor: bgB }]}>
                  <Text style={[s.badgeText, { color: c }]}>{log.badge}</Text>
                </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary,
  },
  barTitle: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  blinkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.danger },
  content: { paddingBottom: 32 },

  sectionLabel: {
    fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, marginHorizontal: 20, marginTop: 4,
  },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 20, marginBottom: 16 },
  sensorCard: { width: '47.5%', borderRadius: 14, padding: 14, borderWidth: 0.5 },
  scName: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  scVal: { fontSize: 22, fontWeight: '700' },
  scUnit: { fontSize: 12, fontWeight: '400', color: Colors.textTertiary },

  strangerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.bgWarning, borderWidth: 0.5, borderColor: Colors.borderWarning,
    borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 16,
  },
  strangerIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 1, borderColor: Colors.borderWarning,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  strangerTitle: { fontSize: 14, fontWeight: '600', color: Colors.warning },
  strangerSub: { fontSize: 12, color: Colors.warning, opacity: 0.8, marginTop: 3 },
  strangerTime: { fontSize: 11, color: Colors.warning, opacity: 0.7, marginTop: 4 },
  strangerThumb: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: Colors.bgSecondary,
    borderWidth: 0.5, borderColor: Colors.borderWarning, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  logWrap: { backgroundColor: Colors.bgSecondary, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: Colors.borderTertiary, marginHorizontal: 20, marginBottom: 20 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  logBorder: { borderTopWidth: 0.5, borderTopColor: Colors.borderTertiary },
  logDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  logTime: { fontSize: 11, color: Colors.textTertiary, fontVariant: ['tabular-nums'], width: 42, flexShrink: 0 },
  logDesc: { flex: 1, fontSize: 12, color: Colors.textPrimary },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 10, fontWeight: '500' },
});
