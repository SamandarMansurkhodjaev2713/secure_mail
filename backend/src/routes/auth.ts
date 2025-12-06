import { Router } from 'express'
import { prisma } from '../services/prisma'
import bcrypt from 'bcrypt'
import { sign, verify, type Secret, type SignOptions } from 'jsonwebtoken'
import { config } from '../config'
import { z } from 'zod'
import { requireAuth } from '../middlewares/auth'
import { authenticator } from 'otplib'

const router = Router()

router.post('/login', async (req, res) => {
  const schema = z.object({
    login: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(4),
    otp: z.string().min(6).max(6).optional()
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const user = await prisma.user.findFirst({ where: { OR: [{ login: parsed.data.login }, { email: parsed.data.email }] } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  if (user.twoFASecret) {
    if (!parsed.data.otp) return res.status(401).json({ error: 'OTP required' })
    const valid = authenticator.verify({ token: parsed.data.otp, secret: user.twoFASecret })
    if (!valid) return res.status(401).json({ error: 'Invalid OTP' })
  }
  const accessToken = sign({ userId: user.id }, config.jwtSecret as Secret, { expiresIn: config.jwtExpiresIn } as SignOptions)
  const refreshToken = sign({ userId: user.id }, config.refreshSecret as Secret, { expiresIn: config.refreshExpiresIn } as SignOptions)
  res.json({ accessToken, refreshToken, user: { id: user.id, login: user.login, email: user.email, name: user.name, role: user.role } })
})

router.post('/logout', async (_req, res) => { res.json({ ok: true }) })

router.post('/refresh', async (req, res) => {
  const schema = z.object({ refreshToken: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  try {
    const payload = verify(parsed.data.refreshToken, config.refreshSecret) as { userId: string }
    const token = sign({ userId: payload.userId }, config.jwtSecret as Secret, { expiresIn: config.jwtExpiresIn } as SignOptions)
    res.json({ accessToken: token })
  } catch { res.status(401).json({ error: 'Unauthorized' }) }
})

router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'Unauthorized' })
    const token = auth.replace('Bearer ', '')
    const payload = verify(token, config.jwtSecret) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json({ id: user.id, login: user.login, email: user.email, name: user.name })
  } catch { res.status(401).json({ error: 'Unauthorized' }) }
})

router.post('/register', async (req, res) => {
  const schema = z.object({
    login: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
    email: z.string().email(),
    name: z.string().min(2).max(64),
    password: z.string().min(4).max(128),
    role: z.enum(['USER', 'ADMIN']).optional()
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })

  // Permission: if self-registration disabled, require admin
  let requesterRole: 'USER' | 'ADMIN' | null = null
  if (!config.allowSelfRegistration) {
    try {
      const auth = req.headers.authorization
      if (!auth) return res.status(403).json({ error: 'Forbidden' })
      const token = auth.replace('Bearer ', '')
      const payload = verify(token, config.jwtSecret) as { userId: string }
      const me = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (!me || me.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })
      requesterRole = me.role as 'ADMIN'
    } catch { return res.status(401).json({ error: 'Unauthorized' }) }
  }

  const { login, email, name, password, role } = parsed.data
  const exists = await prisma.user.findFirst({ where: { OR: [{ login }, { email }] } })
  if (exists) return res.status(409).json({ error: 'User already exists' })
  const hash = await bcrypt.hash(password, 10)
  const finalRole: 'USER' | 'ADMIN' = requesterRole === 'ADMIN' && role === 'ADMIN' ? 'ADMIN' : (role === 'USER' ? 'USER' : 'USER')
  const user = await prisma.user.create({ data: { login, email, name, passwordHash: hash, role: finalRole } })
  res.status(201).json({ id: user.id, login: user.login, email: user.email, name: user.name, role: user.role })
})

router.post('/2fa/setup', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const secret = authenticator.generateSecret()
  const otpAuth = authenticator.keyuri(user.email, 'SecureMail', secret)
  await prisma.user.update({ where: { id: userId }, data: { twoFATempSecret: secret } })
  res.json({ secret, otpAuth })
})

router.post('/2fa/verify', requireAuth, async (req, res) => {
  const schema = z.object({ token: z.string().min(6).max(6) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const userId = (req as any).userId as string
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.twoFATempSecret) return res.status(400).json({ error: 'Setup not started' })
  const ok = authenticator.verify({ token: parsed.data.token, secret: user.twoFATempSecret })
  if (!ok) return res.status(401).json({ error: 'Invalid token' })
  await prisma.user.update({ where: { id: userId }, data: { twoFASecret: user.twoFATempSecret, twoFATempSecret: null } })
  res.json({ enabled: true })
})

export default router
