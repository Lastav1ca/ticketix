import { TicketFilters } from "../../services/tickets.js"
import { db } from "../index.js"
import { TicketPriority, tickets, TicketStatus } from "../schema.js"
import { and, count, desc, eq } from "drizzle-orm"

const ticketColumns = {
        id : tickets.id,
        title : tickets.title,
        description : tickets.description,
        status : tickets.status,
        priority : tickets.priority,
        dueAt : tickets.dueAt,
        resolvedAt : tickets.resolvedAt,
        createdBy : tickets.createdBy,
        assignedTo : tickets.assignedTo,
        createdAt : tickets.createdAt,
        updatedAt : tickets.updatedAt,
    }

export async function insertTicket(title : string, description : string, createdBy : string, priority : TicketPriority, dueAt : Date){
    const [result] = await db.insert(tickets).values({title, description, createdBy, priority, dueAt}).returning(ticketColumns)
    return result;
}

export async function selectTicketById(id : string){
    const [result] = await db.select(ticketColumns).from(tickets).where(eq(tickets.id, id))
    return result
}

function buildConditions(filters: TicketFilters) {
  const conditions = []
  if (filters.createdBy) conditions.push(eq(tickets.createdBy, filters.createdBy))
  if (filters.status) conditions.push(eq(tickets.status, filters.status))
  if (filters.priority) conditions.push(eq(tickets.priority, filters.priority))
  if (filters.assignedTo) conditions.push(eq(tickets.assignedTo, filters.assignedTo))
  return conditions
}

export async function selectTickets (filters : TicketFilters){
    const conditions = buildConditions(filters)

    const result = await db.select(ticketColumns).from(tickets)
    .where(and(...conditions))
    .orderBy(desc(tickets.createdAt))
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit)

    const ticketCount = await countTickets(filters)

    return {data : result, page : filters.page, limit : filters.limit, total : ticketCount}
}

export async function countTickets (filters : TicketFilters){
    const conditions = buildConditions(filters)

    const [row] = await db.select({ total: count() }).from(tickets).where(and(...conditions))

    return row.total
}


export async function updateTicketStatus(id : string, status : TicketStatus){
    const [result] = await db.update(tickets).set({status}).where(eq(tickets.id, id)).returning(ticketColumns)
    return result
}

export async function updateTicketAssignee(ticketId : string, assigneeId : string){
    const [result] = await db.update(tickets).set({assignedTo : assigneeId}).where(eq(tickets.id, ticketId)).returning(ticketColumns)
    return result
}