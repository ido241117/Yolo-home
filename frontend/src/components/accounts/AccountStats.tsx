import { Icon } from '@/components';
import type { AccountRow } from './types';

export function AccountStats({ accounts }: { accounts: AccountRow[] }) {
  const active = accounts.filter(account => account.active).length;
  const revoked = accounts.length - active;
  const admins = accounts.filter(account => account.role === 'owner' || account.role === 'admin').length;
  const tenants = accounts.filter(account => account.role === 'tenant').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="metric">
        <span>Total Users</span>
        <strong>{accounts.length}</strong>
      </div>
      <div className="metric">
        <span>Active Accounts</span>
        <strong>{active}</strong>
      </div>
      <div className="metric alert">
        <span>Revoked</span>
        <strong>{revoked}</strong>
      </div>
      <div className="metric">
        <span>Admins / Tenants</span>
        <div className="flex items-end justify-between gap-3">
          <strong>{admins}/{tenants}</strong>
          <Icon name="groups" size={28} className="text-primary" />
        </div>
      </div>
    </div>
  );
}
