import { test, expect, Page } from '@playwright/test'

/**
 * 顧客管理シナリオ E2Eテスト
 * - E2E-CUSTOMER-001: 顧客登録
 * - E2E-CUSTOMER-002: 顧客検索
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

// ユニークな顧客名を生成
function generateUniqueCustomerName(): string {
  const timestamp = Date.now()
  return `テスト株式会社_${timestamp}`
}

test.describe('顧客管理シナリオ', () => {
  test('E2E-CUSTOMER-001: 顧客登録 - 上長ユーザーが顧客を登録', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)

    // 顧客一覧ページに遷移
    await page.goto('/customers')
    await expect(page.getByRole('heading', { name: '顧客マスタ' })).toBeVisible()

    // 新規登録ボタンが表示されていることを確認（上長のみ）
    await expect(page.getByRole('link', { name: '+ 新規登録' })).toBeVisible()

    // 新規登録ページに遷移
    await page.getByRole('link', { name: '+ 新規登録' }).click()
    await expect(page).toHaveURL('/customers/new')
    await expect(page.getByRole('heading', { name: '顧客登録' })).toBeVisible()

    // Act
    const customerName = generateUniqueCustomerName()
    const customerAddress = '東京都新宿区1-2-3 テストビル5F'
    const customerPhone = '03-1234-5678'
    const customerContact = '田中テスト様'

    await page.getByLabel('顧客名').fill(customerName)
    await page.getByLabel('住所').fill(customerAddress)
    await page.getByLabel('電話番号').fill(customerPhone)
    await page.getByLabel('担当者名').fill(customerContact)
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    // 顧客一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/customers')
    await expect(page.getByRole('heading', { name: '顧客マスタ' })).toBeVisible()

    // 登録した顧客が一覧に表示されていることを確認
    await expect(page.getByText(customerName)).toBeVisible()
  })

  test('E2E-CUSTOMER-001: 顧客登録 - 必須項目のみで登録', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/customers/new')

    // Act
    const customerName = generateUniqueCustomerName()
    await page.getByLabel('顧客名').fill(customerName)
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page).toHaveURL('/customers')
    await expect(page.getByText(customerName)).toBeVisible()
  })

  test('E2E-CUSTOMER-001: 顧客登録 - バリデーションエラー（顧客名未入力）', async ({
    page,
  }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/customers/new')

    // Act
    // 顧客名を入力せずに保存
    await page.getByLabel('住所').fill('テスト住所')
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    // バリデーションエラーが表示されることを確認
    await expect(page.getByText('顧客名は必須です')).toBeVisible()
    // ページが遷移していないことを確認
    await expect(page).toHaveURL('/customers/new')
  })

  test('E2E-CUSTOMER-002: 顧客検索 - 顧客名で検索', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)

    // まず検索対象の顧客を登録
    await page.goto('/customers/new')
    const customerName = `検索テスト顧客_${Date.now()}`
    await page.getByLabel('顧客名').fill(customerName)
    await page.getByRole('button', { name: '保存' }).click()

    // 顧客一覧ページで検索
    await expect(page).toHaveURL('/customers')

    // Act
    await page.getByPlaceholder('顧客名で検索...').fill(customerName)
    await page.getByRole('button', { name: '検索' }).click()

    // Assert
    // 検索結果に該当の顧客が表示されることを確認
    await expect(page.getByText(customerName)).toBeVisible()
  })

  test('E2E-CUSTOMER-002: 顧客検索 - 部分一致検索', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/customers')

    // Act
    // 既存の顧客データ（シードデータ）で部分一致検索
    await page.getByPlaceholder('顧客名で検索...').fill('株式会社')
    await page.getByRole('button', { name: '検索' }).click()

    // Assert
    // 「株式会社」を含む顧客が表示されることを確認
    // シードデータに「株式会社ABC」があるはず
    await expect(page.getByText('株式会社ABC')).toBeVisible()
  })

  test('E2E-CUSTOMER-002: 顧客検索 - 該当なし', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)
    await page.goto('/customers')

    // Act
    await page.getByPlaceholder('顧客名で検索...').fill('存在しない顧客名XXXXX')
    await page.getByRole('button', { name: '検索' }).click()

    // Assert
    // 該当する顧客がないメッセージが表示されることを確認
    await expect(page.getByText('顧客が見つかりません')).toBeVisible()
  })

  test('顧客編集 - 上長ユーザーが顧客情報を編集', async ({ page }) => {
    // Arrange
    await login(page, testUsers.manager.email, testUsers.manager.password)

    // 顧客を作成
    await page.goto('/customers/new')
    const originalName = generateUniqueCustomerName()
    await page.getByLabel('顧客名').fill(originalName)
    await page.getByRole('button', { name: '保存' }).click()

    // 顧客一覧で編集リンクをクリック
    await expect(page).toHaveURL('/customers')
    await page.getByRole('row', { name: new RegExp(originalName) }).getByRole('link', { name: '編集' }).click()

    // Act
    await expect(page.getByRole('heading', { name: '顧客編集' })).toBeVisible()

    const updatedName = `${originalName}_更新済み`
    await page.getByLabel('顧客名').fill(updatedName)
    await page.getByLabel('住所').fill('更新後の住所')
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page).toHaveURL('/customers')
    await expect(page.getByText(updatedName)).toBeVisible()
  })

  test('顧客一覧 - 営業ユーザーは新規登録ボタンが表示されない', async ({ page }) => {
    // Arrange
    await login(page, testUsers.sales.email, testUsers.sales.password)

    // Act
    await page.goto('/customers')
    await expect(page.getByRole('heading', { name: '顧客マスタ' })).toBeVisible()

    // Assert
    // 営業ユーザーには新規登録ボタンが表示されないことを確認
    await expect(page.getByRole('link', { name: '+ 新規登録' })).not.toBeVisible()
  })

  test('顧客一覧 - 営業ユーザーは編集リンクが表示されない', async ({ page }) => {
    // Arrange
    await login(page, testUsers.sales.email, testUsers.sales.password)

    // Act
    await page.goto('/customers')
    await expect(page.getByRole('heading', { name: '顧客マスタ' })).toBeVisible()

    // Assert
    // 営業ユーザーには編集リンクが表示されないことを確認
    // ただし、顧客が存在する場合のみテスト
    const customerRows = page.locator('tbody tr')
    const count = await customerRows.count()

    if (count > 0) {
      // テーブルのヘッダーに「操作」列がないことを確認
      await expect(page.locator('thead').getByText('操作')).not.toBeVisible()
    }
  })
})
