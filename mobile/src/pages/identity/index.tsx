import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CheckCircle2, CircleAlert, Lock, ScanFace, Trash2, UserPlus, Wand2 } from 'lucide-react-native';
import {
  commandRoomDevice,
  deleteRoomFace,
  getRoomEvents,
  getRoomFaces,
  recognizeRoomFace,
  registerRoomFace,
  retrainRoomFaces,
} from '../../apis';
import { useRoomOverview } from '../../hooks';
import { theme } from '../../styles';
import type { FaceSummary, RoomEventSummary } from '../../types';

const REGISTER_MIN_IMAGES = 3;
const REGISTER_CAMERA_TARGET_IMAGES = 5;
const REGISTER_MAX_IMAGES = 7;

export default function IdentityPage() {
  const { room, refresh } = useRoomOverview();
  const [faces, setFaces] = useState<FaceSummary[]>([]);
  const [history, setHistory] = useState<RoomEventSummary[]>([]);
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  useEffect(() => {
    if (!room?.id) return;
    void loadIdentityData(room.id);
  }, [room?.id]);

  const totalLabel = useMemo(() => `${faces.length} Total`, [faces.length]);

  async function loadIdentityData(roomId: string) {
    try {
      const [nextFaces, nextEvents] = await Promise.all([getRoomFaces(roomId), getRoomEvents(roomId)]);
      setFaces(nextFaces);
      setHistory(nextEvents.filter((event) => event.type === 'door').slice(0, 5));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to load face data');
    }
  }

  async function pickImageBase64(source: 'camera' | 'library') {
    if (source === 'library') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo library permission needed', 'Allow photo access to select a face image.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        quality: 0.72,
      });

      if (result.canceled || !result.assets[0]?.base64) return null;
      return result.assets[0].base64;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to capture a face image.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      quality: 0.65,
    });

    if (result.canceled || !result.assets[0]?.base64) return null;
    return result.assets[0].base64;
  }

  async function pickRegisterImagesBase64(source: 'camera' | 'library') {
    if (source === 'library') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo library permission needed', 'Allow photo access to select several face images.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: REGISTER_MAX_IMAGES,
        base64: true,
        quality: 0.7,
      });

      if (result.canceled) return null;
      const images = result.assets.map((asset) => asset.base64).filter((value): value is string => Boolean(value));
      if (images.length < REGISTER_MIN_IMAGES) {
        Alert.alert('More samples needed', `Select at least ${REGISTER_MIN_IMAGES} clear face photos.`);
        return null;
      }
      return images.slice(0, REGISTER_MAX_IMAGES);
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to capture several face images.');
      return null;
    }

    const images: string[] = [];
    const prompts = ['Look straight', 'Turn left slightly', 'Turn right slightly', 'Tilt up or down slightly', 'Hold still for one clear shot'];
    for (let index = 0; index < REGISTER_CAMERA_TARGET_IMAGES; index += 1) {
      setStatus(`Capture ${index + 1}/${REGISTER_CAMERA_TARGET_IMAGES}: ${prompts[index]}`);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        quality: 0.65,
      });

      if (result.canceled) break;
      const image = result.assets[0]?.base64;
      if (image) images.push(image);
    }

    if (images.length < REGISTER_MIN_IMAGES) {
      Alert.alert('More samples needed', `Capture at least ${REGISTER_MIN_IMAGES} clear face photos.`);
      return null;
    }
    return images;
  }

  async function handleRegisterFace(source: 'camera' | 'library') {
    if (!room?.id || isRegistering) return;
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      Alert.alert('Face label required', 'Enter a short label before registering this face.');
      return;
    }

    setIsRegistering(true);
    setStatus(source === 'camera' ? 'Capturing face samples...' : 'Selecting face samples...');
    try {
      const images = await pickRegisterImagesBase64(source);
      if (!images) return;
      setStatus(`Uploading ${images.length} face samples...`);
      const result = await registerRoomFace(room.id, cleanLabel, images);
      await loadIdentityData(room.id);
      setLabel('');
      const ai = result as { ai?: { accepted_samples?: number; rejected_samples?: number } };
      const accepted = ai.ai?.accepted_samples ?? images.length;
      const rejected = ai.ai?.rejected_samples ?? 0;
      setStatus(`Face registered with ${accepted} sample(s)${rejected ? `; ${rejected} rejected by quality checks` : ''}.`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Unable to register face';
      setStatus(`Face registration failed: ${detail}`);
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleFaceUnlock(source: 'camera' | 'library') {
    if (!room?.id || isRecognizing) return;
    setIsRecognizing(true);
    setStatus(source === 'camera' ? 'Capturing face for unlock...' : 'Selecting face image for unlock...');
    try {
      const image = await pickImageBase64(source);
      if (!image) return;
      const result = await recognizeRoomFace(room.id, image);
      const confidence = result.confidence == null ? '-' : `${Math.round(result.confidence * 100)}%`;
      setStatus(result.doorUnlocked ? `Door unlocked by ${result.label ?? 'face'} (${confidence})` : `Access denied (${confidence})`);
      await Promise.all([loadIdentityData(room.id), refresh()]);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to recognize face');
    } finally {
      setIsRecognizing(false);
    }
  }

  async function handleLockDoor() {
    if (!room?.id || isLocking) return;
    setIsLocking(true);
    try {
      await commandRoomDevice(room.id, 'door', 'LOCKED');
      setStatus('Door locked.');
      await Promise.all([loadIdentityData(room.id), refresh()]);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to lock door');
    } finally {
      setIsLocking(false);
    }
  }

  async function handleRetrain() {
    if (!room?.id || isRetraining) return;
    setIsRetraining(true);
    try {
      await retrainRoomFaces(room.id);
      setStatus('Face model retrained.');
    } catch {
      setStatus('Retrain request failed.');
    } finally {
      setIsRetraining(false);
    }
  }

  async function handleDelete(faceId: string) {
    setFaces((current) => current.filter((face) => face.id !== faceId));
    if (!room?.id) return;
    deleteRoomFace(room.id, faceId)
      .catch(() => undefined);
  }

  return (
    <View style={pageStyles.page}>
      <View style={pageStyles.cameraCard}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1200&auto=format&fit=crop' }}
          style={pageStyles.cameraImage}
        />
        <View style={pageStyles.cameraOverlay} />
        <View style={pageStyles.scanFrame}>
          <ScanFace size={52} color={theme.colors.onPrimary} strokeWidth={1.8} />
        </View>
        <View style={pageStyles.cameraCopy}>
          <Text style={pageStyles.cameraKicker}>Live Feed</Text>
          <Text style={pageStyles.cameraTitle}>Secure Entry Cam</Text>
        </View>
      </View>

      <View style={pageStyles.controlCard}>
        <TextInput
          style={pageStyles.labelInput}
          value={label}
          onChangeText={setLabel}
          placeholder="Face label, e.g. thien_primary"
          placeholderTextColor={theme.colors.outline}
          autoCapitalize="none"
        />
        <View style={pageStyles.actionRow}>
          <Pressable style={pageStyles.tertiaryAction} onPress={() => handleRegisterFace('camera')} disabled={isRegistering}>
            <UserPlus size={18} color={theme.colors.onSurface} />
            <Text style={pageStyles.tertiaryActionText}>Camera Add</Text>
          </Pressable>
          <Pressable style={pageStyles.tertiaryAction} onPress={() => handleFaceUnlock('camera')} disabled={isRecognizing}>
            <ScanFace size={18} color={theme.colors.onSurface} />
            <Text style={pageStyles.tertiaryActionText}>Camera Unlock</Text>
          </Pressable>
        </View>
        <View style={pageStyles.actionRow}>
          <Pressable style={pageStyles.tertiaryAction} onPress={handleLockDoor} disabled={isLocking}>
            <Lock size={18} color={theme.colors.onSurface} />
            <Text style={pageStyles.tertiaryActionText}>{isLocking ? 'Locking...' : 'Lock Door'}</Text>
          </Pressable>
          <Pressable style={pageStyles.tertiaryAction} onPress={handleRetrain} disabled={isRetraining}>
            <Wand2 size={18} color={theme.colors.onSurface} />
            <Text style={pageStyles.tertiaryActionText}>{isRetraining ? 'Processing...' : 'Retrain AI'}</Text>
          </Pressable>
        </View>
        {status && <Text style={pageStyles.statusText}>{status}</Text>}
      </View>

      <View style={pageStyles.sectionHeader}>
        <Text style={pageStyles.sectionTitle}>Registered Faces</Text>
        <Text style={pageStyles.countPill}>{totalLabel}</Text>
      </View>

      <View style={pageStyles.list}>
        {faces.map((face, index) => (
          <View key={face.id} style={pageStyles.faceRow}>
            <View style={pageStyles.faceInfo}>
              <Image
                source={{ uri: `https://i.pravatar.cc/120?img=${index + 12}` }}
                style={pageStyles.faceImage}
              />
              <View>
                <Text style={pageStyles.faceName}>{face.name}</Text>
                <Text style={pageStyles.faceMeta}>Added: {face.addedAt ?? 'Recently'}</Text>
              </View>
            </View>
            <Pressable style={pageStyles.deleteButton} onPress={() => handleDelete(face.id)}>
              <Trash2 size={20} color={theme.colors.error} />
            </Pressable>
          </View>
        ))}
        {faces.length === 0 && (
          <View style={pageStyles.emptyCard}>
            <Text style={pageStyles.emptyTitle}>No registered faces</Text>
            <Text style={pageStyles.emptyText}>Enter a label, then capture or select 3-7 clear face samples.</Text>
          </View>
        )}
      </View>

      <View style={pageStyles.sectionHeader}>
        <Text style={pageStyles.sectionTitle}>Recognition History</Text>
        <Text style={pageStyles.linkText}>View All</Text>
      </View>

      <View style={pageStyles.list}>
        {history.map((item) => {
          const ok = item.severity !== 'error';
          return (
          <View key={item.id} style={[pageStyles.historyCard, ok ? pageStyles.successBorder : pageStyles.errorBorder]}>
            <View style={pageStyles.historyTop}>
              <View style={pageStyles.historyStatus}>
                {ok ? (
                  <CheckCircle2 size={20} color={theme.colors.secondary} fill={theme.colors.secondary} />
                ) : (
                  <CircleAlert size={20} color={theme.colors.error} />
                )}
                <Text style={pageStyles.historyTitle}>{item.title}</Text>
              </View>
              <Text style={pageStyles.historyTime}>{item.time}</Text>
            </View>
            <View style={pageStyles.historyBottom}>
              <Text style={pageStyles.historyName}>{item.description}</Text>
              <Text style={[pageStyles.historyAction, ok ? pageStyles.successText : pageStyles.errorText]}>
                {ok ? 'Accepted' : 'Denied'}
              </Text>
            </View>
          </View>
        );
        })}
        {history.length === 0 && (
          <View style={pageStyles.emptyCard}>
            <Text style={pageStyles.emptyTitle}>No door access history</Text>
            <Text style={pageStyles.emptyText}>Face unlock and door lock events will appear here.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const { colors, elevation, rounded, spacing, typography } = theme;

const pageStyles = StyleSheet.create({
  page: {
    gap: spacing.md,
  },
  cameraCard: {
    height: 196,
    borderRadius: rounded.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
    ...elevation.card,
  },
  cameraImage: {
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(53, 37, 205, 0.32)',
  },
  scanFrame: {
    position: 'absolute',
    top: 46,
    alignSelf: 'center',
    width: 104,
    height: 104,
    borderRadius: rounded.md,
    borderWidth: 2,
    borderColor: colors.inversePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCopy: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
  },
  cameraKicker: {
    color: colors.inverseOnSurface,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '600',
  },
  cameraTitle: {
    color: colors.onPrimary,
    fontSize: typography.headlineMd.fontSize,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  controlCard: {
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    gap: spacing.md,
    ...elevation.card,
  },
  labelInput: {
    minHeight: 52,
    borderRadius: rounded.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHighest,
    color: colors.onSurface,
    paddingHorizontal: spacing.md,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '700',
  },
  tertiaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: rounded.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tertiaryActionText: {
    color: colors.onSurface,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '800',
  },
  statusText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: typography.headlineMd.fontSize,
    fontWeight: '700',
  },
  countPill: {
    borderRadius: rounded.full,
    backgroundColor: colors.primaryContainer,
    color: colors.onPrimaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '800',
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '800',
  },
  list: {
    gap: spacing.sm,
  },
  faceRow: {
    minHeight: 76,
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...elevation.card,
  },
  faceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  faceImage: {
    width: 48,
    height: 48,
    borderRadius: rounded.md,
    backgroundColor: colors.surfaceContainer,
  },
  faceName: {
    color: colors.onSurface,
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '700',
  },
  faceMeta: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: rounded.md,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    gap: 4,
    ...elevation.card,
  },
  emptyTitle: {
    color: colors.onSurface,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
  },
  historyCard: {
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerLowest,
    borderLeftWidth: 4,
    padding: spacing.md,
    gap: spacing.sm,
    ...elevation.card,
  },
  successBorder: {
    borderLeftColor: colors.secondary,
  },
  errorBorder: {
    borderLeftColor: colors.error,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyTitle: {
    color: colors.onSurface,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '800',
  },
  historyTime: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  historyBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyName: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodyMd.fontSize,
  },
  confidence: {
    borderRadius: rounded.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  successPill: {
    backgroundColor: colors.activeTint,
    color: colors.secondary,
  },
  errorPill: {
    backgroundColor: colors.errorContainer,
    color: colors.onErrorContainer,
  },
  historyAction: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  successText: {
    color: colors.secondary,
  },
  errorText: {
    color: colors.error,
  },
});
