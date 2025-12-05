"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const prisma_1 = require("../services/prisma");
const auth_1 = require("../middlewares/auth");
const config_1 = require("../config");
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        fs_1.default.mkdirSync(config_1.config.uploadDir, { recursive: true });
        cb(null, config_1.config.uploadDir);
    },
    filename: (_req, file, cb) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}${path_1.default.extname(file.originalname)}`;
        cb(null, id);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'];
        cb(null, allowed.includes(file.mimetype));
    }
});
router.get('/', auth_1.requireAuth, async (req, res) => {
    const userId = req.userId;
    const items = await prisma_1.prisma.message.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        include: { attachments: true }
    });
    res.json({ items: items.map(m => ({
            id: m.id,
            subject: m.subject,
            body: m.body,
            senderId: m.senderId,
            recipientId: m.recipientId,
            createdAt: m.createdAt.toISOString(),
            readAt: m.readAt ? m.readAt.toISOString() : null,
            attachments: m.attachments.map(a => ({ id: a.id, filename: a.filename, mime: a.mime, size: a.size, url: `/uploads/${a.storageName}` }))
        })) });
});
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    const id = req.params.id;
    const m = await prisma_1.prisma.message.findUnique({ where: { id }, include: { attachments: true } });
    if (!m)
        return res.status(404).json({ error: 'Not found' });
    res.json({
        id: m.id,
        subject: m.subject,
        body: m.body,
        senderId: m.senderId,
        recipientId: m.recipientId,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt ? m.readAt.toISOString() : null,
        attachments: m.attachments.map(a => ({ id: a.id, filename: a.filename, mime: a.mime, size: a.size, url: `/uploads/${a.storageName}` }))
    });
});
router.post('/', auth_1.requireAuth, upload.array('attachments'), async (req, res) => {
    const userId = req.userId;
    const schema = zod_1.z.object({ to: zod_1.z.string(), subject: zod_1.z.string().min(1), body: zod_1.z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid payload' });
    const recipient = await prisma_1.prisma.user.findFirst({ where: { OR: [{ login: parsed.data.to }, { email: parsed.data.to }] } });
    if (!recipient)
        return res.status(404).json({ error: 'Recipient not found' });
    const msg = await prisma_1.prisma.message.create({ data: { senderId: userId, recipientId: recipient.id, subject: parsed.data.subject, body: parsed.data.body } });
    const files = req.files || [];
    for (const f of files) {
        await prisma_1.prisma.attachment.create({ data: { messageId: msg.id, filename: f.originalname, storageName: f.filename, mime: f.mimetype, size: f.size } });
    }
    const full = await prisma_1.prisma.message.findUnique({ where: { id: msg.id }, include: { attachments: true } });
    res.status(201).json({
        id: full.id,
        subject: full.subject,
        body: full.body,
        senderId: full.senderId,
        recipientId: full.recipientId,
        createdAt: full.createdAt.toISOString(),
        readAt: full.readAt ? full.readAt.toISOString() : null,
        attachments: full.attachments.map(a => ({ id: a.id, filename: a.filename, mime: a.mime, size: a.size, url: `/uploads/${a.storageName}` }))
    });
});
exports.default = router;
