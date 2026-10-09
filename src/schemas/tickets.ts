import {z} from "zod"
import { ticketStatusEnum } from "../db/schema.js"

export const ticketSchema = z.object({
    title : z.string().min(3).max(200),
    description : z.string().min(3).max(1000)
})

export const ticketIdSchema = z.uuid()
export const updateStatusSchema = z.object({ status: z.enum(ticketStatusEnum.enumValues) })