import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../db/index.js";

export default async function setup() {
    await migrate(db, { migrationsFolder: "./drizzle" })
    return async () => { await pool.end() }
}