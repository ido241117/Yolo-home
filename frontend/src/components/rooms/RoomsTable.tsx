import { useNavigate } from 'react-router';
import { Icon } from '@/components';
import { ROOM_STATUS_CONFIG, type RoomRow } from './types';

export function RoomsTable({
  rows,
  total,
  isLoading,
  isError,
}: {
  rows: RoomRow[];
  total: number;
  isLoading: boolean;
  isError: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
      {isError && (
        <div className="px-6 py-4 border-b border-error/30 text-error bg-error-container/10">
          Could not load rooms from backend.
        </div>
      )}
      {isLoading && (
        <div className="px-6 py-3 border-b border-outline-variant text-on-surface-variant bg-surface-container-high/30">
          Syncing rooms...
        </div>
      )}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-high/50">
            <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant tracking-wider uppercase">Room Name</th>
            <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant tracking-wider uppercase">Status</th>
            <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant tracking-wider uppercase">Tenants</th>
            <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant tracking-wider uppercase">Adafruit Account</th>
            <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant tracking-wider uppercase">Last Activity</th>
            <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant tracking-wider uppercase text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {rows.map(room => {
            const s = ROOM_STATUS_CONFIG[room.status];
            return (
              <tr key={room.id} className="hover:bg-surface-container-high transition-colors cursor-pointer" onClick={() => navigate(`/rooms/${room.id}`)}>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Icon name="meeting_room" size={20} />
                    </div>
                    <div>
                      <p className="text-body-md font-bold text-on-surface">{room.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{room.location}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mr-2`} />
                    {s.label}
                  </span>
                </td>
                <td className="px-6 py-5">
                  {room.status === 'maintenance' ? (
                    <div className="w-7 h-7 rounded-full bg-surface-container-highest border-2 border-surface-container-low flex items-center justify-center">
                      <Icon name="engineering" size={14} className="text-on-surface-variant" />
                    </div>
                  ) : room.tenants.length === 0 ? (
                    <span className="text-label-md text-on-surface-variant/50">-</span>
                  ) : (
                    <div className="flex -space-x-2">
                      {room.tenants.map((t, i) => (
                        <div key={i} className={`w-7 h-7 rounded-full border-2 border-surface-container-low flex items-center justify-center text-[10px] font-bold text-white ${t.color}`}>
                          {t.initials}
                        </div>
                      ))}
                      {room.extraTenants && (
                        <div className="w-7 h-7 rounded-full bg-surface-container-highest border-2 border-surface-container-low flex items-center justify-center text-[10px] text-on-surface-variant font-bold">
                          +{room.extraTenants}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-5">
                  <code className="text-label-md text-tertiary bg-tertiary/10 px-2 py-1 rounded">{room.adafruit}</code>
                </td>
                <td className="px-6 py-5">
                  <p className="text-body-md text-on-surface-variant">{room.lastActivity}</p>
                  <p className="text-label-sm text-on-surface-variant/50">{room.lastSensor}</p>
                </td>
                <td className="px-6 py-5 text-right" onClick={e => e.stopPropagation()}>
                  <button className="text-on-surface-variant hover:text-primary p-1 transition-colors">
                    <Icon name="more_vert" size={20} />
                  </button>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">No rooms found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between px-6 py-4 bg-surface-container-low border-t border-outline-variant">
        <span className="text-label-sm text-on-surface-variant">Showing {rows.length} of {total} rooms</span>
        <div className="flex gap-2">
          <button disabled className="p-1.5 rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30">
            <Icon name="chevron_left" size={20} />
          </button>
          <button disabled className="p-1.5 rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30">
            <Icon name="chevron_right" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
