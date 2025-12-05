import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.REFRESH_SECRET || 'dev-refresh',
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowSelfRegistration: (process.env.ALLOW_SELF_REGISTRATION || 'false').toLowerCase() === 'true'
}
