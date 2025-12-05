FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* /app/
RUN npm i --no-fund --no-audit
COPY . /app
EXPOSE 5173
CMD ["npm","run","dev"]
