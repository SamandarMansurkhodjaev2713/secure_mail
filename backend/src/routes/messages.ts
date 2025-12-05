import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../services/prisma'
import { requireAuth } from '../middlewares/auth'
import { config } from '../config'
import { z } from 'zod'
import path from 'path'
import fs from 'fs'

const router = Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(config.uploadDir, { recursive: true })
    cb(null, config.uploadDir)
  },
  filename: (_req, file, cb) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}${path.extname(file.originalname)}`
    cb(null, id)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip']
    cb(null, allowed.includes(file.mimetype))
  }
})

router.get('/', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string
  const items = await prisma.message.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    include: { attachments: true }
  })
  res.json({ items: items.map(m => ({
    id: m.id,
    subject: m.subject,
    body: m.body,
    senderId: m.senderId,
    recipientId: m.recipientId,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
    attachments: m.attachments.map(a => ({ id: a.id, filename: a.filename, mime: a.mime, size: a.size, url: `/uploads/${a.storageName}` }))
  })) })
})

router.get('/:id', requireAuth, async (req, res) => {
  const id = req.params.id
  const m = await prisma.message.findUnique({ where: { id }, include: { attachments: true } })
  if (!m) return res.status(404).json({ error: 'Not found' })
  res.json({
    id: m.id,
    subject: m.subject,
    body: m.body,
    senderId: m.senderId,
    recipientId: m.recipientId,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
    attachments: m.attachments.map(a => ({ id: a.id, filename: a.filename, mime: a.mime, size: a.size, url: `/uploads/${a.storageName}` }))
  })
})

router.post('/', requireAuth, upload.array('attachments'), async (req, res) => {
  const userId = (req as any).userId as string
  const schema = z.object({ to: z.string(), subject: z.string().min(1), body: z.string().min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const recipient = await prisma.user.findFirst({ where: { OR: [{ login: parsed.data.to }, { email: parsed.data.to }] } })
  if (!recipient) return res.status(404).json({ error: 'Recipient not found' })
  const msg = await prisma.message.create({ data: { senderId: userId, recipientId: recipient.id, subject: parsed.data.subject, body: parsed.data.body } })
  const files = (req.files as Express.Multer.File[]) || []
  for (const f of files) {
    await prisma.attachment.create({ data: { messageId: msg.id, filename: f.originalname, storageName: f.filename, mime: f.mimetype, size: f.size } })
  }
  const full = await prisma.message.findUnique({ where: { id: msg.id }, include: { attachments: true } })
  res.status(201).json({
    id: full!.id,
    subject: full!.subject,
    body: full!.body,
    senderId: full!.senderId,
    recipientId: full!.recipientId,
    createdAt: full!.createdAt.toISOString(),
    readAt: full!.readAt ? full!.readAt.toISOString() : null,
    attachments: full!.attachments.map(a => ({ id: a.id, filename: a.filename, mime: a.mime, size: a.size, url: `/uploads/${a.storageName}` }))
  })
})

export default router
