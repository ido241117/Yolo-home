import { useState } from 'react';

export function useSelectedRoomStore() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>('101');
  return { selectedRoomId, setSelectedRoomId };
}
