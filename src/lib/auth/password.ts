import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * パスワードをハッシュ化する
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * パスワードを検証する
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
