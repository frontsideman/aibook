import type { ComponentType } from 'react';
import { BookPlus, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export const navItems: readonly NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Create Book', href: '/books/new', icon: BookPlus },
  { label: 'Profiles', href: '/profiles', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Logout', href: '/logout', icon: LogOut },
];
