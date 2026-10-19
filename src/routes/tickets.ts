import { Router, Request, Response } from "express";
import { listTickets, createTicket, getTicketById, changeTicketStatus, changeTicketAssignee } from "../services/tickets.js";
import { requireAuth } from "../middleware/auth.js";
import { assigneeIdSchema, ticketIdSchema, ticketQuerySchema, ticketSchema, updateStatusSchema } from "../schemas/tickets.js";
import {z} from "zod"
import { commentSchema } from "../schemas/comments.js";
import { createComment, listComments } from "../services/comments.js";

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth)

ticketsRouter.get('/', async (req : Request, res : Response) => {
    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}

    const filters = ticketQuerySchema.safeParse(req.query)

    if (!filters.success) {return res.status(400).json({"error" : "validation failed", "issues" : filters.error.issues})}

    const tickets = await listTickets(req.user.id, req.user.role, filters.data)

    return res.status(200).json(tickets)
})

ticketsRouter.post('/', async (req : Request, res : Response) => {
    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}
    
    const result = ticketSchema.safeParse(req.body)
    if (!result.success) { return res.status(400).json({"error" : "validation failed", "issues" : result.error.issues})}

    const ticket = await createTicket(result.data.title, result.data.description, req.user.id)
    res.status(201).json(ticket)
})

ticketsRouter.get('/:id', async (req : Request, res : Response) => {
    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}

    const parsed = z.uuid().safeParse(req.params.id)
    if (!parsed.success) { return res.status(400).json({error : 'Invalid ticket id'})}

    const ticket = await getTicketById(parsed.data, req.user.id, req.user.role)

    res.status(200).json(ticket)
})

ticketsRouter.patch('/:id/status', async (req : Request, res : Response) => {

    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}

    const parsedId = ticketIdSchema.safeParse(req.params.id)
    const parsedBody = updateStatusSchema.safeParse(req.body)

    if (!parsedId.success) { return res.status(400).json({error : 'Invalid ticket id'})}
    if (!parsedBody.success) { return res.status(400).json({error : 'Invalid status'})}

    const ticket = await changeTicketStatus(parsedId.data, parsedBody.data.status, req.user.role)

    res.status(200).json(ticket)

})

ticketsRouter.patch('/:id/assign', async (req : Request, res : Response) => {
    
    if (!req.user) {return res.status(401).json({error : 'unauthorized'})}

    const parsedId = ticketIdSchema.safeParse(req.params.id)
    const parsedBody = assigneeIdSchema.safeParse(req.body)

    if (!parsedId.success) { return res.status(400).json({error : 'Invalid ticket id'})}
    if (!parsedBody.success) { return res.status(400).json({error : 'Invalid assignee id'})}

    const ticket = await changeTicketAssignee(parsedId.data, parsedBody.data.assignedTo, req.user.role)

    res.status(200).json(ticket)
})

// comments

ticketsRouter.post('/:id/comments', async (req : Request, res: Response) => {
    if (!req.user) { return res.status(401).json({error : 'unauthorized'})}

    const parsedId = ticketIdSchema.safeParse(req.params.id)
    const parsedComment = commentSchema.safeParse(req.body)
    if (!parsedId.success) { return res.status(400).json({error : 'Invalid ticket id'})}
    if (!parsedComment.success) { return res.status(400).json({error : 'Invalid comment body'})}

    const comment = await createComment(parsedId.data, req.user.id, req.user.role, parsedComment.data.body, parsedComment.data.isInternal)
    res.status(201).json(comment)
})

ticketsRouter.get('/:id/comments', async (req : Request, res : Response) => {
    if (!req.user) { return res.status(401).json({error : 'unauthorized'})}

    const parsedId = ticketIdSchema.safeParse(req.params.id)
    if (!parsedId.success) { return res.status(400).json({error : 'Invalid ticket id'})}


    const comments = await listComments(parsedId.data, req.user.id, req.user.role)
    res.status(200).json(comments)
});