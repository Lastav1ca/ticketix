import { describe, it, expect, beforeEach } from "vitest"
import request from "supertest"
import app from "../app.js"
import { clearDb, createUser } from "../test/helpers.js"

describe('POST /api/auth/register', () => {
    beforeEach(clearDb)

    it('registruje korisnika 201', async () => {
        const res = await request(app).post('/api/auth/register').send({"name":"Marko","email":"agent@test.rs","password":"tajnalozinka"})
        expect(res.status).toBe(201)
        expect(res.body.id)
    })

    it('vraca 409 za postojeci email', async () => { 
        await request(app).post('/api/auth/register').send({"name":"Marko","email":"agent@test.rs","password":"tajnalozinka"})
        const res = await request(app).post('/api/auth/register').send({"name":"Marko","email":"agent@test.rs","password":"lozinkica"})
        expect(res.status).toBe(409)
    })

    it('vraca 400 za nevalidan email', async () => { 
        const res = await request(app).post('/api/auth/register').send({"name":"Marko","email":"nijedobaremail","password":"lozinkica"})
        expect(res.status).toBe(400)
    })
})

describe('POST /api/auth/login', () => {
    beforeEach(clearDb)

    it('loginovanje korisnika 200', async () => {
        await request(app).post('/api/auth/register').send({"name":"Marko","email":"agent@test.rs","password":"tajnalozinka"})
        const res = await request(app).post('/api/auth/login').send({"email":"agent@test.rs","password":"tajnalozinka"})
        expect(res.status).toBe(200)
        expect(res.body.id)
    })

    it('pogresna lozinka vraca 401', async () => {
        await request(app).post('/api/auth/register').send({"name":"Marko","email":"agent@test.rs","password":"tajnalozinka"})
        const res = await request(app).post('/api/auth/login').send({"email":"agent@test.rs","password":"nijedobra"})
        expect(res.status).toBe(401)
    })

    it('nepostojeci email vraca 401', async () => {
        await request(app).post('/api/auth/register').send({"name":"Marko","email":"agent@test.rs","password":"tajnalozinka"})
        const res = await request(app).post('/api/auth/login').send({"email":"nevazi@test.rs","password":"tajnalozinka"})
        expect(res.status).toBe(401)
    })
})

describe('GET /api/auth/me', () => {
    beforeEach(clearDb)

    it('vraca podatke prijavljenog korisnika', async () => {
        const marko = await createUser('marko@test.rs', 'client')

        const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${marko.token}`)

        expect(res.status).toBe(200)
        expect(res.body.id).toBe(marko.id)
        expect(res.body.email).toBe('marko@test.rs')
        expect(res.body.passwordHash).toBeUndefined()
    })

    it('vraca 401 bez tokena', async () => {
        const res = await request(app).get('/api/auth/me')

        expect(res.status).toBe(401)
    })

    it('vraca 401 za neispravan token', async () => {
        const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer nijetoken')

        expect(res.status).toBe(401)
    })
})