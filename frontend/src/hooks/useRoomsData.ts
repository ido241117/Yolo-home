import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoom, getRooms, type CreateRoomPayload } from '@/apis';

export function useRoomsData() {
  return useQuery({ queryKey: ['rooms'], queryFn: getRooms });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoomPayload) => createRoom(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
}
