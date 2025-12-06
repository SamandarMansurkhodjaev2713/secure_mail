import { Router } from 'express'
import { prisma } from '../services/prisma'
import { requireAuth } from '../middlewares/auth'
import { runSandbox } from '../services/sandbox'

const router = Router()

router.post('/open/:attachmentId', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string
  const attId = req.params.attachmentId
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const used = await prisma.sandboxSession.count({ where: { userId, createdAt: { gte: todayStart } } })
  if (used >= (user.dailyQuota || 5)) return res.status(429).json({ error: 'Quota exceeded' })
  try {
    const result = await runSandbox(userId, attId)
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ error: 'Sandbox failed' })
  }
})

router.get('/sessions', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string
  const list = await prisma.sandboxSession.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  res.json(list)
})

export default router
