import type { RoomDto, RoomStatus } from '@/apis';
import { Icon } from '@/components';

const STATUS_CONFIG: Record<RoomStatus, { bg: string; text: string; label: string }> = {
  occupied:    { bg: 'bg-blue-500/15',  text: 'text-blue-400',  label: 'Occupied' },
  vacant:      { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Vacant' },
  maintenance: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Maintenance' },
};

export function RoomDetailHeader({ room, onBack }: { room: RoomDto; onBack: () => void }) {
  const status = STATUS_CONFIG[room.status];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-on-surface-variant hover:text-primary transition-colors">
          <Icon name="arrow_back" size={20} />
        </button>
        <h2 className="text-headline-md font-bold text-primary">{room.name}</h2>
        <span className={`px-3 py-1 ${status.bg} ${status.text} text-label-md rounded-full border border-outline-variant/30`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}
