import { insertComment, selectCommentsByTicketId } from "../db/queries/comments.js";
import { Role } from "../db/schema.js";
import { ForbiddenError } from "../errors.js";
import { getTicketById } from "./tickets.js";

export async function createComment(ticketId : string, authorId : string, role : Role, body : string, isInternal : boolean){
    
    const ticket = await getTicketById(ticketId, authorId, role)

    if (role !== 'admin' && role !== 'agent' && isInternal) { throw new ForbiddenError('users cannot post internal comments')}

    const comment = await insertComment(ticketId, authorId, body, isInternal)

    return comment
}

export async function listComments(ticketId : string, userId : string, role : Role){
    
    const comments = await selectCommentsByTicketId(ticketId)
    
    if (role == 'client') { return comments.filter((comment) => !comment.isInternal)}
    return comments
}