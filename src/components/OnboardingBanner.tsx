import { completeSindicoOnboardingAction } from "@/app/actions/onboarding";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";

export function OnboardingBanner({
  buildingName,
  hasSystems,
}: {
  buildingName: string;
  hasSystems: boolean;
}) {
  if (hasSystems) {
    return (
      <Card className="mb-6 border border-accent/20 bg-accent-container/30">
        <h2 className="text-base font-semibold sm:text-lg">
          Edifício {buildingName} já veio preenchido
        </h2>
        <p className="mt-1 text-sm text-muted">
          A construtora (ou o seed) já montou sistemas e previsão. Confirme para
          sair do onboarding.
        </p>
        <div className="mt-4">
          <form action={completeSindicoOnboardingAction}>
            <input type="hidden" name="skip" value="1" />
            <PrimaryButton type="submit">Concluir onboarding</PrimaryButton>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border border-accent/20 bg-accent-container/30">
      <h2 className="text-base font-semibold sm:text-lg">
        Primeiros 15 minutos em {buildingName}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Monte os sistemas críticos e a primeira previsão sem planilha. A
        construtora também pode concluir isso no wizard de entrega.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <form action={completeSindicoOnboardingAction}>
          <PrimaryButton type="submit">Gerar sistemas críticos</PrimaryButton>
        </form>
        <form action={completeSindicoOnboardingAction}>
          <input type="hidden" name="skip" value="1" />
          <SecondaryButton type="submit">Pular por agora</SecondaryButton>
        </form>
      </div>
    </Card>
  );
}
