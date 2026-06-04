import type { EventDto } from '@/apis';
import { Icon } from '@/components';
import { eventLabel, formatClock } from '@/utils/backend-format';

type EventCategory = 'SENSORS' | 'COMMAND' | 'ACCESS' | 'SYSTEM';

const EVENT_BADGE: Record<EventCategory, string> = {
  SENSORS: 'badge-event-sensors',
  COMMAND: 'badge-event-command',
  ACCESS:  'badge-event-access',
  SYSTEM:  'badge-event-system',
};

function eventCategory(type: string): EventCategory {
  if (type.includes('sensor')) return 'SENSORS';
  if (type.includes('device')) return 'COMMAND';
  if (type.includes('face')) return 'ACCESS';
  return 'SYSTEM';
}

export function RoomEventsLog({ events }: { events: EventDto[] }) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container">
        <h3 className="text-headline-sm">Room Event Log</h3>
        <span className="text-label-sm text-on-surface-variant italic">Showing last 20 events</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        <ul className="divide-y divide-outline-variant/20">
          {events.map(ev => {
            const category = eventCategory(ev.type);
            const badge = EVENT_BADGE[category];
            return (
              <li key={ev.id} className="px-6 py-3 flex items-center justify-between hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-label-sm font-mono text-on-surface-variant">{formatClock(ev.createdAt, true)}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded badge-pill ${badge}`}>{category}</span>
                  <p className="text-body-md text-on-surface">{eventLabel(ev)}</p>
                </div>
                <Icon name="chevron_right" size={16} className="text-on-surface-variant flex-shrink-0" />
              </li>
            );
          })}
          {events.length === 0 && <li className="px-6 py-8 text-center text-on-surface-variant">No events yet</li>}
        </ul>
      </div>
    </div>
  );
}
