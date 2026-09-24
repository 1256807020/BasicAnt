# ReactAdmin — React 19 + antd 6 中后台管理系统

> 一套「干净、可直接运行、易扩展」的国内主流 React 中后台框架基线。
> 后端对接 [`BasicApi`](../../BasicApi)（文件型 JSON 快速接口，端口 `1234`），遵循统一的 `{ code, data, msg }` 响应契约。

---

## 一、特性

- **技术新颖**：React 19 + antd 6 + Vite 8 + TypeScript 6，支持 React 19 新特性与 RSC 之前的现代写法。
- **骨架完整**：入口装配 → 路由 → 三栏布局 → 登录守卫 → 全局状态 → 请求层，开箱即用。
- **RBAC 权限**：菜单级（按权限码过滤侧边栏）+ 按钮级（`<Auth code="...">` 包裹）。
- **CRUD 零样板**：`createCrudApi(resource)` 一行生成一个集合的完整增删改查接口。
- **契约统一**：与 BasicApi 解耦，后端换成 Nest/CMS 时**只改一个 `baseURL`** 即可切换。
- **动效方案**：内置 GSAP + Lenis（页面/滚动特效）、Framer Motion（组件微交互）、Three.js（3D）、Lottie（资产动画），可叠加使用。

---

## 二、技术栈

| 类别     | 技术               | 版本   | 用途                                    |
| -------- | ------------------ | ------ | --------------------------------------- |
| 框架     | React              | 19.2   | UI 库                                   |
| 语言     | TypeScript         | 6.0    | 类型安全                                |
| 构建     | Vite               | 8.0    | 开发服务器 & 生产构建                   |
| 路由     | React Router DOM   | 7.15   | 客户端路由（嵌套 / 守卫 / 404）         |
| 数据请求 | TanStack Query     | 5.100  | 服务端状态管理                          |
| 表单     | React Hook Form    | 7.76   | 表单状态管理                            |
| 验证     | Zod                | 4.4    | Schema 验证                             |
| 状态     | Zustand            | 5.0    | 全局轻量状态（主题 / 登录态）           |
| 状态     | Redux Toolkit      | 2.12   | 企业级状态（按需使用）                  |
| UI 库    | Ant Design         | 6.6    | 企业级组件库                            |
| 图标     | @ant-design/icons  | 6.3    | 图标                                    |
| Hook 库  | ahooks             | 3.9    | 通用 React Hook                         |
| 图表     | ECharts            | 6.1    | 数据可视化                              |
| HTTP     | Axios              | 1.16   | 请求封装（拦截器 / 解包）               |
| 动画     | Framer Motion      | 13.1   | 组件级声明式微交互（已内置）            |
| 动画     | GSAP               | 3.15.0 | 时间轴 / 滚动驱动动画                   |
| 动画     | Lenis              | 1.3.26 | 平滑惯性滚动                            |
| 动画     | @gsap/react        | 2.1.2  | GSAP 官方 `useGSAP` React Hook          |
| 动画     | split-type         | 0.3.4  | 文字拆字（配合 GSAP 做逐字揭示）        |
| 动画     | lottie-react       | 3.1.2  | Lottie(JSON) 动画                       |
| 3D       | three              | 0.186  | WebGL 3D 引擎                           |
| 3D       | @react-three/fiber | 9.8    | React 声明式封装 three（兼容 React 19） |
| 3D       | @react-three/drei  | 10.7   | three 常用辅助组件                      |

---

## 三、快速开始

```bash
# 1) 安装依赖
pnpm install

# 2) 启动后端 BasicApi（默认 1234 端口，独立仓库）
cd ../../BasicApi && npm start

# 3) 启动前端（Vite 默认 5173，自动把 /api 代理到 1234）
pnpm dev

# 演示账号：admin / 123456（超级管理员）、zhangsan / 123456（部门经理）、lisi / 123456（普通用户）
```

常用脚本：

| 命令             | 说明                                      |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | 启动开发服务（已配置 `/api` 代理到 1234） |
| `pnpm build`     | 类型检查 + 生产构建                       |
| `pnpm typecheck` | 仅 TypeScript 检查                        |
| `pnpm lint`      | ESLint 检查                               |

环境变量（可选，均有默认值）：

| 变量                | 默认                    | 说明                                 |
| ------------------- | ----------------------- | ------------------------------------ |
| `VITE_API_BASE_URL` | `/api`                  | 请求基址；生产环境可指向真实后端域名 |
| `VITE_API_TARGET`   | `http://127.0.0.1:1234` | 开发代理目标（BasicApi）             |

---

## 四、目录结构

```
src/
├── main.tsx                 # 应用入口（StrictMode 挂载）
├── App.tsx                  # 根组件：ConfigProvider(国际化+主题) → AntdApp → BrowserRouter → AppRouter
├── api/
│   ├── crud.ts              # 通用 CRUD 工厂 createCrudApi(resource)
│   ├── rbac.ts              # RBAC 接口（登录/用户/角色/权限/部门/字典/日志）
│   └── index.ts             # 业务接口汇总（articleApi / noticeApi / configApi / tableApi / postApi ...）
├── components/
│   ├── Auth.tsx             # <Auth code="..."> 按钮级权限包裹
│   ├── EChart.tsx           # echarts 封装
│   └── GlobalNotifier.tsx   # 全局消息桥接（接收 axios 拦截器的提示）
├── config/menu.ts           # 菜单配置（带权限码，按权限过滤）
├── hooks/
│   ├── useCrudList.ts       # 通用列表查询 Hook（分页/关键字/筛选/刷新）
│   └── usePermission.ts     # 按钮级鉴权 Hook
├── layouts/
│   ├── BasicLayout.tsx      # 三栏框架 + 登录守卫（无 token 跳 /login）
│   ├── AppSider.tsx         # 侧边栏菜单（按权限过滤）
│   └── AppHeader.tsx        # 顶栏（折叠/面包屑/换肤/退出）
├── pages/
│   ├── dashboard/           # 仪表盘（数据总览）
│   ├── login/               # 登录 + 注册
│   ├── profile/             # 个人中心
│   ├── system/              # 系统管理：user/role/permission/dept/post/dict/log/config
│   ├── content/             # 内容管理：article/notice
│   ├── data/table/          # 通用数据（极简 CRUD 模板）
│   └── error/NotFound.tsx   # 404
├── router/
│   ├── AppRouter.tsx        # 由路由表渲染 <Routes>（Suspense + 404）
│   └── routes.tsx           # 路由表（React.lazy 代码分割）
├── store/useAppStore.ts     # 全局状态（zustand + 持久化）
├── styles/global.css        # 全局样式（仅框架级布局）
├── types/                   # 类型定义（index.ts 通用 + rbac.ts 权限）
└── utils/
    ├── request.ts           # axios 封装（token 注入 + 信封解包 + 401 清理）
    ├── auth.ts              # token 存取（localStorage 'reactadm_token'）
    └── notify.ts            # 脱离 React 树的全局消息通道
```

---

## 五、架构与数据流

### 5.1 入口链路

```
index.html
  └─ src/main.tsx            # createRoot 挂载 <App/>
       └─ src/App.tsx        # ConfigProvider(国际化 zhCN + theme.token)
            └─ <BrowserRouter>
                 └─ <AppRouter/>            # 路由分发
                      └─ <BasicLayout/>     # 登录守卫 + 三栏布局
                           └─ <Outlet/>     # 渲染当前页面
```

### 5.2 请求层契约（与 BasicApi 对齐）

`utils/request.ts` 做了三件事：

1. **baseURL**：`import.meta.env.VITE_API_BASE_URL || '/api'`，开发时由 Vite 代理到 BasicApi（`:1234`）。
2. **请求拦截**：自动注入 `Authorization: Bearer <token>`，并写入操作人 `x-user-id` / `x-user-name`（供后端审计）。
3. **响应拦截**：统一解包 `{ code, data, msg }`；`code !== 0` 自动提示并抛 `ApiError`；HTTP `401` 自动清理登录态。

```ts
// 业务调用示例：拿到的直接是 data，无需自己拆信封
const { list, total } = await fetchUsers({ page: 1, pageSize: 10 });
```

### 5.3 路由与登录守卫

- 路由表集中在 `router/routes.tsx`，用 `React.lazy` 做页面级代码分割。
- 登录守卫放在 `layouts/BasicLayout.tsx`：**骨架层**拦截，无 `token` 直接 `<Navigate to="/login">`，比逐路由套守卫更省事，功能等价。
- 公共页（`/login`）在守卫之外，登录后跳回 `state.from` 或 `/dashboard`。

### 5.4 三栏布局

`BasicLayout = Sider(菜单) + Header(工具) + Content(<Outlet/>) + Footer`。

- `AppSider`：读 `config/menu.ts` 的 `menuConfig`，用 `useAppStore.hasPermission` 按权限码过滤菜单（超级管理员恒可见）。
- `AppHeader`：侧边栏折叠、面包屑（`titleMap`）、主题切换、主色 `ColorPicker`、用户下拉（个人中心 / 退出）。

### 5.5 全局状态（Zustand）

`store/useAppStore.ts` 持久化到 `localStorage['reactadm_app']`，管理：

| 字段           | 说明                                                   |
| -------------- | ------------------------------------------------------ |
| `token`        | 登录令牌（同时写入 `reactadm_token`，供 request 读取） |
| `userInfo`     | 含 `permissions` / `roleNames` / `isAdmin` 等          |
| `theme`        | `light` / `dark`，驱动 `ConfigProvider` 算法           |
| `colorPrimary` | 主色，实时写入 `theme.token`                           |
| `collapsed`    | 侧边栏折叠                                             |

换肤是实时的：`App.tsx` 订阅 `theme` 与 `colorPrimary`，直接传入 `ConfigProvider` 的 `theme` prop。

---

## 六、接口约定（BasicApi）

- 基础地址：`/api`（开发代理到 `http://127.0.0.1:1234`）
- 成功响应：`{ code: 0, data, msg, total?, page?, pageSize?, totalPages? }`
- 列表查询参数：`page` `pageSize` `keyword` `keywordFields` `sort` `order` `tree`
- 通用 CRUD：`GET /:resource`、`POST /:resource`、`PATCH /:resource/:id`、`DELETE /:resource/:id`、`POST /:resource/batch-delete`
- RBAC 层：`/api/rbac/*`（登录 / 用户 / 角色 / 权限 / 部门 / 字典 / 日志，后端做内存 JOIN 后返回聚合结果）

> **核心原则（家族约定）**：接口契约一旦在 BasicApi 定型，后续换成 Nest / CMS 生产后端时，**前端只改一个 `baseURL`** 即可切换，业务代码零改动。

---

## 七、RBAC 权限模型

三级授权链路：`user.roleIds → role → role_permission → permission`，外加 `dataScope`（全部 / 本部门及以下 / 本部门 / 仅本人）。

- **菜单级**：后端返回 `permissions` → `AppSider` 按 `code` 过滤侧边栏。
- **按钮级**：`<Auth code="system:user:add"><Button>新增</Button></Auth>`；无权限则不渲染。
- **审计**：`request.ts` 写入 `x-user-id` / `x-user-name`，后端中间件自动记录写操作并脱敏密码。

初始化数据：`POST /api/rbac/seed?confirm=1`（或前端「系统管理」触发）。

---

## 八、页面开发模式（核心套路）

中后台 90% 的页面都是「筛选 + 表格 + 分页 + 弹窗增改 + 删除」。本框架把这部分抽成了可复制模板。

### 8.1 一个集合 = 一行接口

```ts
// src/api/index.ts
export const articleApi = createCrudApi<ArticleItem>('article');
// 即得 list / detail / create / update / remove / batchRemove / count
```

`createCrudApi` 在 `api/crud.ts` 定义，直接对接 BasicApi 的通用 CRUD，无需手写每个请求。

### 8.2 列表逻辑 = 一个 Hook

`hooks/useCrudList.ts` 统一管理 `page / pageSize / keyword / filters / loading / reload`，页面里只需：

```ts
const { list, total, loading, page, pageSize, setPage, setPageSize, setKeyword, reload } =
  useCrudList<TableItem>(tableApi.list, { keywordFields: 'title,content' });
```

### 8.3 两个现成模板（照抄即可）

| 模板     | 文件                          | 复杂度 | 包含                                                                             |
| -------- | ----------------------------- | ------ | -------------------------------------------------------------------------------- |
| 极简模板 | `pages/data/table/index.tsx`  | ★      | 搜索 + 表格 + Modal 增改 + 删除                                                  |
| 富模板   | `pages/system/user/index.tsx` | ★★★    | 左部门树 + 右表格、Modal 表单、Drawer 分配角色、Popconfirm 删除、按钮级 `<Auth>` |

**照抄顺序**：复制 `data/table` → 改 `useCrudList` 的 api 与字段 → 调列定义 → 用 `<Auth>` 包按钮。一个业务页 10 分钟成型。

### 8.4 按钮级权限

```tsx
import Auth from '@/components/Auth';

<Auth code="system:user:add">
  <Button type="primary" onClick={openCreate}>
    新增
  </Button>
</Auth>;
```

---

## 九、动效方案

各动效库**分层互补、互不冲突**，可按需叠加：

| 库                                        | 负责层             | 典型场景                          |
| ----------------------------------------- | ------------------ | --------------------------------- |
| Framer Motion（已内置）                   | 组件级微交互       | 卡片/列表/模态过渡                |
| GSAP + Lenis（新装）                      | 页面级 / 滚动驱动  | 滚动揭示、时间轴、惯性平滑滚动    |
| split-type（新装）                        | 文字特效           | 标题逐字/逐词揭示（配合 GSAP）    |
| @gsap/react（新装）                       | GSAP 的 React 绑定 | `useGSAP` 让动画生命周期安全      |
| lottie-react（新装）                      | 资产动画           | 加载/空态/成功提示（Lottie JSON） |
| three / @react-three/fiber / drei（新装） | 3D                 | 炫酷 3D 背景 / 视觉模块           |

> 依赖已安装，业务特效页模块可直接 `import` 使用；本基线不内置示例，由具体页面按需引入。

---

## 十、学习路径

1. **阶段 A — 搭骨架**：读懂 `App.tsx → router → layouts → store → utils/request` 五层装配。
2. **阶段 B — 学页面模式**：以 `pages/data/table`（极简）和 `pages/system/user`（富）为模板，照抄出自己的 CRUD 页。
3. **阶段 C — 啃 React 基础**：在业务中体会 hooks / 受控表单 / 权限 / 状态管理。

建议从「复制 `data/table` 模板、新建一个集合的 CRUD 页」开始动手，最快建立整体感。
