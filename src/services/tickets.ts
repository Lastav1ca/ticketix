import { getAllTicketsByUser, getAllTickets, insertTicket } from "../db/queries/tickets.js";
import type { Role } from "../db/schema.js";

export async function listTickets(userId : string, role : Role){

    if (role === "client"){
        const tickets = await getAllTicketsByUser(userId)
        return tickets
    }else{
        const tickets = await getAllTickets()
        return tickets
    }
}

export async function createTicket(title : string, description : string, createdBy : string){
    
    const ticket = await insertTicket(title, description, createdBy)
    return ticket

}