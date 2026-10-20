import { describe, it, expect, beforeEach } from "vitest"
import request from "supertest"
import app from "../app.js"
import { clearDb, createUser } from "../test/helpers.js"
import { createTicket } from "../services/tickets.js"

describe('POST /api/tickets/:id/comments', () => {
    beforeEach(clearDb)

    it('klijent komentarise svoj tiket', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${marko.token}`)
            .send({body : 'Problem i dalje postoji'})

        expect(res.status).toBe(201)
        expect(res.body.isInternal).toBe(false)
    })

    it('klijent ne sme da postavi interni komentar', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${marko.token}`)
            .send({body : 'Interna napomena', isInternal : true})

        expect(res.status).toBe(403)
    })

    it('agent sme da postavi interni komentar', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const agent = await createUser('agent@test.rs', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({body : 'Proveriti logove na serveru', isInternal : true})

        expect(res.status).toBe(201)
        expect(res.body.isInternal).toBe(true)
    })

    it('klijent ne moze da komentarise tudji tiket', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const nemanja = await createUser('nemanja@test.rs', 'client')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${nemanja.token}`)
            .send({body : 'Mene ovo ne tice'})

        expect(res.status).toBe(404)
    })

    it('vraca 409 za komentar na zatvorenom tiketu', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const agent = await createUser('agent@test.rs', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        await request(app).patch(`/api/tickets/${ticket.id}/status`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({status : 'closed'})

        const res = await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${marko.token}`)
            .send({body : 'Jos jedna napomena'})

        expect(res.status).toBe(409)
    })

    it('vraca 400 za prekratko telo komentara', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${marko.token}`)
            .send({body : 'a'})

        expect(res.status).toBe(400)
    })
})

describe('GET /api/tickets/:id/comments', () => {
    beforeEach(clearDb)

    it('klijent ne vidi interne komentare', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const agent = await createUser('agent@test.rs', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({body : 'Javni odgovor klijentu'})
        await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({body : 'Interna napomena za kolege', isInternal : true})

        const res = await request(app).get(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${marko.token}`)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
        expect(res.body[0].isInternal).toBe(false)
    })

    it('agent vidi i interne komentare', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const agent = await createUser('agent@test.rs', 'agent')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({body : 'Javni odgovor klijentu'})
        await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({body : 'Interna napomena za kolege', isInternal : true})

        const res = await request(app).get(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${agent.token}`)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(2)
    })

    it('klijent ne moze da cita komentare tudjeg tiketa', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const nemanja = await createUser('nemanja@test.rs', 'client')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        await request(app).post(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${marko.token}`)
            .send({body : 'Moj komentar'})

        const res = await request(app).get(`/api/tickets/${ticket.id}/comments`)
            .set('Authorization', `Bearer ${nemanja.token}`)

        expect(res.status).toBe(404)
    })

    it('vraca 401 bez tokena', async () => {
        const marko = await createUser('marko@test.rs', 'client')
        const ticket = await createTicket('MarkovTicket', 'Prvi ticket', marko.id, 'medium')

        const res = await request(app).get(`/api/tickets/${ticket.id}/comments`)

        expect(res.status).toBe(401)
    })
})
