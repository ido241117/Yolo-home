import { RoomService } from '../room.service';

export async function resolveRoomIdFromRequest(
  roomService: RoomService,
  params: { roomId?: string; id?: string },
): Promise<string | null> {
  const ref = params.roomId ?? params.id;
  if (!ref) return null;
  return roomService.resolveRoomId(ref);
}
