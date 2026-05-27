import { create } from 'zustand';

interface AppState {
  selectedRoomId?: string;
  setSelectedRoomId: (roomId?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedRoomId: undefined,
  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),
}));
