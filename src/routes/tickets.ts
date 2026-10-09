import { Router, Request, Response } from "express";
import { listTickets } from "../services/tickets.js";
import { requireAuth } from "../middleware/auth.js";

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth)

ticketsRouter.get('/', async (req : Request, res : Response) => {
    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}
    const tickets = await listTickets(req.user.id, req.user.role)

    return res.status(200).json(tickets)
})