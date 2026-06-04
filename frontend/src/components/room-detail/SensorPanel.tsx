import type { SensorMap } from '@/apis';
import { Icon } from '@/components';
import { isActiveValue, sensorValue } from '@/utils/backend-format';

function SensorCard({ label, icon, value, sub }: { label: string; icon: string; value: string; sub: string }) {
  return (
    <div className="bg-surface-container border border-outline-variant p-4 rounded transition-all hover:bg-surface-container-high">
      <div className="flex justify-between items-start mb-4">
        <span className="text-label-md text-on-surface-variant uppercase tracking-wider">{label}</span>
        <Icon name={icon} size={22} className="text-primary" />
      </div>
      <div className="text-display text-primary font-bold">{value}</div>
      <div className="mt-2 text-label-sm text-on-surface-variant">{sub}</div>
    </div>
  );
}

export function SensorPanel({ sensors }: { sensors: SensorMap }) {
  const human = isActiveValue(sensors.human);
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <SensorCard label="Temperature" icon="thermostat" value={sensorValue(sensors, 'temp')} sub="Live feed" />
      <SensorCard label="Humidity" icon="humidity_percentage" value={sensorValue(sensors, 'humi')} sub="Live feed" />
      <SensorCard label="Luminosity" icon="light_mode" value={sensorValue(sensors, 'light')} sub="Ambient light" />
      <div className="bg-surface-container border border-outline-variant p-4 rounded transition-all hover:bg-surface-container-high">
        <div className="flex justify-between items-start mb-4">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Presence</span>
          <Icon name="person_search" size={22} className="text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${human ? 'bg-status-active' : 'bg-slate-500'}`} />
          <div className="text-display text-on-surface-variant font-bold">
            {human === null ? 'N/A' : human ? 'ON' : 'OFF'}
          </div>
        </div>
        <div className="mt-2 text-label-sm text-on-surface-variant">Human sensor feed</div>
      </div>
    </div>
  );
}
