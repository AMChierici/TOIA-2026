import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const navItems = [
    { to: "/", label: "Home", end: true },
    { to: "/explore", label: "Explore" },
    { to: "/about", label: "About" },
    ...(isAuthenticated ? [{ to: "/mytoia", label: "My TOIA" }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Video className="size-4" />
            </span>
            <span className="text-lg tracking-tight">TOIA</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Hi, {user?.first_name}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>

        {open && (
          <div className="border-t md:hidden">
            <nav className="container flex flex-col gap-1 py-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium",
                      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Button variant="outline" onClick={() => { setOpen(false); logout(); }}>
                    Log out
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline">
                      <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/signup" onClick={() => setOpen(false)}>Get started</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} TOIA</span>
          <span>Interactive video conversations</span>
        </div>
      </footer>
    </div>
  );
}
