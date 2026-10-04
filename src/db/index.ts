import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.js";
import { config } from "../config.js";

const dbUrl = config.dbUrl

const pool = new Pool({
    connectionString : dbUrl
})

export const db = drizzle(pool, { schema});