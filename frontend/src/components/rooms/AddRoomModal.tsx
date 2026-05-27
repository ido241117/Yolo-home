import { useState } from 'react';
import type { RoomStatus } from '@/apis';
import { Icon } from '@/components';
import { useCreateRoom } from '@/hooks';

export function AddRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<RoomStatus>('vacant');
  const [description, setDescription] = useState('');
  const mutation = useCreateRoom();

  if (!open) return null;

  function handleClose() {
    setName('');
    setStatus('vacant');
    setDescription('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-surface-container-low border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <h3 className="text-headline-sm text-on-surface">Provision New Room</h3>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors" onClick={handleClose}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <form
          className="p-6 space-y-4"
          onSubmit={e => {
            e.preventDefault();
            if (name.trim()) {
              mutation.mutate(
                { name: name.trim(), status, description: description.trim() || undefined },
                { onSuccess: handleClose },
              );
            }
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
              Room Designation
            </label>
            <input
              type="text"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="e.g. Room 401"
              className="w-full bg-surface border border-outline-variant rounded px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/30 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={event => setStatus(event.target.value as RoomStatus)}
                className="w-full bg-surface border border-outline-variant rounded px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Ready"
                className="w-full bg-surface border border-outline-variant rounded px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          {mutation.isError && <p className="text-label-sm text-error">Could not create room.</p>}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 border border-outline-variant rounded text-on-surface-variant text-label-md hover:bg-surface-container-high transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending || !name.trim()} className="flex-1 px-4 py-2.5 bg-primary-container text-on-primary-container rounded text-label-md font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
              {mutation.isPending ? 'Deploying...' : 'Deploy Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
