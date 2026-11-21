"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";

const desktopLinks = [
  { href: "/dashboard", label: "Início" },
  { href: "/systems", label: "Sistemas" },
  { href: "/delivery", label: "Entrega" },
  { href: "/occurrences", label: "Ocorrências" },
  { href: "/map", label: "Mapa" },
  { href: "/maintenance", label: "Preventivo" },
  { href: "/works", label: "Obras" },
  { href: "/forecast", label: "Assembleia" },
];

export function AppShell({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line/40 glass elev-1">
        <div
          className="mx-auto flex max-w-6xl items-center gap-3 px-4"
          style={{ minHeight: "var(--appbar-h)" }}
        >
          <Link href="/dashboard" className="brand-mark shrink-0 text-2xl sm:text-[1.75rem]">
            Predizza
          </Link>
          <div className="hidden h-8 w-px bg-line/70 sm:block" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {session.buildingName}
            </p>
            <p className="truncate text-[11px] text-muted sm:text-xs">
              {session.name}
              <span className="mx-1.5 text-line">·</span>
              <span className="capitalize">{session.role}</span>
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-transparent px-3 text-sm font-medium text-muted transition hover:border-line hover:bg-card hover:text-foreground"
            >
              Sair
            </button>
          </form>
        </div>

        <nav
          className="mx-auto hidden max-w-6xl gap-0.5 overflow-x-auto px-4 pb-3 no-scrollbar md:flex"
          aria-label="Navegação desktop"
        >
          {desktopLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative shrink-0 rounded-[var(--radius-sm)] px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-[calc(var(--nav-h)+var(--safe-bottom)+1.5rem)] sm:py-9 md:pb-12">
        <div className="animate-soft-in">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
