"use client";

/**
 * Kitchen, waiter, admin: consistent top bar + content area on grid background.
 * Optional staffNav enables hamburger drawer with navigation and logout to /login.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, RefreshCw, History, LayoutDashboard, UtensilsCrossed } from "lucide-react";
import { clearToken } from "../lib/auth";
import { Button } from "./ui/Button";

export function StaffShell({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = "",
  toolbarClassName = "",
  contentClassName = "",
  dense = false,
  /** @type {{ variant: 'kitchen' | 'waiter' | 'admin' | 'super_admin' | 'history', onRefresh?: () => void, historyHref?: string, dashboardHref?: string, backLabel?: string } | null} */
  staffNav = null,
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const logout = () => {
    clearToken();
    setDrawerOpen(false);
    router.replace("/login");
  };

  const navLinks = [];
  if (staffNav?.variant === "kitchen") {
    navLinks.push({ href: "/kitchen", label: "Kitchen dashboard", icon: LayoutDashboard });
    navLinks.push({ href: staffNav.historyHref || "/kitchen/history", label: "Order history", icon: History });
  } else if (staffNav?.variant === "waiter") {
    navLinks.push({ href: "/waiter", label: "Waiter dashboard", icon: LayoutDashboard });
    navLinks.push({ href: staffNav.historyHref || "/waiter/history", label: "Order history", icon: History });
  } else if (staffNav?.variant === "admin") {
    navLinks.push({ href: "/admin/menu", label: "Admin dashboard", icon: LayoutDashboard });
    navLinks.push({ href: "/admin/history", label: "Order history", icon: History });
    navLinks.push({ href: "/admin/menu#admin-overview", label: "Revenue overview", icon: LayoutDashboard });
    navLinks.push({ href: "/admin/menu#admin-branding", label: "Branding & settings", icon: LayoutDashboard });
    navLinks.push({ href: "/admin/menu#admin-live-orders", label: "Live orders", icon: LayoutDashboard });
    navLinks.push({ href: "/admin/menu#admin-tables", label: "Table QR codes", icon: LayoutDashboard });
    navLinks.push({ href: "/admin/menu#admin-staff-create", label: "Staff accounts", icon: LayoutDashboard });
    navLinks.push({ href: "/admin/menu#admin-menu-editor", label: "Menu items", icon: UtensilsCrossed });
  } else if (staffNav?.variant === "super_admin") {
    navLinks.push({ href: "/super-admin", label: "Super admin", icon: LayoutDashboard });
    navLinks.push({ href: "/admin/menu", label: "Cafe admin (menu)", icon: UtensilsCrossed });
  } else if (staffNav?.variant === "history") {
    navLinks.push({
      href: staffNav.dashboardHref || "/",
      label: staffNav.backLabel || "Dashboard",
      icon: LayoutDashboard,
    });
  }

  return (
    <div className={`page-shell relative min-h-screen overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className={`relative mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 ${dense ? "py-3" : ""}`}>
        <header
          className={`mb-6 flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between ${toolbarClassName}`}
        >
          <div className="min-w-0 flex-1">
            {badge ? <div className="mb-2">{badge}</div> : null}
            {title ? (
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            ) : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:items-center">
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            {staffNav ? (
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                onClick={() => setDrawerOpen(true)}
                aria-expanded={drawerOpen}
                aria-controls="staff-nav-drawer"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </header>
        <main className={contentClassName}>{children}</main>
      </div>

      {drawerOpen && staffNav ? (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            id="staff-nav-drawer"
            className="relative flex h-full w-full max-w-sm flex-col border-l border-slate-200/80 bg-white shadow-[-12px_0_40px_-8px_rgba(15,23,42,0.18)]"
            role="dialog"
            aria-modal="true"
            aria-label="Staff navigation"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="font-display text-lg font-bold text-slate-900">Menu</span>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <li key={href + label}>
                    <Link
                      href={href}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-orange-50"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-orange-600" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-slate-200 p-4 space-y-2">
              {staffNav.onRefresh ? (
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={() => {
                    staffNav.onRefresh();
                    setDrawerOpen(false);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh data
                </Button>
              ) : null}
              <Button variant="outline" className="w-full justify-center gap-2 text-red-700 border-red-200 hover:bg-red-50" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
