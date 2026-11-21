import { relations, sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const roles = [
  "construtora",
  "sindico",
  "gestor",
  "tecnico",
  "fornecedor",
] as const;
export type Role = (typeof roles)[number];

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const buildings = sqliteTable("buildings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  onboardingDone: integer("onboarding_done").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const memberships = sqliteTable("memberships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  role: text("role").notNull().$type<Role>(),
});

export const systems = sqliteTable("systems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  locationLabel: text("location_label"),
  specs: text("specs"),
  warrantyUntil: text("warranty_until"),
  periodicityMonths: integer("periodicity_months").default(12),
  nextDueAt: text("next_due_at"),
  estimatedCost: real("estimated_cost").default(0),
  mapX: real("map_x").default(0),
  mapY: real("map_y").default(0),
  mapZ: real("map_z").default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  systemId: integer("system_id").references(() => systems.id),
  title: text("title").notNull(),
  kind: text("kind").notNull(),
  notes: text("notes"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const occurrenceStatuses = [
  "aberta",
  "programada",
  "em_execucao",
  "executada",
  "concluida",
  "cancelada",
] as const;
export type OccurrenceStatus = (typeof occurrenceStatuses)[number];

export const priorities = ["baixa", "media", "alta", "urgente"] as const;
export type Priority = (typeof priorities)[number];

export const occurrences = sqliteTable("occurrences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  systemId: integer("system_id").references(() => systems.id),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().$type<OccurrenceStatus>().default("aberta"),
  priority: text("priority").notNull().$type<Priority>().default("media"),
  dueAt: text("due_at"),
  authorId: integer("author_id").references(() => users.id),
  assigneeId: integer("assignee_id").references(() => users.id),
  mapX: real("map_x").default(0),
  mapY: real("map_y").default(0),
  mapZ: real("map_z").default(0),
  /** Campos internos — só construtora (não exibir ao síndico) */
  internalRootCause: text("internal_root_cause"),
  internalCost: real("internal_cost"),
  internalNotes: text("internal_notes"),
  source: text("source").default("app"),
  /** Fechamento: aviso ao grupo (foto + texto) */
  resolutionNote: text("resolution_note"),
  resolutionPhotoPath: text("resolution_photo_path"),
  resolutionNotifiedAt: text("resolution_notified_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const invitations = sqliteTable("invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().$type<Role>(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  invitedBy: integer("invited_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const aiSuggestions = sqliteTable("ai_suggestions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  kind: text("kind").notNull(),
  inputText: text("input_text"),
  resultJson: text("result_json").notNull(),
  status: text("status").notNull().default("pending"),
  imagePath: text("image_path"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const quoteRequests = sqliteTable("quote_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  systemId: integer("system_id").references(() => systems.id),
  title: text("title").notNull(),
  scope: text("scope"),
  status: text("status").notNull().default("rascunho"),
  /** Proposta do fornecedor — para comparar no mesmo escopo */
  supplierName: text("supplier_name"),
  amount: real("amount"),
  validUntil: text("valid_until"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const whatsappEvents = sqliteTable("whatsapp_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  groupName: text("group_name"),
  authorName: text("author_name"),
  body: text("body").notNull(),
  classification: text("classification").notNull(),
  matchedOccurrenceId: integer("matched_occurrence_id").references(
    () => occurrences.id,
  ),
  status: text("status").notNull().default("pending"),
  /** Evolution: chat/grupo e id da mensagem de origem */
  remoteJid: text("remote_jid"),
  messageId: text("message_id"),
  instanceName: text("instance_name"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const occurrenceEvents = sqliteTable("occurrence_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  occurrenceId: integer("occurrence_id")
    .notNull()
    .references(() => occurrences.id),
  authorId: integer("author_id").references(() => users.id),
  type: text("type").notNull(),
  note: text("note"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const maintenancePlans = sqliteTable("maintenance_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  systemId: integer("system_id")
    .notNull()
    .references(() => systems.id),
  title: text("title").notNull(),
  periodicityMonths: integer("periodicity_months").notNull().default(6),
  nextDueAt: text("next_due_at"),
  estimatedCost: real("estimated_cost").default(0),
  notes: text("notes"),
});

export const maintenanceRuns = sqliteTable("maintenance_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id")
    .notNull()
    .references(() => maintenancePlans.id),
  executedAt: text("executed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  cost: real("cost").default(0),
  notes: text("notes"),
  executedBy: integer("executed_by").references(() => users.id),
});

export const works = sqliteTable("works", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  systemId: integer("system_id").references(() => systems.id),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("reforma"),
  status: text("status").notNull().default("planejada"),
  startAt: text("start_at"),
  endAt: text("end_at"),
  estimatedCost: real("estimated_cost").default(0),
  responsible: text("responsible"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const forecastItems = sqliteTable("forecast_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  systemId: integer("system_id").references(() => systems.id),
  source: text("source").notNull(),
  title: text("title").notNull(),
  dueAt: text("due_at").notNull(),
  estimatedCost: real("estimated_cost").default(0),
  urgency: text("urgency").notNull().default("planejado"),
});

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const buildingsRelations = relations(buildings, ({ many }) => ({
  memberships: many(memberships),
  systems: many(systems),
  documents: many(documents),
  occurrences: many(occurrences),
}));
