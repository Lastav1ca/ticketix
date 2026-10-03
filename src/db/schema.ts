import { pgTable, timestamp, uuid, text, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["client", "agent", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  createdAt: timestamp("created_at", {withTimezone : true}).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", {withTimezone : true})
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role : roleEnum("role").notNull().default("client"),
});