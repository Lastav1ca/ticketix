import express, { type Express, type Request, type Response } from 'express';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/error.js';

const app : Express = express();

app.use(express.json()) 

app.get('/healthz', (req, res) => {
  res.json({ status : 'ok' });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use('/api/auth', authRouter)

app.use(errorHandler)

export default app