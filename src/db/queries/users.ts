import {db} from '../index.js'
import {users} from '../schema.js'
import { eq } from 'drizzle-orm';

const userColumns = {
    id : users.id,
    name : users.name,
    email : users.email,
    role : users.role,
    createdAt : users.createdAt    
}

export async function insertUser(name : string, email : string, passwordHash : string){
    const [result] = await db.insert(users).values({name, email, passwordHash}).returning({id : users.id, name : users.name, email : users.email, role : users.role});
    return result;
}

export async function selectUserByEmail(email : string){
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
}

export async function selectUserById(id : string) {
    const [result] = await db.select(userColumns).from(users).where(eq(users.id, id));
    return result;
}

export async function selectAllUsers(){
    const result = await db.select(userColumns).from(users);
    return result
    }