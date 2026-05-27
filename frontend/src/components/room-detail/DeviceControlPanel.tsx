import type { DeviceMap } from '@/apis';
import { Icon } from '@/components';
import { isActiveValue, isLockedValue } from '@/utils/backend-format';

function DeviceRow({
  icon, iconClass, label, on, loading, onToggle,
}: {
  icon: string; iconClass: string; label: string; on: boolean | null; loading: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 border border-outline-variant bg-surface rounded">
      <div className="flex items-center gap-3">
        <Icon name={icon} size={20} filled={Boolean(on)} className={iconClass} />
        <span className="text-body-md font-medium">{label}</span>
      </div>
      <button onClick={onToggle} disabled={on === null || loading} className={`px-3 py-1 text-label-md rounded font-bold uppercase tracking-tighter transition-colors disabled:opacity-50 ${on ? 'bg-primary text-on-primary-fixed' : 'bg-slate-600 text-white'}`}>
        {on === null ? 'N/A' : on ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

export function DeviceControlPanel({
  devices,
  loading,
  onCommand,
}: {
  devices: DeviceMap;
  loading: boolean;
  onCommand: (key: 'led' | 'fan' | 'door', value: string) => void;
}) {
  const ledOn = isActiveValue(devices.led);
  const fanOn = isActiveValue(devices.fan);
  const locked = isLockedValue(devices.door);

  return (
    <div className="bg-surface-container border border-outline-variant rounded p-6">
      <h3 className="text-headline-sm mb-6 flex items-center gap-2">
        <Icon name="settings_remote" size={20} />
        Device Control
      </h3>
      <div className="space-y-4">
        <DeviceRow icon="lightbulb" iconClass="text-yellow-400" label="Main LED" on={ledOn} loading={loading} onToggle={() => onCommand('led', ledOn ? '0' : '1')} />
        <DeviceRow icon="toys_fan" iconClass="text-blue-400" label="Cooling Fan" on={fanOn} loading={loading} onToggle={() => onCommand('fan', fanOn ? '0' : '1')} />
        <div className="flex items-center justify-between p-3 border border-outline-variant bg-surface rounded">
          <div className="flex items-center gap-3">
            <Icon name="lock" size={20} filled={Boolean(locked)} className="text-error" />
            <span className="text-body-md font-medium">Smart Door</span>
          </div>
          <button onClick={() => onCommand('door', locked ? 'UNLOCKED' : 'LOCKED')} disabled={locked === null || loading} className="border border-outline-variant hover:bg-surface-container px-4 py-1 text-label-md rounded text-on-surface-variant transition-colors disabled:opacity-50">
            {locked === null ? 'N/A' : locked ? 'Unlock' : 'Lock'}
          </button>
        </div>
      </div>
    </div>
  );
}
