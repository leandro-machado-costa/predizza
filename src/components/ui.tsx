import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 animate-fade-up">
        <div className="mb-2 h-1 w-10 rounded-full bg-accent/80" aria-hidden />
        <h1 className="display text-[1.85rem] leading-[1.15] tracking-tight sm:text-3xl md:text-[2.5rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-muted sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="shrink-0 animate-fade-up" style={{ animationDelay: "0.08s" }}>
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-line/60 bg-card/90 p-4 elev-1 sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "ok";
}) {
  const toneClass =
    tone === "warn"
      ? "border-accent-2/25 bg-gradient-to-br from-accent-2-container/80 to-card"
      : tone === "ok"
        ? "border-accent/20 bg-gradient-to-br from-accent-container/70 to-card"
        : "border-line/50 bg-gradient-to-br from-card to-surface-2/40";
  return (
    <Card className={`${toneClass} !shadow-none relative overflow-hidden`}>
      <div
        className={`absolute left-0 top-0 h-full w-1 ${
          tone === "warn" ? "bg-accent-2" : tone === "ok" ? "bg-accent" : "bg-line"
        }`}
        aria-hidden
      />
      <p className="pl-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="display mt-2 pl-2 text-2xl sm:text-[1.85rem]">{value}</p>
      {hint ? <p className="mt-1.5 pl-2 text-sm text-muted">{hint}</p> : null}
    </Card>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-12 touch-target items-center justify-center rounded-[var(--radius-md)] bg-accent px-6 text-sm font-semibold text-on-accent elev-1 transition duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--accent)_92%,white)] active:translate-y-0 disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-12 touch-target items-center justify-center rounded-[var(--radius-md)] border border-line bg-card/70 px-5 text-sm font-semibold text-accent transition duration-200 hover:border-accent/30 hover:bg-accent-container/40 disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground/85">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-[var(--radius-md)] border border-line/80 bg-card px-3.5 py-3 text-base outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15";

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-lg)] border border-dashed border-line bg-surface-2/50 px-4 py-12 text-center text-sm text-muted">
      {children}
    </p>
  );
}

export function TextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold text-accent underline-offset-4 transition hover:underline"
    >
      {children}
    </Link>
  );
}

export function Chip({
  children,
  active = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-9 items-center rounded-[var(--radius-sm)] px-3.5 text-sm font-medium transition ${
        active
          ? "bg-accent text-on-accent"
          : "bg-surface-2 text-foreground hover:bg-accent-container/60"
      } ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
