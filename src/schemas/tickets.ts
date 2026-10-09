import {z} from "zod"

export const ticketSchema = z.object({
    title : z.string().min(3).max(200),
    description : z.string().min(3).max(1000)
})