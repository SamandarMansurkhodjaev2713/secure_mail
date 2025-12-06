import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { config } from './config'
import authRoutes from './routes/auth'
import messageRoutes from './routes/messages'
import usersRoutes from './routes/users'
import sandboxRoutes from './routes/sandbox'

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: config.clientUrl, credentials: true }))
app.use(express.json())
app.use(rateLimit({ windowMs: 60_000, max: 100 }))
app.use('/uploads', express.static(path.resolve(config.uploadDir)))

app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/sandbox', sandboxRoutes)

process.on('unhandledRejection', (err) => { console.error('unhandledRejection', err) })
process.on('uncaughtException', (err) => { console.error('uncaughtException', err) })

app.listen(config.port, () => { console.log(`SecureMail backend on :${config.port}`) })
