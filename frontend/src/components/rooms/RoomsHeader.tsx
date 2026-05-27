import { Icon } from '@/components';
import { ROOM_FILTER_TABS, type FilterTab } from './types';

export function RoomsHeader({
  filter,
  onFilterChange,
  onAddRoom,
}: {
  filter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  onAddRoom: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 className="text-headline-lg text-on-surface">Rooms Inventory</h2>
        <p className="text-body-md text-on-surface-variant">
          Manage physical units, monitor real-time occupation, and track sensor health.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant">
          {ROOM_FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`px-4 py-1.5 rounded-md text-label-md transition-all ${filter === tab.key ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={onAddRoom} className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container text-label-md font-bold rounded-lg hover:opacity-90 transition-opacity">
          <Icon name="add_circle" size={18} />
          Add Room
        </button>
      </div>
    </div>
  );
}
