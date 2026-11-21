import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { getSession } from "@/lib/auth";

export default async function MorePage() {
  const session = await getSession();
  const isConstrutora = session?.role === "construtora";

  const items = [
    {
      href: "/systems",
      title: "Sistemas",
      desc: "Fichas, garantias e próximas intervenções",
    },
    {
      href: "/delivery",
      title: "Entrega digital",
      desc: "Wizard e handover da construtora",
    },
    {
      href: "/maintenance",
      title: "Preventivo",
      desc: "Planos de manutenção (NBR 5674)",
    },
    {
      href: "/works",
      title: "Obras",
      desc: "Reformas e obras (NBR 16280)",
    },
    {
      href: "/forecast",
      title: "Assembleia",
      desc: "Previsão, PDF e export WhatsApp",
    },
    {
      href: "/ai/triage",
      title: "Triagem IA",
      desc: "Texto + foto → ocorrência",
    },
    {
      href: "/ai/plans",
      title: "Planos assistidos",
      desc: "Preventivas e alertas de padrão",
    },
    {
      href: "/whatsapp",
      title: "WhatsApp",
      desc: "Bot seletivo + fila de confirmação",
    },
    {
      href: "/digest",
      title: "Resumo semanal",
      desc: "Alertas, SLA e envio Evolution",
    },
    {
      href: "/invites",
      title: "Convites",
      desc: "Papéis do edifício",
    },
    ...(isConstrutora
      ? [
          {
            href: "/portfolio",
            title: "Portfólio",
            desc: "Edifícios, OCs e custo interno",
          },
          {
            href: "/lessons",
            title: "Lessons learned",
            desc: "Pós-obra interno + CSV",
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Mais"
        subtitle="Módulos e atalhos do edifício."
      />
      <ul className="stagger space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="block">
              <Card className="transition duration-200 hover:-translate-y-0.5 hover:border-accent/25 active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-accent-container to-surface-2 text-sm font-bold text-accent">
                    {item.title.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted">{item.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
