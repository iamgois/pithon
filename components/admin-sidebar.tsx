"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  Squares2X2Icon,
  UsersIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Squares2X2Icon },
  { href: "/admin/leads", label: "Leads", icon: UsersIcon },
];

function SidebarContent({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border">
        <span className="font-bold text-base tracking-tight">Pithon Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <ArrowRightStartOnRectangleIcon className="size-4" />
          Sair
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 min-h-screen border-r border-border bg-card sticky top-0 self-start h-screen">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile: hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Bars3Icon className="size-5" />
      </button>

      {/* Mobile: overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border lg:hidden flex flex-col transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <XMarkIcon className="size-5" />
        </button>

        <SidebarContent
          pathname={pathname}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}
