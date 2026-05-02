import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { recognizeFace, type FaceResult } from '../../services/api';

type StepState = 'done' | 'active' | 'pending';

const STEPS: { label: string; state: StepState }[] = [
  { label: 'Nhìn thẳng', state: 'done' },
  { label: 'Trái', state: 'done' },
  { label: 'Phải', state: 'done' },
  { label: 'Ngẩng', state: 'active' },
  { label: 'Cúi', state: 'pending' },
];

type LogEntry = {
  time: string;
  name: string;
  action: string;
  ok: boolean | null;
  conf: string;
};

const INITIAL_LOG: LogEntry[] = [
  { time: '14:28', name: 'Thiên Nguyễn', action: 'Mở cửa', ok: true, conf: '96%' },
  { time: '14:10', name: 'Người lạ', action: 'Từ chối', ok: false, conf: '34%' },
  { time: '13:55', name: 'An Nguyễn', action: 'Mở cửa', ok: true, conf: '93%' },
  { time: '13:40', name: 'Người lạ', action: 'Từ chối', ok: false, conf: '41%' },
];

function StepBar() {
  return (
    <>
      <View style={st.steps}>
        {STEPS.map((step, i) => (
          <View
            key={i}
            style={[
              st.step,
              step.state === 'done' && { backgroundColor: Colors.success },
              step.state === 'active' && { backgroundColor: Colors.info },
            ]}
          />
        ))}
      </View>
      <View style={st.stepLabels}>
        {STEPS.map((step, i) => (
          <Text key={i} style={[st.stepLbl, step.state === 'active' && { color: Colors.info, fontWeight: '500' }]}>
            {step.label}
          </Text>
        ))}
      </View>
    </>
  );
}

type ViewfinderProps = { scanning: boolean; lastResult: FaceResult | null };

function Viewfinder({ scanning, lastResult }: ViewfinderProps) {
  const borderColor = lastResult
    ? lastResult.action === 'UNLOCK' ? '#22c55e' : '#ef4444'
    : '#64c8ff';

  const badgeBg = lastResult
    ? lastResult.action === 'UNLOCK' ? Colors.bgSuccess : Colors.bgDanger
    : Colors.bgInfo;
  const badgeBorder = lastResult
    ? lastResult.action === 'UNLOCK' ? Colors.borderSuccess : Colors.borderDanger
    : Colors.borderInfo;
  const badgeDot = lastResult
    ? lastResult.action === 'UNLOCK' ? Colors.success : Colors.danger
    : Colors.info;
  const badgeLabel = lastResult
    ? lastResult.action === 'UNLOCK' ? 'Nhận diện thành công' : 'Từ chối — người lạ'
    : scanning ? 'Đang nhận diện…' : 'Sẵn sàng';

  const hintText = lastResult
    ? lastResult.message
    : scanning ? 'Giữ yên — đang xử lý…' : 'Ngẩng đầu nhẹ lên · giữ yên 2 giây';

  return (
    <View style={vf.wrap}>
      <View style={vf.bg}>
        <View style={vf.silouette} />
      </View>
      <View style={[vf.oval, { borderColor }]} />
      <View style={[vf.corner, vf.tl, { borderColor }]} />
      <View style={[vf.corner, vf.tr, { borderColor }]} />
      <View style={[vf.corner, vf.bl, { borderColor }]} />
      <View style={[vf.corner, vf.br, { borderColor }]} />
      <View style={vf.topBadge}>
        {scanning ? (
          <ActivityIndicator size="small" color={Colors.info} />
        ) : (
          <View style={[st.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <View style={[st.dot, { backgroundColor: badgeDot }]} />
            <Text style={[st.badgeText, { color: badgeDot }]}>{badgeLabel}</Text>
          </View>
        )}
      </View>
      <Text style={vf.hint}>{hintText}</Text>
    </View>
  );
}

const vf = StyleSheet.create({
  wrap: {
    borderRadius: 20, overflow: 'hidden', backgroundColor: '#000',
    aspectRatio: 3 / 4, marginBottom: 14, position: 'relative',
  },
  bg: { flex: 1, backgroundColor: '#16213e', alignItems: 'center', justifyContent: 'center' },
  silouette: { width: 80, height: 100, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 40 },
  oval: {
    position: 'absolute', width: 180, height: 220, borderRadius: 90,
    borderWidth: 2, top: '50%', left: '50%', marginLeft: -90, marginTop: -130,
  },
  corner: { position: 'absolute', width: 24, height: 24 },
  tl: { top: '28%', left: '16%', borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  tr: { top: '28%', right: '16%', borderTopWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  bl: { bottom: '28%', left: '16%', borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: 4 },
  br: { bottom: '28%', right: '16%', borderBottomWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  topBadge: { position: 'absolute', top: 14, left: 0, right: 0, alignItems: 'center' },
  hint: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500', paddingHorizontal: 16 },
});

export default function FaceScreen() {
  const [enrolling, setEnrolling] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<FaceResult | null>(null);
  const [log, setLog] = useState<LogEntry[]>(INITIAL_LOG);
  const [sampleCount, setSampleCount] = useState(3);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleCapture() {
    setScanning(true);
    setLastResult(null);
    setApiError(null);
    try {
      const result = await recognizeFace();
      setLastResult(result);
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (result.action === 'UNLOCK') {
        setSampleCount(c => Math.min(c + 1, 5));
        setLog(prev => [{
          time,
          name: result.identity === 'authorized_user' ? 'Đã đăng ký' : result.identity,
          action: 'Mở cửa',
          ok: true,
          conf: `${Math.round(result.confidence * 100)}%`,
        }, ...prev.slice(0, 9)]);
      } else {
        setLog(prev => [{
          time,
          name: 'Người lạ',
          action: 'Từ chối',
          ok: false,
          conf: `${Math.round(result.confidence * 100)}%`,
        }, ...prev.slice(0, 9)]);
      }
    } catch (e) {
      setApiError('Không kết nối được backend. Kiểm tra IP trong services/api.ts');
    } finally {
      setScanning(false);
    }
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      {/* App Bar */}
      <View style={st.appBar}>
        <Text style={st.barTitle}>Khuôn mặt</Text>
        <View style={[st.badge, { backgroundColor: Colors.bgSuccess, borderColor: Colors.borderSuccess }]}>
          <View style={[st.dot, { backgroundColor: Colors.success }]} />
          <Text style={[st.badgeText, { color: Colors.success }]}>Camera OK</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>

        {/* API Error Banner */}
        {apiError && (
          <View style={st.errorBanner}>
            <Ionicons name="warning-outline" size={14} color={Colors.danger} />
            <Text style={st.errorText}>{apiError}</Text>
          </View>
        )}

        {/* Last recognition result card */}
        {lastResult && (
          <View style={[st.resultCard, {
            backgroundColor: lastResult.action === 'UNLOCK' ? Colors.bgSuccess : Colors.bgDanger,
            borderColor: lastResult.action === 'UNLOCK' ? Colors.borderSuccess : Colors.borderDanger,
          }]}>
            <Ionicons
              name={lastResult.action === 'UNLOCK' ? 'checkmark-circle' : 'close-circle'}
              size={22}
              color={lastResult.action === 'UNLOCK' ? Colors.success : Colors.danger}
            />
            <View style={{ flex: 1 }}>
              <Text style={[st.resultTitle, { color: lastResult.action === 'UNLOCK' ? Colors.success : Colors.danger }]}>
                {lastResult.action === 'UNLOCK' ? '✓ Cửa đã mở' : '✗ Từ chối — người lạ'}
              </Text>
              <Text style={[st.resultSub, { color: lastResult.action === 'UNLOCK' ? Colors.success : Colors.danger }]}>
                {lastResult.message} · Độ tin cậy {Math.round(lastResult.confidence * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* Registered Faces */}
        <Text style={st.sectionLabel}>Khuôn mặt đã đăng ký (3)</Text>
        <View style={st.faceList}>
          {[
            { initials: 'TN', name: 'Thiên Nguyễn', role: 'Chủ nhà', samples: 5, date: '01/04/2026', acc: '96%', accOk: true, color: Colors.info, bg: Colors.bgInfo },
            { initials: 'AN', name: 'An Nguyễn', role: '', samples: 3, date: '03/04/2026', acc: '91%', accOk: true, color: Colors.success, bg: Colors.bgSuccess },
            { initials: 'BT', name: 'Bảo Trân', role: '', samples: sampleCount, date: sampleCount < 3 ? 'Cần thêm mẫu (≥3)' : `Đăng ký ${sampleCount}/5 mẫu`, acc: '87%', accOk: sampleCount >= 3, color: Colors.warning, bg: Colors.bgWarning },
          ].map((f, i) => (
            <View key={i} style={[st.faceRow, i === 0 && { borderColor: Colors.borderInfo, backgroundColor: Colors.bgInfo }]}>
              <View style={[st.faceAvatar, { backgroundColor: f.bg }]}>
                <Text style={[st.avatarText, { color: f.color }]}>{f.initials}</Text>
              </View>
              <View style={st.faceInfo}>
                <Text style={st.faceName}>
                  {f.name}
                  {f.role ? <Text style={[st.roleTag, { color: Colors.info }]}> {f.role}</Text> : null}
                </Text>
                <Text style={st.faceMeta}>{f.samples} mẫu · {f.date}</Text>
              </View>
              <Text style={[st.faceAcc, { color: f.accOk ? Colors.success : Colors.warning }]}>{f.acc}</Text>
              <TouchableOpacity style={[st.iconBtn, st.iconBtnDanger]} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add Face Button */}
        <TouchableOpacity style={st.addFaceBtn} activeOpacity={0.8} onPress={() => { setEnrolling(true); setLastResult(null); }}>
          <View style={[st.addFaceIcon, { borderColor: Colors.borderInfo }]}>
            <Ionicons name="add" size={18} color={Colors.info} />
          </View>
          <View>
            <Text style={[st.addFaceText, { color: Colors.info }]}>Đăng ký khuôn mặt mới</Text>
            <Text style={[st.addFaceSub, { color: Colors.info }]}>Dùng camera điện thoại — thu 5 mẫu</Text>
          </View>
        </TouchableOpacity>

        {/* Enrollment Flow */}
        {enrolling && (
          <>
            <Text style={st.sectionLabel}>Quy trình đăng ký — Bảo Trân (thêm mẫu)</Text>
            <StepBar />

            <View style={st.chipRow}>
              {[
                { label: '✓ nhìn thẳng', state: 'done' },
                { label: '✓ quay trái', state: 'done' },
                { label: '✓ quay phải', state: 'done' },
                { label: '▶ ngẩng lên', state: 'active' },
                { label: 'cúi xuống', state: 'pending' },
              ].map((c, i) => (
                <View key={i} style={[st.chip,
                  c.state === 'done' && { backgroundColor: Colors.bgSuccess, borderColor: Colors.borderSuccess },
                  c.state === 'active' && { backgroundColor: Colors.bgInfo, borderColor: Colors.borderInfo },
                ]}>
                  <Text style={[st.chipText,
                    c.state === 'done' && { color: Colors.success },
                    c.state === 'active' && { color: Colors.info, fontWeight: '500' },
                  ]}>{c.label}</Text>
                </View>
              ))}
            </View>

            <Viewfinder scanning={scanning} lastResult={lastResult} />

            <View style={st.card}>
              <View style={st.statRow}>
                <Text style={st.statKey}>Tiến độ thu mẫu</Text>
                <Text style={[st.statVal, { color: Colors.info }]}>{sampleCount} / 5 mẫu</Text>
              </View>
              <View style={[st.statRow, st.statBorder]}>
                <Text style={st.statKey}>Ngưỡng chấp nhận</Text>
                <Text style={st.statVal}>≥ 90% độ tin cậy</Text>
              </View>
              <View style={[st.statRow, st.statBorder]}>
                <Text style={st.statKey}>Ánh sáng môi trường</Text>
                <View style={[st.badge, { backgroundColor: Colors.bgSuccess, borderColor: Colors.borderSuccess }]}>
                  <View style={[st.dot, { backgroundColor: Colors.success }]} />
                  <Text style={[st.badgeText, { color: Colors.success }]}>Đủ sáng</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[st.btnPrimary, scanning && { opacity: 0.6 }]}
              activeOpacity={0.8}
              onPress={handleCapture}
              disabled={scanning}
            >
              {scanning
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={st.btnPrimaryText}>Chụp mẫu ({sampleCount + 1}/5)</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={st.btnGhost} activeOpacity={0.8} onPress={() => { setEnrolling(false); setLastResult(null); }}>
              <Text style={st.btnGhostText}>Hủy đăng ký</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Recognition Log */}
        <Text style={[st.sectionLabel, { marginTop: 24 }]}>Nhật ký nhận diện hôm nay</Text>
        <View style={st.logWrap}>
          {log.map((entry, i) => (
            <View key={i} style={[st.logRow, i > 0 && st.logBorder]}>
              <Text style={st.logTime}>{entry.time}</Text>
              <Text style={[st.logName, entry.ok === false && { color: Colors.danger }, entry.ok === null && { color: Colors.textSecondary }]}>
                {entry.name}
              </Text>
              <View style={[st.badge, {
                backgroundColor: entry.ok === true ? Colors.bgSuccess : entry.ok === false ? Colors.bgDanger : Colors.bgTertiary,
                borderColor: entry.ok === true ? Colors.borderSuccess : entry.ok === false ? Colors.borderDanger : Colors.borderSecondary,
              }]}>
                <Text style={[st.badgeText, { color: entry.ok === true ? Colors.success : entry.ok === false ? Colors.danger : Colors.textSecondary }]}>
                  {entry.action}
                </Text>
              </View>
              <Text style={[st.logConf, { color: entry.ok === true ? Colors.success : entry.ok === false ? Colors.danger : Colors.textTertiary }]}>
                {entry.conf}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgPrimary },
  appBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary,
  },
  barTitle: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 0.5 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  content: { padding: 20, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '500', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.bgDanger, borderWidth: 0.5, borderColor: Colors.borderDanger,
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 12, color: Colors.danger, lineHeight: 18 },

  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 0.5, marginBottom: 16,
  },
  resultTitle: { fontSize: 14, fontWeight: '600' },
  resultSub: { fontSize: 12, opacity: 0.8, marginTop: 2 },

  faceList: { gap: 10, marginBottom: 14 },
  faceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgSecondary, borderRadius: 14, padding: 12,
    borderWidth: 0.5, borderColor: Colors.borderTertiary,
  },
  faceAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 16, fontWeight: '600' },
  faceInfo: { flex: 1, minWidth: 0 },
  faceName: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  roleTag: { fontSize: 10, fontWeight: '500' },
  faceMeta: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  faceAcc: { fontSize: 12, fontWeight: '500' },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: Colors.borderSecondary, backgroundColor: Colors.bgPrimary },
  iconBtnDanger: { borderColor: Colors.borderDanger },

  addFaceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.borderInfo,
    backgroundColor: Colors.bgInfo, marginBottom: 14,
  },
  addFaceIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgInfo, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  addFaceText: { fontSize: 13, fontWeight: '500' },
  addFaceSub: { fontSize: 11, opacity: 0.75, marginTop: 2 },

  steps: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.borderTertiary },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  stepLbl: { fontSize: 10, color: Colors.textTertiary },

  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 0.5, borderColor: Colors.borderSecondary, backgroundColor: Colors.bgSecondary },
  chipText: { fontSize: 12, color: Colors.textSecondary },

  card: { backgroundColor: Colors.bgSecondary, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: Colors.borderTertiary, marginBottom: 14 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  statBorder: { borderTopWidth: 0.5, borderTopColor: Colors.borderTertiary },
  statKey: { fontSize: 13, color: Colors.textSecondary },
  statVal: { fontSize: 13, fontWeight: '500' },

  btnPrimary: { width: '100%', padding: 16, borderRadius: 14, backgroundColor: Colors.info, alignItems: 'center', marginBottom: 8 },
  btnPrimaryText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  btnGhost: { width: '100%', padding: 13, borderRadius: 14, borderWidth: 0.5, borderColor: Colors.borderSecondary, alignItems: 'center', marginBottom: 8 },
  btnGhostText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },

  logWrap: { backgroundColor: Colors.bgSecondary, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: Colors.borderTertiary },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  logBorder: { borderTopWidth: 0.5, borderTopColor: Colors.borderTertiary },
  logTime: { fontSize: 11, color: Colors.textTertiary, fontVariant: ['tabular-nums'], width: 42, flexShrink: 0 },
  logName: { flex: 1, fontSize: 12, color: Colors.textPrimary },
  logConf: { fontSize: 11, marginLeft: 4 },
});
