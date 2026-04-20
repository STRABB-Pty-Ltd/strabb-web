export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 p-sm flex min-h-screen items-center justify-center">{children}</div>
  );
}
