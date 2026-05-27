import { AlertStats, AlertsFilterBar, AlertsTable } from '@/components/alerts';
import { useAlertsData } from '@/hooks';

function AlertsPage() {
  const alertsData = useAlertsData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
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
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-high border border-outline-variant p-4 rounded-xl">
          <h4 className="text-headline-sm text-on-surface mb-2">Peak Activity Insight</h4>
          <p className="text-body-md text-on-surface-variant">
            Human presence and face recognition events are concentrated in the rooms shown above for the selected period.
          </p>
        </div>
        <div className="bg-surface-container border border-outline-variant p-4 rounded-xl">
          <h4 className="text-label-md uppercase tracking-widest text-on-surface-variant">System Health</h4>
          <p className="text-headline-md text-on-surface">Stable</p>
          <p className="text-label-sm text-green-400 mt-2">Live sensor feeds active</p>
        </div>
      </div>
    </div>
  );
}

export default AlertsPage;
