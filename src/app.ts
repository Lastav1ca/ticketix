import express, { type Express, type Request, type Response } from 'express';
import { authRouter } from './routes/auth.js';
import { ticketsRouter } from './routes/tickets.js';
import { errorHandler } from './middleware/error.js';
import { usersRouter } from './routes/users.js';
import swaggerUi from "swagger-ui-express"
import { openapiSpec } from "./docs/openapi.js"
import cors from "cors"

const app : Express = express();

app.use(express.json()) 

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))
app.use(cors())

app.get('/healthz', (req, res) => {
  res.json({ status : 'ok' });
});

app.get('/', (req: Request, res: Response) => {
  res.redirect('/api/docs')
});

app.use('/api/auth', authRouter)
app.use('/api/tickets', ticketsRouter)
app.use('/api/users', usersRouter)

app.use(errorHandler)


export default app