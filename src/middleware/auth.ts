import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import jwt, { JwtPayload } from "jsonwebtoken"
import { error } from "node:console";


export const requireAuth = (req : Request, res : Response, next : NextFunction) : void => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith(`Bearer `)) { 
        res.status(401).json({error : 'Unauthorized : No token provided'})
        return
    }

    try{
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload
        req.user = {id : decoded.sub as string, role : decoded.role}
        next()
    }catch(err){
        res.status(401).json({error : 'Unauthorized : Token couldn\'t be verified'})
    }
}