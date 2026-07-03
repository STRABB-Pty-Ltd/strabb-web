// Public auth flows (forgot-password, reset-password, invite accept) share the
// same centered card shell as /login. Kept identical to src/app/login/layout.tsx
// so the emailed links land on a page that looks like the sign-in screen.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 p-sm flex min-h-screen items-center justify-center">{children}</div>
  );
}
