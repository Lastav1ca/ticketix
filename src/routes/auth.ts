import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.js';
import { registerSchema, loginSchema } from '../schemas/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { getUserById } from '../db/queries/users.js';

export const authRouter = Router();

authRouter.post('/register', async (req : Request, res : Response) => {
    const result = registerSchema.safeParse(req.body)
    if (!result.success) { return res.status(400).json({"error" : "validation failed", "issues" : result.error.issues})}

    const user = await registerUser(result.data.name, result.data.email, result.data.password)
    res.status(201).json(user)

});

authRouter.post('/login', async (req : Request, res : Response) => {
    const result = loginSchema.safeParse(req.body)
    if (!result.success) { return res.status(400).json({"error" : "validation failed", "issues" : result.error.issues})}
    

    const token = await loginUser(result.data.email, result.data.password)
    res.status(200).json(token)

});

authRouter.get('/me', requireAuth, async (req : Request, res : Response) => {
    if (!req.user) {return res.status(401).json({error : 'Unauthorized!'})}
    
    const user = await getUserById(req.user.id)

    if (!user){
        return res.status(404).json({error : 'User not found'})
    }

    return res.status(200).json(user)
});