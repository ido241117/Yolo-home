import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Animated, useRef, useEffect } from 'react-native';
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

        {/* ── Active Gas Alert Banner ── */}
        <View style={s.alertBanner}>
          <View style={s.alertBannerTop}>
            <View style={s.alertIconLg}>
              <Ionicons name="warning-outline" size={26} color={Colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>Phát hiện khí nguy hiểm!</Text>
              <Text style={s.alertSub}>MQ135 — Nồng độ vượt ngưỡng an toàn</Text>
              <Text style={s.alertTime}>14:10:03 · Buzzer đang kích hoạt · LED đỏ nhấp nháy</Text>
            </View>
          </View>

          {/* Gas Gauge */}
          <View style={s.gaugeWrap}>
            <View style={s.gaugeLabelRow}>
              <Text style={s.gaugeLabel}>Nồng độ khí (MQ135)</Text>
              <Text style={s.gaugeValue}>820 <Text style={s.gaugeUnit}>ppm</Text></Text>
            </View>
            <View style={s.gaugeBarBg}>
              <View style={[s.gaugeBarFill, { width: '82%' }]} />
            </View>
            <View style={s.gaugeZones}>
              <Text style={s.gaugeZone}>0</Text>
              <Text style={s.gaugeZone}>An toàn &lt;400</Text>
              <Text style={s.gaugeZone}>Ngưỡng 500</Text>
              <Text style={s.gaugeZone}>1000</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.btnDanger} activeOpacity={0.8}>
            <Ionicons name="call-outline" size={16} color={Colors.white} />
            <Text style={s.btnDangerText}>Khẩn cấp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnDismiss} activeOpacity={0.8}>
            <Text style={s.btnDismissText}>Đã xử lý</Text>
          </TouchableOpacity>
        </View>

        {/* Sensor Status Grid */}
        <Text style={s.sectionLabel}>Trạng thái cảm biến</Text>
        <View style={s.sensorGrid}>
          {[
            { name: 'MQ135 Khí', val: '820', unit: 'ppm', status: 'danger' as const },
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
            { time: '14:10', desc: 'Khí gas vượt ngưỡng — 820 ppm', type: 'danger', badge: 'Khẩn' },
            { time: '14:10', desc: 'Người lạ tại cửa — nhận diện thất bại 34%', type: 'warning', badge: 'Cảnh báo' },
            { time: '13:40', desc: 'Người lạ tại cửa — nhận diện thất bại 41%', type: 'warning', badge: 'Cảnh báo' },
            { time: '11:00', desc: 'Khí gas trở về bình thường — 210 ppm', type: 'success', badge: 'Tự động tắt' },
            { time: '10:55', desc: 'Khí gas vượt ngưỡng — 640 ppm', type: 'danger', badge: 'Khẩn' },
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

  alertBanner: { backgroundColor: Colors.bgDanger, padding: 20, gap: 12 },
  alertBannerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  alertIconLg: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1.5, borderColor: Colors.borderDanger,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  alertTitle: { fontSize: 18, fontWeight: '700', color: Colors.danger },
  alertSub: { fontSize: 13, color: Colors.danger, opacity: 0.8, marginTop: 3 },
  alertTime: { fontSize: 11, color: Colors.danger, opacity: 0.7, marginTop: 2 },

  gaugeWrap: {
    backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 0.5, borderColor: Colors.borderDanger,
    borderRadius: 14, padding: 14,
  },
  gaugeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  gaugeLabel: { fontSize: 12, color: Colors.danger, fontWeight: '500' },
  gaugeValue: { fontSize: 22, fontWeight: '700', color: Colors.danger },
  gaugeUnit: { fontSize: 13, fontWeight: '400' },
  gaugeBarBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(239,68,68,0.2)', overflow: 'hidden' },
  gaugeBarFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.danger },
  gaugeZones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  gaugeZone: { fontSize: 10, color: Colors.danger, opacity: 0.7 },

  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  btnDanger: {
    flex: 1, padding: 14, borderRadius: 14, backgroundColor: Colors.danger,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDangerText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  btnDismiss: {
    flex: 1, padding: 14, borderRadius: 14, backgroundColor: Colors.bgSecondary,
    borderWidth: 0.5, borderColor: Colors.borderSecondary, alignItems: 'center', justifyContent: 'center',
  },
  btnDismissText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },

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
