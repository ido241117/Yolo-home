import { useState } from 'react';
import { AddRoomModal, RoomsHeader, RoomsTable, type FilterTab, type RoomRow } from '@/components/rooms';
import { useRoomsData } from '@/hooks';
import { formatDateTime } from '@/utils/backend-format';

export default function RoomsPage() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const roomsQuery = useRoomsData();

  const rows: RoomRow[] = (roomsQuery.data ?? []).map(room => ({
    id: room.id,
    code: room.code,
    name: room.name,
    location: room.description || 'No description',
    status: room.status,
    tenants: [],
    adafruit: room.adafruitUsername || 'Configure',
    lastActivity: formatDateTime(room.updatedAt),
    lastSensor: 'Open detail for live sensors',
  }));
  const filtered = filter === 'all' ? rows : rows.filter(room => room.status === filter);

  return (
    <div className="space-y-6">
      <RoomsHeader filter={filter} onFilterChange={setFilter} onAddRoom={() => setModalOpen(true)} />
      <RoomsTable rows={filtered} total={rows.length} isLoading={roomsQuery.isLoading} isError={roomsQuery.isError} />
      <AddRoomModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
