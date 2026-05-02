import { useRef, useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { recognizeVoice, type VoiceResult } from '../../services/api';

type MicState = 'idle' | 'listening' | 'success' | 'error';

function Waveform({ active }: { active: boolean }) {
  const bars = [10, 22, 16, 32, 12, 26, 18, 30, 14, 20, 28, 10];
  const anims = useRef(bars.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (active) {
      const loops = anims.map((a, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 60),
            Animated.timing(a, { toValue: 1, duration: 300 + i * 30, useNativeDriver: true }),
            Animated.timing(a, { toValue: 0.3, duration: 300 + i * 30, useNativeDriver: true }),
          ])
        )
      );
      loops.forEach(l => l.start());
      return () => loops.forEach(l => l.stop());
    } else {
      anims.forEach(a => a.setValue(0.3));
    }
  }, [active]);

  return (
    <View style={wv.row}>
      {bars.map((h, i) => (
        <Animated.View key={i} style={[wv.bar, { height: h, opacity: anims[i] }]} />
      ))}
    </View>
  );
}

const wv = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 40, marginVertical: 16 },
  bar: { width: 5, borderRadius: 3, backgroundColor: Colors.info },
});

type LogEntry = { time: string; phrase: string; acc: string; ok: boolean };

const INITIAL_LOG: LogEntry[] = [
  { time: '13:55', phrase: '"Mở cửa"', acc: '91%', ok: true },
  { time: '11:10', phrase: '"Đóng cửa"', acc: '89%', ok: true },
  { time: '09:30', phrase: '"Mở cửa"', acc: '72%', ok: false },
];

export default function VoiceScreen() {
  const [micState, setMicState] = useState<MicState>('idle');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceResult | null>(null);
  const [log, setLog] = useState<LogEntry[]>(INITIAL_LOG);
  const [apiError, setApiError] = useState<string | null>(null);

  const isListening = micState === 'listening' || loading;

  const tint = micState === 'success' ? Colors.success
    : micState === 'error' ? Colors.danger
    : isListening ? Colors.info
    : Colors.textTertiary;

  const bgMic = micState === 'success' ? Colors.bgSuccess
    : micState === 'error' ? Colors.bgDanger
    : isListening ? Colors.bgInfo
    : Colors.bgSecondary;

  const statusText = loading ? 'Đang xử lý…'
    : micState === 'listening' ? 'Đang lắng nghe…'
    : micState === 'success' ? 'Đã thực thi lệnh!'
    : micState === 'error' ? 'Không nhận dạng được'
    : 'Nhấn để bắt đầu';

  const subText = lastResult?.success
    ? lastResult.message
    : micState === 'error' ? 'Nhấn lại để thử lại'
    : isListening ? 'Phát lệnh bằng tiếng Việt\nNhận dạng trong vòng 5 giây'
    : 'Nhấn mic để gửi lệnh đến backend';

  const micIcon: keyof typeof Ionicons.glyphMap = micState === 'idle' ? 'mic-off-outline' : 'mic-outline';

  async function handleMicPress() {
    if (loading) return;
    setLoading(true);
    setMicState('listening');
    setLastResult(null);
    setApiError(null);
    try {
      const result = await recognizeVoice();
      setLastResult(result);
      setMicState(result.success ? 'success' : 'error');
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLog(prev => [{
        time,
        phrase: result.command ? `"${result.command}"` : '"???"',
        acc: `${Math.round(result.confidence * 100)}%`,
        ok: result.success,
      }, ...prev.slice(0, 9)]);
    } catch {
      setApiError('Không kết nối được backend. Kiểm tra IP trong services/api.ts');
      setMicState('error');
    } finally {
      setLoading(false);
    }
  }

  const appBadgeBg = micState === 'success' ? Colors.bgSuccess : micState === 'error' ? Colors.bgDanger : Colors.bgInfo;
  const appBadgeBorder = micState === 'success' ? Colors.borderSuccess : micState === 'error' ? Colors.borderDanger : Colors.borderInfo;
  const appBadgeDot = micState === 'success' ? Colors.success : micState === 'error' ? Colors.danger : Colors.info;
  const appBadgeLabel = micState === 'success' ? 'Thực thi thành công' : micState === 'error' ? 'Thất bại' : isListening ? 'Đang lắng nghe' : 'Sẵn sàng';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* App Bar */}
      <View style={s.appBar}>
        <Text style={s.barTitle}>Giọng nói</Text>
        <View style={[s.badge, { backgroundColor: appBadgeBg, borderColor: appBadgeBorder }]}>
          <View style={[s.dot, { backgroundColor: appBadgeDot }]} />
          <Text style={[s.badgeText, { color: appBadgeDot }]}>{appBadgeLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* API Error Banner */}
        {apiError && (
          <View style={s.errorBanner}>
            <Ionicons name="warning-outline" size={14} color={Colors.danger} />
            <Text style={s.errorText}>{apiError}</Text>
          </View>
        )}

        {/* Last Result Card */}
        {lastResult && (
          <View style={[s.resultCard, {
            backgroundColor: lastResult.success ? Colors.bgSuccess : Colors.bgDanger,
            borderColor: lastResult.success ? Colors.borderSuccess : Colors.borderDanger,
          }]}>
            <View style={[s.resultIcon, { borderColor: lastResult.success ? Colors.borderSuccess : Colors.borderDanger }]}>
              <Ionicons
                name={lastResult.success ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={16}
                color={lastResult.success ? Colors.success : Colors.danger}
              />
            </View>
            <View>
              <Text style={[s.resultPhrase, { color: lastResult.success ? Colors.success : Colors.danger }]}>
                {lastResult.command ? `"${lastResult.command}"` : '"Không nhận ra"'}
              </Text>
              <Text style={[s.resultMeta, { color: lastResult.success ? Colors.success : Colors.danger }]}>
                {lastResult.message} · Độ khớp {Math.round(lastResult.confidence * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* Mic Hero */}
        <View style={s.micSection}>
          <Text style={s.micLabel}>Nhấn để gửi lệnh giọng nói đến backend</Text>

          <TouchableOpacity onPress={handleMicPress} activeOpacity={0.85} disabled={loading}>
            <View style={[s.micOuter, isListening && s.micOuterListening]}>
              <View style={[s.micBtn, { backgroundColor: bgMic }]}>
                {loading
                  ? <ActivityIndicator size="large" color={Colors.info} />
                  : <Ionicons name={micIcon} size={40} color={tint} />
                }
              </View>
            </View>
          </TouchableOpacity>

          <Waveform active={isListening} />

          <Text style={s.micStatusText}>{statusText}</Text>
          <Text style={s.micSubText}>{subText}</Text>
        </View>

        {/* Command Chips */}
        <Text style={s.cmdHintLabel}>Lệnh hỗ trợ</Text>
        <View style={s.cmdChips}>
          {[
            { label: '"Mở cửa"', acc: 'tb 91%', color: Colors.success },
            { label: '"Đóng cửa"', acc: 'tb 89%', color: Colors.danger },
          ].map((c, i) => (
            <View key={i} style={s.cmdChip}>
              <Ionicons
                name={i === 0 ? 'lock-open-outline' : 'lock-closed-outline'}
                size={20}
                color={c.color}
              />
              <Text style={s.cmdChipText}>{c.label}</Text>
              <Text style={s.cmdChipAcc}>{c.acc}</Text>
            </View>
          ))}
        </View>

        {/* Unavailable Notice */}
        <View style={s.unavailBar}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.warning} />
          <Text style={s.unavailText}>
            Không khả dụng khi mất kết nối điện thoại — hệ thống chuyển sang mật mã
          </Text>
        </View>

        {/* Log */}
        <Text style={s.sectionLabel}>Nhật ký hôm nay</Text>
        <View style={s.logWrap}>
          {log.map((entry, i) => (
            <View key={i} style={[s.logRow, i > 0 && s.logBorder]}>
              <Text style={s.logTime}>{entry.time}</Text>
              <Text style={s.logPhrase}>{entry.phrase}</Text>
              <View style={[s.badge, { backgroundColor: entry.ok ? Colors.bgSuccess : Colors.bgTertiary, borderColor: entry.ok ? Colors.borderSuccess : Colors.borderSecondary }]}>
                <Text style={[s.badgeText, { color: entry.ok ? Colors.success : Colors.textSecondary }]}>
                  {entry.ok ? 'Thực thi' : 'Không khớp'}
                </Text>
              </View>
              <Text style={[s.logAcc, { color: entry.ok ? Colors.success : Colors.warning }]}>{entry.acc}</Text>
            </View>
          ))}
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
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, borderWidth: 0.5 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  content: { padding: 20, paddingBottom: 32, alignItems: 'center' },

  errorBanner: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.bgDanger, borderWidth: 0.5, borderColor: Colors.borderDanger,
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 12, color: Colors.danger, lineHeight: 18 },

  resultCard: {
    width: '100%', borderRadius: 16, padding: 14, borderWidth: 0.5,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28,
  },
  resultIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  resultPhrase: { fontSize: 15, fontWeight: '600' },
  resultMeta: { fontSize: 11, opacity: 0.8, marginTop: 2 },

  micSection: { alignItems: 'center', width: '100%', marginBottom: 28 },
  micLabel: { fontSize: 13, color: Colors.textTertiary, marginBottom: 20 },
  micOuter: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgSecondary,
  },
  micOuterListening: { backgroundColor: 'rgba(59,130,246,0.08)' },
  micBtn: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  micStatusText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  micSubText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  cmdHintLabel: {
    fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, alignSelf: 'flex-start',
  },
  cmdChips: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 20 },
  cmdChip: {
    flex: 1, padding: 14, borderRadius: 14, borderWidth: 0.5, borderColor: Colors.borderSecondary,
    backgroundColor: Colors.bgSecondary, alignItems: 'center', gap: 6,
  },
  cmdChipText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  cmdChipAcc: { fontSize: 11, color: Colors.textTertiary },

  unavailBar: {
    width: '100%', backgroundColor: Colors.bgWarning, borderWidth: 0.5, borderColor: Colors.borderWarning,
    borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 20,
  },
  unavailText: { flex: 1, fontSize: 12, color: Colors.warning, lineHeight: 18 },

  sectionLabel: {
    fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, alignSelf: 'flex-start',
  },
  logWrap: { width: '100%', backgroundColor: Colors.bgSecondary, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: Colors.borderTertiary },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  logBorder: { borderTopWidth: 0.5, borderTopColor: Colors.borderTertiary },
  logTime: { fontSize: 11, color: Colors.textTertiary, fontVariant: ['tabular-nums'], width: 42, flexShrink: 0 },
  logPhrase: { flex: 1, fontSize: 12, color: Colors.textPrimary },
  logAcc: { fontSize: 11, fontWeight: '500' },
});
