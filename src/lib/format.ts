export function formatBRL(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export const priorityLabel: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const statusLabel: Record<string, string> = {
  aberta: "Aberta",
  programada: "Programada",
  em_execucao: "Em execução",
  executada: "Executada",
  concluida: "Concluída",
  cancelada: "Cancelada",
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida_obra: "Concluída",
};

export function dueDaysForPriority(priority: string) {
  switch (priority) {
    case "urgente":
      return 2;
    case "alta":
      return 7;
    case "media":
      return 15;
    default:
      return 30;
  }
}
