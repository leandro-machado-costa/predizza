import { upsertSystemAction } from "@/app/actions/systems";
import { PageHeader, Card, Field, PrimaryButton, inputClass } from "@/components/ui";

export default function NewSystemPage() {
  return (
    <div>
      <PageHeader
        title="Nova ficha de sistema"
        subtitle="Cadastre um sistema do edifício com previsão e custo."
      />
      <Card>
        <form action={upsertSystemAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Nome">
            <input className={inputClass} name="name" required />
          </Field>
          <Field label="Categoria">
            <select className={inputClass} name="category" defaultValue="elevadores">
              <option value="elevadores">Elevadores</option>
              <option value="bombas">Bombas</option>
              <option value="fachada">Fachada</option>
              <option value="cobertura">Cobertura</option>
              <option value="eletrica">Elétrica</option>
              <option value="hidraulica">Hidráulica</option>
              <option value="outro">Outro</option>
            </select>
          </Field>
          <Field label="Local">
            <input className={inputClass} name="locationLabel" />
          </Field>
          <Field label="Garantia até">
            <input className={inputClass} type="date" name="warrantyUntil" />
          </Field>
          <Field label="Periodicidade (meses)">
            <input
              className={inputClass}
              type="number"
              name="periodicityMonths"
              defaultValue={12}
            />
          </Field>
          <Field label="Próxima intervenção">
            <input className={inputClass} type="date" name="nextDueAt" />
          </Field>
          <Field label="Custo estimado (R$)">
            <input
              className={inputClass}
              type="number"
              name="estimatedCost"
              defaultValue={0}
            />
          </Field>
          <Field label="Especificações">
            <textarea className={inputClass} name="specs" rows={3} />
          </Field>
          <div className="md:col-span-2">
            <PrimaryButton type="submit">Salvar ficha</PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
