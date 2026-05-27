import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, DoorOpen, Lightbulb, ShieldCheck, Thermometer, UserRoundCheck } from 'lucide-react-native';
import { getRoomEvents } from '../../apis';
import { useRoomOverview } from '../../hooks';
import { theme } from '../../styles';
import type { RoomEventSummary } from '../../types';

type FilterKey = 'device' | 'door' | 'sensor';

const fallbackEvents: RoomEventSummary[] = [
  {
    id: 'face-unlocked',
    type: 'door',
    title: 'Door Unlocked via Face',
    description: 'Entry granted for Main User',
    time: '10:45',
    severity: 'success',
  },
  {
    id: 'temp-high',
    type: 'sensor',
    title: 'Temp high (32 C)',
    description: 'Room sensor exceeded the comfort limit',
    time: '09:30',
    severity: 'warning',
  },
  {
    id: 'light-on',
    type: 'device',
    title: 'Light turned ON',
    description: 'Entrance hallway motion trigger',
    time: '08:15',
    severity: 'success',
  },
  {
    id: 'armed',
    type: 'security',
    title: 'Security Armed',
    description: "System set to 'Away' mode",
    time: 'Yesterday',
    severity: 'info',
  },
];

export default function AlertsPage() {
  const { room } = useRoomOverview();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('device');
  const [events, setEvents] = useState<RoomEventSummary[]>(fallbackEvents);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshEvents() {
    if (!room?.id) return;
    setRefreshing(true);
    try {
      const nextEvents = await getRoomEvents(room.id);
      if (nextEvents.length > 0) setEvents(nextEvents);
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

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'device') {
      return events;
    }
    return events.filter((event) => event.type === activeFilter);
  }, [activeFilter, events]);

  return (
    <View style={pageStyles.page}>
      <View style={pageStyles.refreshHint}>
        <Bell size={18} color={theme.colors.onSurfaceVariant} />
        <Text style={pageStyles.refreshHintText}>{refreshing ? 'Refreshing...' : 'Last updated just now'}</Text>
      </View>

      <View style={pageStyles.tabs}>
        <FilterButton active={activeFilter === 'device'} label="Device Events" onPress={() => setActiveFilter('device')} />
        <FilterButton active={activeFilter === 'door'} label="Door Access" onPress={() => setActiveFilter('door')} />
        <FilterButton active={activeFilter === 'sensor'} label="Sensor Alerts" onPress={() => setActiveFilter('sensor')} />
      </View>

      <ScrollView
        scrollEnabled={false}
        contentContainerStyle={pageStyles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshEvents} tintColor={theme.colors.primary} />}
      >
        <Text style={pageStyles.groupLabel}>TODAY</Text>
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </ScrollView>
    </View>
  );
}

function FilterButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[pageStyles.tabButton, active && pageStyles.tabButtonActive]} onPress={onPress}>
      <Text style={[pageStyles.tabText, active && pageStyles.tabTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function EventCard({ event }: { event: RoomEventSummary }) {
  const Icon = getEventIcon(event);
  const accentColor = getAccentColor(event);

  return (
    <View style={pageStyles.eventCard}>
      <View style={[pageStyles.eventIcon, { backgroundColor: getIconBackground(event) }]}>
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
            <Text style={pageStyles.warningPillText}>Amber Warning</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function getEventIcon(event: RoomEventSummary) {
  if (event.type === 'door') return UserRoundCheck;
  if (event.type === 'sensor') return Thermometer;
  if (event.type === 'security') return ShieldCheck;
  if (event.title.toLowerCase().includes('light')) return Lightbulb;
  return DoorOpen;
}

function getAccentColor(event: RoomEventSummary) {
  if (event.severity === 'warning') return theme.colors.tertiary;
  if (event.severity === 'error') return theme.colors.error;
  if (event.severity === 'success') return theme.colors.secondary;
  return theme.colors.primary;
}

function getIconBackground(event: RoomEventSummary) {
  if (event.severity === 'warning') return theme.colors.tertiaryFixed;
  if (event.severity === 'error') return theme.colors.errorContainer;
  if (event.severity === 'success') return theme.colors.secondaryFixed;
  return theme.colors.primaryFixed;
}

const { colors, elevation, rounded, spacing, typography } = theme;

const pageStyles = StyleSheet.create({
  page: {
    gap: spacing.md,
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
  tabs: {
    minHeight: 48,
    borderRadius: rounded.lg,
    backgroundColor: colors.surfaceContainerLow,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: colors.surfaceContainerLowest,
    ...elevation.card,
  },
  tabText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextActive: {
    color: colors.primary,
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
});
