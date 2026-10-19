import {z} from "zod"
import { ticketPriorityEnum, ticketStatusEnum } from "../db/schema.js"

export const ticketSchema = z.object({
    title : z.string().min(3).max(200),
    description : z.string().min(3).max(1000)
})

export const ticketIdSchema = z.uuid()
export const updateStatusSchema = z.object({ status: z.enum(ticketStatusEnum.enumValues) })

export const assigneeIdSchema = z.object({ assignedTo: z.uuid() })

export const ticketQuerySchema = z.object({
    status : z.enum(ticketStatusEnum.enumValues).optional(),
    priority : z.enum(ticketPriorityEnum.enumValues).optional(),
    assignedTo : z.uuid().optional(),
    createdBy : z.uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
})