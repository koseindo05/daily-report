import { test, expect, Page } from '@playwright/test'

/**
 * ユーザー管理シナリオ E2Eテスト
 * - E2E-USER-001: ユーザー登録
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

// ユニークなメールアドレスを生成
function generateUniqueEmail(): string {
  const timestamp = Date.now()
  return `test.user.${timestamp}@example.com`
}

test.describe('ユーザー管理シナリオ', () => {
  test('E2E-USER-001: ユーザー登録 - 営業ユーザーを登録', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)

    // ユーザー一覧ページに遷移
    await page.goto('/users')
    await expect(page.getByRole('heading', { name: 'ユーザー管理' })).toBeVisible()

    // 新規登録ボタンをクリック
    await page.getByRole('link', { name: '+ 新規登録' }).click()
    await expect(page).toHaveURL('/users/new')
    await expect(page.getByRole('heading', { name: 'ユーザー登録' })).toBeVisible()

    // Act
    const userName = `テストユーザー_${Date.now()}`
    const userEmail = generateUniqueEmail()
    const userPassword = 'testpass123'
    const userDepartment = '営業2課'

    await page.getByLabel('氏名').fill(userName)
    await page.getByLabel('メールアドレス').fill(userEmail)
    await page.getByLabel('パスワード').fill(userPassword)
    await page.getByLabel('部署').fill(userDepartment)
    await page.getByLabel('役職').selectOption('SALES')
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    // ユーザー一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/users')
    await expect(page.getByRole('heading', { name: 'ユーザー管理' })).toBeVisible()

    // 登録したユーザーが一覧に表示されていることを確認
    await expect(page.getByText(userName)).toBeVisible()
    await expect(page.getByText(userEmail)).toBeVisible()
  })

  test('E2E-USER-001: ユーザー登録 - 上長ユーザーを登録', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/users/new')

    // Act
    const userName = `テスト上長_${Date.now()}`
    const userEmail = generateUniqueEmail()
    const userPassword = 'managerpass123'
    const userDepartment = '営業部'

    await page.getByLabel('氏名').fill(userName)
    await page.getByLabel('メールアドレス').fill(userEmail)
    await page.getByLabel('パスワード').fill(userPassword)
    await page.getByLabel('部署').fill(userDepartment)
    await page.getByLabel('役職').selectOption('MANAGER')
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page).toHaveURL('/users')
    await expect(page.getByText(userName)).toBeVisible()

    // 役職が「上長」と表示されていることを確認
    const userRow = page.getByRole('row', { name: new RegExp(userName) })
    await expect(userRow.getByText('上長')).toBeVisible()
  })

  test('E2E-USER-001: ユーザー登録 - バリデーションエラー（氏名未入力）', async ({
    page,
  }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/users/new')

    // Act
    await page.getByLabel('メールアドレス').fill(generateUniqueEmail())
    await page.getByLabel('パスワード').fill('password123')
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page.getByText('氏名は必須です')).toBeVisible()
  })

  test('E2E-USER-001: ユーザー登録 - バリデーションエラー（メールアドレス未入力）', async ({
    page,
  }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/users/new')

    // Act
    await page.getByLabel('氏名').fill('テストユーザー')
    await page.getByLabel('パスワード').fill('password123')
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page.getByText('メールアドレスは必須です')).toBeVisible()
  })

  test('E2E-USER-001: ユーザー登録 - バリデーションエラー（パスワード未入力）', async ({
    page,
  }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/users/new')

    // Act
    await page.getByLabel('氏名').fill('テストユーザー')
    await page.getByLabel('メールアドレス').fill(generateUniqueEmail())
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page.getByText('パスワードは必須です')).toBeVisible()
  })

  test('E2E-USER-001: ユーザー登録 - バリデーションエラー（パスワードが短すぎる）', async ({
    page,
  }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/users/new')

    // Act
    await page.getByLabel('氏名').fill('テストユーザー')
    await page.getByLabel('メールアドレス').fill(generateUniqueEmail())
    await page.getByLabel('パスワード').fill('short') // 8文字未満
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page.getByText('パスワードは8文字以上で入力してください')).toBeVisible()
  })

  test('E2E-USER-001: ユーザー登録 - バリデーションエラー（メールアドレス形式不正）', async ({
    page,
  }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/users/new')

    // Act
    await page.getByLabel('氏名').fill('テストユーザー')
    await page.getByLabel('メールアドレス').fill('invalid-email')
    await page.getByLabel('パスワード').fill('password123')
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page.getByText('メールアドレスの形式が正しくありません')).toBeVisible()
  })

  test('ユーザー編集 - ユーザー情報を編集', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)

    // ユーザーを作成
    await page.goto('/users/new')
    const originalName = `編集テストユーザー_${Date.now()}`
    const userEmail = generateUniqueEmail()
    await page.getByLabel('氏名').fill(originalName)
    await page.getByLabel('メールアドレス').fill(userEmail)
    await page.getByLabel('パスワード').fill('password123')
    await page.getByRole('button', { name: '保存' }).click()

    // ユーザー一覧で編集リンクをクリック
    await expect(page).toHaveURL('/users')
    await page.getByRole('row', { name: new RegExp(originalName) }).getByRole('link', { name: '編集' }).click()

    // Act
    await expect(page.getByRole('heading', { name: 'ユーザー編集' })).toBeVisible()

    const updatedName = `${originalName}_更新済み`
    await page.getByLabel('氏名').fill(updatedName)
    await page.getByLabel('部署').fill('更新後の部署')
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page).toHaveURL('/users')
    await expect(page.getByText(updatedName)).toBeVisible()
  })

  test('ユーザー一覧 - 登録済みユーザーが表示される', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)

    // Act
    await page.goto('/users')

    // Assert
    await expect(page.getByRole('heading', { name: 'ユーザー管理' })).toBeVisible()

    // シードデータのユーザーが表示されていることを確認
    await expect(page.getByText('山田太郎')).toBeVisible()
    await expect(page.getByText('鈴木花子')).toBeVisible()
    await expect(page.getByText('sales@example.com')).toBeVisible()
    await expect(page.getByText('manager@example.com')).toBeVisible()
  })

  test('ユーザー一覧 - 役職が正しく表示される', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)

    // Act
    await page.goto('/users')

    // Assert
    // 「営業」と「上長」の役職が表示されていることを確認
    await expect(page.getByRole('cell', { name: '営業', exact: true }).first()).toBeVisible()
    await expect(page.getByRole('cell', { name: '上長', exact: true }).first()).toBeVisible()
  })
})
