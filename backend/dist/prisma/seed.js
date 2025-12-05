"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function run() {
    const prisma = new client_1.PrismaClient();
    const s = await bcrypt_1.default.hash('1234', 12);
    const a = await bcrypt_1.default.hash('1234', 12);
    const sam = await prisma.user.upsert({
        where: { login: 'Sam4k' },
        update: { role: 'ADMIN' },
        create: { login: 'Sam4k', email: 'sam@example.test', name: 'Sam', passwordHash: s, role: 'ADMIN' }
    });
    const artur = await prisma.user.upsert({
        where: { login: 'artur' },
        update: { role: 'USER' },
        create: { login: 'artur', email: 'artur@example.test', name: 'Artur', passwordHash: a, role: 'USER' }
    });
    await prisma.message.create({ data: { senderId: sam.id, recipientId: artur.id, subject: 'Привет', body: 'Сообщение 1' } });
    await prisma.message.create({ data: { senderId: artur.id, recipientId: sam.id, subject: 'Ответ', body: 'Сообщение 2' } });
    await prisma.message.create({ data: { senderId: sam.id, recipientId: artur.id, subject: 'Файл', body: 'Смотри вложение' } });
}
run().then(() => process.exit(0));
