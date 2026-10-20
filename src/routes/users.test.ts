import { describe, it, expect, beforeEach } from "vitest"
import request from "supertest"
import { randomUUID } from "node:crypto"
import app from "../app.js"
import { clearDb, createUser } from "../test/helpers.js"

describe('GET /api/users', () => {
    beforeEach(clearDb)

    it('admin dobija listu svih korisnika', async () => {
        const admin = await createUser('admin@test.rs', 'admin')
        await createUser('marko@test.rs', 'client')

        const res = await request(app).get('/api/users').set('Authorization', `Bearer ${admin.token}`)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(2)
    })

    it('ne vraca passwordHash', async () => {
        const admin = await createUser('admin@test.rs', 'admin')

        const res = await request(app).get('/api/users').set('Authorization', `Bearer ${admin.token}`)

        expect(res.body[0].passwordHash).toBeUndefined()
    })

    it('agent dobija 403', async () => {
        const agent = await createUser('agent@test.rs', 'agent')

        const res = await request(app).get('/api/users').set('Authorization', `Bearer ${agent.token}`)

        expect(res.status).toBe(403)
    })

    it('klijent dobija 403', async () => {
        const marko = await createUser('marko@test.rs', 'client')

        const res = await request(app).get('/api/users').set('Authorization', `Bearer ${marko.token}`)

        expect(res.status).toBe(403)
    })

    it('vraca 401 bez tokena', async () => {
        const res = await request(app).get('/api/users')

        expect(res.status).toBe(401)
    })
})

describe('PATCH /api/users/:id/role', () => {
    beforeEach(clearDb)

    it('admin menja rolu klijentu u agenta', async () => {
        const admin = await createUser('admin@test.rs', 'admin')
        const marko = await createUser('marko@test.rs', 'client')

        const res = await request(app).patch(`/api/users/${marko.id}/role`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({role : 'agent'})

        expect(res.status).toBe(200)
        expect(res.body.role).toBe('agent')
    })

    it('admin ne sme da menja svoju rolu', async () => {
        const admin = await createUser('admin@test.rs', 'admin')

        const res = await request(app).patch(`/api/users/${admin.id}/role`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({role : 'agent'})

        expect(res.status).toBe(403)
    })

    it('agent ne sme da menja role', async () => {
        const agent = await createUser('agent@test.rs', 'agent')
        const marko = await createUser('marko@test.rs', 'client')

        const res = await request(app).patch(`/api/users/${marko.id}/role`)
            .set('Authorization', `Bearer ${agent.token}`)
            .send({role : 'admin'})

        expect(res.status).toBe(403)
    })

    it('vraca 404 za nepostojeceg korisnika', async () => {
        const admin = await createUser('admin@test.rs', 'admin')

        const res = await request(app).patch(`/api/users/${randomUUID()}/role`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({role : 'agent'})

        expect(res.status).toBe(404)
    })

    it('vraca 400 za nevalidan uuid', async () => {
        const admin = await createUser('admin@test.rs', 'admin')

        const res = await request(app).patch('/api/users/nijeuuid/role')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({role : 'agent'})

        expect(res.status).toBe(400)
    })

    it('vraca 400 za nepostojecu rolu', async () => {
        const admin = await createUser('admin@test.rs', 'admin')
        const marko = await createUser('marko@test.rs', 'client')

        const res = await request(app).patch(`/api/users/${marko.id}/role`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({role : 'superadmin'})

        expect(res.status).toBe(400)
    })
})
