import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CheckCircle2, CircleAlert, Lock, ScanFace, Trash2, UserPlus } from 'lucide-react-native';
import {
  commandRoomDevice,
  deleteRoomFace,
  getRoomEvents,
  getRoomFaces,
  recognizeRoomFace,
  registerRoomFace,
} from '../../apis';
import { RoomAccessNotice } from '../../components';
import { useRoomOverview } from '../../hooks';
import { theme } from '../../styles';
import type { FaceSummary, RoomEventSummary } from '../../types';

const REGISTER_MIN_IMAGES = 3;
const REGISTER_CAMERA_TARGET_IMAGES = 5;
const REGISTER_MAX_IMAGES = 7;
type CameraMode = 'register' | 'unlock';

export default function IdentityPage() {
  const { room, devices, refresh, isRoomMissing } = useRoomOverview();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [faces, setFaces] = useState<FaceSummary[]>([]);
  const [history, setHistory] = useState<RoomEventSummary[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [deletingFaceId, setDeletingFaceId] = useState<string | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode | null>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraSwitching, setCameraSwitching] = useState(false);
  const [cameraPreviewMounted, setCameraPreviewMounted] = useState(true);
  const [cameraPreviewKey, setCameraPreviewKey] = useState(0);
  const [cameraModalShown, setCameraModalShown] = useState(false);
  const [cameraShots, setCameraShots] = useState<string[]>([]);
  const cameraRef = useRef<any>(null);
  const cameraSwapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cameraSwapTimer.current) clearTimeout(cameraSwapTimer.current);
    };
  }, []);

  const roomRef = room?.code ?? room?.id;
  const door = devices.find((device) => device.key === 'door');
  const isDoorUnlocked = door?.value === 'UNLOCKED' || door?.active;

  useEffect(() => {
    if (!roomRef) return;
    void loadIdentityData(roomRef);
  }, [roomRef]);

  const totalLabel = useMemo(() => `${faces.length} Total`, [faces.length]);

  if (isRoomMissing) {
    return <RoomAccessNotice />;
  }

  async function loadIdentityData(roomId: string) {
    try {
      const [nextFaces, nextEvents] = await Promise.all([getRoomFaces(roomId), getRoomEvents(roomId)]);
      setFaces(nextFaces);
      setHistory(nextEvents.filter((event) => event.type === 'face').slice(0, 5));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to load face data');
    }
  }

  async function pickImageBase64() {
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

  async function pickRegisterImagesBase64() {
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

  function resetCameraSession() {
    if (cameraSwapTimer.current) {
      clearTimeout(cameraSwapTimer.current);
      cameraSwapTimer.current = null;
    }
    setIsCameraVisible(false);
    setCameraMode(null);
    setCameraFacing('front');
    setCameraReady(false);
    setCameraBusy(false);
    setCameraSwitching(false);
    setCameraPreviewMounted(true);
    setCameraModalShown(false);
    setCameraShots([]);
  }

  async function switchCameraFacing() {
    if (cameraBusy || cameraSwitching) return;

    const nextFacing: CameraType = cameraFacing === 'back' ? 'front' : 'back';
    setCameraSwitching(true);
    setCameraReady(false);
    setCameraPreviewMounted(false);
    setCameraFacing(nextFacing);

    if (cameraSwapTimer.current) clearTimeout(cameraSwapTimer.current);
    cameraSwapTimer.current = setTimeout(() => {
      setCameraPreviewKey((current) => current + 1);
      setCameraPreviewMounted(true);
      cameraSwapTimer.current = null;
    }, 120);
  }

  async function ensureCameraPermission() {
    if (cameraPermission?.granted) return true;

    const permission = await requestCameraPermission();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to capture face images.');
      return false;
    }

    return true;
  }

  async function openCameraSession(mode: CameraMode) {
    if (!roomRef) return;

    const granted = await ensureCameraPermission();
    if (!granted) return;

    if (mode === 'register') {
      setCameraShots([]);
    }

    setCameraMode(mode);
    setCameraFacing('front');
    setCameraReady(false);
    setCameraBusy(false);
    setCameraSwitching(false);
    setCameraPreviewMounted(true);
    setCameraModalShown(false);
    setIsCameraVisible(true);
    setStatus(
      mode === 'register'
        ? `Capture ${REGISTER_MIN_IMAGES}-${REGISTER_MAX_IMAGES} samples. Target ${REGISTER_CAMERA_TARGET_IMAGES}.`
        : 'Capture one clear image to unlock the door.',
    );
  }

  async function handleCapturePhoto() {
    if (!cameraReady || !cameraRef.current || !cameraMode || cameraBusy || cameraSwitching) return;

    setCameraBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: cameraMode === 'register' ? 0.65 : 0.72,
      });

      const image = photo?.base64;
      if (!image) {
        setStatus('Unable to read camera capture.');
        return;
      }

      if (cameraMode === 'unlock') {
        const roomId = roomRef;
        resetCameraSession();
        if (!roomId) return;

        const result = await recognizeRoomFace(roomId, image);
        const confidence = result.confidence == null ? '-' : `${Math.round(result.confidence * 100)}%`;
        setStatus(result.doorUnlocked ? `Door unlocked (${confidence})` : `Access denied (${confidence})`);
        await Promise.all([loadIdentityData(roomId), refresh()]);
        return;
      }

      setCameraShots((current) => {
        const next = [...current, image].slice(0, REGISTER_MAX_IMAGES);
        setStatus(
          next.length >= REGISTER_MAX_IMAGES
            ? `Captured ${next.length}/${REGISTER_MAX_IMAGES} samples. Tap Done to save.`
            : `Captured ${next.length}/${REGISTER_MAX_IMAGES} sample(s).`,
        );
        return next;
      });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to capture photo');
    } finally {
      setCameraBusy(false);
    }
  }

  function handleUndoCameraShot() {
    setCameraShots((current) => current.slice(0, -1));
  }

  async function handleFinalizeCameraRegistration() {
    if (!roomRef || isRegistering) return;

    if (cameraShots.length < REGISTER_MIN_IMAGES) {
      Alert.alert('More samples needed', `Capture at least ${REGISTER_MIN_IMAGES} clear face photos.`);
      return;
    }

    const roomId = roomRef;
    const images = cameraShots;

    setIsRegistering(true);
    setStatus(`Uploading ${images.length} face samples...`);
    resetCameraSession();

    try {
      const result = await registerRoomFace(roomId, images);
      await loadIdentityData(roomId);
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

  async function handleRegisterFace(source: 'camera' | 'library') {
    if (!roomRef || isRegistering) return;

    if (source === 'camera') {
      await openCameraSession('register');
      return;
    }

    setIsRegistering(true);
    setStatus('Selecting face samples...');
    try {
      const images = await pickRegisterImagesBase64();
      if (!images) return;
      setStatus(`Uploading ${images.length} face samples...`);
      const result = await registerRoomFace(roomRef, images);
      await loadIdentityData(roomRef);
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
    if (!roomRef || isRecognizing) return;

    if (source === 'camera') {
      await openCameraSession('unlock');
      return;
    }

    setIsRecognizing(true);
    setStatus('Selecting face image for unlock...');
    try {
      const image = await pickImageBase64();
      if (!image) return;
      const result = await recognizeRoomFace(roomRef, image);
      const confidence = result.confidence == null ? '-' : `${Math.round(result.confidence * 100)}%`;
      setStatus(result.doorUnlocked ? `Door unlocked (${confidence})` : `Access denied (${confidence})`);
      await Promise.all([loadIdentityData(roomRef), refresh()]);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to recognize face');
    } finally {
      setIsRecognizing(false);
    }
  }

  async function handleLockDoor() {
    if (!roomRef || isLocking) return;
    setIsLocking(true);
    try {
      await commandRoomDevice(roomRef, 'door', 'LOCKED');
      setStatus('Door locked.');
      await Promise.all([loadIdentityData(roomRef), refresh()]);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to lock door');
    } finally {
      setIsLocking(false);
    }
  }

  async function handleDoorAction() {
    if (isDoorUnlocked) {
      await handleLockDoor();
      return;
    }
    await handleFaceUnlock('camera');
  }

  async function handleDelete(faceId: string) {
    if (!roomRef || deletingFaceId) return;

    setDeletingFaceId(faceId);
    setStatus('Deleting face profile...');
    try {
      await deleteRoomFace(roomRef, faceId);
      await Promise.all([loadIdentityData(roomRef), refresh()]);
      setStatus('Face profile deleted.');
    } catch (err) {
      setStatus(err instanceof Error ? `Unable to delete face: ${err.message}` : 'Unable to delete face');
    } finally {
      setDeletingFaceId(null);
    }
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
        <Text style={pageStyles.faceRegisterHint}>Capture 3-7 clear face samples. The app will assign the internal face ID automatically.</Text>
        <View style={pageStyles.actionRow}>
          <Pressable style={pageStyles.tertiaryAction} onPress={() => handleRegisterFace('camera')} disabled={isRegistering}>
            <UserPlus size={18} color={theme.colors.onSurface} />
            <Text style={pageStyles.tertiaryActionText}>Camera Add</Text>
          </Pressable>
          <Pressable style={pageStyles.tertiaryAction} onPress={handleDoorAction} disabled={isRecognizing || isLocking}>
            {isDoorUnlocked ? (
              <Lock size={18} color={theme.colors.onSurface} />
            ) : (
              <ScanFace size={18} color={theme.colors.onSurface} />
            )}
            <Text style={pageStyles.tertiaryActionText}>
              {isLocking ? 'Locking...' : isRecognizing ? 'Scanning...' : isDoorUnlocked ? 'Lock Door' : 'Camera Unlock'}
            </Text>
          </Pressable>
        </View>
        {status && <Text style={pageStyles.statusText}>{status}</Text>}
      </View>

      <Modal
        visible={isCameraVisible}
        animationType="slide"
        onShow={() => setCameraModalShown(true)}
        onRequestClose={resetCameraSession}
      >
          <View style={pageStyles.cameraModal}>
          <View style={pageStyles.cameraPreviewShell}>
            {cameraModalShown && cameraPreviewMounted ? (
              <CameraView
                key={cameraPreviewKey}
                ref={cameraRef}
                style={[pageStyles.cameraPreview, { width: windowWidth, height: windowHeight }]}
                facing={cameraFacing}
                onCameraReady={() => {
                  setCameraReady(true);
                  setCameraSwitching(false);
                }}
              />
            ) : (
              <View style={[pageStyles.cameraPreviewPlaceholder, { width: windowWidth, height: windowHeight }]}>
                <ActivityIndicator color={theme.colors.onPrimary} />
                <Text style={pageStyles.cameraSwitchText}>Switching camera...</Text>
              </View>
            )}
          </View>
          <View style={pageStyles.cameraScrim} />

          <View style={pageStyles.cameraTopBar}>
            <Pressable style={pageStyles.cameraTopButton} onPress={resetCameraSession}>
              <Text style={pageStyles.cameraTopButtonText}>Cancel</Text>
            </Pressable>

            <View style={pageStyles.cameraTopCenter}>
              <Text style={pageStyles.cameraModeText}>
                {cameraMode === 'register' ? 'Register face samples' : 'Unlock with camera'}
              </Text>
              <Text style={pageStyles.cameraHintText}>
                {cameraMode === 'register'
                  ? `${cameraShots.length}/${REGISTER_MAX_IMAGES} samples`
                  : 'Capture one clear image'}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${cameraFacing === 'back' ? 'front' : 'back'} camera`}
              style={[pageStyles.cameraTopIconButton, (cameraBusy || cameraSwitching) && pageStyles.cameraTopButtonDisabled]}
              onPress={switchCameraFacing}
              disabled={cameraBusy || cameraSwitching}
            >
              <Camera size={18} color={theme.colors.onPrimary} />
            </Pressable>

            <Pressable
              style={[pageStyles.cameraTopButton, (!cameraShots.length || cameraBusy) && pageStyles.cameraTopButtonDisabled]}
              onPress={handleUndoCameraShot}
              disabled={!cameraShots.length || cameraBusy || cameraMode !== 'register'}
            >
              <Text style={pageStyles.cameraTopButtonText}>Undo</Text>
            </Pressable>
          </View>

          <View style={pageStyles.cameraFooter}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pageStyles.sampleStrip}>
              {cameraShots.map((shot, index) => (
                <View key={`${shot.slice(0, 24)}-${index}`} style={pageStyles.sampleThumbWrap}>
                  <Image source={{ uri: `data:image/jpeg;base64,${shot}` }} style={pageStyles.sampleThumb} />
                </View>
              ))}
            </ScrollView>

            <View style={pageStyles.cameraActionRow}>
              <Pressable style={pageStyles.cameraActionSecondary} onPress={resetCameraSession}>
                <Text style={pageStyles.cameraActionSecondaryText}>Close</Text>
              </Pressable>

              <Pressable
                style={[pageStyles.cameraActionPrimary, (!cameraReady || cameraBusy || cameraSwitching) && pageStyles.cameraActionDisabled]}
                onPress={handleCapturePhoto}
                disabled={!cameraReady || cameraBusy || cameraSwitching}
              >
                {cameraBusy ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={pageStyles.cameraActionPrimaryText}>Capture</Text>}
              </Pressable>

              {cameraMode === 'register' ? (
                <Pressable
                  style={[pageStyles.cameraActionSecondary, cameraShots.length < REGISTER_MIN_IMAGES && pageStyles.cameraActionDisabled]}
                  onPress={handleFinalizeCameraRegistration}
                  disabled={cameraShots.length < REGISTER_MIN_IMAGES || isRegistering}
                >
                  <Text style={pageStyles.cameraActionSecondaryText}>{isRegistering ? 'Saving...' : 'Done'}</Text>
                </Pressable>
              ) : (
                <View style={pageStyles.cameraActionGhost} />
              )}
            </View>
          </View>
        </View>
      </Modal>

      <View style={pageStyles.sectionHeader}>
        <Text style={pageStyles.sectionTitle}>Registered Faces</Text>
        <Text style={pageStyles.countPill}>{totalLabel}</Text>
      </View>

      <View style={pageStyles.list}>
        {faces.map((face) => (
          <View key={face.id} style={pageStyles.faceRow}>
            <View style={pageStyles.faceInfo}>
              {face.previewImage ? (
                <Image source={{ uri: `data:image/jpeg;base64,${face.previewImage}` }} style={pageStyles.faceImage} />
              ) : (
                <View style={pageStyles.faceImageFallback} />
              )}
              <View>
                <Text style={pageStyles.faceName}>{face.name}</Text>
              </View>
            </View>
            <Pressable
              style={[pageStyles.deleteButton, deletingFaceId === face.id && pageStyles.deleteButtonDisabled]}
              onPress={() => handleDelete(face.id)}
              disabled={Boolean(deletingFaceId)}
            >
              {deletingFaceId === face.id ? (
                <ActivityIndicator color={theme.colors.error} />
              ) : (
                <Trash2 size={20} color={theme.colors.error} />
              )}
            </Pressable>
          </View>
        ))}
        {faces.length === 0 && (
          <View style={pageStyles.emptyCard}>
            <Text style={pageStyles.emptyTitle}>No registered faces</Text>
            <Text style={pageStyles.emptyText}>Capture or select 3-7 clear face samples to create the first face profile.</Text>
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
  faceRegisterHint: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '700',
    lineHeight: typography.labelMd.lineHeight,
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
  cameraModal: {
    flex: 1,
    backgroundColor: colors.inverseSurface,
    position: 'relative',
    overflow: 'hidden',
  },
  cameraPreviewShell: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.inverseSurface,
    overflow: 'hidden',
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraPreviewPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inverseSurface,
  },
  cameraSwitchText: {
    color: colors.inverseOnSurface,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '700',
  },
  cameraScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cameraTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cameraTopCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  cameraModeText: {
    color: colors.onPrimary,
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '800',
  },
  cameraHintText: {
    color: colors.inverseOnSurface,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '700',
  },
  cameraTopButton: {
    minWidth: 68,
    minHeight: 38,
    borderRadius: rounded.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  cameraTopButtonDisabled: {
    opacity: 0.45,
  },
  cameraTopIconButton: {
    width: 38,
    height: 38,
    borderRadius: rounded.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTopButtonText: {
    color: colors.onPrimary,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '800',
  },
  cameraFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(11, 28, 48, 0.72)',
    gap: spacing.md,
  },
  sampleStrip: {
    gap: spacing.sm,
    alignItems: 'center',
    minHeight: 66,
  },
  sampleThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: rounded.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  sampleThumb: {
    width: '100%',
    height: '100%',
  },
  cameraActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cameraActionPrimary: {
    flex: 1,
    minHeight: 56,
    borderRadius: rounded.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraActionPrimaryText: {
    color: colors.onPrimary,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '800',
  },
  cameraActionSecondary: {
    minWidth: 82,
    minHeight: 56,
    borderRadius: rounded.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  cameraActionSecondaryText: {
    color: colors.onPrimary,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '800',
  },
  cameraActionDisabled: {
    opacity: 0.45,
  },
  cameraActionGhost: {
    minWidth: 82,
    minHeight: 56,
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
  faceImageFallback: {
    width: 48,
    height: 48,
    borderRadius: rounded.md,
    backgroundColor: colors.surfaceContainerHigh,
  },
  faceName: {
    color: colors.onSurface,
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '700',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: rounded.md,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
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
