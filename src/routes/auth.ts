import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.js';
import { registerSchema, loginSchema } from '../schemas/auth.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors.js';

export const authRouter = Router();

authRouter.post('/register', async (req : Request, res : Response) => {
    const result = registerSchema.safeParse(req.body)
    if (!result.success) { return res.status(400).json({"error" : "validation failed", "issues" : result.error.issues})}

    try{
        const user = await registerUser(result.data.name, result.data.email, result.data.password)
        res.status(201).json(user)
    }catch(err){
        if (err instanceof ConflictError){
            res.status(409).json({ error: err.message })
            return
        }else{
            throw err
        }
    }
});

authRouter.post('/login', async (req : Request, res : Response) => {
    const result = loginSchema.safeParse(req.body)
    if (!result.success) { return res.status(400).json({"error" : "validation failed", "issues" : result.error.issues})}
    
    try{
        const token = await loginUser(result.data.email, result.data.password)
        res.status(200).json(token)
    }catch(err){
        if (err instanceof UnauthorizedError){
            res.status(401).json({error : err.message})
        }else{
            throw err
        }
    }
});