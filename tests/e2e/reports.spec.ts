import { test, expect, Page } from '@playwright/test'

/**
 * 日報シナリオ E2Eテスト
 * - E2E-REPORT-001: 日報作成（訪問1件）
 * - E2E-REPORT-002: 日報作成（訪問複数件）
 * - E2E-REPORT-003: 日報作成（訪問削除）
 * - E2E-REPORT-004: 日報編集
 */

// テスト用ユーザー情報
const testUser = {
  email: 'sales@example.com',
  password: 'password123',
}

// ログインヘルパー関数
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await expect(page).toHaveURL('/reports')
}

// 本日の日付を取得するヘルパー関数
function _getTodayString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ユニークな日付を生成（テスト毎に重複を避けるため）
function getTestDate(offset: number = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - offset - 1) // 過去の日付を使用
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

test.describe('日報シナリオ', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUser.email, testUser.password)
  })

  test('E2E-REPORT-001: 日報作成（訪問1件）', async ({ page }) => {
    // Arrange
    const reportDate = getTestDate(10) // 10日前の日付
    const visitContent = 'テスト訪問内容 - 新規商談の打ち合わせを実施しました。'
    const visitTime = '10:00'
    const problem = 'テスト課題 - 価格面での交渉が必要'
    const plan = 'テスト計画 - 見積書を作成して再訪問する'

    // Act
    // 新規作成ページに遷移
    await page.getByRole('link', { name: '+ 新規作成' }).click()
    await expect(page).toHaveURL('/reports/new')
    await expect(page.getByRole('heading', { name: '日報作成' })).toBeVisible()

    // 基本情報を入力
    await page.getByLabel('日付').fill(reportDate)

    // 訪問記録を入力
    await page.getByLabel('顧客').first().selectOption({ index: 1 }) // 最初の顧客を選択
    await page.getByLabel('訪問時刻').first().fill(visitTime)
    await page.getByLabel('活動内容').first().fill(visitContent)

    // 所感・計画を入力
    await page.getByLabel('課題・問題点').fill(problem)
    await page.getByLabel('翌日の予定').fill(plan)

    // 保存
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    // 日報詳細ページにリダイレクトされることを確認
    await expect(page.getByRole('heading', { name: '日報詳細' })).toBeVisible()

    // 入力した内容が表示されていることを確認
    await expect(page.getByText(visitContent)).toBeVisible()
    await expect(page.getByText(problem)).toBeVisible()
    await expect(page.getByText(plan)).toBeVisible()
  })

  test('E2E-REPORT-002: 日報作成（訪問複数件）', async ({ page }) => {
    // Arrange
    const reportDate = getTestDate(20) // 20日前の日付
    const visitContent1 = 'テスト訪問1 - 定期訪問を実施'
    const visitContent2 = 'テスト訪問2 - 新規提案を実施'
    const visitTime1 = '09:00'
    const visitTime2 = '14:00'

    // Act
    await page.getByRole('link', { name: '+ 新規作成' }).click()
    await expect(page).toHaveURL('/reports/new')

    // 基本情報を入力
    await page.getByLabel('日付').fill(reportDate)

    // 訪問記録1を入力
    await page.getByLabel('顧客').first().selectOption({ index: 1 })
    await page.getByLabel('訪問時刻').first().fill(visitTime1)
    await page.getByLabel('活動内容').first().fill(visitContent1)

    // 訪問を追加
    await page.getByRole('button', { name: '+ 訪問を追加' }).click()

    // 訪問記録2を入力（2つ目のフィールドを取得）
    await page.getByLabel('顧客').nth(1).selectOption({ index: 2 })
    await page.getByLabel('訪問時刻').nth(1).fill(visitTime2)
    await page.getByLabel('活動内容').nth(1).fill(visitContent2)

    // 保存
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page.getByRole('heading', { name: '日報詳細' })).toBeVisible()

    // 両方の訪問内容が表示されていることを確認
    await expect(page.getByText(visitContent1)).toBeVisible()
    await expect(page.getByText(visitContent2)).toBeVisible()

    // 訪問件数が2件であることを確認
    await expect(page.getByText('訪問記録 (2件)')).toBeVisible()
  })

  test('E2E-REPORT-003: 日報作成（訪問削除）', async ({ page }) => {
    // Arrange
    const reportDate = getTestDate(30) // 30日前の日付
    const visitContent1 = '残す訪問 - 重要な商談'
    const visitContent2 = '削除する訪問 - キャンセルになった訪問'

    // Act
    await page.getByRole('link', { name: '+ 新規作成' }).click()
    await expect(page).toHaveURL('/reports/new')

    // 基本情報を入力
    await page.getByLabel('日付').fill(reportDate)

    // 訪問記録1を入力
    await page.getByLabel('顧客').first().selectOption({ index: 1 })
    await page.getByLabel('活動内容').first().fill(visitContent1)

    // 訪問を追加
    await page.getByRole('button', { name: '+ 訪問を追加' }).click()

    // 訪問記録2を入力
    await page.getByLabel('顧客').nth(1).selectOption({ index: 2 })
    await page.getByLabel('活動内容').nth(1).fill(visitContent2)

    // 2つ目の訪問を削除
    await page.getByRole('button', { name: '削除' }).nth(1).click()

    // 保存
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page.getByRole('heading', { name: '日報詳細' })).toBeVisible()

    // 残した訪問内容が表示されていることを確認
    await expect(page.getByText(visitContent1)).toBeVisible()

    // 削除した訪問内容が表示されていないことを確認
    await expect(page.getByText(visitContent2)).not.toBeVisible()

    // 訪問件数が1件であることを確認
    await expect(page.getByText('訪問記録 (1件)')).toBeVisible()
  })

  test('E2E-REPORT-004: 日報編集', async ({ page }) => {
    // Arrange - まず日報を作成
    const reportDate = getTestDate(40) // 40日前の日付
    const originalContent = '編集前の活動内容'
    const updatedContent = '編集後の活動内容 - 内容を更新しました'
    const updatedProblem = '編集後の課題'

    // 新規作成
    await page.getByRole('link', { name: '+ 新規作成' }).click()
    await page.getByLabel('日付').fill(reportDate)
    await page.getByLabel('顧客').first().selectOption({ index: 1 })
    await page.getByLabel('活動内容').first().fill(originalContent)
    await page.getByRole('button', { name: '保存' }).click()

    // 詳細ページで確認
    await expect(page.getByRole('heading', { name: '日報詳細' })).toBeVisible()
    await expect(page.getByText(originalContent)).toBeVisible()

    // Act - 編集ページに遷移
    await page.getByRole('link', { name: '編集' }).click()
    await expect(page.getByRole('heading', { name: '日報編集' })).toBeVisible()

    // 内容を更新
    await page.getByLabel('活動内容').first().fill(updatedContent)
    await page.getByLabel('課題・問題点').fill(updatedProblem)

    // 保存
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    await expect(page.getByRole('heading', { name: '日報詳細' })).toBeVisible()

    // 更新後の内容が表示されていることを確認
    await expect(page.getByText(updatedContent)).toBeVisible()
    await expect(page.getByText(updatedProblem)).toBeVisible()

    // 元の内容が表示されていないことを確認
    await expect(page.getByText(originalContent)).not.toBeVisible()
  })

  test('日報作成 - バリデーションエラー（顧客未選択）', async ({ page }) => {
    // Arrange
    const reportDate = getTestDate(50)
    const visitContent = '活動内容のみ入力'

    // Act
    await page.getByRole('link', { name: '+ 新規作成' }).click()
    await page.getByLabel('日付').fill(reportDate)
    // 顧客を選択せずに活動内容のみ入力
    await page.getByLabel('活動内容').first().fill(visitContent)
    await page.getByRole('button', { name: '保存' }).click()

    // Assert
    // バリデーションエラーが表示されることを確認
    await expect(page.getByText('顧客を選択してください')).toBeVisible()
  })

  test('日報一覧から詳細ページへの遷移', async ({ page }) => {
    // Arrange - 日報一覧ページにいることを確認
    await expect(page.getByRole('heading', { name: '日報一覧' })).toBeVisible()

    // Act - 詳細リンクをクリック（最初の詳細リンク）
    const detailLinks = page.getByRole('link', { name: '詳細' })
    const count = await detailLinks.count()

    if (count > 0) {
      await detailLinks.first().click()

      // Assert
      await expect(page.getByRole('heading', { name: '日報詳細' })).toBeVisible()
    } else {
      // 日報がない場合はスキップ
      test.skip()
    }
  })
})
