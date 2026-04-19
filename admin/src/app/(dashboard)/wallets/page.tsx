'use client';

import { useEffect, useState, useCallback } from 'react';
import { admin } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Pagination from '@/components/pagination';

export default function WalletsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admin.wallets.list(page, 20, search || undefined);
      setUsers(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalUsers(res.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch wallets', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Wallets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of user balances across coins, pens, and wallet funds
            {totalUsers > 0 && (
              <span className="ml-2 text-gray-400">({totalUsers} users)</span>
            )}
          </p>
        </div>
      </div>

      {/* Search bar */}
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

      {/* Wallets table */}
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
                    <th className="table-header text-right">Coins Balance</th>
                    <th className="table-header text-right">Pens Balance</th>
                    <th className="table-header text-right">Wallet (INR)</th>
                    <th className="table-header">Premium</th>
                    <th className="table-header">Joined</th>
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
                      <td className="table-cell">
                        <span className="font-mono text-xs">{user.phone}</span>
                      </td>
                      <td className="table-cell text-right">
                        <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                          <span className="text-yellow-500" aria-hidden="true">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" />
                              <text x="12" y="16" textAnchor="middle" fontSize="11" fill="currentColor" fontWeight="bold">C</text>
                            </svg>
                          </span>
                          {(user.coinsBalance ?? 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                          <span className="text-brand-500" aria-hidden="true">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                            </svg>
                          </span>
                          {(user.pensBalance ?? 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(user.walletBalanceINR ?? 0)}
                        </span>
                      </td>
                      <td className="table-cell">
                        {user.isPremium ? (
                          <span className="badge-yellow">Premium</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell text-xs text-gray-500">
                        {formatDate(user.createdAt)}
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
    </div>
  );
}
