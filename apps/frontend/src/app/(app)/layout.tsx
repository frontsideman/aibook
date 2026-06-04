import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/app-shell/AppShell";

export default function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard mode="authenticated">
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
