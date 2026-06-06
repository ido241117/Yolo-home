import { useState } from 'react';
import { AddRoomModal, RoomsHeader, RoomsTable, type FilterTab, type RoomRow } from '@/components/rooms';
import { useDeleteRoom, useRoomsData } from '@/hooks';
import { formatDateTime } from '@/utils/backend-format';

const AVATAR_COLORS = [
  'bg-primary',
  'bg-tertiary',
  'bg-status-occupied',
  'bg-status-active',
  'bg-error',
];

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.slice(0, 2).map(word => word[0]?.toUpperCase()).join('');
}

export default function RoomsPage() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const roomsQuery = useRoomsData();
  const deleteRoom = useDeleteRoom();

  const rows: RoomRow[] = (roomsQuery.data ?? []).map(room => ({
    id: room.id,
    code: room.code,
    name: room.name,
    location: room.description || 'No description',
    status: room.status,
    tenants: (room.tenants ?? []).slice(0, 3).map((tenant, index) => ({
      initials: initials(tenant.name || tenant.username),
      color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    })),
    extraTenants: Math.max((room.tenants?.length ?? 0) - 3, 0) || undefined,
    adafruit: room.adafruitUsername || 'Configure',
    lastActivity: formatDateTime(room.updatedAt),
    lastSensor: 'Open detail for live sensors',
  }));
  const filtered = filter === 'all' ? rows : rows.filter(room => room.status === filter);

  return (
    <div className="space-y-6">
      <RoomsHeader filter={filter} onFilterChange={setFilter} onAddRoom={() => setModalOpen(true)} />
      <RoomsTable
        rows={filtered}
        total={rows.length}
        isLoading={roomsQuery.isLoading}
        isError={roomsQuery.isError}
        deletingRoomId={deleteRoom.variables}
        onDeleteRoom={room => {
          const confirmed = window.confirm(`Delete ${room.name}? This cannot be undone.`);
          if (confirmed) deleteRoom.mutate(room.id);
        }}
      />
      {deleteRoom.isError && (
        <p className="text-label-sm text-error">Could not delete room. Please check your account permission.</p>
      )}
      <AddRoomModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
