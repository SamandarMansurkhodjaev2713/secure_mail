# SecureMail — техническое описание

Стек: Frontend (React 18, Vite, TS, Tailwind, Router, Zustand, RHF, axios). Backend (Node.js, Express, TS, Prisma+SQLite, JWT, bcrypt, multer, helmet, rate-limit, zod).

Файловая структура:
- frontend: Vite проект, компоненты, страницы, store, services, types. Прокси `/api` и `/uploads` на порт 4000.
- backend: Express сервер, маршруты `auth`, `messages`, Prisma, конфиг, мидлвары.
- prisma: `schema.prisma`, `seed.ts`.
- docker-compose.yml, Dockerfile для фронта и бэка.

Запуск разработки:
1. Backend: `npm install`, создать `.env` по образцу `.env.example`, `npx prisma generate`, `npx prisma migrate dev --name init`, `npm run dev`, `npm run seed`.
2. Frontend: `npm install`, `npm run dev`.

Аутентификация: JWT access/refresh, логику входа `POST /api/auth/login`, обновление `POST /api/auth/refresh`, выход `POST /api/auth/logout`. Пароли хешируются bcrypt 12 rounds. Заголовки безопасности через helmet, лимиты запросов через rate-limit.

Сообщения: `GET /api/messages` возвращает входящие текущего пользователя, `GET /api/messages/:id` — письмо, `POST /api/messages` — отправка с вложениями multipart. Валидация через zod. Файлы хранятся в `uploads`, ссылки отдаются как `/uploads/{storageName}`.

Переменные окружения: порт, clientUrl, jwt секреты, uploadDir, DATABASE_URL.

Тестовые данные: `npm run seed` создаёт Sam4k и artur, а также несколько сообщений.

Рекомендации: добавить Jest+Supertest для тестов, S3-адаптер для файлов, CSP заголовок, настройку CORS доменов, Husky и ESLint.
