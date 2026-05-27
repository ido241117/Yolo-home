import type { DashboardAlert, EventDto } from '@/apis';
import { Icon } from '@/components';

export function AlertStats({
  liveAlerts,
  history,
  acknowledgedCount,
}: {
  liveAlerts: DashboardAlert[];
  history: EventDto[];
  acknowledgedCount: number;
}) {
  const unresolved = liveAlerts.length + Math.max(history.length - acknowledgedCount, 0);

  return (
    <div className="flex flex-wrap gap-4">
      <div className="bg-surface-container border border-outline-variant px-4 py-3 rounded-lg flex items-center gap-3">
        <Icon name="warning" size={24} className="text-error" />
        <div>
          <p className="text-label-sm text-on-surface-variant">Unresolved</p>
          <p className="text-headline-sm text-error">{unresolved}</p>
        </div>
      </div>
      <div className="bg-surface-container border border-outline-variant px-4 py-3 rounded-lg flex items-center gap-3">
        <Icon name="check_circle" size={24} className="text-green-400" />
        <div>
          <p className="text-label-sm text-on-surface-variant">Acknowledged</p>
          <p className="text-headline-sm text-on-surface">{acknowledgedCount}</p>
        </div>
      </div>
      <div className="bg-surface-container border border-outline-variant px-4 py-3 rounded-lg flex items-center gap-3">
        <Icon name="sensors" size={24} className="text-primary" />
        <div>
          <p className="text-label-sm text-on-surface-variant">Live Human Feed</p>
          <p className="text-headline-sm text-on-surface">{liveAlerts.length}</p>
        </div>
      </div>
    </div>
  );
}
