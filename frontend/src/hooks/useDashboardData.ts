import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  commandGlobalDevice,
  getDashboardAlerts,
  getDashboardOccupancy,
  getDashboardSummary,
  getEvents,
} from '@/apis';

export function useDashboardData() {
  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary });
  const occupancyQuery = useQuery({ queryKey: ['dashboard', 'occupancy'], queryFn: getDashboardOccupancy });
  const alertsQuery = useQuery({ queryKey: ['dashboard', 'alerts'], queryFn: getDashboardAlerts });
  const eventsQuery = useQuery({ queryKey: ['events', 'recent'], queryFn: () => getEvents(5) });

  return {
    summaryQuery,
    occupancyQuery,
    alertsQuery,
    eventsQuery,
    isLoading: summaryQuery.isLoading || occupancyQuery.isLoading,
    hasError: summaryQuery.isError || occupancyQuery.isError || alertsQuery.isError || eventsQuery.isError,
  };
}

export function useGlobalDeviceCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceKey, value }: { deviceKey: 'led' | 'fan'; value: string }) =>
      commandGlobalDevice(deviceKey, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });
}
