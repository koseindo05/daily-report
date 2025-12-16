import jwt from 'jsonwebtoken'
import type { Role } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_EXPIRES_IN = '24h'

export interface JwtPayload {
  userId: string
  email: string
  role: Role
}

/**
 * JWTトークンを生成する
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * JWTトークンを検証してペイロードを取得する
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Authorizationヘッダーからトークンを抽出する
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Cookieからトークンを抽出する
 */
export function extractTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  return cookies['auth-token'] || null
}
