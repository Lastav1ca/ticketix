import { listAllTicketsByUser, listAllTickets } from "../db/queries/tickets.js";
import type { Role } from "../db/schema.js";

export async function listTickets(userId : string, role : Role){

    if (role === "client"){
        const tickets = await listAllTicketsByUser(userId)
        return tickets
    }else{
        const tickets = await listAllTickets()
        return tickets
    }
}