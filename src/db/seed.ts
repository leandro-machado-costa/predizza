import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { addMonths, formatISO } from "date-fns";
import { db } from "./index";
import {
  aiSuggestions,
  buildings,
  documents,
  forecastItems,
  invitations,
  maintenancePlans,
  memberships,
  occurrenceEvents,
  occurrences,
  quoteRequests,
  systems,
  users,
  whatsappEvents,
  works,
} from "./schema";
import { rebuildForecast } from "../lib/forecast";

async function main() {
  const passwordHash = await bcrypt.hash("prediza123", 10);

  // reset demo (dev only)
  db.delete(forecastItems).run();
  db.delete(maintenancePlans).run();
  db.delete(works).run();
  db.delete(occurrenceEvents).run();
  db.delete(whatsappEvents).run();
  db.delete(aiSuggestions).run();
  db.delete(quoteRequests).run();
  db.delete(invitations).run();
  db.delete(occurrences).run();
  db.delete(documents).run();
  db.delete(systems).run();
  db.delete(memberships).run();
  db.delete(users).run();
  db.delete(buildings).run();

  const [building] = db
    .insert(buildings)
    .values({
      slug: "palmeiras",
      name: "Residencial Palmeiras",
      address: "Rua das Palmeiras, 120 — Florianópolis/SC",
      onboardingDone: 1,
    })
    .returning()
    .all();

  const [building2] = db
    .insert(buildings)
    .values({
      slug: "jardins",
      name: "Condomínio Jardins",
      address: "Av. Beira Mar, 900 — Florianópolis/SC",
      onboardingDone: 1,
    })
    .returning()
    .all();

  const seededUsers = db
    .insert(users)
    .values([
      {
        email: "sindico@prediza.demo",
        name: "Ana Síndica",
        passwordHash,
      },
      {
        email: "tecnico@prediza.demo",
        name: "Carlos Técnico",
        passwordHash,
      },
      {
        email: "construtora@prediza.demo",
        name: "Marina Construtora",
        passwordHash,
      },
    ])
    .returning()
    .all();

  const sindico = seededUsers.find((u) => u.email.startsWith("sindico"))!;
  const tecnico = seededUsers.find((u) => u.email.startsWith("tecnico"))!;
  const construtora = seededUsers.find((u) =>
    u.email.startsWith("construtora"),
  )!;

  db.insert(memberships)
    .values([
      { userId: sindico.id, buildingId: building.id, role: "sindico" },
      { userId: tecnico.id, buildingId: building.id, role: "tecnico" },
      {
        userId: construtora.id,
        buildingId: building.id,
        role: "construtora",
      },
      {
        userId: construtora.id,
        buildingId: building2.id,
        role: "construtora",
      },
    ])
    .run();

  db.insert(systems)
    .values({
      buildingId: building2.id,
      name: "Elevadores",
      category: "elevadores",
      locationLabel: "Torre única",
      periodicityMonths: 1,
      nextDueAt: formatISO(addMonths(new Date(), 2), { representation: "date" }),
      estimatedCost: 2600,
      warrantyUntil: formatISO(addMonths(new Date(), 12), {
        representation: "date",
      }),
    })
    .run();

  const now = new Date();
  const systemRows = db
    .insert(systems)
    .values([
      {
        buildingId: building.id,
        name: "Elevadores",
        category: "elevadores",
        locationLabel: "Torre — hall / casa de máquinas",
        specs: "2 elevadores social + 1 serviço",
        warrantyUntil: formatISO(addMonths(now, 18), {
          representation: "date",
        }),
        periodicityMonths: 1,
        nextDueAt: formatISO(addMonths(now, 1), { representation: "date" }),
        estimatedCost: 2800,
        mapX: 0,
        mapY: 12,
        mapZ: -1.2,
      },
      {
        buildingId: building.id,
        name: "Bombas de recalque",
        category: "bombas",
        locationLabel: "Subsolo — casa de bombas",
        specs: "2 bombas 5 CV + reservatório inferior",
        warrantyUntil: formatISO(addMonths(now, 8), { representation: "date" }),
        periodicityMonths: 3,
        nextDueAt: formatISO(addMonths(now, 1), { representation: "date" }),
        estimatedCost: 1500,
        mapX: -2.5,
        mapY: -1.2,
        mapZ: 0,
      },
      {
        buildingId: building.id,
        name: "Fachada",
        category: "fachada",
        locationLabel: "Edifício inteiro",
        specs: "Revestimento cerâmico + peitoris",
        warrantyUntil: formatISO(addMonths(now, 30), {
          representation: "date",
        }),
        periodicityMonths: 36,
        nextDueAt: formatISO(addMonths(now, 20), { representation: "date" }),
        estimatedCost: 180000,
        mapX: 9.2,
        mapY: 14,
        mapZ: 0,
      },
      {
        buildingId: building.id,
        name: "SPDA",
        category: "spda",
        locationLabel: "Cobertura",
        specs: "Sistema de proteção contra descargas atmosféricas",
        warrantyUntil: formatISO(addMonths(now, 6), { representation: "date" }),
        periodicityMonths: 12,
        nextDueAt: formatISO(addMonths(now, 2), { representation: "date" }),
        estimatedCost: 4200,
        mapX: 4,
        mapY: 28.5,
        mapZ: 2,
      },
      {
        buildingId: building.id,
        name: "Reservatório superior",
        category: "reservatorio",
        locationLabel: "Cobertura",
        specs: "Caixa 20.000 L",
        warrantyUntil: formatISO(addMonths(now, 12), {
          representation: "date",
        }),
        periodicityMonths: 6,
        nextDueAt: formatISO(addMonths(now, 4), { representation: "date" }),
        estimatedCost: 3500,
        mapX: -4,
        mapY: 28.5,
        mapZ: 2,
      },
    ])
    .returning()
    .all();

  const elev = systemRows.find((s) => s.category === "elevadores")!;
  const bombas = systemRows.find((s) => s.category === "bombas")!;
  const fachada = systemRows.find((s) => s.category === "fachada")!;

  db.insert(documents)
    .values([
      {
        buildingId: building.id,
        systemId: elev.id,
        title: "Manual dos elevadores",
        kind: "manual",
        notes: "Entrega digital da construtora",
        uploadedBy: construtora.id,
      },
      {
        buildingId: building.id,
        systemId: bombas.id,
        title: "Memorial hidráulico",
        kind: "memorial",
        notes: "Plantas e memorial descritivo",
        uploadedBy: construtora.id,
      },
      {
        buildingId: building.id,
        title: "Habite-se e garantias",
        kind: "garantia",
        notes: "Pacote de garantias por sistema",
        uploadedBy: construtora.id,
      },
    ])
    .run();

  db.insert(maintenancePlans)
    .values([
      {
        buildingId: building.id,
        systemId: elev.id,
        title: "Manutenção mensal dos elevadores",
        periodicityMonths: 1,
        nextDueAt: formatISO(addMonths(now, 1), { representation: "date" }),
        estimatedCost: 2800,
        notes: "Alinhado à NBR 5674",
      },
      {
        buildingId: building.id,
        systemId: bombas.id,
        title: "Inspeção trimestral das bombas",
        periodicityMonths: 3,
        nextDueAt: formatISO(addMonths(now, 1), { representation: "date" }),
        estimatedCost: 1500,
      },
    ])
    .run();

  db.insert(works)
    .values([
      {
        buildingId: building.id,
        systemId: fachada.id,
        title: "Revisão de juntas e impermeabilização da fachada",
        kind: "reforma",
        status: "planejada",
        startAt: formatISO(addMonths(now, 20), { representation: "date" }),
        estimatedCost: 180000,
        responsible: "Empresa a contratar",
        notes: "NBR 16280 — prever reserva em assembleia",
      },
    ])
    .run();

  db.insert(occurrences)
    .values([
      {
        buildingId: building.id,
        systemId: bombas.id,
        code: "OC-0001",
        title: "Ruído anormal na bomba 2",
        description: "Morador relatou vibração no subsolo.",
        status: "aberta",
        priority: "alta",
        dueAt: formatISO(addMonths(now, 0), { representation: "date" }),
        authorId: sindico.id,
        assigneeId: tecnico.id,
        mapX: 1.5,
        mapY: 0.5,
        mapZ: -2,
      },
      {
        buildingId: building.id,
        systemId: elev.id,
        code: "OC-0002",
        title: "Porta do elevador social emperrando",
        description: "Falha intermitente no 7º andar.",
        status: "em_execucao",
        priority: "media",
        dueAt: formatISO(addMonths(now, 0), { representation: "date" }),
        authorId: sindico.id,
        assigneeId: tecnico.id,
        mapX: -1.2,
        mapY: 8,
        mapZ: 0.5,
      },
      {
        buildingId: building.id,
        systemId: bombas.id,
        code: "OC-0003",
        title: "Infiltração no teto da garagem",
        description:
          "Mancha de umidade no concreto do teto da garagem, junto à tubulação. Relato + foto do morador via WhatsApp (confirmado pela síndica).\n\nFoto: /demo/infiltracao-garagem.jpeg",
        status: "aberta",
        priority: "alta",
        dueAt: formatISO(addMonths(now, 0), { representation: "date" }),
        authorId: sindico.id,
        assigneeId: tecnico.id,
        source: "whatsapp",
        mapX: -2.2,
        mapY: -0.8,
        mapZ: 0.3,
      },
    ])
    .run();

  const oc3 = db
    .select()
    .from(occurrences)
    .where(eq(occurrences.code, "OC-0003"))
    .get();
  if (oc3) {
    db.insert(occurrenceEvents)
      .values([
        {
          occurrenceId: oc3.id,
          authorId: sindico.id,
          type: "criacao",
          note: "Confirmada a partir do WhatsApp (João) — foto da infiltração",
        },
        {
          occurrenceId: oc3.id,
          authorId: sindico.id,
          type: "comentario",
          note: "Foto: /demo/infiltracao-garagem.jpeg",
        },
      ])
      .run();
  }

  await rebuildForecast(building.id);
  await rebuildForecast(building2.id);

  const check = db.select().from(buildings).where(eq(buildings.id, building.id)).get();
  console.log("Seed OK:", check?.name, "+ Condomínio Jardins (portfólio)");
  console.log("Logins: sindico@prediza.demo / tecnico@prediza.demo / construtora@prediza.demo");
  console.log("Senha: prediza123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
