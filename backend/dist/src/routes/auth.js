"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../services/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../config");
const zod_1 = require("zod");
const auth_1 = require("../middlewares/auth");
const otplib_1 = require("otplib");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    const schema = zod_1.z.object({
        login: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        password: zod_1.z.string().min(4),
        otp: zod_1.z.string().min(6).max(6).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid payload' });
    const user = await prisma_1.prisma.user.findFirst({ where: { OR: [{ login: parsed.data.login }, { email: parsed.data.email }] } });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt_1.default.compare(parsed.data.password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    if (user.twoFASecret) {
        if (!parsed.data.otp)
            return res.status(401).json({ error: 'OTP required' });
        const valid = otplib_1.authenticator.verify({ token: parsed.data.otp, secret: user.twoFASecret });
        if (!valid)
            return res.status(401).json({ error: 'Invalid OTP' });
    }
    const accessToken = (0, jsonwebtoken_1.sign)({ userId: user.id }, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
    const refreshToken = (0, jsonwebtoken_1.sign)({ userId: user.id }, config_1.config.refreshSecret, { expiresIn: config_1.config.refreshExpiresIn });
    res.json({ accessToken, refreshToken, user: { id: user.id, login: user.login, email: user.email, name: user.name, role: user.role } });
});
router.post('/logout', async (_req, res) => { res.json({ ok: true }); });
router.post('/refresh', async (req, res) => {
    const schema = zod_1.z.object({ refreshToken: zod_1.z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid payload' });
    try {
        const payload = (0, jsonwebtoken_1.verify)(parsed.data.refreshToken, config_1.config.refreshSecret);
        const token = (0, jsonwebtoken_1.sign)({ userId: payload.userId }, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
        res.json({ accessToken: token });
    }
    catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
});
router.get('/me', async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth)
            return res.status(401).json({ error: 'Unauthorized' });
        const token = auth.replace('Bearer ', '');
        const payload = (0, jsonwebtoken_1.verify)(token, config_1.config.jwtSecret);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(404).json({ error: 'Not found' });
        res.json({ id: user.id, login: user.login, email: user.email, name: user.name });
    }
    catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
});
router.post('/register', async (req, res) => {
    const schema = zod_1.z.object({
        login: zod_1.z.string().min(2).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
        email: zod_1.z.string().email(),
        name: zod_1.z.string().min(2).max(64),
        password: zod_1.z.string().min(4).max(128),
        role: zod_1.z.enum(['USER', 'ADMIN']).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    // Permission: if self-registration disabled, require admin
    let requesterRole = null;
    if (!config_1.config.allowSelfRegistration) {
        try {
            const auth = req.headers.authorization;
            if (!auth)
                return res.status(403).json({ error: 'Forbidden' });
            const token = auth.replace('Bearer ', '');
            const payload = (0, jsonwebtoken_1.verify)(token, config_1.config.jwtSecret);
            const me = await prisma_1.prisma.user.findUnique({ where: { id: payload.userId } });
            if (!me || me.role !== 'ADMIN')
                return res.status(403).json({ error: 'Forbidden' });
            requesterRole = me.role;
        }
        catch {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }
    const { login, email, name, password, role } = parsed.data;
    const exists = await prisma_1.prisma.user.findFirst({ where: { OR: [{ login }, { email }] } });
    if (exists)
        return res.status(409).json({ error: 'User already exists' });
    const hash = await bcrypt_1.default.hash(password, 10);
    const finalRole = requesterRole === 'ADMIN' && role === 'ADMIN' ? 'ADMIN' : (role === 'USER' ? 'USER' : 'USER');
    const user = await prisma_1.prisma.user.create({ data: { login, email, name, passwordHash: hash, role: finalRole } });
    res.status(201).json({ id: user.id, login: user.login, email: user.email, name: user.name, role: user.role });
});
router.post('/2fa/setup', auth_1.requireAuth, async (req, res) => {
    const userId = req.userId;
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return res.status(401).json({ error: 'Unauthorized' });
    const secret = otplib_1.authenticator.generateSecret();
    const otpAuth = otplib_1.authenticator.keyuri(user.email, 'SecureMail', secret);
    await prisma_1.prisma.user.update({ where: { id: userId }, data: { twoFATempSecret: secret } });
    res.json({ secret, otpAuth });
});
router.post('/2fa/verify', auth_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ token: zod_1.z.string().min(6).max(6) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid payload' });
    const userId = req.userId;
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFATempSecret)
        return res.status(400).json({ error: 'Setup not started' });
    const ok = otplib_1.authenticator.verify({ token: parsed.data.token, secret: user.twoFATempSecret });
    if (!ok)
        return res.status(401).json({ error: 'Invalid token' });
    await prisma_1.prisma.user.update({ where: { id: userId }, data: { twoFASecret: user.twoFATempSecret, twoFATempSecret: null } });
    res.json({ enabled: true });
});
exports.default = router;
