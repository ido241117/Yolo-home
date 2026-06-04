import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoryValueState, ValueState } from '@/apis';
import { Icon } from '@/components';
import { formatClock } from '@/utils/backend-format';

function SensorLineChart({
  label,
  icon,
  state,
  unit,
  history,
  color,
}: {
  label: string;
  icon: string;
  state?: ValueState | null;
  unit: string;
  history?: HistoryValueState[];
  color: string;
}) {
  const value = state ? `${state.value}${unit}` : 'N/A';
  const data = (history ?? [])
    .map((point) => ({
      value: Number(point.value),
      label: formatClock(point.createdAt),
      createdAt: point.createdAt,
    }))
    .filter((point) => Number.isFinite(point.value))
    .reverse();

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icon name={icon} size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-label-md font-bold uppercase text-on-surface-variant">{label}</p>
            <p className="text-body-sm text-on-surface-variant">Adafruit IO feed history</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-headline-sm font-bold text-on-surface">{value}</p>
          <p className="text-label-sm text-on-surface-variant">Updated {formatClock(state?.updatedAt, true)}</p>
        </div>
      </div>
      <div className="h-56">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} width={46} unit={unit.trim()} />
              <Tooltip
                labelFormatter={(_, payload) => formatClock(payload?.[0]?.payload?.createdAt, true)}
                formatter={(chartValue) => [`${chartValue}${unit}`, label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-outline-variant text-body-sm text-on-surface-variant">
            No Adafruit history yet
          </div>
        )}
      </div>
    </div>
  );
}

export function GlobalEnvironmentLog({
  temp,
  humi,
  tempHistory,
  humiHistory,
  configured,
}: {
  temp?: ValueState | null;
  humi?: ValueState | null;
  tempHistory?: HistoryValueState[];
  humiHistory?: HistoryValueState[];
  configured?: boolean;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-headline-sm font-bold text-on-surface">
          <Icon name="monitor_heart" size={20} className="text-primary" />
          Global Environment Log
        </h3>
        <span className={`${configured ? 'text-status-active' : 'text-on-surface-variant'} text-label-sm font-bold`}>
          {configured ? 'LIVE ADAFRUIT' : 'NOT CONFIGURED'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SensorLineChart
          label="Temperature"
          icon="device_thermostat"
          state={temp}
          history={tempHistory}
          unit=" C"
          color="#f97316"
        />
        <SensorLineChart
          label="Humidity"
          icon="humidity_percentage"
          state={humi}
          history={humiHistory}
          unit="%"
          color="#0ea5e9"
        />
      </div>
    </section>
  );
}
