"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primary = [
  {
    href: "/dashboard",
    label: "Início",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.5 12 4.5l9 9M5.25 11.25V19.5h4.5v-4.5h4.5V19.5h4.5v-8.25"
      />
    ),
  },
  {
    href: "/map",
    label: "Mapa",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75V19.5m0-12.75L3.75 4.5v12.75L9 19.5m0-12.75 6-2.25m0 0V16.5m0-12.75L20.25 6v12.75L15 16.5"
      />
    ),
  },
  {
    href: "/occurrences",
    label: "Ocorrências",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m0 3.75h.008v.008H12V16.5Zm9-4.5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    href: "/forecast",
    label: "Assembleia",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 3.75V10.5H20.25"
      />
    ),
  },
  {
    href: "/more",
    label: "Mais",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm6 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm6 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 md:hidden"
      style={{ paddingBottom: "max(0.5rem, var(--safe-bottom))" }}
      aria-label="Navegação principal"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 rounded-[var(--radius-xl)] border border-line/50 glass p-1.5 elev-2">
        {primary.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-1 text-[10px] font-semibold transition ${
                  active
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-surface-2/80"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden
                >
                  {item.icon}
                </svg>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
