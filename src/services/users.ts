import { selectAllUsers } from "../db/queries/users.js";
import { Role } from "../db/schema.js";
import { ForbiddenError } from "../errors.js";

export async function listUsers(role : Role){
    if (role !== 'admin'){
        throw new ForbiddenError('user info is for admins only')
    }

    const users = await selectAllUsers()
    return users
}