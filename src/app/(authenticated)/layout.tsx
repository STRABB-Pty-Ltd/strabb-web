import { NewAppShell } from "@/components/shell/app-shell";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <NewAppShell>{children}</NewAppShell>;
}
