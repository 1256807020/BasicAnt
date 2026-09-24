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

## 六、接口约定（BasicApi）

- 基础地址：`/api`（开发代理到 `http://127.0.0.1:1234`）
- 成功响应：`{ code: 0, data, msg, total?, page?, pageSize?, totalPages? }`
- 列表查询参数：`page` `pageSize` `keyword` `keywordFields` `sort` `order` `tree`
- 通用 CRUD：`GET /:resource`、`POST /:resource`、`PATCH /:resource/:id`、`DELETE /:resource/:id`、`POST /:resource/batch-delete`
- RBAC 层：`/api/rbac/*`（登录 / 用户 / 角色 / 权限 / 部门 / 字典 / 日志，后端做内存 JOIN 后返回聚合结果）

> **核心原则（家族约定）**：接口契约一旦在 BasicApi 定型，后续换成 Nest / CMS 生产后端时，**前端只改一个 `baseURL`** 即可切换，业务代码零改动。

---

## 七、RBAC 权限模型（完整流程与缺口）

> 本章同时记录「当前已实现的完整权限流程」与「缺失的企业级能力」，后者作为**未来 Nest.js 12.x 企业级后端的开发规格**。当前阶段（BasicApi 快速接口）只需接口调通、功能可用，不要过度实现。

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

### 7.4 当前已实现（演示级，够用）

- ✅ 用户↔角色↔权限三件套关联 + 角色 `dataScope` 字段
- ✅ 级联勾选分配 + 完整树存储 + 覆盖式保存（无脏数据）
- ✅ 菜单前缀匹配、按钮精确匹配、超级管理员短路
- ✅ 写操作审计日志（操作人 + 模块 + 动作）
- ✅ 内置 `admin` 角色防删除
- ✅ `userInfo` 持久化（zustand + localStorage）与版本迁移

### 7.5 缺失的企业级功能（待 Nest.js 12.x 后端补齐）

> 以下问题在当前 BasicApi 下**不修复**（避免把快速接口做复杂），仅作为企业级后端的开发规格。

1. **后端接口级鉴权（最关键）**：当前 `app.js` 只挂 `authGuard()` 校验 JWT 登录态，**没有任何按 `permission code` 校验的中间件**。任何已登录用户都能调用任意接口，前端隐藏按钮/菜单仅是「君子协定」（F12 改状态或 curl 即可越权）。企业级需实现 `requirePerm(code)` 中间件：写接口声明所需权限码，未持有即 `403`。
2. **数据权限（dataScope）未生效**：角色的 `all / deptAndBelow / dept / self` 已存储，但所有查询未按数据范围过滤，非管理员仍能查到全量用户/部门。需在查询层注入数据范围拦截器（按当前用户部门 + 范围拼接条件）。
3. **路由级守卫缺失**：路由静态注册、仅靠菜单隐藏；无对应权限的用户直接敲 URL（如 `/system/user`）仍能进页面、发请求。需前端路由守卫 + 后端接口兜底双重保障。
4. **权限变更不实时生效**：`userInfo.permissions` 缓存于 localStorage，改完角色权限需**重新登录**才刷新。企业级应提供权限变更后的主动刷新（事件总线 / WebSocket 推送）。
5. **权限树未按 type 过滤**：分配树里 `api` 类权限也混在勾选列表（无害但不严谨），企业级应区分 `menu/button/api` 分别展示。
6. **高级特性未规划**：默认角色、数据权限模板、权限/角色继承、临时授权、IP/时间限制等未在当前模型内。

### 7.6 用户-角色关系的隐藏设计缺陷（务必在 Nest.js 12.x 修正）

> 这是一处**隐藏的 bug 级设计**：当前「用户管理 → 分配角色」与「角色管理 → 分配用户」看似两套互逆功能，实则共享同一个字段 `user.roleIds`，而写路径**极度不对称**。企业级若不重新设计，会做一套自己都理不清的糊涂账。下面先给当前 BasicApi 的「大致样子」，再列缺陷，最后给 Nest 级改造规格。

#### 7.6.1 当前 BasicApi 的大致实现

- **单一数据源**：用户-角色关系**只**存在 `user.roleIds`（用户记录上），后端**没有**独立的 `role.userIds` 表。所谓「某角色下的用户」全是每次查询时**反查**算出来的：

```28:28:E:\360Data\BasicApi\router\rbac\role.js
const userCount = users.filter((u) => toIdList(u.roleIds).some((id) => same(id, roleId))).length
```

```199:199:E:\360Data\BasicApi\router\rbac\role.js
.filter((u) => toIdList(u.roleIds).some((id) => same(id, roleId)))
```

- **三条写入路径，全部落回 `user.roleIds`**：

| 来源                        | 端点                                   | 写法                                                              | 代码位置                             |
| --------------------------- | -------------------------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| 用户管理 → 给某用户分配角色 | `POST /user/roles`                     | **覆盖式** `user.roleIds = roleIds`                               | `user.js:99-128`                     |
| 角色管理 → 分配用户 → 添加  | `POST /role/users`                     | **追加式**，把 roleId `push` 进每个选中用户的 `roleIds`（已去重） | `role.js:205-240`                    |
| 角色管理 → 分配用户 → 移除  | `GET /user/roles` + `POST /user/roles` | 读取该用户的 `roleIds` → 过滤掉本角色 → **覆盖写回**              | `user.js:131-138` + `user.js:99-128` |

- **读取两侧都从 `user.roleIds` 即时 JOIN**（用户列表的 `roleNames`、角色列表的 `userCount` 都是反查），无缓存副本（这点本身是对的）。

#### 7.6.2 隐藏缺陷（为什么是 bug 级）

1. **写语义不对称（最致命）**：`POST /role/users` 是**纯追加式**，后端**根本没有 `DELETE /role/users` 端点**。从角色侧「减人」唯一合法路径是绕到用户侧 `POST /user/roles` 覆盖写。若任何人（包括未来的你）误以为「再调一次 `POST /role/users` 传剩余集合就能减人」，会发现**根本删不掉**——该接口只增不减。
2. **移除 = N 次请求且无事务**：批量移除 M 个用户，前端要发 M 次 `GET /user/roles` + M 次 `POST /user/roles`（当前用 `Promise.all` 并发）。中途任一失败即**部分不一致**，无补偿、无回滚。
3. **单字段覆盖写 = 并发覆盖风险**：`user.roleIds` 是覆盖式写入。高并发下「用户管理改 A 角色」与「角色管理改 B 角色」若作用于同一用户，后写者会**覆盖前者的结果**（丢更新）。当前 BasicApi 是 JSON 文件单线程服务，问题被掩盖；企业级多实例必爆。
4. **反查 O(N) 扫描**：每次查「角色下的用户 / 用户数」都要遍历全量用户，`userCount` 在角色列表里对每个角色各扫一遍 = O(角色数 × 用户数)。千级用户量级可接受，万级开始吃力。
5. **无引用完整性校验**：直接改 `user.json` 删掉某个角色 id，`role.users` 反查会**静默丢掉**该成员，无任何报错或孤儿检测。
6. **删除角色已做级联清理**（唯一做对的）：`DELETE /roles/:id` 会同步清理所有 `user.roleIds` 中的该角色引用（`role.js:110-147`），Nest 侧也须保留此行为。

#### 7.6.3 Nest.js 12.x 改造规格（强制）

- **引入独立多对多关联表 `user_role(user_id, role_id, ...)**，废除「用户侧单字段 `roleIds` + 反查」模式。消除写不对称与 O(N) 扫描。
- **对称端点**（语义清晰、可增可减）：
  - `POST /rbac/roles/:id/users`（批量添加）
  - `DELETE /rbac/roles/:id/users`（批量移除，**这是当前缺的**）
  - `GET /rbac/roles/:id/users`、`GET /rbac/users/:id/roles`
- **写操作包数据库事务**：批量增删原子化，失败整体回滚；用行锁 / 乐观锁解决并发覆盖。
- **删除角色级联清理** `user_role`（外键 `ON DELETE CASCADE` 或应用层），保证无孤儿数据。
- **向后兼容（前端零改动）**：聚合层仍返回 `user.roleIds`（由 `user_role` 聚合）、`role.permissionIds`、`role.userCount`，沿用现有响应契约，前端只改 `baseURL`。
- **关联一致性校验**：角色/用户不存在时拒绝写入，杜绝静默孤儿。

> 前端「角色管理 → 分配用户」抽屉当前的移除实现（走用户侧覆盖写）是**临时兼容方案**，仅因 BasicApi 无删除端点。Nest 落地上述规格后，该抽屉应改为调用 `DELETE /rbac/roles/:id/users`，逻辑会大幅简化且语义对称。

### 7.7 架构定位（为什么这么划分）

- **BasicApi（当前后端）**：文件型 JSON 快速 CRUD 服务，定位是「前端演示 / 联调」，只保证接口调通、功能可用，**不追求企业级安全闭环**。最初的目标本就是「一个 JSON 实现全套 CRUD（增删改查 + 查询分页）」，在此之上堆企业级标准并不现实。
- **Nest.js 12.x（企业级后端，规划中）**：将在独立服务中按 **7.5** 的规格完整实现接口鉴权、数据权限、审计留痕、多租户等。
- **前端零改动切换**：因「契约一旦定型、切换后端只改一个 `baseURL`」的家族约定（`src/utils/request.ts`），届时业务页面代码无需改动，仅 BasicApi → Nest 后端迁移。

### 7.8 权限节点的来源（Nest.js 12.x 规格）

> BasicAnt 当前把「权限节点」当作**可手工 CRUD 的数据**（权限管理页维护整棵权限树），这是快速基线为了能编辑/新增权限而留的入口。但企业级基座更推荐**代码驱动、自注册**，二者定位不同，Nest 侧应按如下规格落地：

1. **权限节点自注册（代码即配置）**：Nest 启动时扫描路由元数据与 `@RequirePerm` / 控制器装饰器，自动同步权限节点进权限表——新增接口自动补节点、删除接口自动禁用节点，无需人工维护「权限管理」页来建档。
2. **保留「权限管理」页作为管理员覆盖层**：用于临时改 `code`、禁用某节点、补录非路由类权限（如数据权限 / 接口类）。它**不再是唯一权限来源**，而是运维覆盖工具，与自注册机制互补。
3. **权限分配的交互形态（不限形式，功能对标即可）**：当前 BasicAnt 用「可勾选权限树」实现角色授权；若企业级基座采用更直观的形态（如**穿梭框**：左侧勾选权限节点、拖动/穿梭到右侧以树状展示已分配权限）亦可，重点是「能完整选、能回显、能存完整树」，不拘泥于控件形式。

> 设计取向：是否照搬市面方案、是否允许冗余，属于本项目的设计选择。只要功能对标、页面满意即可，不强求与开源后台完全一致。

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

- **文章正文字段**：`BasicApi/data/article.json` 增加 `content`；前端 `ArticleItem`、`ArticleFormValues` 同步补字段，表单加 `Input.TextArea`（8 行），列表加「正文」预览列（`scroll.x` 调到 1200）。富文本编辑器留待 Nest.js 12.x 阶段实现。
- **角色分配用户 — 大用户量改造**：原「一次拉 500 用户 + 全量多选」在百/千级用户下会卡死且 `pageSize:500` 硬编码会导致第 501 个用户选不到；改为「已授权用户服务端分页表格 + 远程搜索添加 + 单/批量移除」，前端任意时刻只持有一页数据。移除走用户侧覆盖写（设计缺陷与 Nest 级规格见 §7.6）。

### 11.3 测试结论

当前 BasicApi 快速接口下，核心 CRUD 模块与 RBAC 链路均可用，满足演示 / 联调目标。企业级缺口（接口级鉴权、数据权限、路由守卫、权限实时刷新、type 过滤、用户-角色对称端点等）按 §7.5、§7.6 规格待 Nest.js 12.x 补齐，届时前端仅切换 `baseURL`、业务代码零改动。
