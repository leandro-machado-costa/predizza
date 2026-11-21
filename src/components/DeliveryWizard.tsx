"use client";

import { useMemo, useState } from "react";
import { runDeliveryWizardAction } from "@/app/actions/wizard";
import { CRITICAL_SYSTEM_TEMPLATES } from "@/lib/system-templates";
import { Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/ui";

export function DeliveryWizard() {
  const [step, setStep] = useState(1);
  const [docTitle, setDocTitle] = useState("Pacote de garantias — entrega");
  const [docNotes, setDocNotes] = useState("Handover digital da construtora");
  const [docManual, setDocManual] = useState("");
  const [docPlanta, setDocPlanta] = useState("");
  const [docMemorial, setDocMemorial] = useState("");
  const [systems, setSystems] = useState<Record<string, boolean>>(
    Object.fromEntries(CRITICAL_SYSTEM_TEMPLATES.map((t) => [t.category, true])),
  );
  const [createPlans, setCreatePlans] = useState(true);

  const selectedCount = useMemo(
    () => Object.values(systems).filter(Boolean).length,
    [systems],
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-accent" : "bg-surface-2"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-muted">
        Passo {step} de 3 — Wizard de entrega Prediza
      </p>

      <form action={runDeliveryWizardAction} className="space-y-4">
        <input type="hidden" name="docTitle" value={docTitle} />
        <input type="hidden" name="docKind" value="garantia" />
        <input type="hidden" name="docNotes" value={docNotes} />
        {docManual ? <input type="hidden" name="doc_manual" value={docManual} /> : null}
        {docPlanta ? <input type="hidden" name="doc_planta" value={docPlanta} /> : null}
        {docMemorial ? (
          <input type="hidden" name="doc_memorial" value={docMemorial} />
        ) : null}
        <input type="hidden" name="createSystems" value="on" />
        {Object.entries(systems).map(([cat, on]) =>
          on ? <input key={cat} type="hidden" name={`sys_${cat}`} value="on" /> : null,
        )}
        {createPlans ? <input type="hidden" name="createPlans" value="on" /> : null}

        {step === 1 ? (
          <div className="space-y-3">
            <h3 className="font-semibold">Documentos da entrega</h3>
            <Field label="Pacote de garantias (título)">
              <input
                className={inputClass}
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
              />
            </Field>
            <Field label="Notas">
              <textarea
                className={inputClass}
                rows={2}
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
              />
            </Field>
            <Field label="Manual de sistemas (opcional)">
              <input
                className={inputClass}
                placeholder="Ex.: Manuais elevador e bombas"
                value={docManual}
                onChange={(e) => setDocManual(e.target.value)}
              />
            </Field>
            <Field label="Plantas (opcional)">
              <input
                className={inputClass}
                placeholder="Ex.: Plantas as-built"
                value={docPlanta}
                onChange={(e) => setDocPlanta(e.target.value)}
              />
            </Field>
            <Field label="Memorial (opcional)">
              <input
                className={inputClass}
                value={docMemorial}
                onChange={(e) => setDocMemorial(e.target.value)}
              />
            </Field>
            <PrimaryButton type="button" onClick={() => setStep(2)}>
              Continuar
            </PrimaryButton>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <h3 className="font-semibold">Sistemas críticos</h3>
            <p className="text-sm text-muted">
              Marque os sistemas para gerar fichas com previsão e custo. Selecionados:{" "}
              {selectedCount}
            </p>
            {CRITICAL_SYSTEM_TEMPLATES.map((tpl) => (
              <label
                key={tpl.category}
                className="flex items-center gap-3 rounded-[var(--radius-md)] bg-surface-2 px-3 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  className="size-4"
                  checked={!!systems[tpl.category]}
                  onChange={(e) =>
                    setSystems((prev) => ({
                      ...prev,
                      [tpl.category]: e.target.checked,
                    }))
                  }
                />
                <span>
                  <strong>{tpl.name}</strong>
                  <span className="block text-muted">
                    a cada {tpl.periodicityMonths} mês(es) · ~
                    {tpl.estimatedCost.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </span>
              </label>
            ))}
            <div className="flex gap-2">
              <SecondaryButton type="button" onClick={() => setStep(1)}>
                Voltar
              </SecondaryButton>
              <PrimaryButton type="button" onClick={() => setStep(3)}>
                Continuar
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <h3 className="font-semibold">Planos e previsão</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createPlans}
                onChange={(e) => setCreatePlans(e.target.checked)}
              />
              Criar planos preventivos sugeridos (NBR 5674)
            </label>
            <p className="text-sm text-muted">
              Ao concluir, a home da síndica já mostra o que reservar — sem
              cadastro manual.
            </p>
            <div className="flex gap-2">
              <SecondaryButton type="button" onClick={() => setStep(2)}>
                Voltar
              </SecondaryButton>
              <PrimaryButton type="submit">Concluir entrega</PrimaryButton>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
