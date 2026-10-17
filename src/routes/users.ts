import { Router, Request, Response } from 'express';
import { listUsers } from '../services/users.js';
import { requireAuth } from '../middleware/auth.js';

export const usersRouter = Router()

usersRouter.use(requireAuth)

usersRouter.get(('/'), async (req : Request, res : Response) => {
    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}

    const users = await listUsers(req.user.role)

    res.status(200).json(users)
})