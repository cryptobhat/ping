import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Users,
  FolderOpen,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertTriangle,
  Globe,
} from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  const { count: categoryCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  const { count: pendingCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  const { count: acceptedCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted');
  const { count: rejectedCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');
  const { count: driveFailedCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'drive_failed');

  const statCards = [
    {
      label: 'Users',
      count: userCount || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/admin/users',
    },
    {
      label: 'Active Categories',
      count: categoryCount || 0,
      icon: FolderOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/admin/categories',
    },
    {
      label: 'Pending',
      count: pendingCount || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Accepted',
      count: acceptedCount || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Rejected',
      count: rejectedCount || 0,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Drive Failed',
      count: driveFailedCount || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage users, categories, and assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="bg-white rounded-lg border p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <Users className="w-8 h-8 text-indigo-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
            Manage Users
          </h3>
          <p className="text-sm text-gray-500 mt-1">Add users, update roles and status</p>
        </Link>
        <Link
          href="/admin/categories"
          className="bg-white rounded-lg border p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <FolderOpen className="w-8 h-8 text-indigo-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
            Manage Categories
          </h3>
          <p className="text-sm text-gray-500 mt-1">Create and manage content categories</p>
        </Link>
        <Link
          href="/admin/assignments"
          className="bg-white rounded-lg border p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <UserCheck className="w-8 h-8 text-indigo-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
            Manage Assignments
          </h3>
          <p className="text-sm text-gray-500 mt-1">Assign categories to creators</p>
        </Link>
        <Link
          href="/admin/languages"
          className="bg-white rounded-lg border p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <Globe className="w-8 h-8 text-indigo-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">Language Access</h3>
          <p className="text-sm text-gray-500 mt-1">Assign languages to creators &amp; reviewers</p>
        </Link>
      </div>
    </div>
  );
}
