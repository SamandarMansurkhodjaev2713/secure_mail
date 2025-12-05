import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { prisma } from '../services/prisma'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })
  const token = auth.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string }
    ;(req as any).userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId as string
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })
  next()
}
