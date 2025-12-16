import { test, expect } from '@playwright/test'

/**
 * ログインシナリオ E2Eテスト
 * - E2E-LOGIN-001: ログイン成功
 * - E2E-LOGIN-002: ログイン失敗
 */

// テスト用ユーザー情報
const testUsers = {
  manager: {
    email: 'manager@example.com',
    password: 'password123',
    name: '鈴木花子',
    role: 'MANAGER',
  },
  sales: {
    email: 'sales@example.com',
    password: 'password123',
    name: '山田太郎',
    role: 'SALES',
  },
}

test.describe('ログインシナリオ', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに遷移
    await page.goto('/login')
  })

  test('E2E-LOGIN-001: ログイン成功 - 上長ユーザー', async ({ page }) => {
    // Arrange
    const { email, password } = testUsers.manager

    // Act
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByLabel('パスワード').fill(password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Assert
    // ログイン成功後、日報一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/reports')
    await expect(page.getByRole('heading', { name: '日報一覧' })).toBeVisible()
  })

  test('E2E-LOGIN-001: ログイン成功 - 営業ユーザー', async ({ page }) => {
    // Arrange
    const { email, password } = testUsers.sales

    // Act
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByLabel('パスワード').fill(password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Assert
    // ログイン成功後、日報一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/reports')
    await expect(page.getByRole('heading', { name: '日報一覧' })).toBeVisible()
  })

  test('E2E-LOGIN-002: ログイン失敗 - メールアドレス誤り', async ({ page }) => {
    // Arrange
    const wrongEmail = 'wrong@example.com'
    const password = 'password123'

    // Act
    await page.getByLabel('メールアドレス').fill(wrongEmail)
    await page.getByLabel('パスワード').fill(password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Assert
    // エラーメッセージが表示されることを確認
    await expect(page.getByText('ログインに失敗しました')).toBeVisible()
    // ログインページに留まることを確認
    await expect(page).toHaveURL('/login')
  })

  test('E2E-LOGIN-002: ログイン失敗 - パスワード誤り', async ({ page }) => {
    // Arrange
    const email = testUsers.manager.email
    const wrongPassword = 'wrongpassword'

    // Act
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByLabel('パスワード').fill(wrongPassword)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Assert
    // エラーメッセージが表示されることを確認
    await expect(page.getByText('ログインに失敗しました')).toBeVisible()
    // ログインページに留まることを確認
    await expect(page).toHaveURL('/login')
  })

  test('E2E-LOGIN-002: ログイン失敗 - 空のフォーム送信', async ({ page }) => {
    // Act
    // メールアドレスとパスワードを空のまま送信しようとする
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Assert
    // HTML5バリデーションによりフォームが送信されない
    // メールアドレスフィールドにフォーカスが当たる（required属性により）
    await expect(page.getByLabel('メールアドレス')).toBeFocused()
  })

  test('E2E-LOGIN-001: ログイン成功後にlocalStorageにトークンが保存される', async ({
    page,
  }) => {
    // Arrange
    const { email, password } = testUsers.manager

    // Act
    await page.getByLabel('メールアドレス').fill(email)
    await page.getByLabel('パスワード').fill(password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Wait for navigation
    await expect(page).toHaveURL('/reports')

    // Assert
    // localStorageにトークンが保存されていることを確認
    const token = await page.evaluate(() => localStorage.getItem('auth-token'))
    expect(token).toBeTruthy()

    // localStorageにユーザー情報が保存されていることを確認
    const userStr = await page.evaluate(() => localStorage.getItem('user'))
    expect(userStr).toBeTruthy()

    const user = JSON.parse(userStr as string)
    expect(user.email).toBe(testUsers.manager.email)
    expect(user.role).toBe('MANAGER')
  })
})
