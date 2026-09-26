# 部署手册（BasicAnt 前端 + BasicNest 后端）

> 最后更新：2026-09-26
> 适用范围：前端 Netlify / 后端 Suga 容器 / 数据库 Supabase Postgres / 缓存 Redis Cloud / 对象存储 Supabase Storage
> 本文所有代码片段、路径、提交号均对照代码现状，非臆测。

---

## 0. 架构一览

| 层            | 技术                                                       | 托管                                              | 访问地址                                                                                      |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 前端          | BasicAnt（Vite + React19 + antd6 + zustand + react-query） | Netlify 静态托管                                  | 自己绑定的二级域名（如 `basic-ant.fmvp.club`）                                                |
| 后端          | BasicNest（NestJS 12 + Prisma 7 + swc）                    | Suga 容器                                         | `https://bw1vsfc5sd5i-production-82lvx7lm.us-central1.suga.run`（端口 1234，全局前缀 `/api`） |
| 数据库        | PostgreSQL                                                 | Supabase（ref `ujhvdujrapamgyjegoky`，us-east-2） | 连接串见 `.env.production`                                                                    |
| 缓存 / 在线态 | Redis                                                      | Redis Cloud 免费档                                | 连接串见 `.env.production`                                                                    |
| 对象存储      | Supabase Storage                                           | Supabase 公开桶 `basic-nest`                      | CDN：`https://ujhvdujrapamgyjegoky.supabase.co/storage/v1/object/public/basic-nest/...`       |

---

## 1. 后端 BasicNest → Suga

### 1.1 构建与启动（已绕过 TS7 限制）

`nest build` 被 TypeScript 7.0 阻断，改用 swc 编译：

```bash
npx swc src -d dist --strip-leading-paths
node dist/main.js
```

Suga 平台按上述方式配置启动命令（源码已在仓库，Suga 连 GitHub `1256807020/BasicNest` 拉取）。

### 1.2 环境变量（Suga Env Vars 面板）

**全部变量逐条填到 Suga**，值与本地 `.env.production` 一致（该文件已 gitignore，不入库；密钥请勿提交、勿贴入公开文档）。

必填关键项：

- `DATABASE_URL`：Supabase **事务池** 6543（`?pgbouncer=true`），运行时连库用。
- `DIRECT_URL`：Supabase **会话池** 5432，仅 `prisma migrate` 用。
- `REDIS_*`：Redis Cloud（密码见 `.env.production`）。
- `JWT_SECRET`：强随机值。
- `CORS_ORIGIN`：**必须 = 前端真实域名**，如 `https://basic-ant.fmvp.club`。浏览器同源策略会拦截不符的跨域 API（见第 4 节坑 8）。
- `SUPABASE_STORAGE_ENABLED=true` + `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_BUCKET=basic-nest`：开启对象存储上传。

> ⚠️ **Suga 平台【不要】设置 `NODE_ENV`**（会与平台内置冲突）。`.env.production` 里的 `NODE_ENV=production` 仅本地 `NODE_ENV=production node dist/main.js` 用，填 Suga 时省略该项。

### 1.3 健康检查 `/api/_health`

- 路径：`GLOBAL_PREFIX=api` + 控制器 `_health` → 完整路径 `/api/_health`（标记 `@Public()`，无需鉴权）。
- 由 `@nestjs/terminus` 驱动，三项探针：`database` / `redis` / `storage`。
- `storage` 为**软探针**（见 `src/health/storage.health.ts`）：
  - `SUPABASE_STORAGE_ENABLED !== 'true'` → `up (disabled)`；
  - 启用时 `HEAD /storage/v1/bucket/{bucket}`，`200`/`404` 视为可达；任何网络异常只写 `message`，**整体仍返回 up**，避免可降级存储把健康 Pod 误重启（K8s 探针语义）。
- 任一**硬依赖**（DB / Redis）不可用时整体返回 `503`。
- 今日线上实测响应（已 Redeploy 生效）：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "status": "ok",
    "info": {
      "database": { "status": "up" },
      "redis": { "status": "up" },
      "storage": { "status": "up", "message": "reachable (bucket=basic-nest, http=200)" }
    }
  }
}
```

### 1.4 上传后端选择（`src/modules/upload/upload.service.ts`）

默认全部关闭，显式环境变量才启用，fail-closed：

- `SUPABASE_STORAGE_ENABLED=true` 且密钥齐全 → 写入 Supabase Storage，返回 CDN URL；
- 否则回落本地磁盘 `public/uploads`（容器临时盘，重新部署清空）。
- 桶 `basic-nest` 已建且 Public，`ensureBucket()` 幂等。今日线上验证：测试图片已落桶（文件名 `05a4dd1c-...png`）。

### 1.5 WebSocket 网关 `/ws/notifications`（`src/modules/notifications/notifications.gateway.ts`）

- `@WebSocketGateway({ path: '/ws/notifications' })`，**无 `/api` 前缀**（仅 REST 有全局前缀）。
- 鉴权：连接 URL 带 `?token=<accessToken>`，校验失败 `close(4001/4003)`。
- 连接成功即下发 `init` 未读数；服务端发通知时推送 `notification` 事件。
- **不校验 Origin**（靠 token 鉴权），因此前端可**跨域直连 Suga**，无需反向代理 `/ws`。

---

## 2. 前端 BasicAnt → Netlify

### 2.1 构建配置 `netlify.toml`（已入库）

```toml
[build]
  command = "pnpm build"      # 注意：pnpm build = `tsc -b && vite build`，会先做全量类型检查
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"         # Vite8 建议 20.19+/22+；若 Netlify 构建报 Node 版本错，升到 22
```

Netlify 检测到 `pnpm-lock.yaml` 会自动用 pnpm 安装依赖。

### 2.2 必填环境变量（Site settings → Environment variables）

> 纯静态托管**没有** `/api`、`/ws` 代理，生产必须由前端直连 Suga。下列两变量缺失会导致 API 全 404 / WS 断连。

| 变量                | 值                                                                  |
| ------------------- | ------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://bw1vsfc5sd5i-production-82lvx7lm.us-central1.suga.run/api` |
| `VITE_WS_BASE_URL`  | `wss://bw1vsfc5sd5i-production-82lvx7lm.us-central1.suga.run`       |

（`netlify.toml` 注释里也有同款，可取消注释直接提交；Suga URL 是公开端点，无泄密风险。）

### 2.3 相关代码改动

- `src/vite-env.d.ts`：新增 `VITE_WS_BASE_URL` 类型（提交 `69ea003`）。
- `src/hooks/useNotifications.ts`：`wsUrl()` 支持 `VITE_WS_BASE_URL` 直连 Suga；**未配置时回退同源 dev proxy**，本地开发不受影响（提交 `69ea003`）。
- `src/utils/request.ts`：`axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' })`（既有逻辑）。

### 2.4 `.env` 治理（提交 `9f9a506`）

- 已将 `.env` / `.env.production` **移出版本跟踪**（`git rm --cached`，本地保留），仅 `.env.example` 模板入库。
- 原因：① 公开仓库不交 `.env`；② `.env.production` 内含 `VITE_API_BASE_URL=/api`，production 模式构建会被 Vite 加载，**一旦忘记在 Netlify 设变量就回落到 `/api` 导致 404**。生产地址只由 Netlify 注入最稳。

---

## 3. 今日（2026-09-26）端到端验证记录

| 环节          | 本地                                | 线上 Suga                                                                         |
| ------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| 依赖/服务在线 | Postgres 5433 ✅ / Redis 6379 ✅    | Suga 健康检查 `200`，`database up` + `redis up` ✅                                |
| 登录          | `admin / BasicNest@123` 成功        | 同凭证成功；登录后写 Redis（`online:users` / `online:<id>` / `rt:<id>`）          |
| 上传图片      | 落 Supabase Storage 桶 `basic-nest` | 桶内可见测试图（上传时间 18:18:25），Redis Cloud 仪表盘 `basic-nest` 库 3 keys ✅ |
| 新增文章      | Postgres 增加记录                   | Supabase Postgres 已写文章记录 ✅                                                 |
| WebSocket     | `/ws/notifications` 收到 `init`     | 线上 WS 可用（直连 Suga）                                                         |

**结论**：全链路打通——登录写 Redis Cloud → 上传落 Supabase Storage → 建文章写 Postgres → WS 实时推送。

---

## 4. 踩坑 / 经验（非常值得记）

1. **Prisma 7 + Supabase**：运行时 `DATABASE_URL` 走 6543 事务池（`pgbouncer=true`）；迁移 `DIRECT_URL` 走 5432 会话池（`prisma.config.ts` 内 `url: DIRECT_URL ?? DATABASE_URL`）。远程 `curl` 直连 supabase.co REST 会 `SSL exit 35`（网络被拦），但 Postgres 池端口可连，验证请用 pg 客户端而非 curl。
2. **`nest build` 被 TS7 阻断** → 走 swc：`npx swc src -d dist --strip-leading-paths && node dist/main.js`。
3. **Suga 不要设 `NODE_ENV`**（平台冲突）；其余变量照 `.env.production` 填。
4. **前端生产地址必须显式直连**：纯静态托管无同源代理，`VITE_API_BASE_URL` / `VITE_WS_BASE_URL` 缺一不可。
5. **Vite 环境变量优先级**：Netlify 注入的 `process.env` 高于 `.env` 文件；两者共存时 Netlify 赢。但**一旦忘了在 Netlify 设变量**，就会回落文件里的 `/api` → API 全 404。故 `.env.production` 不进仓库 + Netlify 必填两变量 是最稳组合。
6. **WS 网关靠 `?token=` 鉴权、不校验 Origin** → 前端可跨域直连 Suga，无需为 `/ws` 配代理/隧道。
7. **健康检查 storage 故意软处理（永远 up）**：避免可降级存储把健康 Pod 误重启；真实上传失败由 `UploadService` 回落本地磁盘兜底。
8. **CORS 是常见隐形坑**：Suga 的 `CORS_ORIGIN` 必须包含前端**真实域名**（当前 `https://basic-ant.fmvp.club`）。换域名/子域名必须同步改 Suga 变量并重部署，否则浏览器拦截 API（现象：前端能打开，但所有请求 CORS 失败）。
9. **公开仓库隐私**：BasicAnt 已设为公开。仓库内**无真实密钥**——仅 `VITE_*` 公开变量 + Suga URL（公开端点）。所有密钥只在本地 `.env.production`（gitignore）与 Suga 平台，未入库、未入本文档。
10. **Netlify 构建 = `tsc -b && vite build`**：构建会先做全量 TS 类型检查。若 Netlify 部署失败，优先排查类型错误（而非配置）。本地先 `pnpm build` 跑通再发布。

---

## 5. 接下来：绑定二级域名 + 上线测试（用户操作）

1. Netlify 导入 GitHub `1256807020/BasicAnt` → 填第 2.2 节两个环境变量 → Deploy。
2. 绑定二级域名（如 `basic-ant.fmvp.club`）到 Netlify。
3. **核对 CORS**：Suga 的 `CORS_ORIGIN` 须等于该前端域名（`.env.production` 当前已配 `https://basic-ant.fmvp.club`，一致则无需改；若用其他域名，改 Suga 变量并重部署）。
4. 浏览器打开前端 → 登录 → 上传图片（确认落 Supabase Storage）→ 新增文章（确认 Postgres 记录）→ 看站内信 WS 是否实时推送。
5. 异常排查顺序：① Netlify 构建日志（`tsc -b` 类型错误？）② 前端 Network 面板（API 是否 CORS 失败 → 检查 `VITE_API_BASE_URL` / Suga `CORS_ORIGIN`）③ Suga `/api/_health`（DB/Redis/Storage 是否 up）。

---

## 6. 相关提交

- BasicNest `3a795e8`（已 push）：新增 storage 健康软探针（`src/health/storage.health.ts` + 接入 `HealthModule`/`HealthController`）。
- BasicAnt `69ea003`（已 push）：兼容纯静态托管——`VITE_WS_BASE_URL` 直连 Suga + `netlify.toml`。
- BasicAnt `9f9a506`（已 push）：从版本库移除 `.env`/`.env.production`，生产变量改由 Netlify 注入。
