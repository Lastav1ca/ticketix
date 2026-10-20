import { describe, it, expect, beforeEach } from "vitest"
import request from "supertest"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import app from "../app.js"
import { db } from "../db/index.js"
import { tickets } from "../db/schema.js"
import { clearDb, createUser } from "../test/helpers.js"
import { createTicket } from "../services/tickets.js"

const HOUR = 60 * 60 * 1000

describe('GET /api/tickets', ()=> {
    beforeEach(clearDb)

    it('dobavlja tikete samo koji pripadaju klijentu', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const nemanja = await createUser('nemanja@gmail.com', 'client')

        const ticketMarko = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')
        await createTicket('NemanjinTicket', 'Drugi ticket', nemanja.id, 'medium')

        const ticketiMarko = await request(app).get('/api/tickets').set('Authorization', `Bearer ${marko.token}`)
        expect(ticketiMarko.status).toBe(200)
        expect(ticketiMarko.body.total).toBe(1)
        expect(ticketiMarko.body.data[0].id).toBe(ticketMarko.id)
    })

    it('ignorise tudji createdBy filter kada ga posalje klijent', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const nemanja = await createUser('nemanja@gmail.com', 'client')

        const ticketMarko = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')
        await createTicket('NemanjinTicket', 'Drugi ticket', nemanja.id, 'medium')

        const res = await request(app)
            .get(`/api/tickets?createdBy=${nemanja.id}`)
            .set('Authorization', `Bearer ${marko.token}`)

        expect(res.status).toBe(200)
        expect(res.body.total).toBe(1)
        expect(res.body.data[0].id).toBe(ticketMarko.id)
    })

    it('agent vidi tikete svih korisnika', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const nemanja = await createUser('nemanja@gmail.com', 'client')
        const agent = await createUser('agent@gmail.com', 'agent')

        await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')
        await createTicket('NemanjinTicket', 'Drugi ticket', nemanja.id, 'medium')

        const res = await request(app).get('/api/tickets').set('Authorization', `Bearer ${agent.token}`)
        expect(res.body.total).toBe(2)
    })

    it('overdue=true vraca samo neresene tikete sa prosaolim rokom', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const agent = await createUser('agent@gmail.com', 'agent')

        const probijen = await createTicket('Probijen', 'Rok prosao', marko.id, 'urgent')
        const uRoku = await createTicket('U roku', 'Rok nije prosao', marko.id, 'low')
        const resen = await createTicket('Resen', 'Rok prosao ali je resen', marko.id, 'urgent')

        // rok u proslost gura samo direktan upis - servis ga uvek racuna u buducnost
        await db.update(tickets).set({dueAt : new Date(Date.now() - 2 * HOUR)}).where(eq(tickets.id, probijen.id))
        await db.update(tickets).set({dueAt : new Date(Date.now() - 2 * HOUR), status : 'resolved', resolvedAt : new Date()}).where(eq(tickets.id, resen.id))

        const res = await request(app).get('/api/tickets?overdue=true').set('Authorization', `Bearer ${agent.token}`)

        expect(res.status).toBe(200)
        expect(res.body.total).toBe(1)
        expect(res.body.data[0].id).toBe(probijen.id)
        expect(res.body.data.map((t : {id : string}) => t.id)).not.toContain(uRoku.id)
    })

    it('vraca 401 bez tokena', async () => {
        const res = await request(app).get('/api/tickets')
        expect(res.status).toBe(401)
    })

    it('vraca 400 za nevalidan query parametar', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const res = await request(app).get('/api/tickets?limit=500').set('Authorization', `Bearer ${marko.token}`)
        expect(res.status).toBe(400)
    })
})

describe('POST /api/tickets', () => {
    beforeEach(clearDb)

    it('racuna dueAt iz prioriteta urgent (4h)', async () => {
        const marko = await createUser('marko@gmail.com', 'client')

        const res = await request(app).post('/api/tickets')
            .set('Authorization', `Bearer ${marko.token}`)
            .send({title : 'Server pao', description : 'Produkcija nedostupna', priority : 'urgent'})

        expect(res.status).toBe(201)
        const diff = new Date(res.body.dueAt).getTime() - Date.now()
        expect(diff).toBeGreaterThan(3.9 * HOUR)
        expect(diff).toBeLessThan(4.1 * HOUR)
    })

    it('podrazumevani prioritet je medium sa rokom od 24h', async () => {
        const marko = await createUser('marko@gmail.com', 'client')

        const res = await request(app).post('/api/tickets')
            .set('Authorization', `Bearer ${marko.token}`)
            .send({title : 'Mis ne radi', description : 'Levi klik ne reaguje'})

        expect(res.status).toBe(201)
        expect(res.body.priority).toBe('medium')
        const diff = new Date(res.body.dueAt).getTime() - Date.now()
        expect(diff).toBeGreaterThan(23.9 * HOUR)
        expect(diff).toBeLessThan(24.1 * HOUR)
    })

    it('novi tiket nema resolvedAt', async () => {
        const marko = await createUser('marko@gmail.com', 'client')

        const res = await request(app).post('/api/tickets')
            .set('Authorization', `Bearer ${marko.token}`)
            .send({title : 'Nesto ne radi', description : 'Opis problema'})

        expect(res.body.resolvedAt).toBeNull()
    })

    it('vraca 400 za nepostojeci prioritet', async () => {
        const marko = await createUser('marko@gmail.com', 'client')

        const res = await request(app).post('/api/tickets')
            .set('Authorization', `Bearer ${marko.token}`)
            .send({title : 'Test naslov', description : 'Test opis', priority : 'kriticno'})

        expect(res.status).toBe(400)
    })
})

describe('PATCH /api/tickets/:id/status', () => {
    beforeEach(clearDb)

    it('klijent ne sme da menja status', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).patch(`/api/tickets/${ticket.id}/status`)
            .set('Authorization', `Bearer ${marko.token}`)
            .send({status : 'in_progress'})

        expect(res.status).toBe(403)
    })

    it('vraca 409 za nevalidan prelaz open -> resolved', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const agent = await createUser('agent@gmail.com', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).patch(`/api/tickets/${ticket.id}/status`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({status : 'resolved'})

        expect(res.status).toBe(409)
    })

    it('postavlja resolvedAt pri prelazu u resolved i ne menja ga pri zatvaranju', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const agent = await createUser('agent@gmail.com', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        await request(app).patch(`/api/tickets/${ticket.id}/status`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({status : 'in_progress'})

        const resolved = await request(app).patch(`/api/tickets/${ticket.id}/status`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({status : 'resolved'})

        expect(resolved.status).toBe(200)
        expect(resolved.body.resolvedAt).not.toBeNull()

        const closed = await request(app).patch(`/api/tickets/${ticket.id}/status`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({status : 'closed'})

        expect(closed.status).toBe(200)
        expect(closed.body.resolvedAt).toBe(resolved.body.resolvedAt)
    })

    it('brise resolvedAt kada se tiket ponovo otvori', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const agent = await createUser('agent@gmail.com', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        await request(app).patch(`/api/tickets/${ticket.id}/status`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({status : 'in_progress'})
        await request(app).patch(`/api/tickets/${ticket.id}/status`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({status : 'resolved'})

        const reopened = await request(app).patch(`/api/tickets/${ticket.id}/status`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({status : 'in_progress'})

        expect(reopened.status).toBe(200)
        expect(reopened.body.resolvedAt).toBeNull()
    })
})

describe('GET /api/tickets/:id', () => {
    beforeEach(clearDb)

    it('klijent dobija svoj tiket', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).get(`/api/tickets/${ticket.id}`)
            .set('Authorization', `Bearer ${marko.token}`)

        expect(res.status).toBe(200)
        expect(res.body.id).toBe(ticket.id)
    })

    it('klijent dobija 404 za tudji tiket', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const nemanja = await createUser('nemanja@gmail.com', 'client')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).get(`/api/tickets/${ticket.id}`)
            .set('Authorization', `Bearer ${nemanja.token}`)

        expect(res.status).toBe(404)
    })

    it('agent dobija tudji tiket', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const agent = await createUser('agent@gmail.com', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).get(`/api/tickets/${ticket.id}`)
            .set('Authorization', `Bearer ${agent.token}`)

        expect(res.status).toBe(200)
    })

    it('vraca 404 za nepostojeci tiket', async () => {
        const agent = await createUser('agent@gmail.com', 'agent')

        const res = await request(app).get(`/api/tickets/${randomUUID()}`)
            .set('Authorization', `Bearer ${agent.token}`)

        expect(res.status).toBe(404)
    })

    it('vraca 400 za nevalidan uuid', async () => {
        const agent = await createUser('agent@gmail.com', 'agent')

        const res = await request(app).get('/api/tickets/nijeuuid')
            .set('Authorization', `Bearer ${agent.token}`)

        expect(res.status).toBe(400)
    })
})

describe('PATCH /api/tickets/:id/assign', () => {
    beforeEach(clearDb)

    it('agent dodeljuje tiket drugom agentu', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const agent = await createUser('agent@gmail.com', 'agent')
        const agent2 = await createUser('agent2@gmail.com', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).patch(`/api/tickets/${ticket.id}/assign`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({assignedTo : agent2.id})

        expect(res.status).toBe(200)
        expect(res.body.assignedTo).toBe(agent2.id)
    })

    it('klijent ne sme da dodeljuje tikete', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const agent = await createUser('agent@gmail.com', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).patch(`/api/tickets/${ticket.id}/assign`)
            .set('Authorization', `Bearer ${marko.token}`)
            .send({assignedTo : agent.id})

        expect(res.status).toBe(403)
    })

    it('vraca 400 kada assignedTo nije uuid', async () => {
        const marko = await createUser('marko@gmail.com', 'client')
        const agent = await createUser('agent@gmail.com', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).patch(`/api/tickets/${ticket.id}/assign`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({assignedTo : 'nijeuuid'})

        expect(res.status).toBe(400)
    })
})
