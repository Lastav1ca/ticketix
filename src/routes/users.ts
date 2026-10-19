import { Router, Request, Response } from 'express';
import { changeUserRole, listUsers } from '../services/users.js';
import { requireAuth } from '../middleware/auth.js';
import { roleChangeSchema, userIdSchema } from '../schemas/users.js';

export const usersRouter = Router()

usersRouter.use(requireAuth)

usersRouter.get(('/'), async (req : Request, res : Response) => {
    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}

    const users = await listUsers(req.user.role)

    res.status(200).json(users)
})

usersRouter.patch('/:id/role', async (req : Request, res : Response) => {
    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}

    const id = userIdSchema.safeParse(req.params.id)
    const role = roleChangeSchema.safeParse(req.body)

    if (!id.success) { return res.status(400).json({error : 'Invalid user id'})}
    if (!role.success) { return res.status(400).json({error : 'Invalid user role'})}

    const updated = await changeUserRole(id.data, role.data.role, req.user.role)

    res.status(200).json(updated)
})