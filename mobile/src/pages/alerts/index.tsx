import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, CircleAlert, UserRoundCheck } from 'lucide-react-native';
import { getRoomEvents } from '../../apis';
import { RoomAccessNotice } from '../../components';
import { useRoomOverview } from '../../hooks';
import { theme } from '../../styles';
import type { RoomEventSummary } from '../../types';

export default function AlertsPage() {
  const { room, isRoomMissing } = useRoomOverview();
  const [events, setEvents] = useState<RoomEventSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshEvents() {
    if (!room?.id) return;
    setRefreshing(true);
    try {
      const nextEvents = await getRoomEvents(room.id);
      setEvents(nextEvents);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id]);

  const faceEvents = useMemo(() => events.filter((event) => event.type === 'face'), [events]);
  const hasEvents = faceEvents.length > 0;

  if (isRoomMissing) {
    return <RoomAccessNotice />;
  }

  return (
    <ScrollView
      style={pageStyles.page}
      contentContainerStyle={[pageStyles.content, !hasEvents && pageStyles.emptyContent]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshEvents} tintColor={theme.colors.primary} />}
    >
      <View style={pageStyles.refreshHint}>
        <Bell size={18} color={theme.colors.onSurfaceVariant} />
        <Text style={pageStyles.refreshHintText}>{refreshing ? 'Refreshing...' : 'Face alerts only'}</Text>
      </View>

      {hasEvents ? (
        <View style={pageStyles.list}>
          <Text style={pageStyles.groupLabel}>FACE EVENTS</Text>
          {faceEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      ) : (
        <View style={pageStyles.emptyCard}>
          <Text style={pageStyles.emptyTitle}>No face alerts yet</Text>
          <Text style={pageStyles.emptyText}>Only face registrations and face unlock results appear here.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function EventCard({ event }: { event: RoomEventSummary }) {
  const Icon = event.severity === 'error' ? CircleAlert : UserRoundCheck;
  const accentColor = event.severity === 'error' ? theme.colors.error : theme.colors.secondary;
  const iconBackground =
    event.severity === 'error'
      ? theme.colors.errorContainer
      : event.severity === 'success'
        ? theme.colors.secondaryFixed
        : theme.colors.primaryFixed;

  return (
    <View style={pageStyles.eventCard}>
      <View style={[pageStyles.eventIcon, { backgroundColor: iconBackground }]}>
        <Icon size={24} color={accentColor} />
      </View>
      <View style={pageStyles.eventBody}>
        <View style={pageStyles.eventTop}>
          <Text style={[pageStyles.eventTitle, event.severity === 'warning' && pageStyles.warningTitle]} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={pageStyles.eventTime}>{event.time}</Text>
        </View>
        <Text style={pageStyles.eventDescription}>{event.description}</Text>
        {event.severity === 'warning' ? (
          <View style={pageStyles.warningPill}>
            <View style={pageStyles.warningDot} />
            <Text style={pageStyles.warningPillText}>Pending</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const { colors, elevation, rounded, spacing, typography } = theme;

const pageStyles = StyleSheet.create({
  page: {
    gap: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
  emptyContent: {
    flexGrow: 1,
  },
  refreshHint: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    opacity: 0.75,
  },
  refreshHintText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
  },
  groupLabel: {
    marginTop: spacing.xs,
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
    fontWeight: '800',
  },
  eventCard: {
    minHeight: 84,
    borderRadius: rounded.lg,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLowest,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    ...elevation.card,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: rounded.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBody: {
    flex: 1,
    gap: spacing.xs,
  },
  eventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eventTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '800',
    lineHeight: typography.bodyLg.lineHeight,
  },
  warningTitle: {
    color: colors.tertiary,
  },
  eventTime: {
    color: colors.outline,
    fontSize: 12,
    fontWeight: '600',
  },
  eventDescription: {
    color: colors.onSurfaceVariant,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  warningPill: {
    alignSelf: 'flex-start',
    borderRadius: rounded.full,
    backgroundColor: 'rgba(255, 185, 95, 0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: rounded.full,
    backgroundColor: colors.tertiary,
  },
  warningPillText: {
    color: colors.tertiary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyCard: {
    minHeight: 160,
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...elevation.card,
  },
  emptyTitle: {
    color: colors.onSurface,
    fontSize: typography.bodyLg.fontSize,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: typography.labelMd.fontSize,
    lineHeight: typography.labelMd.lineHeight,
    textAlign: 'center',
  },
});
