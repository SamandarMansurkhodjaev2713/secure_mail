import { Router } from 'express'
import { requireAuth } from '../middlewares/auth'
import { syncMailbox } from '../services/imap'

const router = Router()

router.post('/sync', requireAuth, async (req, res) => {
  const userId = (req as any).userId as string
  try {
    const r = await syncMailbox(userId)
    res.json(r)
  } catch {
    res.status(500).json({ ok: false })
  }
})

export default router
