import { ImapFlow } from 'imapflow'
import { prisma } from './prisma'
import { config } from '../config'
import path from 'path'
import fs from 'fs/promises'

export async function syncMailbox(userId: string) {
  const host = process.env.IMAP_HOST
  const user = process.env.IMAP_USER
  const pass = process.env.IMAP_PASS
  const port = Number(process.env.IMAP_PORT || 993)
  const secure = (process.env.IMAP_SECURE || 'true') === 'true'
  if (!host || !user || !pass) return { ok: false, reason: 'IMAP not configured' }
  const client = new ImapFlow({ host, port, secure, auth: { user, pass } })
  await client.connect()
  await client.mailboxOpen('INBOX')
  const lock = await client.getMailboxLock('INBOX')
  try {
    let synced = 0
    for await (const msg of client.fetch('1:*', { envelope: true, source: true, bodyStructure: true })) {
      const from = msg.envelope?.from?.[0]?.address || 'unknown'
      const subject = msg.envelope?.subject || ''
      const bodyText = ''
      const message = await prisma.message.create({ data: { subject, body: bodyText, senderId: userId, recipientId: userId } })
      const bs = msg.bodyStructure
      const parts = Array.isArray((bs as any).childNodes) ? (bs as any).childNodes : []
      for (const p of parts) {
        const disp = (p.disposition?.type || '').toLowerCase()
        if (disp === 'attachment') {
          const uid = msg.uid!
          const dl = await client.download(uid, p.part!)
          const chunks: Buffer[] = []
          for await (const chunk of dl.content) { chunks.push(chunk as Buffer) }
          const buf = Buffer.concat(chunks)
          const storageName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${p.params?.name}`
          const filePath = path.join(config.uploadDir, storageName)
          await fs.writeFile(filePath, buf)
          await prisma.attachment.create({ data: { filename: p.params?.name || 'file', storageName, mime: p.type || 'application/octet-stream', size: buf.length, messageId: message.id } })
        }
      }
      synced++
      if (synced >= 10) break
    }
    return { ok: true, synced }
  } finally {
    lock.release()
    await client.logout()
  }
}
