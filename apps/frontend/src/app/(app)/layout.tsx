import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/app-shell/AppShell";
import { HeaderProvider } from "@/components/app-shell/HeaderContext";

export default function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard mode="authenticated">
      <HeaderProvider>
        <AppShell>{children}</AppShell>
      </HeaderProvider>
    </AuthGuard>
  );
}
