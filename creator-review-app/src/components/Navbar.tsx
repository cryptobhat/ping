'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Home, Upload, FileText, Users, FolderOpen, UserCheck, Globe, Menu, X } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  role: string;
  userEmail: string;
}

export function Navbar({ role, userEmail }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navLinks = {
    admin: [
      { href: '/admin', label: 'Dashboard', icon: Home },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
      { href: '/admin/assignments', label: 'Assignments', icon: UserCheck },
      { href: '/admin/languages', label: 'Languages', icon: Globe }
    ],
    creator: [
      { href: '/creator', label: 'Dashboard', icon: Home },
      { href: '/creator/upload', label: 'Upload', icon: Upload },
      { href: '/creator/submissions', label: 'Submissions', icon: FileText }
    ],
    reviewer: [
      { href: '/reviewer', label: 'Dashboard', icon: Home },
      { href: '/reviewer/pending', label: 'Review', icon: FileText }
    ]
  };

  const links = navLinks[role as keyof typeof navLinks] || [];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <span className="text-lg font-bold text-indigo-600 mr-4">ContentHub</span>
            <div className="hidden md:flex items-center space-x-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === link.href
                      ? 'text-indigo-700 bg-indigo-50'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <link.icon className="w-4 h-4 mr-1.5" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 uppercase">
              {role}
            </span>
            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-2 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === link.href
                    ? 'text-indigo-700 bg-indigo-50'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <link.icon className="w-4 h-4 mr-2" />
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
