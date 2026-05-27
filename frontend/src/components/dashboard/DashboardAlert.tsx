import { useState } from 'react';
import type { DashboardAlert } from '@/apis';
import { Icon } from '@/components';
import { formatClock } from '@/utils/backend-format';

export function DashboardAlertBanner({ alert }: { alert?: DashboardAlert }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !alert) return null;

  return (
    <div className="mb-8 animate-pulse">
      <div className="bg-error-container/20 border border-error text-error p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Icon name="warning" filled size={24} />
          <div>
            <p className="font-bold text-body-lg">
              CRITICAL: Human movement detected in {alert.room.name} at {formatClock(alert.updatedAt)}
            </p>
            <p className="text-label-sm opacity-80">Immediate attention required. Security protocols initiated.</p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-error hover:text-on-error-container transition-colors p-1">
          <Icon name="close" size={18} />
        </button>
      </div>
    </div>
  );
}
