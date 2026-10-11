import { db } from "../index.js"
import { tickets, TicketStatus } from "../schema.js"
import { desc, eq } from "drizzle-orm"

const ticketColumns = {
        id : tickets.id,
        title : tickets.title,
        description : tickets.description,
        status : tickets.status,
        priority : tickets.priority,
        createdBy : tickets.createdBy,
        assignedTo : tickets.assignedTo,
        createdAt : tickets.createdAt,
        updatedAt : tickets.updatedAt,
    }

export async function insertTicket(title : string, description : string, createdBy : string){
    const [result] = await db.insert(tickets).values({title, description, createdBy}).returning(ticketColumns)
    return result;
}

export async function selectTicketById(id : string){
    const [result] = await db.select(ticketColumns).from(tickets).where(eq(tickets.id, id))
    return result
}

export async function selectAllTicketsByUser (userId : string){
    const result = await db.select(ticketColumns).from(tickets).where(eq(tickets.createdBy, userId)).orderBy(desc(tickets.createdAt))
    return result
}

export async function selectAllTickets (){
    const result = await db.select(ticketColumns).from(tickets).orderBy(desc(tickets.createdAt))
    return result
}

export async function updateTicketStatus(id : string, status : TicketStatus){
    const [result] = await db.update(tickets).set({status}).where(eq(tickets.id, id)).returning(ticketColumns)
    return result
}

export async function updateTicketAssignee(ticketId : string, assigneeId : string){
    const [result] = await db.update(tickets).set({assignedTo : assigneeId}).where(eq(tickets.id, ticketId)).returning(ticketColumns)
    return result
}