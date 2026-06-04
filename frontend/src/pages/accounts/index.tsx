import { useMemo, useState } from 'react';
import { AccountFormModal, AccountStats, AccountsTable, type AccountRow } from '@/components/accounts';
import {
  useAccountsData,
  useCreateAccount,
  useResetAccountPassword,
  useRevokeAccount,
  useUpdateAccount,
} from '@/hooks';

function AccountsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);
  const accountsData = useAccountsData();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const revokeAccount = useRevokeAccount();
  const resetPassword = useResetAccountPassword();

  const rows = useMemo<AccountRow[]>(() => {
    const query = search.trim().toLowerCase();
    return (accountsData.usersQuery.data ?? [])
      .map(user => {
        const roomAssignments = accountsData.assignments.get(user.id) ?? [];
        return {
          ...user,
          roomAssignments,
          assignedRooms: roomAssignments.map(assignment => assignment.room?.name).filter(Boolean) as string[],
        };
      })
      .filter(user => {
        if (!query) return true;
        return [user.name, user.username, user.phone ?? '', user.role, user.assignedRooms.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
  }, [accountsData.assignments, accountsData.usersQuery.data, search]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingAccount(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg text-on-surface">Account Management</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="form-input sm:w-72"
            placeholder="Search accounts..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <button className="btn-primary" onClick={() => setModalOpen(true)}>Create Account</button>
        </div>
      </div>

      <AccountStats accounts={rows} />
      <AccountsTable
        rows={rows}
        isLoading={accountsData.isLoading}
        isError={accountsData.hasError}
        onEdit={account => {
          setEditingAccount(account);
          setModalOpen(true);
        }}
        onRevoke={account => {
          revokeAccount.mutate(account.id);
        }}
        onResetPassword={account => {
          resetPassword.mutate(account.id, {
            onSuccess: result => window.alert(`New password for ${account.username}: ${result.newPassword}`),
          });
        }}
      />
      <AccountFormModal
        open={modalOpen}
        rooms={accountsData.roomsQuery.data ?? []}
        account={editingAccount}
        isSubmitting={createAccount.isPending || updateAccount.isPending}
        onClose={closeModal}
        onCreate={payload => {
          createAccount.mutate(payload, { onSuccess: closeModal });
        }}
        onUpdate={(userId, payload) => {
          updateAccount.mutate({
            userId,
            payload: payload.user,
            roomId: payload.roomId,
            previousRoomId: payload.previousRoomId,
            permissions: payload.permissions,
          }, { onSuccess: closeModal });
        }}
      />
    </div>
  );
}

export default AccountsPage;
