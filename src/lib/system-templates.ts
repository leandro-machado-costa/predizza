import { addMonths, formatISO } from "date-fns";

export const CRITICAL_SYSTEM_TEMPLATES = [
  {
    name: "Elevadores",
    category: "elevadores",
    locationLabel: "Casa de máquinas / hall",
    periodicityMonths: 1,
    estimatedCost: 2800,
    warrantyMonths: 24,
  },
  {
    name: "Bombas de recalque",
    category: "bombas",
    locationLabel: "Subsolo — casa de bombas",
    periodicityMonths: 3,
    estimatedCost: 1500,
    warrantyMonths: 12,
  },
  {
    name: "Fachada",
    category: "fachada",
    locationLabel: "Edifício inteiro",
    periodicityMonths: 36,
    estimatedCost: 120000,
    warrantyMonths: 60,
  },
  {
    name: "SPDA",
    category: "spda",
    locationLabel: "Cobertura",
    periodicityMonths: 12,
    estimatedCost: 4200,
    warrantyMonths: 12,
  },
  {
    name: "Reservatório superior",
    category: "reservatorio",
    locationLabel: "Cobertura",
    periodicityMonths: 6,
    estimatedCost: 3500,
    warrantyMonths: 24,
  },
] as const;

export function templateDates(periodicityMonths: number, warrantyMonths: number) {
  const now = new Date();
  return {
    nextDueAt: formatISO(addMonths(now, Math.min(periodicityMonths, 3)), {
      representation: "date",
    }),
    warrantyUntil: formatISO(addMonths(now, warrantyMonths), {
      representation: "date",
    }),
  };
}
