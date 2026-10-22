import { maxLength, minLength } from "zod";

export const openapiSpec = {
  openapi: "3.1.0",
  info: { title: "ticketix API", version: "1.0.0", description: "A comprehensive ticketing and support API system." },
  servers: [
  { url: "https://ticketix.onrender.com", description: "Production" },
  { url: "http://localhost:3000", description: "Local" }
],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: { 
    User: {
        type: "object",
        required: ["id", "name", "email", "role", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "agent", "client"] },
          createdAt: { type: "string", format: "date-time" }
        }
      },
    Ticket: {
        type: "object",
        required: ["id", "title", "description", "status", "priority", "createdBy", "dueAt", "resolvedAt", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", minLength: 3, maxLength : 200},
          description: { type: "string", minLength : 3, maxLength : 1000 },
          status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], default: "medium" },
          dueAt: { type: ["string", "null"], format: "date-time" },
          resolvedAt: { type: ["string", "null"], format: "date-time" },
          createdBy: { type: "string", format: "uuid", description: "User ID of the creator" },
          assignedTo: { type: ["string", "null"], format: "uuid", description: "User ID of the support agent" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
    Comment: {
        type: "object",
        required: ["id", "ticketId", "body", "authorId", "createdAt", "isInternal", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          ticketId: { type: "string", format: "uuid" },
          body: { type: "string" },
          isInternal : {type : "boolean"},
          authorId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt : { type: "string", format: "date-time" }
        }
      },
    Error: { 
        type: "object", properties: { error: { type: "string" } } },
        ValidationError: {
        type: "object",
        properties: {
        error: { type: "string", example: "validation failed" },
        issues: { type: "array", items: { type: "object" } }
            }
        }
    },
    parameters: {
      TicketId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" }
      }
    },
    responses: {
      Unauthorized: {
        description: "Missing or invalid token",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      Forbidden: {
        description: "The caller's role is not allowed to do this",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      NotFound: {
        description: "Not found, or hidden from this caller",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      InvalidId: {
        description: "Malformed id or body",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      ValidationFailed: {
        description: "The body or query failed validation",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } }
      }
    }
  },
  paths: {
  "/api/auth/login": {
    post: {
      summary: "Log in and get a JWT",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email", example: "agent@test.rs" },
                password: { type: "string", example: "tajnalozinka" }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Token issued",
          content: { "application/json": { schema: {
            type: "object",
            properties: { token: { type: "string" } }
          }}}
        },
        401: {
          description: "Wrong email or password",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
        }
      }
    }
  },

  "/api/auth/register": {
    post: {
      summary: "Register a new account",
      description: "Always creates a user with the `client` role. The role cannot be set from input.",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "email", "password"],
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
                password: { type: "string", minLength: 8 }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: "Account created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
        },
        400: { $ref: "#/components/responses/ValidationFailed" },
        409: {
          description: "Email already in use",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
        }
      }
    }
  },

  "/api/auth/me": {
    get: {
      summary: "Get the logged in user",
      tags: ["Auth"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "The caller's own record",
          content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
        },
        401: { $ref: "#/components/responses/Unauthorized" }
      }
    }
  },

  "/api/tickets": {
    get: {
      summary: "List tickets",
      description: "Clients only ever see tickets they created — `createdBy` is ignored for them. Agents and admins see all tickets.",
      tags: ["Tickets"],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", schema: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] } },
        { name: "priority", in: "query", schema: { type: "string", enum: ["low", "medium", "high", "urgent"] } },
        { name: "assignedTo", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "createdBy", in: "query", schema: { type: "string", format: "uuid" }, description: "Ignored for clients" },
        { name: "overdue", in: "query", schema: { type: "boolean" }, description: "Past the deadline and not resolved" },
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } }
      ],
      responses: {
        200: {
          description: "A page of tickets",
          content: { "application/json": { schema: {
            type: "object",
            required: ["data", "page", "limit", "total"],
            properties: {
              data: { type: "array", items: { $ref: "#/components/schemas/Ticket" } },
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer", description: "Total rows matching the filters, across all pages" }
            }
          }}}
        },
        400: { $ref: "#/components/responses/ValidationFailed" },
        401: { $ref: "#/components/responses/Unauthorized" }
      }
    },
    post: {
      summary: "Create a ticket",
      description: "`dueAt` is derived from the priority: urgent 4h, high 8h, medium 24h, low 72h.",
      tags: ["Tickets"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "description"],
              properties: {
                title: { type: "string", minLength: 3, maxLength: 200, example: "Server nedostupan" },
                description: { type: "string", minLength: 3, maxLength: 1000, example: "Produkcija ne odgovara od 9h." },
                priority: { type: "string", enum: ["low", "medium", "high", "urgent"], default: "medium" }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: "Ticket created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Ticket" } } }
        },
        400: { $ref: "#/components/responses/ValidationFailed" },
        401: { $ref: "#/components/responses/Unauthorized" }
      }
    }
  },

  "/api/tickets/{id}": {
    get: {
      summary: "Get one ticket",
      description: "A client asking for someone else's ticket gets 404, not 403 — a 403 would confirm the ticket exists.",
      tags: ["Tickets"],
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/TicketId" }],
      responses: {
        200: {
          description: "The ticket",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Ticket" } } }
        },
        400: { $ref: "#/components/responses/InvalidId" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" }
      }
    }
  },

  "/api/tickets/{id}/status": {
    patch: {
      summary: "Change a ticket's status",
      description: "Agents and admins only. Allowed transitions: open → in_progress/closed, in_progress → resolved/closed, resolved → closed/in_progress. `resolvedAt` is set on the move to `resolved`, cleared on re-opening, and kept when a resolved ticket is closed.",
      tags: ["Tickets"],
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/TicketId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: { status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] } }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Updated ticket",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Ticket" } } }
        },
        400: { $ref: "#/components/responses/InvalidId" },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { $ref: "#/components/responses/Forbidden" },
        404: { $ref: "#/components/responses/NotFound" },
        409: {
          description: "The transition is not allowed from the current status",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
        }
      }
    }
  },

  "/api/tickets/{id}/assign": {
    patch: {
      summary: "Assign a ticket to an agent",
      tags: ["Tickets"],
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/TicketId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["assignedTo"],
              properties: { assignedTo: { type: "string", format: "uuid" } }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Updated ticket",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Ticket" } } }
        },
        400: { $ref: "#/components/responses/InvalidId" },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { $ref: "#/components/responses/Forbidden" },
        404: { $ref: "#/components/responses/NotFound" }
      }
    }
  },

  "/api/tickets/{id}/comments": {
    get: {
      summary: "List a ticket's comments",
      description: "Internal comments are filtered out for clients.",
      tags: ["Comments"],
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/TicketId" }],
      responses: {
        200: {
          description: "Comments, oldest first",
          content: { "application/json": { schema: {
            type: "array",
            items: { $ref: "#/components/schemas/Comment" }
          }}}
        },
        400: { $ref: "#/components/responses/InvalidId" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" }
      }
    },
    post: {
      summary: "Add a comment",
      description: "Only agents and admins may set `isInternal`. Closed tickets cannot be commented on.",
      tags: ["Comments"],
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/TicketId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["body"],
              properties: {
                body: { type: "string", minLength: 3, maxLength: 2000, example: "Proverili smo logove, restart je u toku." },
                isInternal: { type: "boolean", default: false }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: "Comment created",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Comment" } } }
        },
        400: { $ref: "#/components/responses/ValidationFailed" },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: {
          description: "A client tried to post an internal comment",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
        },
        404: { $ref: "#/components/responses/NotFound" },
        409: {
          description: "The ticket is closed",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
        }
      }
    }
  },

  "/api/users": {
    get: {
      summary: "List all users",
      description: "Admins only.",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Users, ordered by email",
          content: { "application/json": { schema: {
            type: "array",
            items: { $ref: "#/components/schemas/User" }
          }}}
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { $ref: "#/components/responses/Forbidden" }
      }
    }
  },

  "/api/users/{id}/role": {
    patch: {
      summary: "Change a user's role",
      description: "Admins only, and an admin cannot change their own role.",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["role"],
              properties: { role: { type: "string", enum: ["client", "agent", "admin"] } }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Updated user",
          content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
        },
        400: { $ref: "#/components/responses/InvalidId" },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { $ref: "#/components/responses/Forbidden" },
        404: { $ref: "#/components/responses/NotFound" }
      }
    }
  },

  "/healthz": {
    get: {
      summary: "Liveness probe",
      tags: ["Meta"],
      responses: {
        200: {
          description: "The service is up",
          content: { "application/json": { schema: {
            type: "object",
            properties: { status: { type: "string", example: "ok" } }
          }}}
        }
      }
    }
  }
}
}