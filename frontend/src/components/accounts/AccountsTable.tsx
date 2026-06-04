import { Icon } from '@/components';
import { formatDateTime, initials } from '@/utils/backend-format';
import { roleClassNames, roleLabels, type AccountRow } from './types';

interface AccountsTableProps {
  rows: AccountRow[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (account: AccountRow) => void;
  onRevoke: (account: AccountRow) => void;
  onResetPassword: (account: AccountRow) => void;
}

export function AccountsTable({ rows, isLoading, isError, onEdit, onRevoke, onResetPassword }: AccountsTableProps) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
      {isError && (
        <div className="px-6 py-4 border-b border-error/30 text-error bg-error-container/10">
          Could not load all account data from backend.
        </div>
      )}
      {isLoading && (
        <div className="px-6 py-3 border-b border-outline-variant text-on-surface-variant bg-surface-container-high/30">
          Syncing accounts...
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-high border-b border-outline-variant">
            <tr>
              <th className="px-6 py-4 text-label-md text-on-surface-variant font-bold uppercase">Username</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant font-bold uppercase">Role</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant font-bold uppercase">Assigned Room</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant font-bold uppercase">Status</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant font-bold uppercase">Last Login</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant font-bold uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {rows.map(account => (
              <tr key={account.id} className={`hover:bg-surface-container-high transition-colors ${account.active ? '' : 'bg-error/5'}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary font-bold text-[11px]">
                      {initials(account.name)}
                    </div>
                    <div>
                      <p className="text-body-md font-medium text-on-surface">{account.username}</p>
                      <p className="text-label-sm text-on-surface-variant">{account.name}{account.phone ? ` · ${account.phone}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded badge-pill text-[10px] font-bold uppercase tracking-wider ${roleClassNames[account.role]}`}>
                    {roleLabels[account.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-body-md text-on-surface-variant">
                  {account.isGlobalAdmin ? 'Global Access' : account.assignedRooms.join(', ') || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-2 text-label-md font-medium ${account.active ? 'text-status-active' : 'text-error'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${account.active ? 'bg-status-active' : 'bg-error'}`} />
                    {account.active ? 'Active' : 'Revoked'}
                  </span>
                </td>
                <td className="px-6 py-4 text-body-md text-on-surface-variant">{formatDateTime(account.lastLoginAt ?? undefined)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="table-icon-btn" onClick={() => onEdit(account)} title="Edit">
                      <Icon name="edit" size={18} />
                    </button>
                    <button className="table-icon-btn hover:text-amber-300" onClick={() => onResetPassword(account)} title="Reset password">
                      <Icon name="lock_reset" size={18} />
                    </button>
                    {account.active && (
                      <button className="table-icon-btn hover:text-error" onClick={() => onRevoke(account)} title="Revoke">
                        <Icon name="block" size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">No accounts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant text-label-sm text-on-surface-variant">
        Showing {rows.length} accounts from backend
      </div>
    </div>
  );
}
