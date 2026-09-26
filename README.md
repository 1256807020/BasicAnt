# BasicAnt — React 19 + antd 6 中后台管理系统（BasicNest 配套前端）

> 一套「干净、可直接运行、易扩展」的国内主流 React 中后台框架基线。
> 默认对接 **[`BasicNest`](../../BasicNest)**（Nest.js 12 + Prisma 7 企业级 RBAC 基座，端口 `1234`），遵循统一的 `{ code, data, msg }` 响应契约。前端项目名为 **BasicAnt**，与后端 **BasicNest** 为配套前后端；启动后端后，前端 `VITE_API_TARGET` 指向 `http://127.0.0.1:1234` 即可联调。

---

## 一、特性

- **技术新颖**：React 19 + antd 6 + Vite 8 + TypeScript 6，支持 React 19 新特性与 RSC 之前的现代写法。
- **骨架完整**：入口装配 → 路由 → 三栏布局 → 登录守卫 → 全局状态 → 请求层，开箱即用。
- **RBAC 权限**：菜单级（按权限码过滤侧边栏）+ 按钮级（`<Auth code="...">` 包裹）。
- **CRUD 零样板**：`createCrudApi(resource)` 一行生成一个集合的完整增删改查接口。
- **契约统一**：与后端（BasicNest）解耦，未来如需替换后端实现，**只改一个 `baseURL`** 即可切换。
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

# 2) 启动后端 BasicNest（默认 1234 端口，独立仓库）
cd ../../BasicNest && pnpm install && pnpm db:generate && pnpm db:migrate && pnpm seed && pnpm start
#    （前端依赖 BasicNest 提供接口，请先启动后端 BasicNest，再启动前端）

# 3) 启动前端（Vite 默认 5173，自动把 /api 代理到 1234）
pnpm dev

# 演示账号：admin / BasicNest@123（超级管理员）、zhangsan / BasicNest@123（部门经理）、lisi / BasicNest@123（普通用户）。
# 更多交叉验证账号（如多角色并集 poly、无角色 guest、禁用 disabled1、自定义范围 customuser、仅本人 selfuser、空权限 emptyuser）见 BasicNest README「演示账号与交叉验证」章节，密码均为 BasicNest@123。
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
| `VITE_API_TARGET`   | `http://127.0.0.1:1234` | 开发代理目标（BasicNest 后端地址）   |

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

### 5.2 请求层契约（与 BasicNest 对齐）

`utils/request.ts` 做了三件事：

1. **baseURL**：`import.meta.env.VITE_API_BASE_URL || '/api'`，开发时由 Vite 代理到 BasicNest（`:1234`）。
2. **请求拦截**：**仅**注入 `Authorization: Bearer <token>`。操作人身份由后端从 JWT 解析（`ctx.state.user`），**不再信任客户端自报**——早期版本曾写 `x-user-id` / `x-user-name` 头，现已移除（后端审计拦截器也以 JWT 为准，仅在缺失 token 时回退读该头，属兼容保留）。
3. **响应拦截**：统一解包 `{ code, data, msg }`；`code !== 0` 自动提示并抛结构化 `ApiError`（携带 `errors?` / `status?`）。HTTP `401` 清理登录态并跳回 `/login`（并发 401 时提示去重，避免刷屏）；其余错误码只提示不登出。
   - 业务错误优先展示**后端 `msg` 具体文案**（如「用户名已存在」「密码需包含字母」），不被前端通用翻译覆盖。
   - 校验类错误（HTTP `422`）后端额外返回 `errors: { 字段: 提示 }`，表单可经 `form.setFields` 内联到对应字段（见 `pages/system/user` 的新增用户弹窗）。

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

- `AppSider`：读 `config/menu.ts` 的 `menuConfig`，用 `hasMenu`（前缀匹配：拥有 `code` 或其任意 `code:*` 后代即视为可见）过滤菜单；超级管理员因登录时拿到全量权限码而恒可见。完整流程见第七章。
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

## 六、接口约定（BasicNest）

- 基础地址：`/api`（开发代理到 `http://127.0.0.1:1234`）
- 成功响应：`{ code: 0, data, msg, total?, page?, pageSize?, totalPages? }`
- 列表查询参数：`page` `pageSize` `keyword` `keywordFields` `sort` `order` `tree`
- 通用 CRUD：`GET /:resource`、`POST /:resource`、`PATCH /:resource/:id`、`DELETE /:resource/:id`、`POST /:resource/batch-delete`、`GET /:resource/_count`
- RBAC 层：`/api/rbac/*`（登录 / 用户 / 角色 / 权限 / 部门 / 字典 / 日志等，后端在 Prisma 层 JOIN 聚合后返回结果）

> **核心原则（家族约定）**：接口契约由 **BasicNest（后端）** 定义并保持稳定——统一的 `{ code, data, msg }` 信封、分页参数与 CRUD / RBAC 路由形状；**BasicAnt（前端）** 据此实现。若未来替换后端实现，**前端只改一个 `baseURL`** 即可，业务代码零改动。

> **核心原则（家族约定）**：BasicAnt 与 BasicNest 通过定型后的接口契约解耦，二者默认配套使用；切换 / 替换后端实现时，**前端只改一个 `baseURL`** 即可，业务代码零改动。

---

## 七、RBAC 权限模型（完整流程与缺口）

> 本章记录 BasicAnt（前端）与 BasicNest（后端）**已实现的完整权限流程**，并逐条标注 §7.5 中曾被列为「企业级缺口」的项**当前闭合状态**（基于 BasicNest 实测，2026-09-25 联调验证）。BasicNest 已作为正式后端落地，前端不再依赖任何快速基线。

### 7.1 授权链路与数据模型

```
user.roleIds  ──(多对多)──▶  role  ──(多对多)──▶  role_permission  ──▶  permission(树形)
                                          │
                                          └─ role.dataScope（全部 / 本部门及以下 / 本部门 / 仅本人）
```

- **permission 是一棵树**：`parentId` 自关联，`type` ∈ `menu`（菜单）/ `button`（按钮）/ `api`（接口）。
- **code 统一冒号格式**：模块:操作，如 `system:user`、`system:user:add`、`content:post:list`。

### 7.2 权限分配流程（角色管理页）

1. 拉全量权限树：`GET /api/rbac/permissions?tree=1`。
2. antd `Tree` `checkable` + 级联勾选（勾父自动选子、取消子父变半选）。
3. **回显**：`GET /api/rbac/role/permissions` → 过滤父节点、**只勾叶子**（半选状态交给 Tree 自动推导）。
4. **保存**：从已勾叶子**向上推导所有祖先** → 提交「完整树 ID（父+子）」→ `POST /api/rbac/role/permissions`。
5. 后端**覆盖式写入**（先删该角色全部关联、再批量插入），不会出现「取消勾选却残留」的脏数据。

> 设计要点：提交存完整树、回显只勾叶子。这样既能让菜单按父级可见性正确显示，又避免前端级联勾选导致的回显错乱。

### 7.3 权限消费链路（前端如何判定「有无权限」）

| 环节         | 机制                                                                                                                         | 匹配方式                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 登录/me 组装 | `buildAuthPayload` 把 `role_permission` 的 ID 映射成 code 列表，写入 `userInfo.permissions`；`admin` 角色直接拿**全量** code | —                                                                                         |
| 菜单过滤     | `AppSider.hasMenu(code)`                                                                                                     | **前缀匹配**：`code` 或任意 `code:*` 命中即可见（父级「自身可见 或 任一子级可见」则保留） |
| 按钮鉴权     | `<Auth code="...">` → `usePermission.hasPermission`                                                                          | **精确匹配**（叶子即按钮码，精确最稳妥）                                                  |
| 超级管理员   | `userInfo.isAdmin` 短路，恒 `true`                                                                                           | —                                                                                         |

```ts
// src/layouts/AppSider.tsx —— 菜单前缀匹配（解决「有 list 权限却看不到菜单」）
const hasMenu = (code?: string): boolean =>
  permissions?.some((p) => p === code || p.startsWith(`${code}:`)) ?? false;

// src/store/useAppStore.ts —— 按钮精确匹配 + admin 短路
hasPermission: (code) =>
  !code ? true : userInfo?.isAdmin ? true : (userInfo.permissions ?? []).includes(code);
```

### 7.4 当前已实现（BasicNest 已落地）

- ✅ 用户↔角色↔权限三件套关联（关联表 `user_role` / `role_permission`，非单字段反查）+ 角色 `dataScope` 字段
- ✅ 级联勾选分配 + 完整树存储 + 覆盖式保存（无脏数据）
- ✅ 菜单前缀匹配、按钮精确匹配、超级管理员短路
- ✅ 写操作审计日志（操作人取自 JWT + 模块 + 动作，脱敏、跳过自身）
- ✅ 内置 `admin` 角色防删除
- ✅ `userInfo` 持久化（zustand + localStorage）与版本迁移
- ✅ **后端接口级鉴权**：`RequirePermGuard` 全局守卫，无权限 `403`（2026-09-25 实测：无权限账号调受保护接口返回 403）
- ✅ **数据权限生效**：`dataScope` 注入查询条件，非管理员仅见授权范围（2026-09-25 实测：部门经理可见 2 人 / admin 可见 3 人）
- ✅ **前端路由级守卫**：`RequirePerm` 按菜单权限码拦截无权限页面，直访 URL 渲染 403（2026-09-25 落地）
- ✅ **权限实时刷新**：后端推 `permission_updated` → 前端 WS 监听调用 `refreshUserInfo()` 原地更新（免重登，2026-09-25 落地）

### 7.5 企业级缺口闭合状态（基于 BasicNest 实测）

> 以下原列为「企业级缺口」，现基于 BasicNest 实测（2026-09-25 联调）逐条标注闭合状态。✅ 已验证可用，❌ 前端侧仍待补，🔶 规划中。

1. **后端接口级鉴权** ✅ **已闭合（实测）**：`RequirePermGuard` 全局守卫读取 `@RequirePerm(...)`，无权限返回 `403`，`isAdmin` 恒放行。验证：无权限账号调 `/rbac/users` 返回 403，admin 返回 200。
2. **数据权限（dataScope）** ✅ **已生效（实测）**：`DataScopeService.applyWhere` 在 `users` / `posts` 列表注入部门范围条件，`self/dept/deptAndBelow/all/custom` 按 `deptId` 过滤且分页 `total` 同步。验证：部门经理（deptAndBelow）可见用户数 2，admin 可见 3。
3. **路由级守卫** ✅ **已落地（2026-09-25）**：前端 `AppRouter` 新增 `RequirePerm` 守卫，按菜单级权限码（与 `menu.ts` 一致）拦截；无权限用户直访 URL 渲染 403 页（`Forbidden`），后端 `RequirePermGuard` 仍兜底接口 403。
4. **权限变更实时生效** ✅ **已落地（2026-09-25）**：后端在「角色权限变更 / 用户-角色变更」时经 `EventEmitter2` 发 `permission.changed`，`NotificationsGateway` 向受影响用户 WS 推送 `permission_updated`；前端监听后调用 `refreshUserInfo()` 拉取最新 `/auth/me` 原地更新（免重登），菜单 / 按钮 / 路由立即生效。
5. **权限树未按 type 过滤** ✅ **已自然解决**：种子权限节点仅含 `menu` / `button` 两类，**不存在 `api` 类型节点**，故分配树中无 api 混入问题；若未来引入 api 类节点，前端 Tree 可按 `type` 分开展示。
6. **高级特性** 🔶 **部分落地**：**默认角色（注册自动授予）已落地**（后端 `DEFAULT_ROLE_ENABLED` / `DEFAULT_ROLE_CODE` env 开关，默认授予 `user` 角色）；数据权限模板、权限/角色继承、临时授权、IP/时间限制、TOTP MFA 等仍规划中（MFA 作为可插拔模块待后续迭代，见 §12.8）。

### 7.6 用户-角色关系：BasicNest 已修正的设计缺陷

> 早期基线存在一处隐藏的 bug 级设计：用户-角色关系只存于 `user.roleIds` 单字段，且「用户管理分配角色」与「角色管理分配用户」三条写入路径**语义极不对称**（纯追加式、无删除端点、覆盖写并发丢更新、反查 O(N) 扫描、无引用完整性）。BasicNest 已通过下面的设计彻底解决，前端无需感知旧缺陷：

- **独立多对多关联表 `user_role(user_id, role_id)`**，废除「单字段 `roleIds` + 反查」模式，消除写不对称与 O(N) 扫描。
- **对称端点**（语义清晰、可增可减）：
  - `POST /rbac/roles/:id/users`（批量添加）
  - `DELETE /rbac/roles/:id/users`（批量移除）
  - `GET /rbac/roles/:id/users`、`GET /rbac/users/:id/roles`
- **写操作包数据库事务**：批量增删原子化，失败整体回滚；用行锁 / 乐观锁解决并发覆盖。
- **删除角色级联清理** `user_role`（外键 `ON DELETE CASCADE`），无孤儿数据。
- **关联一致性校验**：角色 / 用户不存在时拒绝写入，杜绝静默孤儿。
- **向后兼容（前端零改动）**：聚合层仍返回 `user.roleIds`（由 `user_role` 聚合）、`role.permissionIds`、`role.userCount`，沿用现有响应契约。

> 前端「角色管理 → 分配用户」抽屉可走角色侧 `DELETE /rbac/roles/:id/users` 完成减人，逻辑对称、语义清晰（不再依赖用户侧覆盖写）。

### 7.7 架构定位（为什么这么划分）

- **BasicNest（正式后端，已落地）**：Nest.js 12 + Prisma 7 + PostgreSQL + Redis 的独立服务，在 [`../BasicNest`](../../BasicNest) 实现，已补齐接口鉴权（§7.5-1）、数据权限（§7.5-2）、审计留痕等企业能力（高级能力见 §12.5 路线图状态）。**联调与演示默认走它**。
- **前端零改动对接**：BasicAnt 与 BasicNest 通过定型后的 `{ code, data, msg }` 契约解耦，业务页面代码不依赖具体后端实现；如未来替换后端，仅改 `baseURL` 即可。

### 7.8 权限节点的来源（Nest.js 12.x 规格）

> BasicAnt 把「权限节点」作为**可手工 CRUD 的数据**（权限管理页维护整棵权限树），用于运维覆盖。企业级基座更推荐**代码驱动、自注册**，二者定位不同，BasicNest 侧应按如下规格落地：

1. **权限节点自注册（代码即配置）**：Nest 启动时扫描路由元数据与 `@RequirePerm` / 控制器装饰器，自动同步权限节点进权限表——新增接口自动补节点、删除接口自动禁用节点，无需人工维护「权限管理」页来建档。
2. **保留「权限管理」页作为管理员覆盖层**：用于临时改 `code`、禁用某节点、补录非路由类权限（如数据权限 / 接口类）。它**不再是唯一权限来源**，而是运维覆盖工具，与自注册机制互补。
3. **权限分配的交互形态（不限形式，功能对标即可）**：当前 BasicAnt 用「可勾选权限树」实现角色授权；若企业级基座采用更直观的形态（如**穿梭框**：左侧勾选权限节点、拖动/穿梭到右侧以树状展示已分配权限）亦可，重点是「能完整选、能回显、能存完整树」，不拘泥于控件形式。

> 设计取向：是否照搬市面方案、是否允许冗余，属于本项目的设计选择。只要功能对标、页面满意即可，不强求与开源后台完全一致。

初始化数据：在 BasicNest 侧执行 `pnpm seed`（Prisma seed 脚本）初始化 RBAC 基线数据后再启动服务；**BasicNest 不提供 HTTP `/rbac/seed` 端点**，前端也无 seed 触发按钮。

---

## 八、页面开发模式（核心套路）

中后台 90% 的页面都是「筛选 + 表格 + 分页 + 弹窗增改 + 删除」。本框架把这部分抽成了可复制模板。

### 8.1 一个集合 = 一行接口

```ts
// src/api/index.ts
export const articleApi = createCrudApi<ArticleItem>('article');
// 即得 list / detail / create / update / remove / batchRemove / count
```

`createCrudApi` 在 `api/crud.ts` 定义，直接对接 BasicNest 的通用 CRUD，无需手写每个请求。

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

> **依赖说明**：`ScrollTrigger` 是 GSAP 官方免费插件，**自 gsap 3.13 起已随公开 `gsap` 包内置**（本项目 gsap 3.15，`node_modules/gsap/ScrollTrigger.js` 存在），**无需额外安装依赖**，直接 `import ScrollTrigger from 'gsap/ScrollTrigger'` + `gsap.registerPlugin(ScrollTrigger)` 即可。

### 9.1 已落地的动效（当前源码实际使用）

| 位置          | 技术                 | 效果                                                                                         |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| 登录 / 注册页 | GSAP 时间线          | 徽标 / 标题逐行 / 描述 / 特性列表 / 表单卡片依次入场（`power3.out`）                         |
| 登录页左侧    | GSAP 循环 + 鼠标视差 | 3 个光斑 `sine.inOut` 无限浮动，随鼠标 `xPercent/yPercent` 反向位移                          |
| 登录页左侧    | `lottie-react`       | 品牌装饰动画（`public/lottie/hero.json`，绝对定位不参与布局，配 `back.out` 入场 + 缓慢浮动） |
| 登录页        | Lenis                | 页面平滑滚动（`duration 1.1`，挂载在 gsap ticker 上驱动）                                    |
| 后台框架      | Lenis                | 登录后全局平滑滚动（`duration 1.05`，仅挂在 `BasicLayout`）                                  |
| 仪表盘        | GSAP + ScrollTrigger | 统计卡 / 图表卡 / 最新用户卡滚动进入视口时 `opacity+y` 揭示（`batch` + `stagger`）           |
| 仪表盘        | GSAP 补间            | 统计数字从 0 滚动增长（count-up）                                                            |

> **原则：有选择地加动效，不为动效而加动效。** 所有动效均尊重系统「减弱动效」偏好（`prefers-reduced-motion: reduce` 时直接呈现终态），并统一在 `useGSAP`（`@gsap/react`）作用域内创建，组件卸载自动清理动画与 ScrollTrigger 实例，无内存泄漏。

### 9.2 使用要点

- `useGSAP(fn, { scope, dependencies })`：在 React 中安全使用 GSAP；`dependencies` 用于数据到位（如骨架屏换真实卡片）后重建动画，避免元素不存在导致失效。
- `lottie-react` 3.x 的 prop 是 **`src`**（接受 URL 字符串或已解析对象），**不是** `path` / `animationData`：`src: string | object`。
- Lottie 资源放 `public/` 由 Vite 原样托管并发往 `dist` 根部，运行时按 `/xxx.json` 访问；不要从 `src` 里 import public 下的 JSON。
- 其余已装依赖（split-type / three / @react-three）保持按需引入，未使用的不要给页面加重负担。

---

## 十、学习路径

1. **阶段 A — 搭骨架**：读懂 `App.tsx → router → layouts → store → utils/request` 五层装配。
2. **阶段 B — 学页面模式**：以 `pages/data/table`（极简）和 `pages/system/user`（富）为模板，照抄出自己的 CRUD 页。
3. **阶段 C — 啃 React 基础**：在业务中体会 hooks / 受控表单 / 权限 / 状态管理。

建议从「复制 `data/table` 模板、新建一个集合的 CRUD 页」开始动手，最快建立整体感。

---

## 十一、模块验收与测试记录（2026-09-25）

本轮对系统管理 / 内容管理模块做了联调验收，结论如下。

### 11.1 已验证通过的模块

| 模块     | 路由 / 页面       | 验证点                                         | 结论      |
| -------- | ----------------- | ---------------------------------------------- | --------- |
| 岗位管理 | `system/post`     | 增删改查、分页、批量删除、按钮级权限           | ✅ 正常   |
| 字典管理 | `system/dict`     | 字典类型 / 数据维护、CRUD、搜索                | ✅ 正常   |
| 审计日志 | `system/log`      | 写操作留痕（操作人 / 模块 / 动作）、查询展示   | ✅ 正常   |
| 系统参数 | `system/config`   | 参数 CRUD、读取生效                            | ✅ 正常   |
| 文章管理 | `content/article` | 新增 `content` 正文字段（表单读写 + 列表预览） | ✅ 已打通 |

### 11.2 本轮同步修复 / 调整

- **文章正文字段**：BasicNest 的 `Article` 模型增加 `content`；前端 `ArticleItem`、`ArticleFormValues` 同步补字段，表单加 `Input.TextArea`（8 行），列表加「正文」预览列（`scroll.x` 调到 1200）。富文本编辑器留待后续迭代实现。
- **角色分配用户 — 大用户量改造**：原「一次拉 500 用户 + 全量多选」在百/千级用户下会卡死且 `pageSize:500` 硬编码会导致第 501 个用户选不到；改为「已授权用户服务端分页表格 + 远程搜索添加 + 单/批量移除」，前端任意时刻只持有一页数据。移除走用户侧覆盖写（设计缺陷与 Nest 级规格见 §7.6）。

### 11.3 测试结论

- **BasicNest 联调基线**：核心 CRUD 模块与 RBAC 链路均可用，满足前后端联调目标。
- **BasicNest 企业级后端（已联调）**：后端 25 个单元测试 + 1 个 e2e 测试全绿（`pnpm test` / `pnpm test:e2e`）；`tag` / `table` 等通用 CRUD 模块经 curl 全链路验证（增删改查 / 分页 / 批量删除 / 字段校验 / 401 鉴权均符合信封契约）。前端仅切换 `baseURL` 即可对接，业务代码零改动。

### 11.4 BasicNest 联调修复记录（2026-09-25）

联调中发现并修复的前后端口径不一致（以 BasicNest 实际代码为准）：

| 问题          | 前端原调用                       | BasicNest 实际路由                 | 处置                                                 |
| ------------- | -------------------------------- | ---------------------------------- | ---------------------------------------------------- |
| 用户-角色分配 | `POST /rbac/user/roles`          | `POST /rbac/users/roles`           | 前端 `rbac.ts` 改为复数 `users`                      |
| 查询用户角色  | `GET /rbac/user/roles`           | `GET /rbac/users/roles`            | 同上                                                 |
| 重置密码      | `POST /rbac/user/reset-password` | `POST /rbac/users/reset-password`  | 改为复数 `users`                                     |
| 改用户状态    | `POST /rbac/user/status`         | `POST /rbac/users/status`          | 改为复数 `users`                                     |
| 初始化数据    | `POST /rbac/seed`                | 无 HTTP 端点（走 `pnpm seed` CLI） | 保留前端函数，实际经 Prisma CLI 初始化，不依赖该接口 |

> 上述 4 条单数路由若不改，会导致用户管理/角色管理页的「分配角色、重置密码、改状态」静默 404；现已对齐到 BasicNest 真实路由（详见 §12.4 契约清单）。

---

## 十二、Nest.js 12.x 企业级后端实施规划

> 本章是 **BasicNest（Nest.js 12 + Prisma 7）企业级后端的开发规格**，已结合 `src/` 前端契约与后端实测逐条对齐。
> 目标：**前端只改 `baseURL` 即可切换**，业务页面代码零改动。下文所有「契约」均来自 `src/api/crud.ts` 与 `src/api/rbac.ts` 的实测调用。

### 12.1 总体原则

> 本章是 **BasicNest**（`../BasicNest`，Nest.js 12 + Prisma 7）的设计约束与当前实现对照（以代码为准，详见 §12.5 路线图状态）。

1. **契约优先**：BasicNest 定义统一的响应信封、查询参数、CRUD 路由、RBAC 路由（见 §12.4），前端零改动切换。
2. **安全闭环**：补齐 §7.5 的企业能力（接口鉴权 / 数据权限 / 路由守卫 / 实时刷新 / type 过滤 / 高级特性）。
3. **数据模型重构**：废除 `user.roleIds` 单字段反查（§7.6），改用 `user_role` / `role_permission` 关联表；审计日志、字典、部门等保持原实体语义（见 §12.7）。
4. **可审计**：所有写操作留痕（操作人取自 JWT，不信任客户端），敏感字段脱敏。

### 12.2 技术栈选型

| 类别          | 选型                                                       | 用途                                                                                | 备注                                                           |
| ------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 框架          | NestJS 12.x（platform-express）                            | 控制器 / 服务 / 模块 / 守卫 / 拦截器                                                | 用其「约定优于配置」的企业骨架                                 |
| 语言          | TypeScript 6.x                                             | 类型安全                                                                            | 与前端同源                                                     |
| 数据库        | PostgreSQL 18.x                                            | 主存储                                                                              | JSON 文件 → PG 表迁移                                          |
| ORM           | **Prisma 7.10**（`@prisma/client` + `@prisma/adapter-pg`） | 实体 / 关联 / 查询构造                                                              | **实际采用 Prisma**（非 TypeORM）；事务用 `$transaction`       |
| 缓存 / 中间件 | Redis 8.x（ioredis）                                       | 缓存信封、限流计数、Session/RefreshToken、BullMQ 队列                               | 单实例即可支撑演示 + 中小生产                                  |
| 认证          | `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`        | JWT 签发与校验                                                                      | 自研 JWT 工具替代为 `@nestjs/jwt`                              |
| 密码          | **`bcryptjs` 3.x**                                         | 密码哈希                                                                            | 改用 `bcryptjs` 3.x（见 §12.6 坑 3）                           |
| 校验          | **`zod` 4.x Standard Schema**                              | DTO 校验（`StandardSchemaValidationPipe` + `@Body({schema})` / `@Query({schema})`） | 替代 class-validator；响应整形用 `@SerializeOptions({schema})` |
| 配置          | `@nestjs/config`                                           | 环境变量                                                                            | 改用 `@nestjs/config`                                          |
| 文档          | `@nestjs/swagger`                                          | 接口自文档                                                                          | 企业标配                                                       |
| 限流          | `@nestjs/throttler`                                        | 接口级速率限制                                                                      | 防爆破                                                         |
| 缓存          | `@nestjs/cache-manager` + ioredis store                    | 列表/字典缓存                                                                       |                                                                |
| 队列（可选）  | `@nestjs/bullmq`（Redis）                                  | 异步任务 / 通知 / 导入导出                                                          | 非必须，按需                                                   |
| 安全          | `helmet` + `cors`                                          | 安全头 / 跨域                                                                       | 替代手写 cors 中间件                                           |
| 授权（可选）  | `@casl/ability`                                            | 行级/字段级能力计算                                                                 | 与 `@RequirePerm` 互补                                         |

> 前端无关项（PostgreSQL / Redis）由后端独立部署，不影响 `baseURL` 契约。

### 12.3 架构分层（Nest 标准骨架）

```
src/
├── main.ts                      # 挂载全局管道/守卫/拦截器/过滤器，启用 cors/helmet
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts     # 校验 Bearer，写入 request.user
│   │   └── require-perm.guard.ts  # 接口级鉴权（§7.5-1）：读装饰器所需 code，比对 permissions
│   ├── decorators/
│   │   ├── require-perm.decorator.ts  # @RequirePerm('system:user:add')
│   │   └── current-user.decorator.ts  # 取当前用户（含 permissions/dataScope）
│   ├── interceptors/
│   │   ├── transform.interceptor.ts    # 统一信封 { code:0, data, msg, total?... }
│   │   ├── audit.interceptor.ts        # 自动写审计（脱敏、跳过自身）
│   │   └── data-scope.interceptor.ts   # 注入数据范围条件（§7.5-2）
│   ├── filters/
│   │   └── all-exceptions.filter.ts    # 异常 → 信封 { code, msg }
│   └── dto/                         # 分页/查询基类（PageQueryDto）
├── modules/
│   ├── auth/        # login/register/me/password/logout（签发 JWT，组装 userInfo）
│   ├── users/       # GET /users（支持 deptId/roleId/keyword 过滤 + 分页）
│   ├── roles/       # 角色 + 用户关联（对称端点）
│   ├── permissions/ # 权限树（自注册 + 手工覆盖，见 §7.8）
│   ├── depts/       # 部门树
│   ├── posts/       # 岗位（createCrudApi('post')）
│   ├── dicts/       # 字典 + 字典项
│   ├── logs/        # 审计日志（DB 化）
│   ├── config/      # 系统参数（createCrudApi('sys_config')）
│   └── content/     # article / notice（createCrudApi）
└── entities/        # PG 实体（见 §12.7）
```

> 每个业务模块只需实现「实体 + Service + Controller」；通用 CRUD 可抽成 `BaseCrudController` 复用，路由形状对齐 §12.4 契约。

### 12.4 契约对齐清单（前端零改动的硬性约束）

**响应信封**（所有接口）：`{ code: 0, data, msg, total?, page?, pageSize?, totalPages? }`；失败 `code !== 0`（`code` 与 HTTP 状态码一致），`data: null`，校验失败额外带 `errors?: { 字段: 提示 }`。HTTP `401` = 登录失效（前端清登录态并跳 `/login`）；`422` = 入参校验失败（前端读 `errors` 做字段内联）；`403` = 无权限；`409`/`400` = 业务冲突（如重名）。

**通用 CRUD（`createCrudApi(resource)` 实测）**：

| 方法   | 路径                      | 说明                                                             |
| ------ | ------------------------- | ---------------------------------------------------------------- |
| GET    | `/:resource`              | 列表；参数 `page,pageSize,keyword,keywordFields,sort,order,tree` |
| POST   | `/:resource`              | 新增                                                             |
| PATCH  | `/:resource/:id`          | 修改（增量）                                                     |
| DELETE | `/:resource/:id`          | 删除                                                             |
| POST   | `/:resource/batch-delete` | 体 `{ ids:[] }`                                                  |
| GET    | `/:resource/_count`       | 返回 `{ total }`                                                 |
| GET    | `/_health`                | 健康检查                                                         |

**RBAC 路由（`/rbac` 前缀，以 BasicNest OpenAPI 实际路由为准）**：

> 注意：用户侧关联接口为**复数** `/rbac/users/roles`、`/rbac/users/reset-password`、`/rbac/users/status`，前端 `src/api/rbac.ts` 已对齐。

| 方法            | 路径                                                       | 备注                                                                   |
| --------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| POST            | `/rbac/auth/login` `/register` `/password` `/logout`       | login 返回 `{ token, userInfo, accessToken, refreshToken, expiresIn }` |
| POST            | `/rbac/auth/refresh` `/forgot` `/reset`                    | 令牌续期 / 找回 / 重置（扩展）                                         |
| GET             | `/rbac/auth/captcha`                                       | 图形验证码（扩展）                                                     |
| GET             | `/rbac/auth/me`                                            | 当前用户聚合信息                                                       |
| PATCH           | `/rbac/auth/profile`                                       | 改个人资料（扩展）                                                     |
| PATCH/DELETE    | `/user/:id`                                                | 改/删用户（走通用路由，无 /rbac 前缀！）                               |
| GET             | `/rbac/users`                                              | 支持 `keyword,deptId,roleId,status,page,pageSize`                      |
| GET,POST        | `/rbac/users/roles`                                        | `{userId, roleIds}` 覆盖式；GET 返回 `string[]`                        |
| POST            | `/rbac/users/reset-password` `/users/status`               | 重置密码 / 改状态                                                      |
| POST            | `/rbac/users/batch-delete`                                 | 批量删用户                                                             |
| GET/POST        | `/rbac/users/export` `/users/import`                       | 用户导入导出（扩展）                                                   |
| GET             | `/rbac/roles`（`?pageSize=500`） `/roles/all`              | 角色列表                                                               |
| POST/PUT/DELETE | `/rbac/roles` `/rbac/roles/:id`                            |                                                                        |
| GET/POST/DELETE | `/rbac/role/users?roleId`                                  | 角色下用户（对称端点已具备 DELETE）                                    |
| GET/POST        | `/rbac/role/permissions?roleId`                            | 返回 `string[]` / `{roleId,permissionIds}`                             |
| POST            | `/rbac/role/depts`                                         | 角色-部门数据范围（扩展）                                              |
| GET             | `/rbac/permissions?tree=1`                                 | 权限树                                                                 |
| CRUD            | `/rbac/permissions` `/rbac/permissions/:id`                |                                                                        |
| GET             | `/rbac/depts?tree=1` `/depts/all`                          | 部门树                                                                 |
| CRUD            | `/rbac/depts` `/rbac/depts/:id`                            | 注意更新是 `PUT`（非 PATCH）                                           |
| GET             | `/rbac/dicts` `/dict/:code/items`                          | 字典类型 / 数据项                                                      |
| CRUD            | `/rbac/dicts` `/dicts/:id` `/dict/items` `/dict/items/:id` |                                                                        |
| GET,DELETE      | `/rbac/logs` `/logs/overview`                              | 审计日志列表 / 概览；DELETE `?confirm=1` 清空                          |
| GET             | `/rbac/online`                                             | 在线用户（扩展）                                                       |
| POST            | `/rbac/online/kick`                                        | 踢下线（扩展）                                                         |
| GET,POST        | `/rbac/notifications`                                      | 站内信（WebSocket 实时推送，扩展模块）                                 |
| POST            | `/rbac/upload`                                             | 文件上传（扩展）                                                       |

> **初始化数据**：不设 HTTP `/rbac/seed` 端点，需在 BasicNest 侧执行 `pnpm seed`（Prisma seed 脚本）初始化 RBAC 基线数据，再启动服务。

> **前端兼容性提醒**：RBAC 的写请求体里附带了 `operator: currentUsername()`（从 localStorage 读取），Nest 端应**忽略该字段、以 JWT 解析的操作人为准**（§12.6 坑 1）。

### 12.5 分阶段实施路线（BasicNest 落地状态）

| 阶段             | 目标                                                                             | 交付                                | 对应缺口       | 状态                                                   |
| ---------------- | -------------------------------------------------------------------------------- | ----------------------------------- | -------------- | ------------------------------------------------------ |
| **P0 脚手架**    | Nest 工程 + PG/Redis 连接 + 全局信封/异常/校验/分页 + 基线数据与迁移脚本         | 列表/详情/分页可用                  | 基础契约       | ✅ 已落地                                              |
| **P1 认证**      | JWT 签发 + `bcryptjs` + `JwtAuthGuard` + `auth/me` + Refresh Token               | 登录换 JWT，沿用 `{token,userInfo}` | 登录态         | ✅ 已落地                                              |
| **P2 RBAC 模型** | 实体 `user_role`/`role_permission` 关联表 + 聚合接口（替代 `user.roleIds` 反查） | 用户-角色对称端点，废除单字段       | §7.6           | ✅ 已落地                                              |
| **P3 接口鉴权**  | `RequirePermGuard` 全局守卫 + `@RequirePerm` + 权限元数据                        | 无权限 403，越权不可达              | §7.5-1         | ✅ 已落地（骨架，按接口选择性挂 `@RequirePerm`）       |
| **P4 数据权限**  | `DataScopeInterceptor` 按 `dataScope` 注入查询条件                               | 非管理员只看授权范围                | §7.5-2         | 🔶 进行中                                              |
| **P5 审计**      | `AuditInterceptor` 落 PG（操作人取自 JWT，脱敏，跳过自身）                       | 审计日志 DB 化                      | §7.4 升级      | ✅ 已落地                                              |
| **P6 前端守卫**  | 路由守卫 + 权限变更实时刷新（WebSocket/事件总线）                                | 改权限无需重登                      | §7.5-3/4       | 🔶 部分（WebSocket 站内信已建，路由守卫/实时刷新待补） |
| **P7 高级**      | 权限自注册（扫描 `@RequirePerm`）、默认角色、权限树 type 过滤、TOTP MFA、多租户  | 完整企业能力                        | §7.5-5/6、§7.8 | 🔶 进行中（默认角色已落地；MFA 暂未启用，见 §12.8）    |

> 用户-角色对称端点已在 BasicNest 落地：角色侧 `GET/POST/DELETE /rbac/role/users?roleId`，用户侧 `GET/POST /rbac/users/roles`；废除 `user.roleIds` 单字段反查。前端「角色分配用户」走角色侧端点（见 §7.6）。

### 12.6 Nest 开发注意事项 / 坑（结合本项目实测）

1. **前端会发 `operator` 字段**：`src/api/rbac.ts` 在写请求体里带 `operator: currentUsername()`。BasicNest 用 `zod` Standard Schema 校验（非 class-validator），更新类 schema 已加 `.passthrough()` 容忍该字段，且**始终以 `request.user`（JWT）为操作人来源**，忽略 `operator`。
2. **信封与 Nest 默认不同**：Nest 默认直接序列化返回值，需用 `TransformInterceptor` 包装成 `{ code:0, data, msg, ...分页 }`，且 `AllExceptionsFilter` 把异常也转成同信封（前端 `http()` 依赖 `code!==0` 判断）。分页字段名必须严格为 `total/page/pageSize/totalPages`（实测 `src/api/crud.ts` 读取这些键）。
3. **密码哈希**：BasicNest 改用 **`bcryptjs` 3.x**（替换早期基线的 `sha256`）。**存量用户密码若是 sha256 哈希，bcrypt 无法反解**，迁移时需：① 强制首登改密，或 ② 迁移脚本对原哈希再做一次 bcrypt（`bcrypt(sha256(orig))`，登录时同样处理一次）过渡。不要直接把 sha256 串当明文塞进 bcrypt 比对。
4. **`dataScope` 必须在查询构造阶段注入**：用 Prisma `where` 按当前用户 `deptId` + `dataScope`（all/deptAndBelow/dept/self）拼接条件，不能用内存过滤（否则分页 total 失真）。关联查询优先用 Prisma 的 `include`/`relation` 聚合，避免 N+1。
5. **审计拦截器要脱敏 + 防递归**：对 `password/oldPassword/newPassword/token` 字段打 `******`；跳过 `/logs`、`/seed`、`/auth/*` 自身写入，否则无限递归膨胀（用 `SKIP` 列表规避）。
6. **权限树回显只勾叶子、提交完整树**：前端 `saveRolePermissions` 提交「父+子完整 ID 列表」，后端覆盖式写入（先删后插）。Nest 端保持此语义，避免脏数据（见 §7.2）。
7. **`isAdmin` 短路依赖**：前端 `hasPermission`/`hasMenu` 对 `userInfo.isAdmin` 短路恒 true，`auth/me` 与 `login` 必须返回 `isAdmin`。
8. **关联删除级联**：删角色须级联清理 `user_role`、`role_permission`；删权限须清理 `role_permission`；删部门须处理其子节点/用户归属，用 `ON DELETE CASCADE` 或应用层保证无孤儿。
9. **`PATCH /user/:id` 不在 `/rbac` 前缀下**：前端 `updateProfile`/`updateUser` 走 `/user/:id`，Controller 路由务必与其一致，否则 404。
10. **状态码语义**：前端在 HTTP `401` 清理登录态并跳 `/login`（并发 401 提示去重）；其它错误码（403/400/409/422/500）只提示不登出。Nest 鉴权失败返回 **401**（未登录 / 令牌过期 / 无效，msg 已是中文友好提示）与 **403**（无权限）要区分清楚；入参校验失败返回 **422**（带 `errors` 字段级映射），与 400（语法/格式错误，如畸形 JSON）区分。

### 12.7 数据模型（PostgreSQL 表设计概要）

```
users(id, username[uk], password, nickname, email, phone, avatar, dept_id, post_id,
      status, remark, created_at, updated_at)
roles(id, name, code[uk], data_scope, status, remark, created_at, updated_at)
permissions(id, parent_id, name, code[uk], type[menu|button|api], status, sort, remark, created_at)
user_role(user_id, role_id)                 -- 废除 user.roleIds 单字段（§7.6）
role_permission(role_id, permission_id)
depts(id, parent_id, name, code, sort, status, ...)
posts(id, name, code, dept_id, sort, status, remark, ...)
dicts(id, name, code[uk], status, remark, ...)
dict_items(id, dict_id, label, value, sort, status, ...)
sys_config(id, key[uk], value, name, remark, ...)      -- 对应前端 configApi
audit_logs(id, user_id, username, module, action, method, path, ip,
           status_code, cost, detail, created_at)
articles(id, title, author, category, status, views, content, created_at, updated_at)
notices(id, title, content, type, status, publisher, ...)
```

> 树形结构（`permissions`/`depts`）继续用 `parent_id` 自关联，前端 `?tree=1` 在后端递归聚合成树返回，契约不变。
> 实体字段与早期基线设计基本一一对应；`role_permission` 等关联表由 `user_role` 聚合填充。

### 12.8 关于 TOTP / MFA 的决策（2026-09-25）

- **当前结论：暂不启用 TOTP MFA。** 本期（联调阶段）以「接口鉴权（P3）/ 数据权限（P4）等安全闭环」为优先，MFA 属于 P7 高级特性，作为**可插拔模块**在后续迭代补齐（BasicAnt README §13.2 已将其列为待补缺口）。
- **依赖已锁定为稳定版**：`package.json` 全部依赖锁定在稳定大版本（Prisma `7.10.0` 精确钉死，其余 caret 稳定版，已从 `devDependencies` 移除已废弃的 `@types/bcryptjs`，bcryptjs 3.x 自带类型）；`pnpm audit` 在 npmmirror 源无审计端点，故以「钉死版本 + latest 大版本不被自动安装」方式规避风险。
- **依赖审计结论**：无已知事故版本；`Prisma 8.0.0-rc` 等 latest 预览版不会被 `package.json` 范围自动拉入，构建可复现。

---

> **交付判定**：BasicNest 已实现 §12.4 全部契约，前端 `VITE_API_TARGET` 指向它后所有页面（含 tag / table 示例模块）零改动可用，达成「演示级 → 企业级」迁移目标。生产 / 联调默认走 BasicNest。

---

## 十三、BasicNest 能力成熟度清单

> 下表与分节逐维度列出 **BasicNest（已落地的企业级基座，Nest 12 + Prisma 7 + PostgreSQL + Redis）** 的能力成熟度，对照 §12.5 路线图。✅ 已落地 / 🔶 部分落地 / ⬜ 待补。前端（BasicAnt）通过定型契约与后端解耦，仅切 `baseURL` 即可对接。

### 13.1 总览

| 维度     | 能力                                   | 状态 | 说明                             |
| -------- | -------------------------------------- | ---- | -------------------------------- |
| 存储     | PostgreSQL 关系型 + 事务 + 索引        | ✅   | 替代早期 JSON 文件基线           |
| 认证     | bcryptjs + JWT + Refresh Token         | ✅   | 见 §12.6 坑 3                    |
| 授权     | `RequirePermGuard` 接口鉴权 + 数据权限 | ✅   | 接口鉴权实测 403；数据权限已生效 |
| 关联模型 | `user_role` 关联表（对称、可事务）     | ✅   | 废除 `user.roleIds` 单字段反查   |
| 审计     | 完整留痕 + 脱敏 + 查询优化（PG）       | ✅   |                                  |
| 缓存     | Redis（限流/会话/队列）                | ✅   |                                  |
| 安全     | 限流 + 验证码 + Refresh 失效           | 🔶   | MFA 待 P7                        |
| 多租户   | 预留                                   | ⬜   | 待 P7                            |
| 运维     | 健康检查 + Swagger + 监控指标          | ✅   |                                  |

### 13.2 认证与安全（Auth & Security）

1. **密码哈希** ✅：已用 `bcryptjs` 3.x（早期基线为 `sha256`，存量密码需迁移，见 §12.6 坑 3）。
2. **Refresh Token / 续期** ✅：双 token（access + refresh）+ Redis 失效名单。
3. **登录限流 / 账号锁定** ✅：`@nestjs/throttler` 全局限流已启用；失败计数锁定已实现（连续错误密码超 `ACCOUNT_LOCK_MAX_ATTEMPTS` 后锁定 `ACCOUNT_LOCK_SECONDS`，Redis 不可达时自动降级为内存兜底仍生效；env `ACCOUNT_LOCK_ENABLED` 可关）。
4. **验证码 / MFA** 🔶：图形验证码已落地；MFA 作为可插拔模块待 P7（见 §12.8）。
5. **JWT 密钥** ✅：环境变量注入，可轮换。
6. **退出失效** ✅：Redis 黑名单，登出 / 踢人即时失效。
7. **密码策略** 🔶：基础强度校验已有，历史密码 / 定期改密待 P7 增强。

### 13.3 授权（Authorization）

1. **接口级鉴权**（§7.5-1）✅ **已闭合（实测）**：`RequirePermGuard` 全局守卫，无权限返回 `403`，`isAdmin` 恒放行。
2. **数据权限**（§7.5-2）✅ **已生效（实测）**：`dataScope` 注入查询条件，非管理员仅见授权范围，分页 `total` 同步。
3. **路由级守卫**（§7.5-3）✅ **已落地**：前端 `RequirePerm` 按菜单权限码拦截，无权限渲染 403 页。
4. **权限变更实时生效**（§7.5-4）✅ **已落地**：后端 WS 推送 `permission_updated`，前端即时刷新 `userInfo`（免重登）。
5. **权限树 type 过滤**（§7.5-5）✅ **已自然解决**：种子权限节点仅含 `menu` / `button`，无 `api` 混入。
6. **用户-角色对称端点**（§7.6）✅ **已落地**：`user_role` 关联表 + 对称端点 + 事务 + 级联。
7. **行级 / 字段级权限** 🔶：CASL 式细粒度待 P7。
8. **高级授权** 🔶：`默认角色` ✅ 已落地（注册自动授予，见 §13.2-3）；权限/角色继承、临时授权、IP/时段限制（§7.5-6）仍规划中。

### 13.4 数据层（Data）

1. **PostgreSQL 存储** ✅：替代 JSON 文件。
2. **事务** ✅：多步写（注册 + 补角色）原子化。
3. **并发控制** ✅：行锁 / 乐观锁避免丢更新。
4. **索引 / 性能** ✅：关联表 `JOIN`，无 O(N) 反查。
5. **服务端校验层** ✅：Zod Standard Schema DTO。
6. **软删除 / 审计字段** ✅：`deletedAt` / `updatedBy` 等。
7. **迁移工具** ✅：Prisma Migration。

### 13.5 审计与合规（Audit & Compliance）

1. **变更 diff** 🔶：记录操作上下文，改前/改后快照待增强。
2. **审计查询优化** ✅：PG 索引。
3. **脱敏策略** ✅：字段级脱敏 + `SKIP` 列表防递归。
4. **合规报表 / 操作回放** ⬜：等保导出待增强。

### 13.6 系统与运维（Ops）

1. **监控 / 指标** ✅：健康检查 `/api/_health` + Swagger。
2. **限流 / 防刷** ✅：Throttler。
3. **API 版本管理** 🔶：`/api` 前缀已统一，显式版本化待增强。
4. **国际化后端** ⬜：后端报错/枚举多语待补。
5. **特性开关 / 灰度** ⬜：待 P7。

### 13.7 业务完备性（Business）

1. **多租户隔离** ⬜：待 P7。
2. **统一文件/附件存储** 🔶：后端 `POST /rbac/upload` 已落地；前端头像 / 上传控件已接入（见 §14.2），OSS/S3 抽象待补。
3. **通知中心** ✅：站内信 + WebSocket 推送。
4. **批量导入导出** ✅：后端 `GET /rbac/users/export`、`POST /rbac/users/import`、`POST /rbac/users/batch-delete` 已实现并通过测试；**前端用户页已接入**（见 §14.2）。
5. **工作流 / 审批** ⬜：流程类业务待补。
6. **富文本编辑器** ⬜：文章正文当前为 `TextArea`，富文本待补。
7. **全文检索** ⬜：PG 全文 / ES 待补。

### 13.8 前端侧也需补（配合企业级）

1. **路由守卫已实现**（§7.5-3）✅：前端 `RequirePerm` 守卫 + 403 页。
2. **权限变更实时刷新已实现**（§7.5-4）✅：WS `permission_updated` → `refreshUserInfo()`。
3. **全局错误边界细化**：统一 ErrorBoundary / 网络断开提示。
4. **加载态统一**：部分页缺骨架屏。
5. **国际化后端联动**：语言切换未影响后端枚举。

> 以上即 BasicNest 从「演示基线到企业级基座」的能力成熟度。实施顺序见 §12.5（P0~P7），其中 P2（用户-角色关联表）、P3（接口鉴权）、P4（数据权限）、P6（前端路由守卫 + 权限实时刷新）已落地；P7 高级特性（MFA、默认角色、继承、临时授权、IP/时段限制等）仍为下一步重点。

---

## 十四、与 BasicNest 接口联调核对（事实依据）

> 与 BasicNest 后端 README 的「全量接口清单与前后端联调核对（事实依据）」章节一一对应。本节能见度来自对 `src/api/rbac.ts`、`src/api/crud.ts`、`src/api/index.ts`、`src/store/notification.ts`、`src/hooks/useNotifications.ts` 与 BasicNest OpenAPI 的逐条交叉核对。

### 14.1 结论

- 后端 BasicNest 共 **103** 个 HTTP 接口（另含 WebSocket 通道 `/ws/notifications`）。
- 前端 BasicAnt 实际调用的接口 **103** 个，**全部精确命中后端既有路由**（路径 / 方法 / 参数一致），**无错配、无缺失后端接口**——印证了 §六的「家族契约」：前端只切 `baseURL` 即可对接任意兼容后端。
- 后端已实现、前端尚未接入的接口 **0** 个（原 14 项缺口已于 2026-09-26 全部闭合，见 §14.2）。

### 14.2 前端待接入清单（2026-09-26 已全部闭合）

以下接口后端早已实现并通过集成测试，原属前端缺口，现已全部在前端落地（新页面 / 调用点）：

1. **在线用户监控**：`GET /rbac/online` + `POST /rbac/online/kick` —— 已新增「在线用户」页（pages/system/online），支持查看与强制下线。
2. **图形验证码登录**：`GET /rbac/auth/captcha` —— 登录 / 注册页已接入，注册必填验证码（错误验证码 400）。
3. **密码找回**：`POST /rbac/auth/forgot` + `POST /rbac/auth/reset` —— 已新增找回 / 重置密码页（pages/forgot、pages/reset）。
4. **令牌刷新**：`POST /rbac/auth/refresh` —— `request` 拦截器已实现 401 自动刷新续期（refreshToken 串行队列，并发 401 去重重试）。
5. **用户导入 / 导出 / 批量删除**：`GET /rbac/users/export`、`POST /rbac/users/import`、`POST /rbac/users/batch-delete` —— 用户管理页已接入（CSV 导入导出 + 行选择批量删）。
6. **角色数据范围（自定义部门）**：`POST /rbac/role/depts` —— 角色页已接入「自定义数据范围」部门树（custom 时保存 deptIds）。
7. **头像 / 文件上传**：`POST /rbac/upload` —— 个人资料 / 用户表单头像已接入 `<Upload>` + `uploadFile`。
8. **通知广播**：`POST /notifications` —— 已新增通知广播页（pages/system/notify），需 `system:notify` 权限。

> 备注：`GET /_health` 为基础设施探针（terminus），前端未直接调用；`PATCH /rbac/auth/profile` 为后端冗余端点（与 `PATCH /user/:id` 功能重复，前端统一走 `/user/:id`）。

### 14.3 可靠性（本次修复）

- BasicNest 现已具备 **Redis 内存兜底**：`REDIS_ENABLED=false` 或 Redis 未配置 / 不可达（如海外平台忘记设环境变量、Redis 未启动）时，自动降级为进程内内存存储，黑名单（登出 / 踢人）、在线用户、验证码、会话、找回令牌、登录锁定等照常工作且**不崩溃**；健康检查 `/_health` 报告 `redis: up (in-memory fallback)`，不误报 503。前端联调对此无感。
- 全量接口经 BasicNest `vitest` 集成测试覆盖（35 项，含 401/403、排序白名单、分页边界、统一错误契约、在线用户、数据范围、导入导出、tag/table 模块闭环、通知广播等），内存兜底模式下全绿。
