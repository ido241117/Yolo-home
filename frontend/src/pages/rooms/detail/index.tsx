import { useNavigate, useParams } from 'react-router';
import type { DeviceMap, RoomDto, SensorMap } from '@/apis';
import {
  DeviceControlPanel,
  FacesGrid,
  HardwarePanel,
  MembersTable,
  RoomDetailHeader,
  RoomEventsLog,
  SensorPanel,
} from '@/components/room-detail';
import { useRoomDetailData, useRoomDeviceCommand, useUpsertRoomHardware } from '@/hooks';

const emptyDevices: DeviceMap = { led: null, fan: null, door: null };
const emptySensors: SensorMap = { temp: null, humi: null, light: null, human: null };

export default function RoomDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { summaryQuery, hardwareQuery, membersQuery, facesQuery, eventsQuery, hasPartialError } = useRoomDetailData(id);
  const commandMutation = useRoomDeviceCommand(id);
  const hardwareMutation = useUpsertRoomHardware(id);
  const summary = summaryQuery.data;

  if (summaryQuery.isError && !summary?.room) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/rooms')} className="text-primary hover:underline">Back to rooms</button>
        <div className="bg-error-container/20 border border-error text-error p-4 rounded-xl">Could not load this room.</div>
      </div>
    );
  }

  const room: RoomDto = summary?.room ?? {
    id,
    name: 'Room detail',
    status: 'vacant',
    description: 'Syncing room data...',
  };
  const devices = summary?.devices ?? emptyDevices;
  const sensors = summary?.sensors ?? emptySensors;

  return (
    <div className="space-y-6">
      <RoomDetailHeader room={room} onBack={() => navigate('/rooms')} />
      {summaryQuery.isLoading && (
        <div className="bg-surface-container border border-outline-variant p-3 rounded-xl text-on-surface-variant">
          Syncing room detail...
        </div>
      )}
      {hasPartialError && (
        <div className="bg-error-container/20 border border-error text-error p-4 rounded-xl">
          Some room feeds could not be loaded. Available data is still shown.
        </div>
      )}

      <SensorPanel sensors={sensors} />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <DeviceControlPanel
            devices={devices}
            loading={commandMutation.isPending}
            onCommand={(key, value) => commandMutation.mutate({ key, value })}
          />
          <HardwarePanel
            hardware={hardwareQuery.data}
            isSaving={hardwareMutation.isPending}
            onSave={payload => hardwareMutation.mutate(payload)}
          />
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          <MembersTable members={membersQuery.data ?? []} />
          <FacesGrid faces={facesQuery.data ?? []} />
        </div>
      </div>
      <RoomEventsLog events={eventsQuery.data ?? summary?.recentEvents ?? []} />
    </div>
  );
}
