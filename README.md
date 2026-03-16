# sally

多用戶記帳 Web 應用，支援 JWT 登入、分類管理、多幣別、收支紀錄、統計圖表、外觀自訂與操作稽核。

## 功能

- 收入 / 支出記錄，支援分類、幣別、備註、日期
- 分類管理：自訂圖示（emoji）與顏色，支援全域分類（管理員）與個人分類
- 多幣別支援：可新增幣別並套用於每筆交易
- 報表：月收支趨勢、分類佔比圖表，支援匯出 Excel
- 外觀自訂：純色、漸層、圖片背景，支援自訂 CSS
- 帳號管理：修改密碼、個人資料
- 管理員：管理所有用戶帳號與角色、查看操作稽核日誌

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS + Recharts + xlsx |
| 後端 | Node.js + Express + Prisma ORM |
| 資料庫 | PostgreSQL 15 |
| 部署 | Docker Compose + Nginx |

---

## 本地開發

### 前置需求

- Node.js 20.6+
- Docker（用來跑本地資料庫）

### 1. 啟動資料庫

```bash
docker run -d \
  --name tally-db \
  -e POSTGRES_USER=sa \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=tally \
  -p 5432:5432 \
  postgres:15-alpine
```

> 之後重新開機只需要 `docker start tally-db`

### 2. 設定後端環境變數

```bash
cd backend
cp .env.example .env
```

編輯 `backend/.env`，確認 `DATABASE_URL` 對應你的資料庫設定：

```
DATABASE_URL=postgresql://sa:yourpassword@localhost:5432/tally
JWT_SECRET=any-random-secret-string
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

### 3. 設定前端環境變數

```bash
cd frontend
cp .env.example .env
```

`frontend/.env` 預設內容：

```
VITE_API_URL=http://localhost:3000
```

### 4. 安裝依賴並執行 Migration

```bash
# 後端
cd backend
npm install
npm run prisma:migrate   # 建立資料表（首次或 schema 有變動時執行）
```

```bash
# 前端
cd frontend
npm install
```

### 5. 啟動開發伺服器

分兩個終端各自啟動：

```bash
# 終端 1 - 後端
cd backend
npm run dev
```

```bash
# 終端 2 - 前端
cd frontend
npm run dev
```

瀏覽器開啟：**http://localhost:5173/tally**

---

## Docker 部署

### 前置需求

- Docker + Docker Compose

### 1. 設定環境變數

```bash
cp backend/.env.docker.example backend/.env.docker
```

編輯 `backend/.env.docker`，**至少修改 `JWT_SECRET`**：

```
DATABASE_URL=postgresql://sa:yourpassword@postgres:5432/tally
POSTGRES_USER=sa
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=tally
JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
```

> 注意：Docker 環境中 `DATABASE_URL` 的 host 必須是 `postgres`（容器名稱），不是 `localhost`

### 2. 建構並啟動

```bash
docker-compose up --build -d
```

瀏覽器開啟：**http://localhost:48780/tally/**

### 3. 常用指令

```bash
# 查看所有容器狀態
docker-compose ps

# 查看後端 log
docker-compose logs -f backend

# 停止所有服務
docker-compose down

# 停止並清除資料庫資料（慎用）
docker-compose down -v
```

---

## 帳號權限

| 角色 | 說明 |
|------|------|
| ADMIN | 第一個註冊的帳號自動取得，可管理所有用戶的角色與狀態、查看稽核日誌 |
| USER | 一般用戶，只能存取自己的記帳資料 |

---

## 專案結構

```
tally/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf              # 反向代理設定
├── backend/
│   ├── .env.example            # 本地開發環境變數範本
│   ├── .env.docker.example     # Docker 部署環境變數範本
│   ├── prisma/
│   │   └── schema.prisma       # 資料庫 schema
│   └── src/
│       ├── index.js
│       ├── middleware/
│       │   └── auth.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── categories.js
│       │   ├── currencies.js
│       │   ├── monitor.js      # 稽核日誌（Admin）
│       │   ├── preferences.js  # 外觀偏好設定
│       │   ├── transactions.js
│       │   └── users.js
│       └── utils/
│           └── audit.js        # 寫入稽核日誌的工具函式
└── frontend/
    ├── .env.example            # 本地開發環境變數範本
    └── src/
        ├── api/
        ├── components/
        │   ├── CategoryModal.jsx
        │   ├── Layout.jsx
        │   └── TransactionModal.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx # 外觀主題管理
        └── pages/
            ├── Appearance.jsx   # 背景 / 主題自訂
            ├── Categories.jsx
            ├── Currencies.jsx
            ├── Dashboard.jsx
            ├── Login.jsx
            ├── Monitor.jsx      # 稽核日誌（Admin）
            ├── Profile.jsx      # 個人資料 / 修改密碼
            ├── Reports.jsx      # 報表與圖表
            ├── Transactions.jsx
            └── Users.jsx        # 用戶管理（Admin）
```
