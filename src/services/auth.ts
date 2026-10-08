import argon2 from "argon2"
import jwt from "jsonwebtoken"
import { getUserByEmail, insertUser } from "../db/queries/users.js";
import { DatabaseError } from "pg";
import { ConflictError, UnauthorizedError } from "../errors.js";
import { config } from "../config.js";




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

export async function loginUser(email : string, password : string){
    const user = await getUserByEmail(email)
    if (!user) { throw new UnauthorizedError('invalid email/password combination') }

    if (await argon2.verify(user.passwordHash, password)){
        const token = jwt.sign(
            {sub : user.id, role : user.role},
            config.jwtSecret,
            {expiresIn : config.jwtSecretExpiresIn}
        )
        return {token}
    }else{
        throw new UnauthorizedError('invalid email/password combination')
    }
}