import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './routes/auth'
import { reports } from './routes/reports'
import { comments } from './routes/comments'
import { customers } from './routes/customers'
import { authMiddleware } from '@/lib/auth'

// Create Hono app
const app = new Hono().basePath('/api')

// Middleware
app.use('*', logger())
app.use('*', cors())

// Public routes (認証不要)
app.route('/auth', auth)

// Health check (認証不要)
app.get('/health', (c) => c.json({ status: 'ok' }))

// Protected routes (認証必要)
app.use('/reports/*', authMiddleware)
app.use('/customers/*', authMiddleware)

// Routes
app.route('/reports', reports)
app.route('/reports', comments)
app.route('/customers', customers)

// Error handling
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    },
    500
  )
})

// Not found
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'リソースが見つかりません',
      },
    },
    404
  )
})

export default app
