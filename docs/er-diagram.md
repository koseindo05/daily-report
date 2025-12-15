# 営業日報システム ER図

## ER図（Mermaid）

```mermaid
erDiagram
    User ||--o{ DailyReport : "作成する"
    User ||--o{ Comment : "投稿する"
    DailyReport ||--o{ Visit : "含む"
    DailyReport ||--o{ Comment : "付く"
    Customer ||--o{ Visit : "訪問される"

    User {
        string id PK "ユーザーID"
        string name "氏名"
        string email UK "メールアドレス"
        string password_hash "パスワード（ハッシュ）"
        string department "部署"
        enum role "役職（SALES/MANAGER）"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    Customer {
        string id PK "顧客ID"
        string name "顧客名"
        string address "住所"
        string phone "電話番号"
        string contact_person "担当者名"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    DailyReport {
        string id PK "日報ID"
        string user_id FK "営業担当者ID"
        date report_date UK "日付"
        text problem "課題・相談（Problem）"
        text plan "明日やること（Plan）"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    Visit {
        string id PK "訪問記録ID"
        string daily_report_id FK "日報ID"
        string customer_id FK "顧客ID"
        text content "訪問内容"
        time visit_time "訪問時間"
        datetime created_at "作成日時"
    }

    Comment {
        string id PK "コメントID"
        string daily_report_id FK "日報ID"
        string user_id FK "投稿者ID（上長）"
        enum target_type "対象区分（PROBLEM/PLAN）"
        text content "コメント内容"
        datetime created_at "作成日時"
    }
```

## テーブル関連図（簡易版）

```mermaid
graph TD
    subgraph マスタ
        U[User<br/>ユーザー]
        C[Customer<br/>顧客]
    end

    subgraph トランザクション
        DR[DailyReport<br/>日報]
        V[Visit<br/>訪問記録]
        CM[Comment<br/>コメント]
    end

    U -->|1:N| DR
    U -->|1:N| CM
    DR -->|1:N| V
    DR -->|1:N| CM
    C -->|1:N| V
```

## リレーション説明

| 親テーブル | 子テーブル | 関係 | 説明 |
|------------|------------|------|------|
| User | DailyReport | 1:N | 1人のユーザーが複数の日報を作成 |
| User | Comment | 1:N | 1人の上長が複数のコメントを投稿 |
| DailyReport | Visit | 1:N | 1つの日報に複数の訪問記録 |
| DailyReport | Comment | 1:N | 1つの日報に複数のコメント |
| Customer | Visit | 1:N | 1つの顧客に複数の訪問記録 |

## 制約

### ユニーク制約
- `User.email`: メールアドレスは一意
- `DailyReport(user_id, report_date)`: 同一ユーザーの同一日付の日報は1件のみ

### 外部キー制約
- `DailyReport.user_id` → `User.id`
- `Visit.daily_report_id` → `DailyReport.id`
- `Visit.customer_id` → `Customer.id`
- `Comment.daily_report_id` → `DailyReport.id`
- `Comment.user_id` → `User.id`

### Enum定義
- `User.role`: `SALES`（営業）, `MANAGER`（上長）
- `Comment.target_type`: `PROBLEM`, `PLAN`
