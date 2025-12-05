FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* /app/
RUN npm i --no-fund --no-audit
COPY . /app
RUN npx prisma generate
EXPOSE 4000
CMD ["npm","run","dev"]
