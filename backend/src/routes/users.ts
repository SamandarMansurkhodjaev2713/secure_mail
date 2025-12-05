import { Router } from 'express'
import { prisma } from '../services/prisma'
import { requireAuth, requireAdmin } from '../middlewares/auth'

const router = Router()

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { login: 'asc' } })
  res.json(users.map(u => ({ id: u.id, login: u.login, email: u.email, name: u.name, role: u.role })))
})

export default router
