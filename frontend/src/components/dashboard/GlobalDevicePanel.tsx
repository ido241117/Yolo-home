import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ValueState } from '@/apis';
import {
  getGlobalDeviceHardware,
  upsertGlobalDeviceHardware,
} from '@/apis';
import { Icon } from '@/components';
import { useGlobalAutoControlRetrain, useGlobalDeviceAutoCommand, useGlobalDeviceCommand } from '@/hooks';
import { isActiveValue } from '@/utils/backend-format';

const feedKeys = ['led', 'fan', 'door', 'temp', 'humi', 'light', 'human'] as const;

type FeedKey = (typeof feedKeys)[number];

const defaultFeedMapping: Record<FeedKey, string> = {
  led: 'led',
  fan: 'fan',
  door: 'door',
  temp: 'temp',
  humi: 'humi',
  light: 'light',
  human: 'human',
};

function DeviceToggle({
  label,
  icon,
  deviceKey,
  state,
  autoEnabled,
}: {
  label: string;
  icon: string;
  deviceKey: 'led' | 'fan';
  state?: ValueState | null;
  autoEnabled: boolean;
}) {
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
          className={`px-3 py-1 rounded-full border text-label-md font-bold transition-colors disabled:opacity-50 ${
            autoEnabled
              ? 'border-status-active bg-status-active text-white shadow-sm'
              : 'border-primary/40 text-primary hover:bg-primary/10'
          }`}
        >
          Auto
        </button>
        <label className="toggle-wrap">
          <input
            type="checkbox"
            checked={Boolean(active)}
            disabled={active === null || busy || autoEnabled}
            onChange={() => manualMutation.mutate({ deviceKey, value: active ? '0' : '1' })}
          />
          <span className="toggle-track" />
        </label>
      </div>
    </div>
  );
}

export function GlobalDevicePanel({
  led,
  fan,
  autoModes = { led: false, fan: false },
}: {
  led?: ValueState | null;
  fan?: ValueState | null;
  autoModes?: { led: boolean; fan: boolean };
}) {
  const queryClient = useQueryClient();
  const hardwareQuery = useQuery({
    queryKey: ['global-devices', 'hardware'],
    queryFn: getGlobalDeviceHardware,
  });
  const saveMutation = useMutation({
    mutationFn: upsertGlobalDeviceHardware,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['global-devices', 'hardware'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      setEditing(false);
    },
  });

  const [editing, setEditing] = useState(false);
  const [adafruitUsername, setAdafruitUsername] = useState('');
  const [adafruitKey, setAdafruitKey] = useState('');
  const [feedMapping, setFeedMapping] = useState<Record<FeedKey, string>>(defaultFeedMapping);
  const [retrainMessage, setRetrainMessage] = useState('');
  const retrainMutation = useGlobalAutoControlRetrain();

  useEffect(() => {
    const hardware = hardwareQuery.data;
    if (!editing) {
      setAdafruitUsername(hardware?.adafruitUsername ?? '');
      setAdafruitKey('');
      setFeedMapping({ ...defaultFeedMapping, ...(hardware?.feedMapping ?? {}) } as Record<FeedKey, string>);
    }
  }, [editing, hardwareQuery.data]);

  const hardware = hardwareQuery.data;
  const canSave = adafruitUsername.trim() && adafruitKey.trim();

  function openConfig() {
    const nextHardware = hardwareQuery.data;
    setAdafruitUsername(nextHardware?.adafruitUsername ?? '');
    setAdafruitKey('');
    setFeedMapping({ ...defaultFeedMapping, ...(nextHardware?.feedMapping ?? {}) } as Record<FeedKey, string>);
    setEditing(true);
  }

  function handleSave() {
    if (!canSave || saveMutation.isPending) return;
    saveMutation.mutate({
      adafruitUsername: adafruitUsername.trim(),
      adafruitKey: adafruitKey.trim(),
      feedMapping: Object.fromEntries(
        feedKeys.map((key) => [key, feedMapping[key].trim() || defaultFeedMapping[key]]),
      ),
    });
  }

  function handleRetrain() {
    if (retrainMutation.isPending) return;
    setRetrainMessage('');
    retrainMutation.mutate(undefined, {
      onSuccess: (result) => {
        const fanSamples = result.samples?.fan ?? 0;
        const lightSamples = result.samples?.light ?? 0;
        setRetrainMessage(`Retrained bundle ${result.bundleId ?? 'new'} from ${fanSamples} fan / ${lightSamples} light samples.`);
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Retrain failed';
        setRetrainMessage(message);
      },
    });
  }

  return (
    <section className="bg-surface-container border border-outline-variant rounded-xl p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="text-headline-sm font-bold flex items-center gap-2 text-on-surface">
          <Icon name="settings_input_component" size={20} className="text-primary" />
          Global Device Panel
        </h3>
        <div className="flex items-center gap-2">
          <span className={`${hardware ? 'text-status-active' : 'text-on-surface-variant'} flex items-center gap-1 text-label-sm font-bold`}>
            <Icon name={hardware ? 'check_circle' : 'cloud_off'} size={14} filled className={hardware ? 'text-status-active' : 'text-on-surface-variant'} />
            {hardware ? 'CONFIGURED' : 'NOT SET'}
          </span>
          <button
            type="button"
            onClick={editing ? () => setEditing(false) : openConfig}
            className="px-3 py-1 rounded-full border border-primary/40 text-primary text-label-md font-bold hover:bg-primary/10 transition-colors"
          >
            {editing ? 'Close' : 'Config'}
          </button>
          <button
            type="button"
            onClick={handleRetrain}
            disabled={retrainMutation.isPending}
            className="px-3 py-1 rounded-full border border-secondary/40 text-secondary text-label-md font-bold hover:bg-secondary/10 transition-colors disabled:opacity-50"
            title="Create a new custom auto-control model bundle without overwriting default .pkl files"
          >
            {retrainMutation.isPending ? 'Retraining...' : 'Retrain'}
          </button>
        </div>
      </div>

      {retrainMessage && (
        <div className="mb-4 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
          {retrainMessage}
        </div>
      )}

      {editing && (
        <div className="mb-6 space-y-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 block">
              <span className="text-label-sm text-on-surface-variant">Adafruit IO Username</span>
              <input
                className="form-input font-mono"
                value={adafruitUsername}
                onChange={(event) => setAdafruitUsername(event.target.value)}
                placeholder="your_aio_username"
              />
            </label>
            <label className="space-y-2 block">
              <span className="text-label-sm text-on-surface-variant">Adafruit IO Key</span>
              <input
                className="form-input font-mono"
                type="password"
                value={adafruitKey}
                onChange={(event) => setAdafruitKey(event.target.value)}
                placeholder={hardware ? 'Enter key again to update' : 'aio_...'}
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-label-sm text-on-surface-variant">Feed Mapping</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {feedKeys.map((key) => (
                <label key={key} className="space-y-2 block">
                  <span className="text-label-sm text-on-surface-variant uppercase">{key}</span>
                  <input
                    className="form-input font-mono"
                    value={feedMapping[key]}
                    onChange={(event) => setFeedMapping((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saveMutation.isPending}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saveMutation.isPending}
              className="btn-primary"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Config'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <DeviceToggle label="Global LED Toggle" icon="lightbulb" deviceKey="led" state={led} autoEnabled={autoModes.led} />
        <DeviceToggle label="Global Fan Toggle" icon="mode_fan" deviceKey="fan" state={fan} autoEnabled={autoModes.fan} />
      </div>
    </section>
  );
}
