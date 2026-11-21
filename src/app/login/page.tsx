import { loginAction } from "@/app/actions/auth";
import { Field, PrimaryButton, inputClass } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="relative flex min-h-dvh flex-col justify-end overflow-hidden sm:justify-center">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(160deg, rgba(12,92,72,0.88) 0%, rgba(20,24,22,0.55) 42%, transparent 70%), url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 80V0h80' fill='none' stroke='%23ffffff' stroke-opacity='0.07' stroke-width='1'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative mx-auto hidden w-full max-w-6xl flex-1 px-6 pt-16 sm:block">
        <p className="display text-5xl text-white md:text-6xl">Prediza</p>
        <p className="mt-3 max-w-md text-lg text-white/85">
          O mapa do prédio. A previsão das reformas.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 sm:pb-12">
        <div className="animate-fade-up rounded-[var(--radius-xl)] border border-line/40 bg-card/95 p-6 elev-3 sm:p-8">
          <p className="brand-mark text-3xl sm:hidden">Prediza</p>
          <p className="mt-1 text-sm text-muted sm:mt-0 sm:text-base">
            Entre para decidir o que reservar e onde agir.
          </p>
          {params.invited ? (
            <p className="mt-3 rounded-[var(--radius-sm)] bg-accent-container/60 px-3 py-2 text-sm text-accent">
              Convite aceito — faça login com sua conta.
            </p>
          ) : null}
          <form action={loginAction} className="mt-7 space-y-4">
            <Field label="E-mail">
              <input
                className={inputClass}
                name="email"
                type="email"
                autoComplete="username"
                defaultValue="sindico@prediza.demo"
                required
              />
            </Field>
            <Field label="Senha">
              <input
                className={inputClass}
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue="prediza123"
                required
              />
            </Field>
            {params.error ? (
              <p className="text-sm font-medium text-error">
                Credenciais inválidas.
              </p>
            ) : null}
            <PrimaryButton type="submit" className="w-full">
              Entrar
            </PrimaryButton>
          </form>
          <div className="mt-6 space-y-1 rounded-[var(--radius-md)] border border-line/50 bg-surface-2/60 p-3.5 text-xs text-muted">
            <p className="font-semibold text-foreground/80">Contas demo</p>
            <p>sindico@prediza.demo</p>
            <p>tecnico@prediza.demo · construtora@prediza.demo</p>
            <p>Senha: prediza123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
