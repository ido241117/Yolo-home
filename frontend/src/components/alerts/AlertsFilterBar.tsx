import type { RoomDto } from '@/apis';
import { Icon } from '@/components';
import type { AlertRange } from '@/hooks';

interface AlertsFilterBarProps {
  rooms: RoomDto[];
  roomId: string;
  range: AlertRange;
  onRoomChange: (roomId: string) => void;
  onRangeChange: (range: AlertRange) => void;
  onClear: () => void;
}

export function AlertsFilterBar({ rooms, roomId, range, onRoomChange, onRangeChange, onClear }: AlertsFilterBarProps) {
  return (
    <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex flex-wrap items-center gap-4">
      <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Filter by</span>
      <select className="form-input max-w-56" value={roomId} onChange={event => onRoomChange(event.target.value)}>
        <option value="all">All Rooms</option>
        {rooms.map(room => (
          <option key={room.id} value={room.id}>{room.name}</option>
        ))}
      </select>
      <select className="form-input max-w-48" value={range} onChange={event => onRangeChange(event.target.value as AlertRange)}>
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="all">All Time</option>
      </select>
      <button className="ml-auto flex items-center gap-2 text-on-surface-variant hover:text-on-surface" onClick={onClear}>
        <Icon name="filter_alt_off" size={18} />
        <span className="text-label-md">Clear Filters</span>
      </button>
    </div>
  );
}
