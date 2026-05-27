import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardAlerts, getEventsWithParams, getRooms } from '@/apis';

export type AlertRange = '24h' | '7d' | '30d' | 'all';

function rangeStart(range: AlertRange) {
  if (range === 'all') return undefined;
  const date = new Date();
  const days = range === '24h' ? 1 : range === '7d' ? 7 : 30;
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function useAlertsData() {
  const [roomId, setRoomId] = useState('all');
  const [range, setRange] = useState<AlertRange>('24h');
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  const roomsQuery = useQuery({ queryKey: ['rooms'], queryFn: getRooms });
  const liveAlertsQuery = useQuery({ queryKey: ['dashboard', 'alerts'], queryFn: getDashboardAlerts });
  const eventsQuery = useQuery({
    queryKey: ['events', 'alerts', roomId, range],
    queryFn: () =>
      getEventsWithParams({
        limit: 200,
        roomId: roomId === 'all' ? undefined : roomId,
        from: rangeStart(range),
      }),
  });

  const alertEvents = useMemo(
    () => (eventsQuery.data ?? []).filter(event => event.type.includes('human') || event.type.includes('face')),
    [eventsQuery.data],
  );
  const filteredLiveAlerts = useMemo(() => {
    const from = rangeStart(range);
    return (liveAlertsQuery.data ?? []).filter(alert => {
      const roomMatches = roomId === 'all' || alert.room.id === roomId;
      const rangeMatches = !from || new Date(alert.updatedAt).getTime() >= new Date(from).getTime();
      return roomMatches && rangeMatches;
    });
  }, [liveAlertsQuery.data, range, roomId]);

  const acknowledge = (id: string) => {
    setAcknowledgedIds(current => new Set(current).add(id));
  };

  const clearFilters = () => {
    setRoomId('all');
    setRange('24h');
  };

  return {
    roomId,
    setRoomId,
    range,
    setRange,
    roomsQuery,
    liveAlertsQuery,
    filteredLiveAlerts,
    eventsQuery,
    alertEvents,
    acknowledgedIds,
    acknowledge,
    clearFilters,
    isLoading: roomsQuery.isLoading || liveAlertsQuery.isLoading || eventsQuery.isLoading,
    hasError: roomsQuery.isError || liveAlertsQuery.isError || eventsQuery.isError,
  };
}
