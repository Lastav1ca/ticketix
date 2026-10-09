import { selectAllTicketsByUser, selectAllTickets, insertTicket, selectTicketById } from "../db/queries/tickets.js";
import type { Role } from "../db/schema.js";
import { NotFoundError} from "../errors.js";

export async function listTickets(userId : string, role : Role){

    if (role === "client"){
        const tickets = await selectAllTicketsByUser(userId)
        return tickets
    }else{
        const tickets = await selectAllTickets()
        return tickets
    }
}

export async function createTicket(title : string, description : string, createdBy : string){
    
    const ticket = await insertTicket(title, description, createdBy)
    return ticket

}

export async function getTicketById(ticketId : string, userId : string, role : Role){
    
    const ticket = await selectTicketById(ticketId)

    if (!ticket) { throw new NotFoundError('ticket not found')}

    if (ticket.createdBy !== userId
        && role !== "admin"
        && role !== "agent"
    ) { throw new NotFoundError('ticket not found')}

    return ticket

}