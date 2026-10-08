import {db} from '../index.js'
import {users} from '../schema.js'
import { eq } from 'drizzle-orm';

export async function insertUser(name : string, email : string, passwordHash : string){
    const [result] = await db.insert(users).values({name, email, passwordHash}).returning({id : users.id, name : users.name, email : users.email, role : users.role});
    return result;
}

export async function getUserByEmail(email : string){
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
}

export async function getUserById(id : string) {
    const [result] = await db.select({
        id : users.id,
        name : users.name,
        email : users.email,
        role : users.role,
        createdAt : users.createdAt
    }).from(users).where(eq(users.id, id));
    return result;
}