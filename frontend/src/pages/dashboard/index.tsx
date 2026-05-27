import {
  DashboardAlertBanner,
  DashboardCards,
  DashboardRoomsGrid,
  GlobalDevicePanel,
  RecentEventsTable,
} from '@/components/dashboard';
import { useDashboardData } from '@/hooks';

export default function DashboardPage() {
  const { summaryQuery, occupancyQuery, alertsQuery, eventsQuery, hasError } = useDashboardData();
  const summary = summaryQuery.data;
  const alerts = alertsQuery.data ?? [];
  const rooms = (occupancyQuery.data?.rooms ?? []).map(room => ({
    ...room,
    hasAlert: alerts.some(alert => alert.room.id === room.id),
    devices: { light: null, fan: null, locked: null },
    temp: 'N/A',
    humidity: 'N/A',
  }));

  return (
    <div className="space-y-8">
      {(summaryQuery.isLoading || occupancyQuery.isLoading) && (
        <div className="bg-surface-container border border-outline-variant p-3 rounded-xl text-on-surface-variant">
          Syncing dashboard data...
        </div>
      )}
      {hasError && (
        <div className="bg-error-container/20 border border-error text-error p-4 rounded-xl">
          Could not load every dashboard feed. Showing available data.
        </div>
      )}
      <DashboardAlertBanner alert={alerts[0]} />
      <DashboardCards
        totalRooms={summary?.totalRooms ?? rooms.length}
        occupiedRooms={summary?.occupiedRooms ?? 0}
        vacantRooms={summary?.vacantRooms ?? 0}
        totalTenants={summary?.totalTenants ?? 0}
        activeAlerts={summary?.humanDetectedRooms ?? alerts.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <DashboardRoomsGrid rooms={rooms} />
        <div className="space-y-8">
          <GlobalDevicePanel led={summary?.globalDevices.led} fan={summary?.globalDevices.fan} />
          <RecentEventsTable events={eventsQuery.data ?? []} />
        </div>
      </div>
    </div>
  );
}
