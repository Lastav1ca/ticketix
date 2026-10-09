import type { Role } from "../db/schema.js";
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role }
    }
  }
}
export {}