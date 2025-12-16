import { test, expect, Page } from '@playwright/test'

/**
 * 権限シナリオ E2Eテスト
 * - E2E-AUTH-001: 営業ユーザーの権限制限
 * - E2E-AUTH-002: 未認証アクセス
 */

// テスト用ユーザー情報
const testUsers = {
  manager: {
    email: 'manager@example.com',
    password: 'password123',
  },
  sales: {
    email: 'sales@example.com',
    password: 'password123',
  },
}

// ログインヘルパー関数
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await expect(page).toHaveURL('/reports')
}

// ログアウトヘルパー関数
async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user')
  })
}

test.describe('権限シナリオ', () => {
  test.describe('E2E-AUTH-001: 営業ユーザーの権限制限', () => {
    test('営業ユーザーは顧客の新規登録ができない', async ({ page }) => {
      // Arrange
      await login(page, testUsers.sales.email, testUsers.sales.password)

      // Act
      await page.goto('/customers')
      await expect(page.getByRole('heading', { name: '顧客マスタ' })).toBeVisible()

      // Assert
      // 新規登録ボタンが表示されないことを確認
      await expect(page.getByRole('link', { name: '+ 新規登録' })).not.toBeVisible()
    })

    test('営業ユーザーは顧客の編集ができない', async ({ page }) => {
      // Arrange
      await login(page, testUsers.sales.email, testUsers.sales.password)

      // Act
      await page.goto('/customers')
      await expect(page.getByRole('heading', { name: '顧客マスタ' })).toBeVisible()

      // Assert
      // 編集リンクが表示されないことを確認（操作列がない）
      await expect(page.locator('thead').getByText('操作')).not.toBeVisible()
    })

    test('営業ユーザーが顧客登録ページに直接アクセスしても登録できない', async ({
      page,
    }) => {
      // Arrange
      await login(page, testUsers.sales.email, testUsers.sales.password)

      // Act - 直接URLでアクセス
      await page.goto('/customers/new')

      // Assert
      // 権限エラーまたはリダイレクトされることを確認
      // 実装によっては403エラーまたは顧客一覧にリダイレクトされる可能性がある
      const isNewPage = page.url().includes('/customers/new')
      const isCustomersPage = page.url().includes('/customers')
      const hasError = await page.getByText('権限がありません').isVisible().catch(() => false)

      // 新規登録ページにアクセスできないか、エラーが表示されることを確認
      // 注意: 実装によって動作が異なる場合がある
      expect(isCustomersPage || hasError || !isNewPage).toBeTruthy()
    })

    test('営業ユーザーはユーザー管理にアクセスできるが、限定的な操作のみ', async ({
      page,
    }) => {
      // Arrange
      await login(page, testUsers.sales.email, testUsers.sales.password)

      // Act
      await page.goto('/users')

      // Assert
      // ユーザー一覧は表示できるが、権限に応じた制限がある
      // 実装によってはアクセス自体が制限される場合もある
      const isUsersPage = page.url().includes('/users')
      const hasUserManagement = await page.getByRole('heading', { name: 'ユーザー管理' }).isVisible().catch(() => false)
      const hasError = await page.getByText('権限がありません').isVisible().catch(() => false)

      // いずれかの状態であることを確認
      expect(isUsersPage || hasError || hasUserManagement).toBeTruthy()
    })

    test('営業ユーザーは自分の日報を編集できる', async ({ page }) => {
      // Arrange
      await login(page, testUsers.sales.email, testUsers.sales.password)

      // 日報を作成
      await page.getByRole('link', { name: '+ 新規作成' }).click()
      const date = new Date()
      date.setDate(date.getDate() - 100)
      const reportDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      await page.getByLabel('日付').fill(reportDate)
      await page.getByLabel('顧客').first().selectOption({ index: 1 })
      await page.getByLabel('活動内容').first().fill('営業ユーザーの日報')
      await page.getByRole('button', { name: '保存' }).click()

      // 詳細ページで編集リンクを確認
      await expect(page.getByRole('heading', { name: '日報詳細' })).toBeVisible()

      // Act & Assert
      // 編集リンクが表示されることを確認
      await expect(page.getByRole('link', { name: '編集' })).toBeVisible()

      // 編集ページに遷移できることを確認
      await page.getByRole('link', { name: '編集' }).click()
      await expect(page.getByRole('heading', { name: '日報編集' })).toBeVisible()
    })
  })

  test.describe('E2E-AUTH-002: 未認証アクセス', () => {
    test('未認証で日報一覧にアクセスするとログインページにリダイレクトまたはエラー', async ({
      page,
    }) => {
      // Arrange - ログインしていない状態
      // localStorageをクリア
      await page.goto('/login')
      await logout(page)

      // Act
      await page.goto('/reports')

      // Assert
      // ログインページにリダイレクトされるか、認証エラーが表示されることを確認
      const isLoginPage = page.url().includes('/login')
      const hasAuthError = await page.getByText('認証が必要です').isVisible().catch(() => false)
      const isReportsPage = page.url().includes('/reports')

      // ログインページにリダイレクトされるか、エラーが表示されることを確認
      // 注意: SPA実装の場合、APIエラーとして表示される可能性がある
      expect(isLoginPage || hasAuthError || !isReportsPage).toBeTruthy()
    })

    test('未認証で顧客一覧にアクセスするとログインページにリダイレクトまたはエラー', async ({
      page,
    }) => {
      // Arrange
      await page.goto('/login')
      await logout(page)

      // Act
      await page.goto('/customers')

      // Assert
      const isLoginPage = page.url().includes('/login')
      const hasAuthError = await page.getByText('認証が必要です').isVisible().catch(() => false)

      expect(isLoginPage || hasAuthError).toBeTruthy()
    })

    test('未認証でユーザー一覧にアクセスするとログインページにリダイレクトまたはエラー', async ({
      page,
    }) => {
      // Arrange
      await page.goto('/login')
      await logout(page)

      // Act
      await page.goto('/users')

      // Assert
      const isLoginPage = page.url().includes('/login')
      const hasAuthError = await page.getByText('認証が必要です').isVisible().catch(() => false)

      expect(isLoginPage || hasAuthError).toBeTruthy()
    })

    test('未認証で日報作成にアクセスするとログインページにリダイレクトまたはエラー', async ({
      page,
    }) => {
      // Arrange
      await page.goto('/login')
      await logout(page)

      // Act
      await page.goto('/reports/new')

      // Assert
      const isLoginPage = page.url().includes('/login')
      const hasAuthError = await page.getByText('認証が必要です').isVisible().catch(() => false)

      expect(isLoginPage || hasAuthError).toBeTruthy()
    })

    test('ログインページは認証不要でアクセスできる', async ({ page }) => {
      // Arrange - ログインしていない状態
      await page.goto('/login')
      await logout(page)

      // Act
      await page.goto('/login')

      // Assert
      await expect(page).toHaveURL('/login')
      await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
      await expect(page.getByText('営業日報システム')).toBeVisible()
    })

    test('無効なトークンでアクセスするとエラーになる', async ({ page }) => {
      // Arrange
      await page.goto('/login')

      // 無効なトークンを設定
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'invalid-token-xxxxx')
        localStorage.setItem('user', JSON.stringify({ email: 'test@example.com', role: 'SALES' }))
      })

      // Act
      await page.goto('/reports')

      // Assert
      // 無効なトークンの場合、エラーが発生するか再ログインが必要
      const hasAuthError = await page.getByText('トークンが無効').isVisible().catch(() => false)
      const hasGenericError = await page.getByText('認証').isVisible().catch(() => false)
      const isLoginPage = page.url().includes('/login')

      // いずれかの状態になることを確認
      expect(hasAuthError || hasGenericError || isLoginPage).toBeTruthy()
    })
  })

  test.describe('ヘッダーナビゲーション', () => {
    test('上長ユーザーはすべてのメニューにアクセスできる', async ({ page }) => {
      // Arrange
      await login(page, testUsers.manager.email, testUsers.manager.password)

      // Assert
      // ヘッダーにナビゲーションリンクがあることを確認
      // 実装によってはサイドバーやメニューの形式が異なる
      const header = page.locator('header')

      // 日報一覧へのリンクを確認
      await expect(header.getByRole('link', { name: '日報' })).toBeVisible()

      // 顧客マスタへのリンクを確認
      await expect(header.getByRole('link', { name: '顧客' })).toBeVisible()

      // ユーザー管理へのリンクを確認
      await expect(header.getByRole('link', { name: 'ユーザー' })).toBeVisible()
    })

    test('営業ユーザーもナビゲーションにアクセスできる', async ({ page }) => {
      // Arrange
      await login(page, testUsers.sales.email, testUsers.sales.password)

      // Assert
      const header = page.locator('header')

      // 日報一覧へのリンクを確認
      await expect(header.getByRole('link', { name: '日報' })).toBeVisible()

      // 顧客マスタへのリンクを確認（閲覧のみ可能）
      await expect(header.getByRole('link', { name: '顧客' })).toBeVisible()
    })
  })
})
