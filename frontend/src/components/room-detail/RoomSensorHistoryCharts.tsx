import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoryValueState, SensorState } from '@/apis';
import { Icon } from '@/components';
import { formatClock } from '@/utils/backend-format';

function RoomLineChart({
  title,
  icon,
  state,
  history,
  unit,
  color,
  valueFormatter,
}: {
  title: string;
  icon: string;
  state?: SensorState | null;
  history?: HistoryValueState[];
  unit: string;
  color: string;
  valueFormatter?: (value: number) => string;
}) {
  const data = (history ?? [])
    .map((point) => ({
      value: Number(point.value),
      label: formatClock(point.createdAt),
      createdAt: point.createdAt,
    }))
    .filter((point) => Number.isFinite(point.value))
    .reverse();
  const currentValue = state?.value == null ? 'N/A' : valueFormatter ? valueFormatter(Number(state.value)) : `${state.value}${unit}`;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icon name={icon} size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-label-md font-bold uppercase text-on-surface-variant">{title}</p>
            <p className="text-body-sm text-on-surface-variant">Adafruit IO feed history</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-headline-sm font-bold text-on-surface">{currentValue}</p>
          <p className="text-label-sm text-on-surface-variant">Updated {formatClock(state?.updatedAt, true)}</p>
        </div>
      </div>

      <div className="h-56">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} minTickGap={24} />
              <YAxis
                tick={{ fontSize: 11, fill: 'currentColor' }}
                width={46}
                unit={unit.trim()}
                domain={valueFormatter ? [0, 1] : ['auto', 'auto']}
                ticks={valueFormatter ? [0, 1] : undefined}
                tickFormatter={(value) => valueFormatter ? valueFormatter(Number(value)) : String(value)}
              />
              <Tooltip
                labelFormatter={(_, payload) => formatClock(payload?.[0]?.payload?.createdAt, true)}
                formatter={(chartValue) => {
                  const numeric = Number(chartValue);
                  return [valueFormatter ? valueFormatter(numeric) : `${chartValue}${unit}`, title];
                }}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
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

export function RoomSensorHistoryCharts({
  temp,
  humi,
  human,
  tempHistory,
  humiHistory,
  presenceHistory,
}: {
  temp?: SensorState | null;
  humi?: SensorState | null;
  human?: SensorState | null;
  tempHistory?: HistoryValueState[];
  humiHistory?: HistoryValueState[];
  presenceHistory?: HistoryValueState[];
}) {
  const presenceFormatter = (value: number) => value >= 1 ? 'Detected' : 'Clear';

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-headline-sm font-bold text-on-surface">
          <Icon name="monitor_heart" size={20} className="text-primary" />
          Room Sensor History
        </h3>
        <span className="text-label-sm font-bold text-status-active">LIVE ADAFRUIT</span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RoomLineChart
          title="Temperature Environment Log"
          icon="device_thermostat"
          state={temp}
          history={tempHistory}
          unit=" C"
          color="#f97316"
        />
        <RoomLineChart
          title="Humidity Environment Log"
          icon="humidity_percentage"
          state={humi}
          history={humiHistory}
          unit="%"
          color="#0ea5e9"
        />
        <div className="xl:col-span-2">
          <RoomLineChart
            title="Presence Data"
            icon="sensors"
            state={human}
            history={presenceHistory}
            unit=""
            color="#22c55e"
            valueFormatter={presenceFormatter}
          />
        </div>
      </div>
    </section>
  );
}
