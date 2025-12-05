"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../services/prisma");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, auth_1.requireAdmin, async (_req, res) => {
    const users = await prisma_1.prisma.user.findMany({ orderBy: { login: 'asc' } });
    res.json(users.map(u => ({ id: u.id, login: u.login, email: u.email, name: u.name, role: u.role })));
});
exports.default = router;
