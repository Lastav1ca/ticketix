import { selectTickets, insertTicket, selectTicketById, updateTicketStatus, updateTicketAssignee } from "../db/queries/tickets.js";
import { selectUserById } from "../db/queries/users.js";
import type { Role, TicketPriority, TicketStatus } from "../db/schema.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError} from "../errors.js";

const priorityDeadlines : Record<TicketPriority, number> = { //hours
    low : 72,
    medium : 24,
    high : 8,
    urgent : 4
}

const allowed: Record<TicketStatus, TicketStatus[]> = {
    open:        ["in_progress", "closed"],
    in_progress: ["resolved", "closed"],
    resolved:    ["closed", "in_progress"],
    closed:      [],
    }

export type TicketFilters = {
  status?: TicketStatus
  priority?: TicketPriority
  assignedTo?: string
  createdBy? : string
  page: number
  limit: number
  overdue? : boolean
}

function getDeadlineDate(priority : TicketPriority) : Date{
    return new Date(Date.now() + priorityDeadlines[priority] * 60 * 60 * 1000)
}

export async function listTickets(userId : string, role : Role, filters : TicketFilters){

    const createdBy = role === "client" ? userId : filters.createdBy
    const tickets = await selectTickets({...filters, createdBy})
    return tickets

}

export async function createTicket(title : string, description : string, createdBy : string, priority : TicketPriority){
    
    const dueAt = getDeadlineDate(priority)
    const ticket = await insertTicket(title, description, createdBy, priority, dueAt)
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

    let resolvedAt = ticket.resolvedAt
    if (status === 'resolved'){
        resolvedAt = new Date()
    }else if (status === 'in_progress'){
        resolvedAt = null
    }

    const updatedTicket = await updateTicketStatus(ticketId, status, resolvedAt)

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

