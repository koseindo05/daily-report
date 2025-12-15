import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { reports } from './routes/reports'
import { comments } from './routes/comments'
import { customers } from './routes/customers'

// Create Hono app
const app = new Hono().basePath('/api')

// Middleware
app.use('*', logger())
app.use('*', cors())

// Routes
app.route('/reports', reports)
app.route('/reports', comments)
app.route('/customers', customers)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

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
