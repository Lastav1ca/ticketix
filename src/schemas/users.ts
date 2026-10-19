import {z} from "zod"
import { roleEnum } from "../db/schema.js";

export const roleChangeSchema = z.object({
    role : z.enum(roleEnum.enumValues)
});

export const userIdSchema = z.uuid()