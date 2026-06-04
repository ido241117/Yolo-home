import type { RoomDto } from '@/apis';
import { Icon } from '@/components';
import { ROOM_STATUS_CONFIG } from '@/components/rooms/types';

export function RoomDetailHeader({ room, onBack }: { room: RoomDto; onBack: () => void }) {
  const status = ROOM_STATUS_CONFIG[room.status];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-on-surface-variant hover:text-primary transition-colors">
          <Icon name="arrow_back" size={20} />
        </button>
        <h2 className="text-headline-md font-bold text-primary">{room.name}</h2>
        <span className={`px-3 py-1 text-label-md rounded-full badge-pill ${status.badge}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}
