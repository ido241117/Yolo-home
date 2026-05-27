import type { ValueState } from '@/apis';
import { Icon } from '@/components';
import { useGlobalDeviceCommand } from '@/hooks';
import { isActiveValue } from '@/utils/backend-format';

function DeviceToggle({ label, icon, deviceKey, state }: { label: string; icon: string; deviceKey: 'led' | 'fan'; state?: ValueState | null }) {
  const active = isActiveValue(state);
  const mutation = useGlobalDeviceCommand();

  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant">
      <div className="flex items-center gap-3">
        <Icon name={icon} size={20} className="text-primary" />
        <span className="text-body-md font-medium text-on-surface">{label}</span>
      </div>
      <label className="toggle-wrap">
        <input
          type="checkbox"
          checked={Boolean(active)}
          disabled={active === null || mutation.isPending}
          onChange={() => mutation.mutate({ deviceKey, value: active ? '0' : '1' })}
        />
        <span className="toggle-track" />
      </label>
    </div>
  );
}

export function GlobalDevicePanel({ led, fan }: { led?: ValueState | null; fan?: ValueState | null }) {
  return (
    <section className="bg-surface-container border border-outline-variant rounded-xl p-6">
      <h3 className="text-headline-sm font-bold mb-6 flex items-center gap-2 text-on-surface">
        <Icon name="settings_input_component" size={20} className="text-primary" />
        Global Device Panel
      </h3>
      <div className="space-y-4">
        <DeviceToggle label="Global LED Toggle" icon="lightbulb" deviceKey="led" state={led} />
        <DeviceToggle label="Global Fan Toggle" icon="mode_fan" deviceKey="fan" state={fan} />
      </div>
    </section>
  );
}
