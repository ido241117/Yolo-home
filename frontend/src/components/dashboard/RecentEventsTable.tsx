import type { EventDto } from '@/apis';
import { formatClock, eventLabel } from '@/utils/backend-format';

export function RecentEventsTable({ events }: { events: EventDto[] }) {
  return (
    <section className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
        <h3 className="text-headline-sm font-bold text-on-surface">Recent Events</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low text-label-sm text-on-surface-variant uppercase font-bold">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Actor</th>
            </tr>
          </thead>
          <tbody className="text-body-md divide-y divide-outline-variant/30">
            {events.map(ev => (
              <tr key={ev.id} className="hover:bg-surface-container-high transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-label-md text-on-surface">{formatClock(ev.createdAt)}</td>
                <td className="px-4 py-3 text-on-surface">{ev.room?.name ?? '-'}</td>
                <td className="px-4 py-3 font-medium text-on-surface">{eventLabel(ev)}</td>
                <td className="px-4 py-3 text-label-sm text-on-surface-variant">{ev.actor?.name ?? 'System'}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant">No events yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
