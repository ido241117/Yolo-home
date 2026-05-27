import type { PermissionDto } from '@/apis';
import { initials, permissionLabels } from '@/utils/backend-format';

function permBadge(perm: string) {
  if (perm === 'roomAdmin') return 'bg-primary-container text-on-primary-container';
  return 'bg-secondary-container text-on-secondary-container';
}

export function MembersTable({ members }: { members: PermissionDto[] }) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center">
        <h3 className="text-headline-sm">Room Members</h3>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-high text-on-surface-variant text-label-md">
            <th className="px-6 py-3 font-medium">User</th>
            <th className="px-6 py-3 font-medium">Role</th>
            <th className="px-6 py-3 font-medium">Permissions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {members.map(m => (
            <tr key={m.id} className="hover:bg-surface-container-high transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-label-sm font-bold text-white">
                    {initials(m.user.name)}
                  </div>
                  <span className="text-body-md">{m.user.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-body-md text-on-surface-variant">{m.user.role}</td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {permissionLabels(m).map(p => (
                    <span key={p} className={`px-2 py-0.5 text-[10px] rounded border border-outline-variant ${permBadge(p)}`}>
                      {p}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant">No members</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
