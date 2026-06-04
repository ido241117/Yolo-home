import type { RoomDto } from '@/apis';
import { Icon } from '@/components';
import { ROOM_STATUS_CONFIG } from '@/components/rooms/types';

interface DashboardRoom extends RoomDto {
  hasAlert?: boolean;
  devices: {
    light: boolean | null;
    fan: boolean | null;
    locked: boolean | null;
  };
  temp: string;
  humidity: string;
}

const STATUS_BADGE = ROOM_STATUS_CONFIG;

function DeviceTile({ icon, label, active }: { icon: string; label: string; active: boolean | null }) {
  const offline = active === null;
  return (
    <div className={`flex flex-col items-center p-2 rounded bg-surface-container-low border border-outline-variant ${!active ? 'opacity-50' : ''}`}>
      <Icon name={icon} filled={Boolean(active)} size={20} className={`mb-1 ${active ? 'text-status-active' : 'text-on-surface-variant'}`} />
      <span className={`text-label-sm font-bold uppercase ${active ? 'text-status-active' : ''}`}>
        {offline ? 'N/A' : label}
      </span>
    </div>
  );
}

function RoomCard({ room }: { room: DashboardRoom }) {
  const badge = STATUS_BADGE[room.status];
  return (
    <div className={`bg-surface-container border-2 p-4 rounded-xl relative group transition-colors ${room.hasAlert ? 'border-error' : 'border-outline-variant hover:border-primary'} ${room.status === 'vacant' ? 'opacity-80' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-headline-sm text-on-surface">{room.name}</h4>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-label-sm font-medium mt-1 badge-pill ${badge.badge}`}>
            {badge.label}
          </span>
        </div>
        {room.hasAlert && <Icon name="warning" filled size={20} className="text-error animate-pulse" />}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <DeviceTile icon="lightbulb" label={room.devices.light ? 'ON' : 'OFF'} active={room.devices.light} />
        <DeviceTile icon="mode_fan" label={room.devices.fan ? 'ON' : 'OFF'} active={room.devices.fan} />
        <DeviceTile icon="lock" label={room.devices.locked ? 'LOCKED' : 'UNLOCKED'} active={room.devices.locked} />
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant pt-4">
        <div className="flex items-center gap-2">
          <Icon name="thermostat" size={16} className="text-on-surface-variant" />
          <span className="text-headline-sm text-on-surface">{room.temp}</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="humidity_percentage" size={16} className="text-on-surface-variant" />
          <span className="text-headline-sm text-on-surface">{room.humidity}</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardRoomsGrid({ rooms }: { rooms: DashboardRoom[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-headline-lg text-on-surface">Room Status Grid</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map(room => <RoomCard key={room.id} room={room} />)}
        {rooms.length === 0 && (
          <div className="md:col-span-2 bg-surface-container border border-outline-variant rounded-xl p-8 text-center text-on-surface-variant">
            No rooms yet
          </div>
        )}
      </div>
    </div>
  );
}
