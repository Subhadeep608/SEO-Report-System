import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";

export default function DashboardLayout({ title, roleLabel, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500 font-display text-xs font-bold text-white">
              A.D
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold leading-none text-ink">{title}</h1>
              <p className="mt-0.5 text-xs text-ink/40">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink/70">{user?.name}</span>
            <Button variant="ghost" onClick={logout} className="!py-1.5">
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
