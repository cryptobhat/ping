'use client';

import { useEffect, useState, useCallback } from 'react';
import { admin } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Pagination from '@/components/pagination';
import Modal from '@/components/modal';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ phone: '', name: '', username: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [duplicateIPs, setDuplicateIPs] = useState<any[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admin.getUsers(page, 20, search || undefined);
      setUsers(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchDuplicateIPs = async () => {
    try {
      const res = await admin.getDuplicateIPs();
      setDuplicateIPs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch duplicate IPs', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleDeactivateConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await admin.deleteUser(deleteId);
      setDeleteId(null);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    try {
      await admin.createUser(createForm);
      setShowCreateModal(false);
      setCreateForm({ phone: '', name: '', username: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage platform users</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Add User
        </button>
      </div>

      <div className="card mb-6 !p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            className="input max-w-sm"
            placeholder="Search by name, username, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
            No users found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="table-header">User</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Verified</th>
                    <th className="table-header">Premium</th>
                    <th className="table-header">Creator</th>
                    <th className="table-header">Coins</th>
                    <th className="table-header">Pens</th>
                    <th className="table-header">Last Login</th>
                    <th className="table-header">Device</th>
                    <th className="table-header">IP</th>
                    <th className="table-header">Logins</th>
                    <th className="table-header">Joined</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900">{user.name || '-'}</p>
                          <p className="text-xs text-gray-500">@{user.username || '-'}</p>
                        </div>
                      </td>
                      <td className="table-cell">{user.phone}</td>
                      <td className="table-cell">
                        {user.isActive ? (
                          <span className="badge-green">Active</span>
                        ) : (
                          <span className="badge-red">Inactive</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={async () => {
                            try {
                              await admin.verifyUser(user.id, !user.isVerified);
                              fetchUsers();
                            } catch (err: any) {
                              console.error('Failed to toggle verify', err);
                            }
                          }}
                          className={user.isVerified ? 'badge-green cursor-pointer hover:opacity-80' : 'badge-red cursor-pointer hover:opacity-80'}
                        >
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>
                      <td className="table-cell">
                        {user.isPremium ? (
                          <span className="badge-yellow">Premium</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={async () => {
                            try {
                              await admin.setCreatorEligibility(user.id, !user.isCreatorEligible);
                              fetchUsers();
                            } catch (err: any) {
                              console.error('Failed to toggle creator eligibility', err);
                            }
                          }}
                          className={user.isCreatorEligible ? 'badge-green cursor-pointer hover:opacity-80' : 'text-xs text-gray-400 cursor-pointer hover:text-brand-600'}
                          title={user.isCreatorEligible ? 'Click to disable creator' : 'Click to enable creator'}
                        >
                          {user.isCreatorEligible
                            ? `Creator${user.creatorPriceINR ? ` (₹${user.creatorPriceINR})` : ''}`
                            : 'Enable'}
                        </button>
                      </td>
                      <td className="table-cell">{user.coinsBalance ?? 0}</td>
                      <td className="table-cell">{user.pensBalance ?? 0}</td>
                      <td className="table-cell text-xs">{user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'}</td>
                      <td className="table-cell">
                        {user.lastDevice ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {user.lastDevice}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-xs text-gray-500">{user.lastLoginIp || '-'}</span>
                      </td>
                      <td className="table-cell">{user.loginCount ?? 0}</td>
                      <td className="table-cell">{formatDate(user.createdAt)}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Duplicate IP Detection */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Duplicate IP Detection</h2>
            <p className="text-sm text-gray-500">Users sharing the same login IP (potential duplicate accounts)</p>
          </div>
          <button
            onClick={() => {
              setShowDuplicates(!showDuplicates);
              if (!showDuplicates && duplicateIPs.length === 0) fetchDuplicateIPs();
            }}
            className="btn-secondary"
          >
            {showDuplicates ? 'Hide' : 'Check Duplicates'}
          </button>
        </div>

        {showDuplicates && (
          duplicateIPs.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No duplicate IPs found</p>
          ) : (
            <div className="space-y-3">
              {duplicateIPs.map((dup: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-medium text-red-700">{dup.ip}</span>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      {dup.count} accounts
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(dup.users || []).map((u: string, i: number) => (
                      <span key={i} className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200">
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <Modal open={!!deleteId} onClose={() => { setDeleteId(null); setDeleteError(''); }} title="Deactivate User">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will deactivate the user account. They will no longer be able to log in or access the platform. You can reactivate them later if needed.
          </p>
          {deleteError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setDeleteId(null); setDeleteError(''); }}
              className="btn-secondary"
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeactivateConfirm}
              className="btn-danger"
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              className="input"
              placeholder="10-digit phone number"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="input"
              placeholder="Full name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              className="input"
              placeholder="username"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              required
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createLoading} className="btn-primary">
              {createLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
