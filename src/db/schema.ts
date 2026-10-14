import { pgTable, timestamp, uuid, text, pgEnum, boolean } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["client", "agent", "admin"]);
export type Role = typeof roleEnum.enumValues[number]
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"])
export type TicketPriority = typeof ticketPriorityEnum.enumValues[number]
export const ticketStatusEnum = pgEnum("ticket_status", ['open', 'in_progress', 'resolved', 'closed'])
export type TicketStatus = typeof ticketStatusEnum.enumValues[number]

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

export const tickets = pgTable("tickets", {
  id : uuid("id").primaryKey().notNull().defaultRandom(),
  title : text("title").notNull(),
  description : text("description").notNull(),
  status : ticketStatusEnum("status").notNull().default("open"),
  priority : ticketPriorityEnum("priority").notNull().default("medium"),
  createdBy : uuid("created_by").notNull().references(() => users.id),
  assignedTo : uuid("assigned_to").references(() => users.id, {onDelete : "set null"}), // can be null while ticket isnt assigned
  createdAt : timestamp("created_at", {withTimezone : true}).notNull().defaultNow(),
  updatedAt : timestamp("updated_at", {withTimezone : true})
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date())
});

export const comments = pgTable("comments", {
  id : uuid("id").primaryKey().notNull().defaultRandom(),
  ticketId : uuid("ticket_id").notNull().references(() => tickets.id),
  authorId : uuid("id").references(() => users.id),
  body : text("body").notNull(),
  isInternal : boolean("is_internal").notNull().default(false),
  createdAt : timestamp("created_at", {withTimezone : true}).notNull().defaultNow(),
  updatedAt : timestamp("updated_at", {withTimezone : true})
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date())
})