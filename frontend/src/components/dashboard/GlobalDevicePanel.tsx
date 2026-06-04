import type { ValueState } from '@/apis';
import { Icon } from '@/components';
import { useGlobalDeviceAutoCommand, useGlobalDeviceCommand } from '@/hooks';
import { isActiveValue } from '@/utils/backend-format';

function DeviceToggle({ label, icon, deviceKey, state }: { label: string; icon: string; deviceKey: 'led' | 'fan'; state?: ValueState | null }) {
  const active = isActiveValue(state);
  const manualMutation = useGlobalDeviceCommand();
  const autoMutation = useGlobalDeviceAutoCommand();
  const busy = manualMutation.isPending || autoMutation.isPending;

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
      <div className="flex items-center gap-3">
        <Icon name={icon} size={20} className="text-primary" />
        <span className="text-body-md font-medium text-on-surface">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={active === null || busy}
          onClick={() => autoMutation.mutate({ deviceKey })}
          className="px-3 py-1 rounded-full border border-primary/40 text-primary text-label-md font-bold hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          Auto
        </button>
        <label className="toggle-wrap">
          <input
            type="checkbox"
            checked={Boolean(active)}
            disabled={active === null || busy}
            onChange={() => manualMutation.mutate({ deviceKey, value: active ? '0' : '1' })}
          />
          <span className="toggle-track" />
        </label>
      </div>
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
