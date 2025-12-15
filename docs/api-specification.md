# 営業日報システム API仕様書

## 概要

| 項目 | 内容 |
|------|------|
| ベースURL | `/api` |
| 形式 | REST API |
| データ形式 | JSON |
| 認証 | Bearer Token (JWT) |

## 共通仕様

### リクエストヘッダー

```
Content-Type: application/json
Authorization: Bearer <token>  # 認証が必要なAPI
```

### レスポンス形式

**成功時**
```json
{
  "success": true,
  "data": { ... }
}
```

**エラー時**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエスト不正 |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソース未発見 |
| 500 | サーバーエラー |

### エラーコード一覧

| コード | 説明 |
|--------|------|
| INVALID_REQUEST | リクエスト形式が不正 |
| UNAUTHORIZED | 認証が必要 |
| FORBIDDEN | 権限がない |
| NOT_FOUND | リソースが見つからない |
| DUPLICATE_ENTRY | 重複データ |
| VALIDATION_ERROR | バリデーションエラー |

---

## 認証 API

### POST /api/auth/login

ログイン認証

**リクエスト**
```json
{
  "email": "yamada@example.com",
  "password": "password123"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user_001",
      "name": "山田太郎",
      "email": "yamada@example.com",
      "department": "営業1課",
      "role": "SALES"
    }
  }
}
```

### POST /api/auth/logout

ログアウト

**レスポンス**
```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

### GET /api/auth/me

ログインユーザー情報取得

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "user_001",
    "name": "山田太郎",
    "email": "yamada@example.com",
    "department": "営業1課",
    "role": "SALES"
  }
}
```

---

## 日報 API

### GET /api/reports

日報一覧取得

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|------------|-----|------|------|
| date_from | string | - | 検索開始日 (YYYY-MM-DD) |
| date_to | string | - | 検索終了日 (YYYY-MM-DD) |
| user_id | string | - | 担当者ID |
| page | number | - | ページ番号 (デフォルト: 1) |
| limit | number | - | 取得件数 (デフォルト: 20) |

**リクエスト例**
```
GET /api/reports?date_from=2024-12-01&date_to=2024-12-15&page=1&limit=20
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report_001",
        "report_date": "2024-12-15",
        "user": {
          "id": "user_001",
          "name": "山田太郎"
        },
        "visit_count": 3,
        "comment_count": 2,
        "created_at": "2024-12-15T18:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "total_pages": 5
    }
  }
}
```

### GET /api/reports/:id

日報詳細取得

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "report_001",
    "report_date": "2024-12-15",
    "user": {
      "id": "user_001",
      "name": "山田太郎",
      "department": "営業1課"
    },
    "visits": [
      {
        "id": "visit_001",
        "customer": {
          "id": "customer_001",
          "name": "ABC株式会社"
        },
        "visit_time": "10:00",
        "content": "新製品の提案。担当者の反応は良好。"
      },
      {
        "id": "visit_002",
        "customer": {
          "id": "customer_002",
          "name": "XYZ商事"
        },
        "visit_time": "14:00",
        "content": "定期訪問。特に問題なし。"
      }
    ],
    "problem": "ABC株式会社の見積もりについて、値引き交渉があり。",
    "plan": "・ABC株式会社への見積書作成\n・DEF工業へのアポイント電話",
    "comments": [
      {
        "id": "comment_001",
        "target_type": "PROBLEM",
        "content": "10%までOKです。競合状況も確認してください。",
        "user": {
          "id": "user_003",
          "name": "鈴木部長"
        },
        "created_at": "2024-12-15T18:30:00Z"
      }
    ],
    "created_at": "2024-12-15T18:00:00Z",
    "updated_at": "2024-12-15T18:00:00Z"
  }
}
```

### POST /api/reports

日報作成

**権限**: 営業のみ

**リクエスト**
```json
{
  "report_date": "2024-12-15",
  "visits": [
    {
      "customer_id": "customer_001",
      "visit_time": "10:00",
      "content": "新製品の提案。担当者の反応は良好。"
    },
    {
      "customer_id": "customer_002",
      "visit_time": "14:00",
      "content": "定期訪問。特に問題なし。"
    }
  ],
  "problem": "ABC株式会社の見積もりについて、値引き交渉があり。",
  "plan": "・ABC株式会社への見積書作成\n・DEF工業へのアポイント電話"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "report_001",
    "report_date": "2024-12-15",
    "message": "日報を作成しました"
  }
}
```

**バリデーションエラー例**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": [
      { "field": "report_date", "message": "未来の日付は指定できません" },
      { "field": "visits[0].content", "message": "訪問内容は必須です" }
    ]
  }
}
```

### PUT /api/reports/:id

日報更新

**権限**: 営業（本人のみ）

**リクエスト**
```json
{
  "visits": [
    {
      "id": "visit_001",
      "customer_id": "customer_001",
      "visit_time": "10:00",
      "content": "新製品の提案。見積もり依頼あり。"
    }
  ],
  "problem": "値引き交渉について相談したい",
  "plan": "見積書作成"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "report_001",
    "message": "日報を更新しました"
  }
}
```

### DELETE /api/reports/:id

日報削除

**権限**: 営業（本人のみ）

**レスポンス**
```json
{
  "success": true,
  "data": {
    "message": "日報を削除しました"
  }
}
```

---

## コメント API

### POST /api/reports/:report_id/comments

コメント投稿

**権限**: 上長のみ

**リクエスト**
```json
{
  "target_type": "PROBLEM",
  "content": "10%までOKです。競合状況も確認してください。"
}
```

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| target_type | string | ○ | "PROBLEM" または "PLAN" |
| content | string | ○ | コメント内容（1000文字以内） |

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "comment_001",
    "target_type": "PROBLEM",
    "content": "10%までOKです。競合状況も確認してください。",
    "user": {
      "id": "user_003",
      "name": "鈴木部長"
    },
    "created_at": "2024-12-15T18:30:00Z"
  }
}
```

### DELETE /api/reports/:report_id/comments/:comment_id

コメント削除

**権限**: 上長（投稿者本人のみ）

**レスポンス**
```json
{
  "success": true,
  "data": {
    "message": "コメントを削除しました"
  }
}
```

---

## 顧客 API

### GET /api/customers

顧客一覧取得

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|------------|-----|------|------|
| keyword | string | - | 顧客名で検索 |
| page | number | - | ページ番号 |
| limit | number | - | 取得件数 |

**レスポンス**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "customer_001",
        "name": "ABC株式会社",
        "address": "東京都渋谷区...",
        "phone": "03-1234-5678",
        "contact_person": "田中様"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "total_pages": 3
    }
  }
}
```

### GET /api/customers/:id

顧客詳細取得

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "customer_001",
    "name": "ABC株式会社",
    "address": "東京都渋谷区...",
    "phone": "03-1234-5678",
    "contact_person": "田中様",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-12-01T00:00:00Z"
  }
}
```

### POST /api/customers

顧客登録

**権限**: 上長のみ

**リクエスト**
```json
{
  "name": "ABC株式会社",
  "address": "東京都渋谷区...",
  "phone": "03-1234-5678",
  "contact_person": "田中様"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "customer_001",
    "message": "顧客を登録しました"
  }
}
```

### PUT /api/customers/:id

顧客更新

**権限**: 上長のみ

**リクエスト**
```json
{
  "name": "ABC株式会社",
  "address": "東京都渋谷区神宮前1-1-1",
  "phone": "03-1234-5678",
  "contact_person": "田中部長"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "customer_001",
    "message": "顧客情報を更新しました"
  }
}
```

### DELETE /api/customers/:id

顧客削除

**権限**: 上長のみ

**レスポンス**
```json
{
  "success": true,
  "data": {
    "message": "顧客を削除しました"
  }
}
```

---

## ユーザー API

### GET /api/users

ユーザー一覧取得

**権限**: 上長のみ

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|------------|-----|------|------|
| role | string | - | "SALES" または "MANAGER" |
| page | number | - | ページ番号 |
| limit | number | - | 取得件数 |

**レスポンス**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_001",
        "name": "山田太郎",
        "email": "yamada@example.com",
        "department": "営業1課",
        "role": "SALES"
      },
      {
        "id": "user_003",
        "name": "鈴木部長",
        "email": "suzuki@example.com",
        "department": "営業部",
        "role": "MANAGER"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "total_pages": 1
    }
  }
}
```

### GET /api/users/:id

ユーザー詳細取得

**権限**: 上長のみ

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "user_001",
    "name": "山田太郎",
    "email": "yamada@example.com",
    "department": "営業1課",
    "role": "SALES",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-12-01T00:00:00Z"
  }
}
```

### POST /api/users

ユーザー登録

**権限**: 上長のみ

**リクエスト**
```json
{
  "name": "新人太郎",
  "email": "shinjin@example.com",
  "password": "password123",
  "department": "営業1課",
  "role": "SALES"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "user_004",
    "message": "ユーザーを登録しました"
  }
}
```

### PUT /api/users/:id

ユーザー更新

**権限**: 上長のみ

**リクエスト**
```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "department": "営業2課",
  "role": "SALES"
}
```

※ パスワード変更は別APIで実施

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "user_001",
    "message": "ユーザー情報を更新しました"
  }
}
```

### DELETE /api/users/:id

ユーザー削除

**権限**: 上長のみ

**レスポンス**
```json
{
  "success": true,
  "data": {
    "message": "ユーザーを削除しました"
  }
}
```

### PUT /api/users/:id/password

パスワード変更

**権限**: 本人または上長

**リクエスト**
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword456"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "message": "パスワードを変更しました"
  }
}
```

---

## API一覧サマリー

| メソッド | エンドポイント | 説明 | 権限 |
|----------|---------------|------|------|
| POST | /api/auth/login | ログイン | - |
| POST | /api/auth/logout | ログアウト | 認証必須 |
| GET | /api/auth/me | ログインユーザー取得 | 認証必須 |
| GET | /api/reports | 日報一覧 | 認証必須 |
| GET | /api/reports/:id | 日報詳細 | 認証必須 |
| POST | /api/reports | 日報作成 | 営業 |
| PUT | /api/reports/:id | 日報更新 | 営業（本人） |
| DELETE | /api/reports/:id | 日報削除 | 営業（本人） |
| POST | /api/reports/:id/comments | コメント投稿 | 上長 |
| DELETE | /api/reports/:id/comments/:cid | コメント削除 | 上長（本人） |
| GET | /api/customers | 顧客一覧 | 認証必須 |
| GET | /api/customers/:id | 顧客詳細 | 認証必須 |
| POST | /api/customers | 顧客登録 | 上長 |
| PUT | /api/customers/:id | 顧客更新 | 上長 |
| DELETE | /api/customers/:id | 顧客削除 | 上長 |
| GET | /api/users | ユーザー一覧 | 上長 |
| GET | /api/users/:id | ユーザー詳細 | 上長 |
| POST | /api/users | ユーザー登録 | 上長 |
| PUT | /api/users/:id | ユーザー更新 | 上長 |
| DELETE | /api/users/:id | ユーザー削除 | 上長 |
| PUT | /api/users/:id/password | パスワード変更 | 本人/上長 |
