export type NavItem = {
  label: string;
  href: string;
};

export const navItems: readonly NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Create Book', href: '/books/new' },
  { label: 'Profiles', href: '/profiles' },
  { label: 'Settings', href: '/settings' },
];
