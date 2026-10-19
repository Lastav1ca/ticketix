import { db } from "./index.js";
import { users, tickets, Role, TicketStatus, TicketPriority } from "./schema.js";
import argon2 from "argon2"

type SeedUser = {
    name : string,
    email : string,
    password : string,
    role : Role
}

type SeedTicket = {
    title : string,
    description : string,
    status : TicketStatus,
    priority : TicketPriority,
    createdByEmail : string,
    assignedToEmail? : string,
    dueInHours? : number,
    resolvedHoursAgo? : number
}

export async function seedUsers(userRows : SeedUser[]){
    const emailId : Record<string, string> = {}
    for (const user of userRows){
        const hash = await argon2.hash(user.password)
        const [row] = await db.insert(users).values({
            name : user.name, 
            email : user.email, 
            passwordHash : hash, 
            role : user.role})
            .returning({email : users.email, id : users.id})
        emailId[row.email] = row.id
    }
    return emailId
}

export async function seedTickets(ticketRows : SeedTicket[], emailId : Record<string, string>){
    for (const ticket of ticketRows){
        const createdById = emailId[ticket.createdByEmail]
        const dueAt = ticket.dueInHours !== undefined
        ? new Date(Date.now() + ticket.dueInHours * 60 * 60 * 1000)
        : null
        const resolvedAt = ticket.resolvedHoursAgo !== undefined
        ? new Date(Date.now() - ticket.resolvedHoursAgo * 60 * 60 * 1000)
        : null
        await db.insert(tickets).values({
            title : ticket.title, 
            description : ticket.description, 
            status : ticket.status, 
            priority : ticket.priority, 
            createdBy : createdById, 
            assignedTo : ticket.assignedToEmail ? emailId[ticket.assignedToEmail] : null,
            dueAt : dueAt,
            resolvedAt : resolvedAt})
    }
}

async function main(){
    await db.delete(tickets)
    await db.delete(users)

    const emailId = await seedUsers([
  { name: "Admin",        email: "admin@test.rs",  password: "tajnalozinka", role: "admin"  },
  { name: "Ana Agent",    email: "agent@test.rs",  password: "tajnalozinka", role: "agent"  },
  { name: "Petar Agent",  email: "agent2@test.rs", password: "tajnalozinka", role: "agent"  },
  { name: "Marko Marković", email: "marko@test.rs", password: "tajnalozinka", role: "client" },
  { name: "Jovana Jović", email: "jovana@test.rs", password: "tajnalozinka", role: "client" },
    ])

    await seedTickets([
  { title: "Ne mogu da se ulogujem", description: "Posle promene lozinke prijava vraća grešku 401.",
    status: "open", priority: "high", createdByEmail: "marko@test.rs", dueInHours : 2},

  { title: "Štampač ne radi", description: "Mrežni štampač u kancelariji 2 ne prihvata zadatke.",
    status: "open", priority: "low", createdByEmail: "marko@test.rs", dueInHours : 28},

  { title: "Aplikacija se zamrzava", description: "Pri otvaranju izveštaja aplikacija prestaje da reaguje.",
    status: "in_progress", priority: "urgent", createdByEmail: "jovana@test.rs", assignedToEmail: "agent@test.rs", dueInHours : -2 },

  { title: "Zahtev za novi nalog", description: "Potreban nalog za novog kolegu iz računovodstva.",
    status: "in_progress", priority: "medium", createdByEmail: "jovana@test.rs", assignedToEmail: "agent2@test.rs", dueInHours : 5},

  { title: "Email ne stiže", description: "Poruke sa eksternih adresa ne dolaze od juče.",
    status: "resolved", priority: "high", createdByEmail: "marko@test.rs", assignedToEmail: "agent@test.rs", dueInHours : -5, resolvedHoursAgo : 6},

  { title: "Pogrešan datum u izveštaju", description: "Mesečni izveštaj prikazuje prošli mesec.",
    status: "closed", priority: "low", createdByEmail: "jovana@test.rs", assignedToEmail: "agent@test.rs", dueInHours : -10, resolvedHoursAgo : 2},
    ], emailId)

    console.log("seeding done")
    process.exit(0)
}

await main()