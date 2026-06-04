import { AlertStats, AlertsFilterBar, AlertsTable } from '@/components/alerts';
import { useAlertsData } from '@/hooks';

function AlertsPage() {
  const alertsData = useAlertsData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-headline-lg text-on-surface">Alerts History</h2>
        <p className="text-body-md text-on-surface-variant">
          Review live human detections and security-related event logs from the backend.
        </p>
      </div>

      <AlertStats
        liveAlerts={alertsData.filteredLiveAlerts}
        history={alertsData.alertEvents}
        acknowledgedCount={alertsData.acknowledgedIds.size}
      />

      <AlertsFilterBar
        rooms={alertsData.roomsQuery.data ?? []}
        roomId={alertsData.roomId}
        range={alertsData.range}
        onRoomChange={alertsData.setRoomId}
        onRangeChange={alertsData.setRange}
        onClear={alertsData.clearFilters}
      />

      <AlertsTable
        liveAlerts={alertsData.filteredLiveAlerts}
        events={alertsData.alertEvents}
        acknowledgedIds={alertsData.acknowledgedIds}
        isLoading={alertsData.isLoading}
        isError={alertsData.hasError}
        onAcknowledge={alertsData.acknowledge}
      />
    </div>
  );
}

export default AlertsPage;
