import type { DashboardAlert, EventDto } from '@/apis';
import { Icon } from '@/components';
import { eventLabel, formatClock, formatDateTime } from '@/utils/backend-format';

interface AlertsTableProps {
  liveAlerts: DashboardAlert[];
  events: EventDto[];
  acknowledgedIds: Set<string>;
  isLoading: boolean;
  isError: boolean;
  onAcknowledge: (id: string) => void;
}

export function AlertsTable({ liveAlerts, events, acknowledgedIds, isLoading, isError, onAcknowledge }: AlertsTableProps) {
  const liveRows = liveAlerts.map(alert => ({
    id: `live-${alert.room.id}-${alert.updatedAt}`,
    timestamp: alert.updatedAt,
    room: alert.room.name,
    type: 'Human Presence',
    value: alert.value,
    live: true,
  }));
  const eventRows = events.map(event => ({
    id: event.id,
    timestamp: event.createdAt,
    room: event.room?.name ?? 'System',
    type: eventLabel(event),
    value: event.payload?.value ? String(event.payload.value) : event.type.includes('face') ? String(event.payload?.confidence ?? '-') : '-',
    live: false,
  }));
  const rows = [...liveRows, ...eventRows];

  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
      {isError && (
        <div className="px-6 py-4 border-b border-error/30 text-error bg-error-container/10">
          Could not load every alert feed from backend.
        </div>
      )}
      {isLoading && (
        <div className="px-6 py-3 border-b border-outline-variant text-on-surface-variant bg-surface-container-high/30">
          Syncing alerts...
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high border-b border-outline-variant">
              <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase">Timestamp</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase">Room</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase">Sensor Type</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase text-center">Value</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase">Status</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {rows.map(row => {
              const acknowledged = acknowledgedIds.has(row.id);
              return (
                <tr key={row.id} className={`hover:bg-surface-container-high transition-colors ${acknowledged ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-body-md font-medium text-on-surface">{formatDateTime(row.timestamp)}</span>
                      <span className="text-label-sm text-on-surface-variant">{formatClock(row.timestamp, true)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${acknowledged ? 'bg-status-active' : 'bg-error'}`} />
                      <span className="text-body-md text-on-surface">{row.room}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-on-surface">
                      <Icon name={row.type.includes('face') ? 'face' : 'person'} size={18} />
                      <span className="text-body-md capitalize">{row.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="badge-pill badge-success text-label-md px-2 py-0.5 rounded">
                      {row.value}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-label-sm badge-pill font-medium ${acknowledged ? 'badge-success' : 'badge-danger'}`}>
                      {acknowledged ? 'Acknowledged' : row.live ? 'Live' : 'Unresolved'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {acknowledged ? (
                      <span className="text-on-surface-variant text-label-sm italic">Resolved in this session</span>
                    ) : (
                      <button className="text-primary hover:bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg text-label-md" onClick={() => onAcknowledge(row.id)}>
                        Mark as Acknowledged
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">No alerts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant text-label-sm text-on-surface-variant">
        Showing {rows.length} alerts from backend feeds
      </div>
    </div>
  );
}
