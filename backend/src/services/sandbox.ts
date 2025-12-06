import path from 'path'
import fs from 'fs/promises'
import { prisma } from './prisma'
import { config } from '../config'
import { fileTypeFromFile } from 'file-type'
import mammoth from 'mammoth'
import pdf from 'pdf-parse'
import jimp from 'jimp'

export async function runSandbox(userId: string, attachmentId: string) {
  const att = await prisma.attachment.findUnique({ where: { id: attachmentId } })
  if (!att) throw new Error('Attachment not found')
  const start = Date.now()
  const session = await prisma.sandboxSession.create({ data: { userId, attachmentId, status: 'running', resultType: 'none', durationMs: 0 } })
  const baseDir = path.resolve(config.uploadDir)
  const inputPath = path.join(baseDir, att.storageName)
  const outDir = path.join(baseDir, 'sandbox', session.id)
  await fs.mkdir(outDir, { recursive: true })

  let resultType = 'text'
  let previewPath: string | null = null
  let reportPath: string | null = null

  try {
    const type = await fileTypeFromFile(inputPath)
    const mime = att.mime || type?.mime || 'application/octet-stream'
    if (mime.startsWith('image/')) {
      const img = await (jimp as any).read(inputPath)
      const safe = await img.quality(90).getBufferAsync((jimp as any).MIME_PNG)
      const out = path.join(outDir, 'preview.png')
      await fs.writeFile(out, safe)
      resultType = 'image'
      previewPath = `/uploads/sandbox/${session.id}/preview.png`
      const meta = { mime, width: img.getWidth(), height: img.getHeight(), size: att.size }
      const rep = path.join(outDir, 'report.json')
      await fs.writeFile(rep, JSON.stringify({ ok: true, meta }))
      reportPath = `/uploads/sandbox/${session.id}/report.json`
    } else if (mime === 'application/pdf') {
      const data = await fs.readFile(inputPath)
      const parsed = await (pdf as any)(data)
      const out = path.join(outDir, 'preview.txt')
      await fs.writeFile(out, parsed.text.slice(0, 20000))
      resultType = 'text'
      previewPath = `/uploads/sandbox/${session.id}/preview.txt`
      const rep = path.join(outDir, 'report.json')
      await fs.writeFile(rep, JSON.stringify({ ok: true, pages: parsed.numpages }))
      reportPath = `/uploads/sandbox/${session.id}/report.json`
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const data = await fs.readFile(inputPath)
      const res = await mammoth.convertToHtml({ buffer: data })
      const out = path.join(outDir, 'preview.html')
      await fs.writeFile(out, res.value)
      resultType = 'html'
      previewPath = `/uploads/sandbox/${session.id}/preview.html`
      const rep = path.join(outDir, 'report.json')
      await fs.writeFile(rep, JSON.stringify({ ok: true, warnings: res.messages }))
      reportPath = `/uploads/sandbox/${session.id}/report.json`
    } else {
      const buf = await fs.readFile(inputPath)
      const hex = buf.toString('hex').slice(0, 8192)
      const out = path.join(outDir, 'preview.txt')
      await fs.writeFile(out, hex)
      resultType = 'text'
      previewPath = `/uploads/sandbox/${session.id}/preview.txt`
      const rep = path.join(outDir, 'report.json')
      await fs.writeFile(rep, JSON.stringify({ ok: true, mime }))
      reportPath = `/uploads/sandbox/${session.id}/report.json`
    }
    const dur = Date.now() - start
    await prisma.sandboxSession.update({ where: { id: session.id }, data: { status: 'completed', resultType, previewPath: previewPath!, reportPath: reportPath!, durationMs: dur } })
    return { id: session.id, resultType, previewPath, reportPath }
  } catch (e) {
    const dur = Date.now() - start
    await prisma.sandboxSession.update({ where: { id: session.id }, data: { status: 'failed', durationMs: dur } })
    throw e
  }
}
