export type User = {
  id: string
  login: string
  email: string
  name: string
  role?: 'USER' | 'ADMIN'
}

export type AttachmentMeta = {
  id: string
  filename: string
  mime: string
  size: number
  url: string
}

export type Message = {
  id: string
  subject: string
  body: string
  senderId: string
  recipientId: string
  createdAt: string
  readAt?: string | null
  attachments: AttachmentMeta[]
}
