import {comments} from '../schema.js'
import { db } from '../index.js'
import { asc, eq } from 'drizzle-orm'

export async function selectCommentById(id : string){
    const [result] = await db.select().from(comments).where(eq(comments.id, id))
    return result
}

export async function insertComment(ticketId : string, authorId : string, body : string, isInternal : boolean){
    const [result] = await db.insert(comments).values({
        ticketId,
        authorId,
        body,
        isInternal
    }).returning({
        id : comments.id,
        ticketId : comments.ticketId,
        authorId : comments.authorId,
        body : comments.body,
        isInternal : comments.isInternal,
        createdAt : comments.createdAt,
        updatedAt : comments.updatedAt
    })
    return result
}

export async function selectCommentsByTicketId(ticketId : string){
    const result = await db.select().from(comments).where(eq(comments.ticketId, ticketId)).orderBy(asc(comments.createdAt))
    return result
}