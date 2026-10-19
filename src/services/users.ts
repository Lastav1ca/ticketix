import { selectAllUsers, selectUserById, updateUserRole } from "../db/queries/users.js";
import { Role } from "../db/schema.js";
import { ForbiddenError, NotFoundError } from "../errors.js";

export async function listUsers(role : Role){
    if (role !== 'admin'){
        throw new ForbiddenError('user info is for admins only')
    }

    const users = await selectAllUsers()
    return users
}

export async function changeUserRole (userId : string, newRole : Role, functionCallerRole : Role, functionCallerId : string){

    if (functionCallerRole !== 'admin') { throw new ForbiddenError('only admins can change user roles')}
    
    if (functionCallerId === userId) { throw new ForbiddenError('admins cant change their own role')}

    const user = await selectUserById(userId)
    if (!user) { throw new NotFoundError('user doesnt exist')}

    const updated = await updateUserRole(userId, newRole)

    return updated
}