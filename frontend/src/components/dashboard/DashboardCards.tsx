import { Icon } from '@/components';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  alert?: boolean;
  progress?: number;
  progressColor?: string;
}

function StatCard({ label, value, icon, iconColor, alert, progress, progressColor }: StatCardProps) {
  return (
    <div className={`bg-surface-container border border-outline-variant p-5 rounded-xl flex flex-col justify-between ${alert ? 'border-l-4 border-l-error' : ''}`}>
      <div className="flex justify-between items-start">
        <span className={`text-label-md uppercase font-bold ${alert ? 'text-error' : 'text-on-surface-variant'}`}>
          {label}
        </span>
        <Icon name={icon} size={22} className={iconColor ?? 'text-primary'} />
      </div>
      <h2 className={`text-display mt-4 ${alert ? 'text-error' : 'text-on-surface'}`}>{value}</h2>
      {progress !== undefined && (
        <div className="w-full bg-surface-container-lowest h-1 rounded-full mt-2">
          <div className={`h-1 rounded-full ${progressColor ?? 'bg-primary'}`} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

export function DashboardCards({
  totalRooms,
  occupiedRooms,
  vacantRooms,
  totalTenants,
  activeAlerts,
}: {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  totalTenants: number;
  activeAlerts: number;
}) {
  const occupiedProgress = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
      <StatCard label="Total Rooms" value={totalRooms} icon="meeting_room" />
      <StatCard label="Occupied" value={occupiedRooms} icon="person_pin" iconColor="text-status-occupied" progress={occupiedProgress} progressColor="bg-status-occupied" />
      <StatCard label="Vacant" value={vacantRooms} icon="check_circle" iconColor="text-status-active" />
      <StatCard label="Tenants" value={totalTenants} icon="group" iconColor="text-tertiary" />
      <StatCard label="Active Alerts" value={activeAlerts} icon="notification_important" alert />
    </div>
  );
}
