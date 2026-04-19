'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Modal from '@/components/modal';

interface Alert {
  type: 'success' | 'error';
  message: string;
}

export default function SubscriptionsPage() {
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<Alert | null>(null);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', description: '', price: '', durationDays: '30', isActive: true, displayOrder: '0',
  });
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editPlan, setEditPlan] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '', description: '', price: '', durationDays: '', isActive: true, displayOrder: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deletePlan, setDeletePlan] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggling
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Notification form
  const [notifForm, setNotifForm] = useState({ title: '', body: '', target: 'all' });
  const [sendingNotif, setSendingNotif] = useState(false);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await admin.getPricing();
      setPricing(res.data);
    } catch (err) {
      console.error('Failed to fetch pricing', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  // --- Create ---
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.price || !createForm.durationDays) return;
    setCreating(true);
    try {
      await admin.createSubscriptionPlan({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        price: Number(createForm.price),
        durationDays: Number(createForm.durationDays),
        isActive: createForm.isActive,
      });
      setShowCreateForm(false);
      setCreateForm({ name: '', description: '', price: '', durationDays: '30', isActive: true, displayOrder: '0' });
      showAlert('success', 'Plan created successfully');
      fetchPricing();
    } catch (err: any) {
      showAlert('error', err.message || 'Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  // --- Edit ---
  const openEditModal = (plan: any) => {
    setEditPlan(plan);
    setEditForm({
      name: plan.name || '',
      description: plan.description || '',
      price: String(plan.price ?? ''),
      durationDays: String(plan.durationDays ?? ''),
      isActive: plan.isActive !== false,
      displayOrder: String(plan.displayOrder ?? 0),
    });
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlan) return;
    setSaving(true);
    try {
      await admin.updateSubscriptionPlan(editPlan.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price: Number(editForm.price),
        durationDays: Number(editForm.durationDays),
        isActive: editForm.isActive,
        displayOrder: Number(editForm.displayOrder),
      });
      setEditPlan(null);
      showAlert('success', 'Plan updated successfully');
      fetchPricing();
    } catch (err: any) {
      showAlert('error', err.message || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete ---
  const handleDeletePlan = async () => {
    if (!deletePlan) return;
    setDeleting(true);
    try {
      await admin.deleteSubscriptionPlan(deletePlan.id);
      setDeletePlan(null);
      showAlert('success', 'Plan deleted successfully');
      fetchPricing();
    } catch (err: any) {
      showAlert('error', err.message || 'Failed to delete plan');
    } finally {
      setDeleting(false);
    }
  };

  // --- Toggle ---
  const handleToggle = async (plan: any) => {
    setTogglingId(plan.id);
    try {
      await admin.toggleSubscriptionPlan(plan.id);
      showAlert('success', `Plan ${plan.isActive !== false ? 'deactivated' : 'activated'} successfully`);
      fetchPricing();
    } catch (err: any) {
      showAlert('error', err.message || 'Failed to toggle plan status');
    } finally {
      setTogglingId(null);
    }
  };

  // --- Broadcast Notification ---
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title.trim() || !notifForm.body.trim()) return;
    setSendingNotif(true);
    try {
      await admin.broadcastNotification({
        title: notifForm.title.trim(),
        body: notifForm.body.trim(),
        target: notifForm.target,
      });
      setNotifForm({ title: '', body: '', target: 'all' });
      showAlert('success', 'Notification sent successfully');
    } catch (err: any) {
      showAlert('error', err.message || 'Failed to send notification');
    } finally {
      setSendingNotif(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Alert Toast */}
      {alert && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            alert.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions & Pricing</h1>
        <p className="mt-1 text-sm text-gray-500">Manage subscription plans, coin and pen packages</p>
      </div>

      {/* Subscription Plans */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary text-sm"
          >
            {showCreateForm ? 'Cancel' : '+ Create Plan'}
          </button>
        </div>

        {/* Create Plan Form */}
        {showCreateForm && (
          <form onSubmit={handleCreatePlan} className="card mb-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Plan Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Monthly Premium"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Price (INR) *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 99"
                  value={createForm.price}
                  onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Duration (days) *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 30"
                  value={createForm.durationDays}
                  onChange={(e) => setCreateForm({ ...createForm, durationDays: e.target.value })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Optional description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Display Order</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={createForm.displayOrder}
                  onChange={(e) => setCreateForm({ ...createForm, displayOrder: e.target.value })}
                  min="0"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </form>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricing?.subscriptions?.length > 0 ? (
            pricing.subscriptions.map((plan: any) => (
              <div key={plan.id} className={`card ${plan.isActive === false ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{plan.description || 'No description'}</p>
                  </div>
                  <span className={plan.isActive !== false ? 'badge-green' : 'badge-red'}>
                    {plan.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(plan.price)}</p>
                  <p className="text-sm text-gray-500">
                    / {plan.durationDays ? `${plan.durationDays} days` : plan.interval || 'month'}
                  </p>
                  {plan.displayOrder != null && (
                    <p className="mt-1 text-xs text-gray-400">Display order: {plan.displayOrder}</p>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="text-sm font-medium text-brand-600 hover:text-brand-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggle(plan)}
                    disabled={togglingId === plan.id}
                    className={`text-sm font-medium ${
                      plan.isActive !== false
                        ? 'text-amber-600 hover:text-amber-800'
                        : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {togglingId === plan.id
                      ? 'Toggling...'
                      : plan.isActive !== false
                        ? 'Deactivate'
                        : 'Activate'}
                  </button>
                  <button
                    onClick={() => setDeletePlan(plan)}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card col-span-full text-center text-sm text-gray-500">
              No subscription plans configured
            </div>
          )}
        </div>
      </div>

      {/* Coin Packages */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Coin Packages</h2>
        <div className="card overflow-hidden !p-0">
          {pricing?.coinPackages?.length > 0 ? (
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="table-header">Package</th>
                  <th className="table-header">Coins</th>
                  <th className="table-header">Price</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pricing.coinPackages.map((pkg: any) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-gray-900">{pkg.name}</td>
                    <td className="table-cell">{pkg.coins?.toLocaleString()}</td>
                    <td className="table-cell">{formatCurrency(pkg.price)}</td>
                    <td className="table-cell">
                      <span className={pkg.isActive !== false ? 'badge-green' : 'badge-red'}>
                        {pkg.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-gray-500">
              No coin packages configured
            </div>
          )}
        </div>
      </div>

      {/* Pen Packages */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Pen Packages</h2>
        <div className="card overflow-hidden !p-0">
          {pricing?.penPackages?.length > 0 ? (
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="table-header">Package</th>
                  <th className="table-header">Pens</th>
                  <th className="table-header">Price</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pricing.penPackages.map((pkg: any) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-gray-900">{pkg.name}</td>
                    <td className="table-cell">{pkg.pens?.toLocaleString()}</td>
                    <td className="table-cell">{formatCurrency(pkg.price)}</td>
                    <td className="table-cell">
                      <span className={pkg.isActive !== false ? 'badge-green' : 'badge-red'}>
                        {pkg.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-gray-500">
              No pen packages configured
            </div>
          )}
        </div>
      </div>

      {/* Push Notification Broadcast */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Send Push Notification</h2>
        <form onSubmit={handleSendNotification} className="card space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                className="input"
                placeholder="Notification title"
                value={notifForm.title}
                onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Target Audience *</label>
              <select
                className="input"
                value={notifForm.target}
                onChange={(e) => setNotifForm({ ...notifForm, target: e.target.value })}
              >
                <option value="all">All Users</option>
                <option value="premium">Premium Subscribers</option>
                <option value="creators">Creators</option>
                <option value="active_readers">Active Readers</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Body *</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Notification body text"
              value={notifForm.body}
              onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={sendingNotif} className="btn-primary">
              {sendingNotif ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>

      {/* Edit Plan Modal */}
      <Modal
        open={!!editPlan}
        onClose={() => setEditPlan(null)}
        title={`Edit Plan: ${editPlan?.name || ''}`}
      >
        <form onSubmit={handleUpdatePlan} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Plan Name *</label>
            <input
              type="text"
              className="input"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              className="input"
              placeholder="Optional description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Price (INR) *</label>
              <input
                type="number"
                className="input"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                min="0"
                step="1"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Duration (days) *</label>
              <input
                type="number"
                className="input"
                value={editForm.durationDays}
                onChange={(e) => setEditForm({ ...editForm, durationDays: e.target.value })}
                min="1"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Display Order</label>
              <input
                type="number"
                className="input"
                value={editForm.displayOrder}
                onChange={(e) => setEditForm({ ...editForm, displayOrder: e.target.value })}
                min="0"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditPlan(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletePlan}
        onClose={() => setDeletePlan(null)}
        title="Delete Subscription Plan"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-semibold text-gray-900">{deletePlan?.name}</span>?
            This action cannot be undone. Existing subscribers will not be affected.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeletePlan(null)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleDeletePlan}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Plan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
