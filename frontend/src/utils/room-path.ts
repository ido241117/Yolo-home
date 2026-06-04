import type { RoomDto } from '@/apis';

export function roomDetailPath(room: Pick<RoomDto, 'code'>) {
  return `/rooms/${room.code}`;
}
