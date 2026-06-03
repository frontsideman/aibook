export default function AuthGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="min-h-screen flex items-center justify-center p-6 bg-muted/20">{children}</main>;
}
