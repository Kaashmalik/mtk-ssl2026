import { pgTable, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users, userRoleEnum } from "./users";
import { tenants } from "./tenants";

/**
 * User-Tenant Roles junction table.
 *
 * Replaces the single `users.role` + `users.tenant_ids` design.
 * Each row maps one user to one tenant with a specific role.
 *
 * A user who is a `league_owner` in Tenant A and a `scorer` in Tenant B
 * will have two rows here.
 */
export const userTenantRoles = pgTable("user_tenant_roles", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default("fan"),
  /** True if this is the user's primary/default tenant */
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserTenantRole = typeof userTenantRoles.$inferSelect;
export type NewUserTenantRole = typeof userTenantRoles.$inferInsert;
