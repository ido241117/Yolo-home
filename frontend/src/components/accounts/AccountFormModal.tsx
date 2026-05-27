import { useEffect, useState } from 'react';
import type { RoomDto, UpdatePermissionPayload, UserRole } from '@/apis';
import { Icon } from '@/components';
import type { AccountRow } from './types';

const defaultPermissions: UpdatePermissionPayload = {
  canControlLed: true,
  canControlFan: false,
  canControlDoor: false,
  canViewSensors: true,
  canManageFaces: false,
  isRoomAdmin: false,
};

interface AccountFormModalProps {
  open: boolean;
  rooms: RoomDto[];
  account?: AccountRow | null;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (payload: {
    user: { name: string; username: string; password: string; phone?: string; role: UserRole };
    roomId?: string;
    permissions: UpdatePermissionPayload;
  }) => void;
  onUpdate: (
    userId: string,
    payload: {
      user: { name: string; phone?: string; role: UserRole };
      roomId?: string;
      previousRoomId?: string;
      permissions: UpdatePermissionPayload;
    },
  ) => void;
}

export function AccountFormModal({
  open,
  rooms,
  account,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: AccountFormModalProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [roomId, setRoomId] = useState('');
  const [permissions, setPermissions] = useState<UpdatePermissionPayload>(defaultPermissions);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? '');
    setUsername(account?.username ?? '');
    setPassword('');
    setPhone(account?.phone ?? '');
    setRole(account?.role ?? 'tenant');
    const assignment = account?.roomAssignments[0];
    setRoomId(assignment?.room?.id ?? '');
    setPermissions(
      assignment
        ? {
            canControlLed: assignment.canControlLed,
            canControlFan: assignment.canControlFan,
            canControlDoor: assignment.canControlDoor,
            canViewSensors: assignment.canViewSensors,
            canManageFaces: assignment.canManageFaces,
            isRoomAdmin: assignment.isRoomAdmin,
          }
        : defaultPermissions,
    );
  }, [account, open]);

  if (!open) return null;

  const togglePermission = (key: keyof UpdatePermissionPayload) => {
    setPermissions(current => ({ ...current, [key]: !current[key] }));
  };

  const handleSubmit = () => {
    if (account) {
      onUpdate(account.id, {
        user: { name, phone: phone || undefined, role },
        roomId: roomId || undefined,
        previousRoomId: account.roomAssignments[0]?.room?.id,
        permissions,
      });
      return;
    }
    onCreate({
      user: { name, username, password, phone: phone || undefined, role },
      roomId: roomId || undefined,
      permissions,
    });
  };

  const canSubmit = name.trim() && (account || (username.trim() && password.trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={onClose} aria-label="Close account form" />
      <div className="relative w-full max-w-2xl bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h3 className="text-headline-md text-on-surface">{account ? 'Edit Account' : 'Create Account'}</h3>
          <button className="text-on-surface-variant hover:text-error" onClick={onClose} aria-label="Close">
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-label-md text-on-surface-variant">Full Name</span>
              <input className="form-input" value={name} onChange={event => setName(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-label-md text-on-surface-variant">Username</span>
              <input className="form-input" value={username} disabled={Boolean(account)} onChange={event => setUsername(event.target.value)} />
            </label>
            {!account && (
              <label className="space-y-2">
                <span className="text-label-md text-on-surface-variant">Initial Password</span>
                <input className="form-input" type="password" value={password} onChange={event => setPassword(event.target.value)} />
              </label>
            )}
            <label className="space-y-2">
              <span className="text-label-md text-on-surface-variant">Phone</span>
              <input className="form-input" value={phone} onChange={event => setPhone(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-label-md text-on-surface-variant">Role</span>
              <select className="form-input" value={role} onChange={event => setRole(event.target.value as UserRole)}>
                <option value="tenant">Tenant</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-label-md text-on-surface-variant">Room Assignment</span>
              <select className="form-input" value={roomId} onChange={event => setRoomId(event.target.value)}>
                <option value="">No room yet</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </label>
          </div>

          {roomId && (
            <div>
              <p className="text-label-md text-on-surface-variant mb-3">Room Permissions</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  ['canControlLed', 'lightbulb', 'LED'],
                  ['canControlFan', 'air', 'Fan'],
                  ['canControlDoor', 'door_front', 'Door'],
                  ['canViewSensors', 'sensors', 'Sensors'],
                  ['canManageFaces', 'face', 'Faces'],
                  ['isRoomAdmin', 'admin_panel_settings', 'Room Admin'],
                ].map(([key, icon, label]) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-surface border border-outline-variant rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(permissions[key as keyof UpdatePermissionPayload])}
                      onChange={() => togglePermission(key as keyof UpdatePermissionPayload)}
                    />
                    <span className="flex items-center gap-2 text-body-md">
                      <Icon name={icon} size={16} />
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Saving...' : account ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
