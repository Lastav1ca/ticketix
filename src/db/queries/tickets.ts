import { db } from "../index.js"
import { tickets } from "../schema.js"
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

export async function getTicketById(id : string){
    const [result] = await db.select(ticketColumns).from(tickets).where(eq(tickets.id, id))
    return result
}

export async function getAllTicketsByUser (userId : string){
    const result = await db.select(ticketColumns).from(tickets).where(eq(tickets.createdBy, userId)).orderBy(desc(tickets.createdAt))
    return result
}

export async function getAllTickets (){
    const result = await db.select(ticketColumns).from(tickets).orderBy(desc(tickets.createdAt))
    return result
}