import app from "../app.js"
import request from "supertest"
import { Role } from "../db/schema.js"
import { insertUser, updateUserRole } from "../db/queries/users.js"
import argon2 from "argon2"

export const TEST_PASSWORD = "tajnalozinka"

export async function createUser(email : string, role : Role){
    const hashedPassword = await argon2.hash(TEST_PASSWORD)
    const user = await insertUser(email.split("@")[0], email, hashedPassword)
    await updateUserRole(user.id, role)
    const login = await request(app).post('/api/auth/login').send({email : email, password : TEST_PASSWORD})
    if (login.status !== 200) throw new Error(`Error logging in - ${login.status} & ${login.body}`)

    return {id: user.id, token: login.body.token}
}