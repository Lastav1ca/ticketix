import { NextFunction, Request, Response } from "express";
import { ConflictError, NotFoundError, UnauthorizedError } from "../errors.js";

export const errorHandler = (err : Error, req : Request, res : Response, next : NextFunction) : void => {
    if (err instanceof ConflictError){
        res.status(409).json({error : err.message})
    }else if (err instanceof NotFoundError){
        res.status(404).json({error : err.message})
    }else if (err instanceof UnauthorizedError){
        res.status(401).json({error : err.message})
    }else{
        console.error(err)
        res.status(500).json({error : 'Internal server error'})
    }
}