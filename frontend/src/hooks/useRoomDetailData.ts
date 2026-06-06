import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  autoControlRoomDevice,
  commandRoomDevice,
  getRoomEvents,
  getRoomFaces,
  getRoomHardware,
  getRoomMembers,
  getRoomSensorHistory,
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
  const tempHistoryQuery = useQuery({ queryKey: ['rooms', roomCode, 'sensors', 'temp', 'history'], queryFn: () => getRoomSensorHistory(roomCode, 'temp', 80), enabled });
  const humiHistoryQuery = useQuery({ queryKey: ['rooms', roomCode, 'sensors', 'humi', 'history'], queryFn: () => getRoomSensorHistory(roomCode, 'humi', 80), enabled });
  const presenceHistoryQuery = useQuery({ queryKey: ['rooms', roomCode, 'sensors', 'human', 'history'], queryFn: () => getRoomSensorHistory(roomCode, 'human', 80), enabled });

  return {
    summaryQuery,
    hardwareQuery,
    membersQuery,
    facesQuery,
    eventsQuery,
    tempHistoryQuery,
    humiHistoryQuery,
    presenceHistoryQuery,
    hasPartialError:
      hardwareQuery.isError ||
      membersQuery.isError ||
      facesQuery.isError ||
      eventsQuery.isError ||
      tempHistoryQuery.isError ||
      humiHistoryQuery.isError ||
      presenceHistoryQuery.isError,
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
