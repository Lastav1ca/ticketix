import argon2 from "argon2"
import { insertUser } from "../db/queries/users.js";
import { DatabaseError } from "pg";
import { ConflictError } from "../errors.js";


export async function registerUser(name : string, email : string, password : string){
    try{
        const hash = await argon2.hash(password)
        const user = await insertUser(name, email, hash)
        return user
    }catch(err){
        if (err instanceof Error && err.cause instanceof DatabaseError && err.cause.code === "23505"){
            throw new ConflictError('email already in use')
        }
        throw err
    }
    

}