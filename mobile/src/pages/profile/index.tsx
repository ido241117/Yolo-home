import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronRight, Edit3, LockKeyhole, LogOut, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import type { AuthUser } from '../../apis';
import { changePassword } from '../../apis';
import { useRoomOverview } from '../../hooks';
import { theme } from '../../styles';

interface ProfilePageProps {
  user?: AuthUser | null;
  onLogout?: () => void;
}

export default function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const { room } = useRoomOverview();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const displayName = user?.name ?? 'Tran Van A';
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const role = user?.role ? user.role.toUpperCase() : 'TENANT';

  function openPasswordModal() {
    setPasswordMessage(null);
    setPasswordModalVisible(true);
  }

  function closePasswordModal() {
    if (savingPassword) return;
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleChangePassword() {
    if (savingPassword) return;

    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
      return;
    }

    if (trimmedNew.length < 6) {
      Alert.alert('Password too short', 'New password must be at least 6 characters.');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      Alert.alert('Password mismatch', 'New password and confirmation must match.');
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      await changePassword(trimmedCurrent, trimmedNew);
      setPasswordMessage('Password updated successfully.');
      setSavingPassword(false);
      closePasswordModal();
      Alert.alert('Success', 'Password changed successfully.');
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Unable to change password';
      setPasswordMessage(detail);
      Alert.alert('Change failed', detail);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <View style={pageStyles.page}>
      <View style={pageStyles.hero}>
        <View style={pageStyles.avatarWrap}>
          <View style={pageStyles.avatarImage}>
            <Text style={pageStyles.avatarInitial}>{avatarInitial}</Text>
          </View>
          <View style={pageStyles.editBadge}>
            <Edit3 size={16} color={theme.colors.onPrimary} />
          </View>
        </View>
        <Text style={pageStyles.name}>{displayName}</Text>
        <View style={pageStyles.roomLine}>
          <MapPin size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={pageStyles.roomText}>
            {room?.name ?? 'Room 302'} - {role}
          </Text>
        </View>
      </View>

      <View style={pageStyles.menuSection}>
        <Text style={pageStyles.menuHeading}>Security & Support</Text>
        <MenuRow icon={<LockKeyhole size={22} color={theme.colors.primary} />} label="Change Password" onPress={openPasswordModal} />
      </View>

      {passwordMessage ? <Text style={pageStyles.messageText}>{passwordMessage}</Text> : null}

      <View style={pageStyles.logoutSection}>
        <Pressable style={pageStyles.logoutButton} onPress={onLogout}>
          <LogOut size={20} color={theme.colors.error} />
          <Text style={pageStyles.logoutText}>Logout</Text>
        </Pressable>
        <Text style={pageStyles.version}>App Version 2.4.0</Text>
      </View>

      <Modal visible={passwordModalVisible} transparent animationType="fade" onRequestClose={closePasswordModal}>
        <View style={pageStyles.modalBackdrop}>
          <View style={pageStyles.modalCard}>
            <Text style={pageStyles.modalTitle}>Change Password</Text>
            <Text style={pageStyles.modalSubtitle}>Update your password on this device.</Text>

            <View style={pageStyles.fieldGroup}>
              <Text style={pageStyles.fieldLabel}>Current password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Enter current password"
                placeholderTextColor={theme.colors.outline}
                style={pageStyles.fieldInput}
              />
            </View>

            <View style={pageStyles.fieldGroup}>
              <Text style={pageStyles.fieldLabel}>New password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Enter new password"
                placeholderTextColor={theme.colors.outline}
                style={pageStyles.fieldInput}
              />
            </View>

            <View style={pageStyles.fieldGroup}>
              <Text style={pageStyles.fieldLabel}>Confirm new password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Re-enter new password"
                placeholderTextColor={theme.colors.outline}
                style={pageStyles.fieldInput}
              />
            </View>

            <View style={pageStyles.modalActions}>
              <Pressable style={pageStyles.secondaryButton} onPress={closePasswordModal} disabled={savingPassword}>
                <Text style={pageStyles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[pageStyles.primaryButton, savingPassword && pageStyles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text style={pageStyles.primaryButtonText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable style={pageStyles.menuRow} onPress={onPress}>
      <View style={pageStyles.menuLeft}>
        <View style={pageStyles.menuIcon}>{icon}</View>
        <Text style={pageStyles.menuLabel}>{label}</Text>
      </View>
      <ChevronRight size={22} color={theme.colors.outlineVariant} />
    </Pressable>
  );
}

const { colors, elevation, rounded, spacing, typography } = theme;

const pageStyles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatarWrap: {
    width: 132,
    height: 132,
  },
  avatarImage: {
    width: 128,
    height: 128,
    borderRadius: rounded.full,
    borderWidth: 4,
    borderColor: colors.surfaceContainerHigh,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 48,
  },
  editBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: rounded.full,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.card,
  },
  name: {
    marginTop: spacing.md,
    color: colors.onSurface,
    fontSize: typography.headlineLg.fontSize,
    fontWeight: '800',
    lineHeight: typography.headlineLg.lineHeight,
  },
  roomLine: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  roomText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  menuSection: {
    gap: spacing.sm,
  },
  menuHeading: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '900',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
  },
  menuRow: {
    minHeight: 68,
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...elevation.card,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: rounded.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    color: colors.onSurface,
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '700',
  },
  messageText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
  },
  logoutSection: {
    gap: spacing.md,
  },
  logoutButton: {
    minHeight: 58,
    borderRadius: rounded.lg,
    backgroundColor: colors.errorContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutText: {
    color: colors.error,
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '900',
  },
  version: {
    color: colors.outline,
    fontSize: typography.labelMd.fontSize,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: spacing.lg,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: rounded.xl,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation.card,
  },
  modalTitle: {
    color: colors.onSurface,
    fontSize: typography.headlineMd.fontSize,
    fontWeight: '800',
    lineHeight: typography.headlineMd.lineHeight,
  },
  modalSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '700',
  },
  fieldInput: {
    minHeight: 52,
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerLow,
    color: colors.onSurface,
    paddingHorizontal: spacing.md,
    fontSize: typography.bodyMd.fontSize,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.onSurface,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: rounded.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.floating,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
