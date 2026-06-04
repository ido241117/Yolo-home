import { useEffect, useState } from 'react';
import type { HardwareConfigDto } from '@/apis';
import { Icon } from '@/components';

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

interface HardwarePanelProps {
  hardware?: HardwareConfigDto | null;
  isSaving?: boolean;
  onSave: (payload: { adafruitUsername: string; adafruitKey: string; feedMapping: Record<string, string> }) => void;
}

export function HardwarePanel({ hardware, isSaving = false, onSave }: HardwarePanelProps) {
  const [editing, setEditing] = useState(false);
  const [adafruitUsername, setAdafruitUsername] = useState('');
  const [adafruitKey, setAdafruitKey] = useState('');
  const [feedMapping, setFeedMapping] = useState<Record<FeedKey, string>>(defaultFeedMapping);

  useEffect(() => {
    setAdafruitUsername(hardware?.adafruitUsername ?? '');
    setAdafruitKey('');
    setFeedMapping({ ...defaultFeedMapping, ...(hardware?.feedMapping ?? {}) });
    setEditing(!hardware);
  }, [hardware]);

  const canSave = adafruitUsername.trim() && adafruitKey.trim();

  const handleSave = () => {
    if (!canSave || isSaving) return;
    onSave({
      adafruitUsername: adafruitUsername.trim(),
      adafruitKey: adafruitKey.trim(),
      feedMapping: Object.fromEntries(
        feedKeys.map(key => [key, feedMapping[key].trim() || defaultFeedMapping[key]]),
      ),
    });
  };

  return (
    <div className="bg-surface-container border border-outline-variant rounded p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-headline-sm flex items-center gap-2">
          <Icon name="memory" size={20} />
          Adafruit Config
        </h3>
        <div className="flex items-center gap-2">
          <span className={`${hardware ? 'text-status-active' : 'text-on-surface-variant'} flex items-center gap-1 text-label-sm font-bold`}>
            <Icon name={hardware ? 'check_circle' : 'cloud_off'} size={14} filled className={hardware ? 'text-status-active' : 'text-on-surface-variant'} />
            {hardware ? 'CONFIGURED' : 'NOT SET'}
          </span>
          {hardware && (
            <button className="table-icon-btn" onClick={() => setEditing(current => !current)} aria-label="Edit Adafruit config">
              <Icon name={editing ? 'visibility' : 'edit'} size={18} />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          <label className="space-y-2 block">
            <span className="text-label-sm text-on-surface-variant">Adafruit IO Username</span>
            <input
              className="form-input font-mono"
              value={adafruitUsername}
              onChange={event => setAdafruitUsername(event.target.value)}
              placeholder="your_aio_username"
            />
          </label>
          <label className="space-y-2 block">
            <span className="text-label-sm text-on-surface-variant">Adafruit IO Key</span>
            <input
              className="form-input font-mono"
              type="password"
              value={adafruitKey}
              onChange={event => setAdafruitKey(event.target.value)}
              placeholder={hardware ? 'Enter key again to update' : 'aio_...'}
            />
          </label>

          <div>
            <p className="text-label-sm text-on-surface-variant mb-2">Feed Mapping</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {feedKeys.map(key => (
                <label key={key} className="space-y-2">
                  <span className="text-label-sm text-on-surface-variant uppercase">{key}</span>
                  <input
                    className="form-input font-mono"
                    value={feedMapping[key]}
                    onChange={event => setFeedMapping(current => ({ ...current, [key]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {hardware && (
              <button className="btn-secondary" onClick={() => setEditing(false)} disabled={isSaving}>
                Cancel
              </button>
            )}
            <button className="btn-primary" onClick={handleSave} disabled={!canSave || isSaving}>
              {isSaving ? 'Saving...' : 'Save Config'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-label-sm text-on-surface-variant block mb-1">Username</label>
            <div className="text-body-md font-mono bg-surface p-2 rounded border border-outline-variant truncate">
              {hardware?.adafruitUsername ?? '-'}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-label-md border-collapse">
              <thead>
                <tr className="text-on-surface-variant border-b border-outline-variant">
                  <th className="pb-2 font-medium">Feed</th>
                  <th className="pb-2 font-medium">Mapping</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                {Object.entries(hardware?.feedMapping ?? {}).map(([feed, mapping]) => (
                  <tr key={feed} className="border-b border-outline-variant/30">
                    <td className="py-2">{feed}</td>
                    <td className="py-2 font-mono text-primary">{mapping}</td>
                  </tr>
                ))}
                {Object.keys(hardware?.feedMapping ?? {}).length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-on-surface-variant">No feed mapping configured</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
