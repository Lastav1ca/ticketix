import { selectAllTicketsByUser, selectAllTickets, insertTicket, selectTicketById, updateTicketStatus, updateTicketAssignee } from "../db/queries/tickets.js";
import { selectUserById } from "../db/queries/users.js";
import type { Role, TicketStatus } from "../db/schema.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError} from "../errors.js";

const allowed: Record<TicketStatus, TicketStatus[]> = {
    open:        ["in_progress", "closed"],
    in_progress: ["resolved", "closed"],
    resolved:    ["closed", "in_progress"],
    closed:      [],
    }

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

export async function changeTicketStatus(ticketId : string, status : TicketStatus, role : Role){

    if (role !== 'admin' && role !== 'agent') { throw new ForbiddenError('only agents can change ticket status')}
    
    const ticket = await selectTicketById(ticketId)
    if (!ticket) { throw new NotFoundError('ticket not found')}

    if (!allowed[ticket.status].includes(status)) { throw new ConflictError(`cannot change status from ${ticket.status} to ${status}`)}

    const updatedTicket = await updateTicketStatus(ticketId, status)

    return updatedTicket

}

export async function changeTicketAssignee(ticketId : string, assigneeId : string, role : Role){
    if (role !== 'admin' && role !== 'agent') { throw new ForbiddenError('only agents can change who the ticket is assigned to')}

    const ticket = await selectTicketById(ticketId)
    if (!ticket) { throw new NotFoundError('ticket not found')}

    const user = await selectUserById(assigneeId)
    if (!user) { throw new NotFoundError('user doesn\'t exist')}
    if (user.role !== 'admin' && user.role !== 'agent') {throw new BadRequestError('tickets can only be assigned to agents')}

    const updatedTicket = await updateTicketAssignee(ticketId, assigneeId)

    return updatedTicket
}