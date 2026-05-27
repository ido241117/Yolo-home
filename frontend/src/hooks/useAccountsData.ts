import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignUserRoom,
  createUser,
  getUserRoomAssignments,
  getRooms,
  getUsers,
  removeUserRoomAssignment,
  resetUserPassword,
  revokeUser,
  updateUser,
  type CreateUserPayload,
  type PermissionDto,
  type UpdatePermissionPayload,
  type UpdateUserPayload,
} from '@/apis';

export interface CreateAccountInput {
  user: CreateUserPayload;
  roomId?: string;
  permissions: UpdatePermissionPayload;
}

export interface UpdateAccountInput {
  userId: string;
  payload: UpdateUserPayload;
  roomId?: string;
  previousRoomId?: string;
  permissions: UpdatePermissionPayload;
}

export function useAccountsData() {
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const roomsQuery = useQuery({ queryKey: ['rooms'], queryFn: getRooms });
  const users = usersQuery.data ?? [];
  const assignmentsQueries = useQueries({
    queries: users.map(user => ({
      queryKey: ['users', user.id, 'rooms'],
      queryFn: () => getUserRoomAssignments(user.id),
      enabled: usersQuery.isSuccess,
    })),
  });

  const assignments = new Map<string, PermissionDto[]>();
  assignmentsQueries.forEach((query, index) => {
    const user = users[index];
    if (!user || !query.data) return;
    assignments.set(user.id, query.data);
  });

  return {
    usersQuery,
    roomsQuery,
    assignmentsQueries,
    assignments,
    isLoading: usersQuery.isLoading || roomsQuery.isLoading || assignmentsQueries.some(query => query.isLoading),
    hasError: usersQuery.isError || roomsQuery.isError || assignmentsQueries.some(query => query.isError),
  };
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, roomId, permissions }: CreateAccountInput) => {
      const created = await createUser(user);
      if (roomId) {
        await assignUserRoom(created.id, { roomId, ...permissions });
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, payload, roomId, previousRoomId, permissions }: UpdateAccountInput) => {
      const updated = await updateUser(userId, payload);
      if (previousRoomId && previousRoomId !== roomId) {
        await removeUserRoomAssignment(userId, previousRoomId);
      }
      if (roomId) {
        await assignUserRoom(userId, { roomId, ...permissions });
      }
      return updated;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId, 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useRevokeAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useResetAccountPassword() {
  return useMutation({ mutationFn: resetUserPassword });
}
