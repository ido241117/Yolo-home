import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  autoControlRoomDevice,
  commandRoomDevice,
  getRoomEvents,
  getRoomFaces,
  getRoomHardware,
  getRoomMembers,
  getRoomSummary,
  upsertRoomHardware,
  type UpsertHardwareConfigPayload,
} from '@/apis';

export function useRoomDetailData(roomCode: string) {
  const enabled = Boolean(roomCode);
  const summaryQuery = useQuery({ queryKey: ['rooms', roomCode, 'summary'], queryFn: () => getRoomSummary(roomCode), enabled });
  const hardwareQuery = useQuery({ queryKey: ['rooms', roomCode, 'hardware'], queryFn: () => getRoomHardware(roomCode), enabled });
  const membersQuery = useQuery({ queryKey: ['rooms', roomCode, 'members'], queryFn: () => getRoomMembers(roomCode), enabled });
  const facesQuery = useQuery({ queryKey: ['rooms', roomCode, 'faces'], queryFn: () => getRoomFaces(roomCode), enabled });
  const eventsQuery = useQuery({ queryKey: ['rooms', roomCode, 'events'], queryFn: () => getRoomEvents(roomCode, 20), enabled });

  return {
    summaryQuery,
    hardwareQuery,
    membersQuery,
    facesQuery,
    eventsQuery,
    hasPartialError: hardwareQuery.isError || membersQuery.isError || facesQuery.isError || eventsQuery.isError,
  };
}

export function useRoomDeviceCommand(roomCode: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: 'led' | 'fan' | 'door'; value: string }) =>
      commandRoomDevice(roomCode, key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', roomCode] }),
  });
}

export function useRoomDeviceAutoCommand(roomCode: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key }: { key: 'led' | 'fan' }) =>
      autoControlRoomDevice(roomCode, key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', roomCode] }),
  });
}

export function useUpsertRoomHardware(roomCode: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertHardwareConfigPayload) => upsertRoomHardware(roomCode, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomCode, 'hardware'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', roomCode, 'summary'] });
    },
  });
}
