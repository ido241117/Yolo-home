import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  commandRoomDevice,
  getRoomEvents,
  getRoomFaces,
  getRoomHardware,
  getRoomMembers,
  getRoomSummary,
  upsertRoomHardware,
  type UpsertHardwareConfigPayload,
} from '@/apis';

export function useRoomDetailData(roomId: string) {
  const enabled = Boolean(roomId);
  const summaryQuery = useQuery({ queryKey: ['rooms', roomId, 'summary'], queryFn: () => getRoomSummary(roomId), enabled });
  const hardwareQuery = useQuery({ queryKey: ['rooms', roomId, 'hardware'], queryFn: () => getRoomHardware(roomId), enabled });
  const membersQuery = useQuery({ queryKey: ['rooms', roomId, 'members'], queryFn: () => getRoomMembers(roomId), enabled });
  const facesQuery = useQuery({ queryKey: ['rooms', roomId, 'faces'], queryFn: () => getRoomFaces(roomId), enabled });
  const eventsQuery = useQuery({ queryKey: ['rooms', roomId, 'events'], queryFn: () => getRoomEvents(roomId, 20), enabled });

  return {
    summaryQuery,
    hardwareQuery,
    membersQuery,
    facesQuery,
    eventsQuery,
    hasPartialError: hardwareQuery.isError || membersQuery.isError || facesQuery.isError || eventsQuery.isError,
  };
}

export function useRoomDeviceCommand(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: 'led' | 'fan' | 'door'; value: string }) =>
      commandRoomDevice(roomId, key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', roomId] }),
  });
}

export function useUpsertRoomHardware(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertHardwareConfigPayload) => upsertRoomHardware(roomId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'hardware'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'summary'] });
    },
  });
}
