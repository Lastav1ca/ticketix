import { Router, Request, Response } from "express";
import { listTickets, createTicket, getTicketById } from "../services/tickets.js";
import { requireAuth } from "../middleware/auth.js";
import { ticketSchema } from "../schemas/tickets.js";
import {z} from "zod"

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth)

ticketsRouter.get('/', async (req : Request, res : Response) => {
    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}
    const tickets = await listTickets(req.user.id, req.user.role)

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