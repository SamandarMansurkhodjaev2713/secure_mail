"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const prisma_1 = require("../services/prisma");
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth)
        return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.replace('Bearer ', '');
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.userId = payload.userId;
        next();
    }
    catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
async function requireAdmin(req, res, next) {
    const userId = req.userId;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN')
        return res.status(403).json({ error: 'Forbidden' });
    next();
}
