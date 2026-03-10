'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  User,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronDown,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { authUtils } from '@/lib/auth';
import { userAPI } from '@/lib/api';

const sidebarItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    public: false,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
    public: false,
  },
  {
    label: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
    public: false,
  },
];

const adminItems = [
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: Shield,
    admin: true,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = authUtils.getToken();
    setIsLoggedIn(!!token);

    if (token) {
      const user = authUtils.getUser();
      setIsAdmin(user?.role === 'admin');
      
      // Fetch user profile
      const fetchProfile = async () => {
        try {
          const response = await userAPI.getProfile();
          setUserName(response.data.name);
          setUserEmail(response.data.email);
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }
      };
      
      fetchProfile();
    } else {
      // Reset state if not logged in
      setUserName('');
      setUserEmail('');
      setIsAdmin(false);
    }
  }, [pathname]);

  const handleLogout = () => {
    authUtils.logout();
    router.push('/');
    setIsOpen(false);
  };

  if (!isLoggedIn) {
    return null;
  }

  const visibleItems = sidebarItems.concat(isAdmin ? adminItems : []);

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-600">
            <Waves className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-cyan-600">Aqua Monitor</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout button */}
        <div className="border-t p-4 space-y-3">
          {/* User Profile */}
          <div className="px-3 py-2 rounded-lg bg-gray-50 truncate">
            <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-600 truncate">{userEmail}</p>
          </div>
          
          {/* Logout Button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
