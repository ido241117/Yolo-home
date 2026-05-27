import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BellRing, ChevronRight, CircleHelp, Edit3, LockKeyhole, LogOut, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import type { AuthUser } from '../../apis';
import { useRoomOverview } from '../../hooks';
import { theme } from '../../styles';

interface ProfilePageProps {
  user?: AuthUser | null;
  onLogout?: () => void;
}

export default function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const { room, sensors } = useRoomOverview();
  const tempValue = sensors.find((sensor) => sensor.label === 'temp')?.value;
  const humiValue = sensors.find((sensor) => sensor.label === 'humi')?.value;
  const displayName = user?.name ?? 'Tran Van A';
  const role = user?.role ? user.role.toUpperCase() : 'TENANT';

  return (
    <View style={pageStyles.page}>
      <View style={pageStyles.hero}>
        <View style={pageStyles.avatarWrap}>
          <Image source={{ uri: 'https://i.pravatar.cc/240?img=15' }} style={pageStyles.avatarImage} />
          <View style={pageStyles.editBadge}>
            <Edit3 size={16} color={theme.colors.onPrimary} />
          </View>
        </View>
        <Text style={pageStyles.name}>{displayName}</Text>
        <View style={pageStyles.roomLine}>
          <MapPin size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={pageStyles.roomText}>{room?.name ?? 'Room 302'} - {role}</Text>
        </View>
      </View>

      <View style={pageStyles.statsGrid}>
        <View style={pageStyles.statCard}>
          <Text style={pageStyles.statValue}>{tempValue ? `${tempValue} C` : '24 C'}</Text>
          <Text style={pageStyles.statLabel}>Room Temp</Text>
        </View>
        <View style={pageStyles.statCard}>
          <Text style={[pageStyles.statValue, pageStyles.primaryValue]}>{humiValue ? `${humiValue}%` : '85%'}</Text>
          <Text style={pageStyles.statLabel}>Humidity</Text>
        </View>
      </View>

      <View style={pageStyles.menuSection}>
        <Text style={pageStyles.menuHeading}>Security & Support</Text>
        <MenuRow icon={<LockKeyhole size={22} color={theme.colors.primary} />} label="Change Password" />
        <MenuRow icon={<BellRing size={22} color={theme.colors.primary} />} label="Notification Settings" />
        <MenuRow icon={<CircleHelp size={22} color={theme.colors.primary} />} label="Help & Support" />
      </View>

      <View style={pageStyles.logoutSection}>
        <Pressable style={pageStyles.logoutButton} onPress={onLogout}>
          <LogOut size={20} color={theme.colors.error} />
          <Text style={pageStyles.logoutText}>Logout</Text>
        </Pressable>
        <Text style={pageStyles.version}>App Version 2.4.0</Text>
      </View>
    </View>
  );
}

function MenuRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Pressable style={pageStyles.menuRow}>
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
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    ...elevation.card,
  },
  statValue: {
    color: colors.secondary,
    fontSize: typography.sensorValue.fontSize,
    fontWeight: '800',
    lineHeight: typography.sensorValue.lineHeight,
  },
  primaryValue: {
    color: colors.primary,
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '700',
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
});
