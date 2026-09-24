# ReactAdmin — React 19 + antd 6 后台管理系统（ReactAdm04）

> 基于国内主流 React 技术栈搭建的后台管理框架，接口对接 `E:\360Data\BasicApi`。

## 快速开始

```bash
# 1. 启动接口服务（BasicApi，默认 1234 端口）
cd E:\360Data\BasicApi && npm start

# 2. 启动前端
pnpm install
pnpm dev          # http://localhost:5173

# 演示账号：admin / 123456
```

常用脚本：

| 命令             | 说明                                      |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | 启动开发服务（已配置 `/api` 代理到 1234） |
| `pnpm build`     | 类型检查 + 生产构建                       |
| `pnpm typecheck` | 仅 TypeScript 检查                        |
| `pnpm lint`      | ESLint 检查                               |
| `pnpm test`      | Vitest 单元测试                           |

## 目录结构

```
src/
├── main.tsx                 # 应用入口
├── App.tsx                  # 根组件：antd 国际化 / 主题 / 路由装配
├── api/
│   ├── crud.ts              # 通用 CRUD 工厂（对接 /api/:resource）
│   ├── rbac.ts              # RBAC 接口（登录/用户/角色/权限/部门/字典/日志）
│   └── index.ts             # 业务接口汇总：articleApi / noticeApi / configApi / tableApi / postApi
├── components/
│   ├── EChart.tsx           # echarts 封装
│   ├── Auth.tsx             # <Auth code="..."> 按钮级权限包裹
│   └── GlobalNotifier.tsx   # 全局消息桥接
├── config/menu.ts           # 菜单配置（带权限码，按权限过滤）
├── hooks/
│   ├── useCrudList.ts       # 通用列表查询 Hook（ahooks useRequest）
│   └── usePermission.ts     # usePermission() 按钮级鉴权
├── layouts/                 # BasicLayout / AppSider / AppHeader
├── pages/
│   ├── login/               # 登录 + 注册
│   ├── profile/             # 个人中心（资料 / 改密）
│   ├── dashboard/           # 仪表盘
│   ├── system/user/         # 用户管理（部门树 + 分配角色 + 重置密码）
│   ├── system/role/         # 角色管理（分配权限 + 分配用户 + 数据范围）
│   ├── system/permission/   # 权限管理（菜单/按钮/接口 树）
│   ├── system/dept/         # 部门管理（组织树）
│   ├── system/post/         # 岗位管理
│   ├── system/dict/         # 字典管理（分类 + 字典项）
│   ├── system/log/          # 审计日志
│   ├── system/config/       # 系统参数
│   ├── content/article/     # 文章管理
│   ├── content/notice/      # 通知公告
│   ├── data/table/          # 通用数据
│   └── error/NotFound.tsx   # 404
├── router/                  # 路由表（懒加载）
├── store/useAppStore.ts     # 全局状态（zustand + 持久化，含 permissions）
├── types/                   # 类型定义（index.ts + rbac.ts）
├── utils/                   # request / auth / notify
```

## RBAC 权限模型

后端在 `E:\360Data\BasicApi\router\rbac\` 新增了一层，与通用 CRUD 分开：

```
/api/:resource        通用 CRUD   → 单集合原子操作（不动）
/api/rbac/*           RBAC 层     → 跨集合关联 + 业务语义
```

> JSON 文件库没有 JOIN，所以**在 Node 进程内做内存 JOIN** 后一次返回聚合结果，
> 前端拿到的用户对象里 `deptName` / `postName` / `roleNames` 都是现成的。

数据集合：`user` `role` `permission` `role_permission` `dept` `post` `dict` `dict_item` `log` `sys_config` `notice` `article`

三级授权链路：

```
用户 user.roleIds ──▶ 角色 role ──▶ role_permission ──▶ 权限 permission
                          └──▶ dataScope 数据范围（全部/本部门及以下/本部门/仅本人）
```

- **菜单级**：后端返回 permissions → 侧边栏按 `code` 过滤
- **按钮级**：`<Auth code="system:user:add"><Button/></Auth>`
- **审计**：全局中间件自动记录所有写操作，密码字段脱敏

初始化数据：`POST /api/rbac/seed?confirm=1`（或由前端「系统管理」触发）

演示账号：

| 账号     | 密码   | 角色       | 数据范围     | 权限          |
| -------- | ------ | ---------- | ------------ | ------------- |
| admin    | 123456 | 超级管理员 | 全部         | 59 项（全部） |
| zhangsan | 123456 | 部门经理   | 本部门及以下 | 44 项         |
| lisi     | 123456 | 普通用户   | 仅本人       | 4 项          |

## 接口约定（BasicApi）

- 基础地址：`/api`（开发环境由 Vite 代理到 `http://127.0.0.1:1234`）
- 成功响应：`{ code: 0, data, msg, total?, page?, pageSize?, totalPages? }`
- 列表查询参数：`page` `pageSize` `keyword` `keywordFields` `sort` `order` `tree`
- 写操作：`POST /:resource`、`PATCH /:resource/:id`、`DELETE /:resource/:id`、`POST /:resource/batch-delete`

---

# 以下为原 React 知识点学习文档

---

## 一、技术栈

| 类别     | 技术              | 版本  | 用途                       |
| -------- | ----------------- | ----- | -------------------------- |
| 框架     | React             | 19.2  | UI 库                      |
| 语言     | TypeScript        | 6.0   | 类型安全                   |
| 构建     | Vite              | 8.0   | 开发服务器 & 构建          |
| 路由     | React Router DOM  | 7.15  | 客户端路由                 |
| 数据请求 | TanStack Query    | 5.100 | 服务端状态管理             |
| 表单     | React Hook Form   | 7.76  | 表单状态管理               |
| 验证     | Zod               | 4.4   | Schema 验证                |
| 状态     | Zustand           | 5.0   | 客户端状态管理（轻量）     |
| 状态     | Redux Toolkit     | 2.12  | 客户端状态管理（企业级）   |
| UI 库    | Ant Design        | 6.6   | 企业级 UI 组件库           |
| 图标     | @ant-design/icons | 6.3   | Ant Design 图标库          |
| Hook 库  | ahooks            | 3.9   | 阿里开源 React Hook 工具库 |
| 动画     | Framer Motion     | 13.1  | React 动画库               |
| HTTP     | Axios             | 1.16  | HTTP 请求库                |
| 测试     | Vitest            | 4.1   | 单元测试框架               |
| 测试     | Testing Library   | 16.3  | React 组件测试库           |
| 编译器   | React Compiler    | 1.0   | 自动性能优化               |

---

## 二、项目结构

```
ReactAdm04/
├── index.html                  # Vite HTML 入口
├── vite.config.ts              # Vite 配置（含 React Compiler）
├── package.json                # 依赖和脚本
├── README.md                   # 本文档
└── src/
    ├── main.tsx                # 应用入口（三种模式切换）
    ├── App.tsx                 # 模式1：components/ 组件集合
    ├── Basic.tsx               # 模式2：comstart/ 编号组件集合
    ├── BaseRouter.tsx          # 模式3（当前）：React Router 路由版
    ├── App.css                 # 全局样式
    │
    ├── components/             # 第一组知识点组件（无编号）
    │   ├── HelloWorld.tsx          → JSX 基础
    │   ├── JSXDemo.tsx             → JSX 语法综合
    │   ├── UserCardProps.tsx       → Props 类型定义
    │   ├── ChildrenCardProps.tsx   → children 插槽
    │   ├── ProductCardProps.tsx    → Props 默认值
    │   ├── CparentProps.tsx        → 父子通信（父传子）
    │   ├── ChildProps.tsx          → 父子通信（子传父）
    │   ├── UserFormState.tsx       → 受控表单
    │   ├── CounterUseState.tsx     → useState 两种更新
    │   ├── ToggleState.tsx         → 布尔状态
    │   ├── EventHandling.tsx       → 事件处理详解
    │   ├── EventDemo.tsx           → 事件综合
    │   ├── ConditionalRender.tsx   → 条件渲染
    │   ├── ListRender.tsx          → 列表渲染
    │   ├── TodoApp.tsx             → 父子协作 Todo
    │   ├── TodoInput.tsx           → 子组件输入
    │   ├── TodoList.tsx            → 完整 Todo（增删改查）
    │   ├── MyInputRef.tsx          → React 19 ref 作为 props
    │   ├── AutoFocusInput.tsx      → ref 回调 + 清理函数
    │   ├── UseEffectDemo.jsx       → useEffect 三种模式
    │   ├── UserProfileUseEffect.tsx→ useEffect 数据获取
    │   ├── UseThemeContext.tsx     → Context 上下文
    │   ├── UseReducerApp.tsx       → useReducer 复杂状态
    │   ├── ContactForm.tsx         → 原生 form action
    │   ├── UseActionStateForm.tsx  → useActionState
    │   ├── UseFormStatusForm.tsx   → useFormStatus
    │   ├── UseOptimisticForm.tsx   → useOptimistic
    │   ├── RegisterForm.tsx        → 综合表单（三 Hook 联用）
    │   ├── UserProfilePromise.tsx  → use() + Suspense + ErrorBoundary
    │   ├── UserProfileReact18.tsx  → React 18 风格对比
    │   ├── UserProfileReact19.tsx  → React 19 风格对比
    │   ├── UserDashboard.tsx       → use() 并行获取
    │   ├── ExpensiveComponent.tsx  → React 18 手动优化
    │   ├── ExpensiveComponent19.tsx→ React 19 自动优化
    │   └── NewTodo.tsx             → 完整 Todo 应用（localStorage）
    │
    ├── comstart/               # 第二组知识点组件（带编号 01-37）
    │   ├── JSXBasics01.tsx         → 01. JSX 基础
    │   ├── ButtonComp02.tsx        → 02. 可复用按钮
    │   ├── UserCardProps03.tsx     → 03. 复杂 Props
    │   ├── CounterComp04.tsx        → 04. useState 计数器
    │   ├── UserListComp05.tsx       → 05. useEffect 数据获取
    │   ├── InputFocusComp06.tsx     → 06. useRef
    │   ├── PerformanceDemo07.tsx    → 07. React Compiler
    │   ├── AsyncData08.tsx          → 08. use() + Suspense
    │   ├── FormWithActionState09.tsx→ 09. useActionState
    │   ├── SubmitButton10.tsx       → 10. useFormStatus
    │   ├── LikeButton11.tsx         → 11. useOptimistic
    │   ├── PageMetadata12.tsx       → 12. 文档元数据
    │   ├── EventHandling13.tsx      → 13. 事件处理
    │   ├── ConditionalRendering14.tsx→14. 条件渲染
    │   ├── TodoList15.tsx           → 15. 完整 Todo
    │   ├── ThemeContext16.tsx       → 16. Context（TS 完整版）
    │   ├── PostList19.tsx           → 19. TanStack Query
    │   ├── UseMemoDemo20.tsx        → 20. useMemo
    │   ├── UseCallbackDemo21.tsx    → 21. useCallback + React.memo
    │   ├── UseImperativeHandle22.tsx→ 22. useImperativeHandle
    │   ├── UseLayoutEffect23.tsx    → 23. useLayoutEffect
    │   ├── UseTransition24.tsx      → 24. useTransition 并发过渡
    │   ├── UseDeferredValue25.tsx   → 25. useDeferredValue 延迟值
    │   ├── UseIdDemo26.tsx          → 26. useId 唯一 ID
    │   ├── PortalDemo27.tsx         → 27. Portals 传送门
    │   ├── LazyLoadingDemo28.tsx    → 28. React.lazy 代码分割
    │   ├── HeavyComponentModule.tsx → 28. 懒加载演示模块
    │   ├── CustomHooksDemo29.tsx    → 29. 自定义 Hook 综合
    │   ├── ZustandDemo30.tsx        → 30. Zustand 状态管理
    │   ├── HOCDemo31.tsx            → 31. 高阶组件 HOC
    │   ├── RenderPropsDemo32.tsx    → 32. Render Props 模式
    │   ├── ForwardRefDemo33.tsx     → 33. forwardRef（React 18 兼容）
    │   ├── PermissionDemo34.tsx     → 34. 权限控制（路由+按钮级）
    │   ├── VirtualListDemo35.tsx    → 35. 虚拟列表（10万条数据）
    │   ├── ErrorBoundaryDemo36.tsx  → 36. 完整错误边界
    │   ├── DragDropDemo37.tsx       → 37. 拖拽排序（HTML5 原生）
    │   ├── ReduxToolkitDemo38.tsx   → 38. Redux Toolkit 状态管理
    │   ├── AntdDemo39.tsx           → 39. Ant Design 组件库
    │   ├── AhooksDemo40.tsx         → 40. ahooks 工具 Hook 库
    │   ├── FramerMotionDemo41.tsx   → 41. Framer Motion 动画库
    │   ├── VitestDemo42.tsx         → 42. Vitest 单元测试
    │   ├── UseSyncExternalStoreDemo43.tsx → 43. useSyncExternalStore
    │   ├── ReactChildrenDemo44.tsx  → 44. React.Children + cloneElement
    │   ├── SuspenseListPreloadDemo45.tsx → 45. SuspenseList + preload/preinit
    │   └── RegisterForm.tsx         → React Hook Form + Zod
    │
    ├── hooks/                  # 自定义 Hooks
    │   ├── usePosts.ts             → TanStack Query 封装
    │   ├── useDebounce.ts          → 防抖 Hook
    │   ├── useLocalStorage.ts      → localStorage 持久化 Hook
    │   ├── useMousePosition.ts     → 鼠标位置追踪 Hook
    │   ├── useToggle.ts            → 布尔切换 Hook
    │   └── useFetch.ts             → 数据请求 Hook（学习用）
    │
    ├── store/                  # 状态管理
    │   ├── useUserStore.ts         → Zustand 用户状态
    │   ├── counterSlice.ts         → Redux Toolkit 计数器 slice
    │   ├── todoSlice.ts            → Redux Toolkit 待办 slice
    │   └── reduxStore.ts           → Redux Toolkit store 配置
    │
    ├── utils/                  # 工具函数
    │   ├── request.ts              → axios 拦截器封装
    │   ├── mathUtils.ts            → 纯函数工具（用于测试示例）
    │   └── mathUtils.test.ts       → 纯函数单元测试
    │
    ├── test/                   # 测试配置
    │   └── setup.ts                → Vitest 测试环境设置
    │
    ├── pages/                  # 路由页面
    │   ├── Home.tsx                → 首页
    │   ├── About.tsx               → 关于
    │   ├── Contact.tsx             → 联系
    │   ├── Dashboard.tsx           → 仪表盘（受保护）
    │   ├── UserProfile.tsx         → 用户详情（动态路由）
    │   └── NotFound.tsx            → 404
    │
    └── route/                  # 路由相关
        └── ProtectedRoute.tsx      → 路由保护组件
```

---

## 三、三种入口模式

项目在 `src/main.tsx` 中提供了三种入口模式，通过注释切换：

### 模式1：组件演示集合（App.tsx）

展示 `src/components/` 下所有知识点组件，适合逐个学习 React 基础概念。

```tsx
// main.tsx 中取消注释：
import App from './App.tsx';
// <App />
```

### 模式2：编号组件集合（Basic.tsx）

展示 `src/comstart/` 下带编号的组件（01-42），按学习顺序排列。
PostList19 依赖 TanStack Query，需要 QueryClientProvider 包裹。
ReduxToolkitDemo38 已在 Basic.tsx 内部用 Provider 包裹。

```tsx
// main.tsx 中取消注释：
import { QueryClient } from '@tanstack/react-query';
import Basic from './Basic';
// <QueryClientProvider client={queryClient}><Basic /></QueryClientProvider>
```

### 模式3：路由版（BaseRouter.tsx）— 当前启用

React Router 7 路由应用，包含导航栏、嵌套路由、动态路由、受保护路由、404 页面。

```tsx
// main.tsx 当前启用：
import BaseRouter from './BaseRouter';
// <BaseRouter />
```

---

## 四、React 知识点学习路径

按难度从低到高分为五个阶段，每个阶段标注对应的文件。

### 阶段一：React 基础（必学）

| 知识点        | 学习文件                                                                                       | 核心概念                                                |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| JSX 语法      | `components/HelloWorld.tsx`、`components/JSXDemo.tsx`、`comstart/JSXBasics01.tsx`              | 表达式嵌入 `{}`、条件渲染、属性绑定、Fragment           |
| 函数组件      | 所有 `.tsx` 文件                                                                               | 组件就是返回 JSX 的函数                                 |
| Props         | `components/UserCardProps.tsx`、`components/ProductCardProps.tsx`、`comstart/ButtonComp02.tsx` | 组件输入、类型定义、可选属性、默认值、展开运算符        |
| children 插槽 | `components/ChildrenCardProps.tsx`                                                             | 组件标签间的内容、ReactNode 类型                        |
| 事件处理      | `components/EventHandling.tsx`、`components/EventDemo.tsx`、`comstart/EventHandling13.tsx`     | onClick/onChange/onSubmit、事件对象、阻止默认行为、传参 |
| 条件渲染      | `components/ConditionalRender.tsx`、`comstart/ConditionalRendering14.tsx`                      | 三元运算符 `? :`、短路与 `&&`、if 提前返回、变量存储    |
| 列表渲染      | `components/ListRender.tsx`                                                                    | `map()`、`key` 属性、唯一稳定标识                       |

### 阶段二：状态管理（核心）

| 知识点     | 学习文件                                                                                     | 核心概念                                                    |
| ---------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| useState   | `components/CounterUseState.tsx`、`components/ToggleState.tsx`、`comstart/CounterComp04.tsx` | 状态声明、直接传值 vs 函数式更新、对象/数组状态             |
| 受控表单   | `components/UserFormState.tsx`                                                               | value 绑定 state、onChange 统一处理、计算属性名             |
| 父子通信   | `components/CparentProps.tsx` + `ChildProps.tsx`、`components/TodoApp.tsx` + `TodoInput.tsx` | 父传子（props）、子传父（回调函数）、状态提升               |
| 完整 Todo  | `components/TodoList.tsx`、`comstart/TodoList15.tsx`                                         | 增删改查综合、不可变更新、条件样式                          |
| useReducer | `components/UseReducerApp.tsx`                                                               | reducer 函数、action 对象、dispatch、联合类型、复杂状态管理 |

### 阶段三：副作用与引用（进阶）

| 知识点             | 学习文件                                                             | 核心概念                                                        |
| ------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| useEffect          | `components/UseEffectDemo.jsx`                                       | 三种依赖数组模式、清理函数、定时器、副作用                      |
| useEffect 数据获取 | `components/UserProfileUseEffect.tsx`、`comstart/UserListComp05.tsx` | 异步获取、loading/error 状态、依赖数组                          |
| useRef             | `components/MyInputRef.tsx`、`comstart/InputFocusComp06.tsx`         | DOM 引用、持久化值、不触发重渲染、命令式操作                    |
| Context            | `components/UseThemeContext.tsx`、`comstart/ThemeContext16.tsx`      | createContext、Provider、useContext、自定义 Hook 封装、跨层共享 |

### 阶段四：React 19 新特性（重点）

| 知识点             | 学习文件                                                                  | 核心概念                                                |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| use() 读取 Promise | `components/UserProfilePromise.tsx`、`comstart/AsyncData08.tsx`           | `use(promise)`、Suspense、ErrorBoundary、替代 useEffect |
| use() 并行获取     | `components/UserDashboard.tsx`                                            | 先创建 Promise 再 use、并行请求                         |
| useActionState     | `components/UseActionStateForm.tsx`、`comstart/FormWithActionState09.tsx` | 表单 Action 状态、`[state, formAction, isPending]`      |
| useFormStatus      | `components/UseFormStatusForm.tsx`、`comstart/SubmitButton10.tsx`         | 子组件获取表单状态、无需 props 传递                     |
| useOptimistic      | `components/UseOptimisticForm.tsx`、`comstart/LikeButton11.tsx`           | 乐观更新、即时 UI 反馈、自动回滚                        |
| 综合表单           | `components/RegisterForm.tsx`                                             | 三个新 Hook 联用、成功后替换 UI                         |
| ref 作为 props     | `components/MyInputRef.tsx`                                               | React 19 直接接收 ref，无需 forwardRef                  |
| ref 回调清理       | `components/AutoFocusInput.tsx`                                           | ref 回调返回清理函数、挂载/卸载生命周期                 |
| 文档元数据         | `comstart/PageMetadata12.tsx`                                             | 直接渲染 title/meta/link/script、自动管理               |
| React Compiler     | `comstart/PerformanceDemo07.tsx`、`components/ExpensiveComponent19.tsx`   | 自动 memoization、无需 useMemo/useCallback/React.memo   |
| 原生 form action   | `components/ContactForm.tsx`                                              | action 接收异步函数、FormData 自动收集                  |

### 阶段五：生态与工程化（实战）

| 知识点                | 学习文件                                                          | 核心概念                                                                                  |
| --------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| React Router 7        | `BaseRouter.tsx`、`route/ProtectedRoute.tsx`、`pages/`            | createBrowserRouter、RouterProvider、NavLink、Outlet、嵌套路由、动态路由、受保护路由、404 |
| TanStack Query        | `hooks/usePosts.ts`、`comstart/PostList19.tsx`                    | useQuery、useMutation、useQueryClient、queryKey、缓存失效、invalidateQueries              |
| React Hook Form + Zod | `comstart/RegisterForm.tsx`                                       | useForm、register、handleSubmit、zodResolver、z.infer、验证规则                           |
| 完整应用              | `components/NewTodo.tsx`                                          | localStorage 持久化、乐观更新、筛选、统计、组件拆分                                       |
| 性能优化对比          | `components/ExpensiveComponent.tsx` vs `ExpensiveComponent19.tsx` | React 18 手动优化 vs React 19 自动优化                                                    |
| 数据获取对比          | `components/UserProfileReact18.tsx` vs `UserProfileReact19.tsx`   | useEffect 三状态 vs use() + Suspense                                                      |

### 阶段六：性能优化与并发特性（进阶）

| 知识点                   | 学习文件                                                      | 核心概念                                                             |
| ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| useMemo                  | `comstart/UseMemoDemo20.tsx`                                  | 缓存计算结果、依赖数组、昂贵计算优化                                 |
| useCallback + React.memo | `comstart/UseCallbackDemo21.tsx`                              | 缓存函数引用、配合 memo 避免子组件重渲染                             |
| useLayoutEffect          | `comstart/UseLayoutEffect23.tsx`                              | 同步布局副作用、绘制前执行、避免闪烁、Tooltip 定位                   |
| useTransition            | `comstart/UseTransition24.tsx`                                | 并发过渡、紧急 vs 非紧急更新、大列表搜索不卡顿、isPending            |
| useDeferredValue         | `comstart/UseDeferredValue25.tsx`                             | 延迟值更新、被动式并发、props 传入值延迟、isStale 判断               |
| useId                    | `comstart/UseIdDemo26.tsx`                                    | 生成唯一 ID、SSR hydration 安全、label/aria 关联                     |
| Portals                  | `comstart/PortalDemo27.tsx`                                   | createPortal、渲染到 body、弹窗/Modal/Tooltip、事件冒泡遵循 React 树 |
| React.lazy 代码分割      | `comstart/LazyLoadingDemo28.tsx` + `HeavyComponentModule.tsx` | 动态导入、Suspense fallback、路由级懒加载、减少首屏体积              |
| 虚拟列表                 | `comstart/VirtualListDemo35.tsx`                              | 只渲染可见项、scrollTop/itemHeight 计算、10万条数据流畅滚动          |

### 阶段七：设计模式与企业级工程（高级）

| 知识点              | 学习文件                                                                                                                                                     | 核心概念                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 自定义 Hook 开发    | `comstart/CustomHooksDemo29.tsx`、`hooks/useDebounce.ts`、`hooks/useLocalStorage.ts`、`hooks/useMousePosition.ts`、`hooks/useToggle.ts`、`hooks/useFetch.ts` | use 命名规范、封装复用逻辑、防抖/持久化/追踪/请求                                      |
| useImperativeHandle | `comstart/UseImperativeHandle22.tsx`                                                                                                                         | 暴露子组件方法、父组件命令式调用、focus/reset/getValue                                 |
| Zustand 状态管理    | `comstart/ZustandDemo30.tsx`、`store/useUserStore.ts`                                                                                                        | create/store、选择器模式、无 Provider、登录/登出/更新、对比 Redux                      |
| 高阶组件 HOC        | `comstart/HOCDemo31.tsx`                                                                                                                                     | withLoading/withAuth、接收组件返回新组件、透传 props、displayName、HOC 组合            |
| Render Props        | `comstart/RenderPropsDemo32.tsx`                                                                                                                             | render prop / function as children、共享状态逻辑、调用方决定渲染、Toggle/MouseTracker  |
| forwardRef 兼容     | `comstart/ForwardRefDemo33.tsx`                                                                                                                              | React 18 forwardRef 写法、React 19 ref as props、老项目维护、配合 useImperativeHandle  |
| 权限控制            | `comstart/PermissionDemo34.tsx`                                                                                                                              | 路由级（ProtectedRoute）、按钮级（AuthButton）、权限码、角色管理、hasPermission 函数   |
| 错误边界            | `comstart/ErrorBoundaryDemo36.tsx`                                                                                                                           | 类组件实现、getDerivedStateFromError、componentDidCatch、捕获范围、use() reject 捕获   |
| 拖拽排序            | `comstart/DragDropDemo37.tsx`                                                                                                                                | HTML5 拖拽 API、draggable/dragstart/dragover/drop/dragend、splice 交换、@dnd-kit 推荐  |
| axios 拦截器封装    | `utils/request.ts`                                                                                                                                           | 请求拦截（token）、响应拦截（错误码/401/403）、统一 get/post/put/del、ApiResponse 泛型 |
| 环境变量            | `.env.example`                                                                                                                                               | VITE_ 前缀、import.meta.env、开发/生产环境区分                                         |

### 阶段八：生态库实战（企业级）

| 知识点                        | 学习文件                                                                                                                                                      | 核心概念                                                                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Redux Toolkit                 | `comstart/ReduxToolkitDemo38.tsx`、`store/counterSlice.ts`、`store/todoSlice.ts`、`store/reduxStore.ts`                                                       | createSlice、createAsyncThunk、configureStore、useSelector、useDispatch、Immer 不可变更新、多 slice 共存                                                                                      |
| Ant Design                    | `comstart/AntdDemo39.tsx`                                                                                                                                     | Button/Input/Select/Table/Modal/Form/Tabs/DatePicker、ConfigProvider 主题、表单校验、分页、Popconfirm                                                                                         |
| ahooks                        | `comstart/AhooksDemo40.tsx`                                                                                                                                   | useToggle/useBoolean/useCounter/useDebounce/useThrottle/useInterval/useSize/useClickAway/useScroll/useLocalStorageState/useCountDown/useFullscreen/useCopyToClipboard/useNetwork/useLongPress |
| Framer Motion                 | `comstart/FramerMotionDemo41.tsx`                                                                                                                             | motion 组件、initial/animate/exit、AnimatePresence、variants、layout、layoutId、whileHover/whileTap/whileDrag、useMotionValue/useTransform/useSpring、拖拽                                    |
| Vitest 测试                   | `comstart/VitestDemo42.tsx`、`vitest.config.ts`、`src/test/setup.ts`、`utils/mathUtils.test.ts`、`comstart/CounterComp04.test.tsx`、`hooks/useToggle.test.ts` | describe/it/expect、render/screen/fireEvent、userEvent、renderHook/act、vi.fn/vi.useFakeTimers、覆盖率                                                                                        |
| useSyncExternalStore          | `comstart/UseSyncExternalStoreDemo43.tsx`                                                                                                                     | 订阅外部 store、tearing 问题、subscribe/getSnapshot/getServerSnapshot、Zustand/Redux 内部原理、订阅浏览器 API                                                                                 |
| React.Children + cloneElement | `comstart/ReactChildrenDemo44.tsx`                                                                                                                            | Children.map/forEach/count/only/toArray、cloneElement 注入 props、isValidElement、Tabs/ButtonGroup 实现、老项目维护                                                                           |
| SuspenseList + preload        | `comstart/SuspenseListPreloadDemo45.tsx`                                                                                                                      | unstable_SuspenseList、revealOrder/tail、preload/preinit/preconnect、资源预加载、布局抖动优化                                                                                                 |

---

## 五、React 19 新特性速查表

| 新特性           | API                                 | 解决的问题                         | 对比 React 18                  |
| ---------------- | ----------------------------------- | ---------------------------------- | ------------------------------ |
| use() Hook       | `use(promise)`                      | 直接读取 Promise，简化异步数据获取 | useEffect + 三个 state         |
| useActionState   | `useActionState(fn, init)`          | 管理表单 Action 状态和提交状态     | 手动管理 loading/error         |
| useFormStatus    | `useFormStatus()`                   | 子组件获取父表单提交状态           | 通过 props 传递 pending        |
| useOptimistic    | `useOptimistic(base, fn)`           | 乐观更新，即时 UI 反馈             | 手动管理临时状态               |
| ref 作为 props   | `function Comp({ ref })`            | 子组件直接接收 ref                 | 需要 forwardRef                |
| ref 回调清理     | `ref={(el) => { return () => {} }}` | ref 卸载时执行清理                 | 需要单独 useEffect             |
| 文档元数据       | `<title>/<meta>/<link>`             | 组件中直接管理 head 元素           | useEffect 或 react-helmet      |
| React Compiler   | 构建时自动优化                      | 自动 memoization，无需手动优化     | useMemo/useCallback/React.memo |
| 原生 form action | `<form action={fn}>`                | 异步函数直接作为 form action       | onSubmit + preventDefault      |

---

## 六、快速开始

### 安装依赖

```bash
pnpm install
# 或 npm install / yarn install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

### 代码检查

```bash
pnpm lint
```

### 运行测试

```bash
pnpm test          # 运行所有测试
pnpm test:watch    # 监听模式
pnpm test:ui       # 可视化 UI 界面
pnpm test:coverage # 覆盖率报告
```

---

## 七、学习建议

### 推荐学习顺序

1. **先跑起来**：`pnpm dev` 启动项目，浏览路由版的各个页面
2. **基础阶段**：切换到模式1（App.tsx），从上到下逐个看组件，修改代码观察变化
3. **编号阶段**：切换到模式2（Basic.tsx），按 **01-45** 编号顺序系统学习
   - 01-16：React 基础到 Context
   - 19：TanStack Query 数据请求
   - 20-28：性能优化与并发特性（useMemo/useCallback/useTransition/Portals/lazy 等）
   - 29：自定义 Hook 综合
   - 30：Zustand 状态管理
   - 31-33：设计模式（HOC/Render Props/forwardRef）
   - 34-37：企业级工程（权限/虚拟列表/错误边界/拖拽）
   - 38：Redux Toolkit 状态管理
   - 39：Ant Design 组件库
   - 40：ahooks 工具 Hook 库
   - 41：Framer Motion 动画库
   - 42：Vitest 单元测试
   - 43：useSyncExternalStore（订阅外部 store）
   - 44：React.Children + cloneElement（老项目维护）
   - 45：SuspenseList + preload/preinit（并发与资源预加载）
4. **React 19 重点**：重点理解 use()、useActionState、useFormStatus、useOptimistic 四个新 Hook
5. **实战综合**：研究 NewTodo.tsx 和 RegisterForm.tsx（comstart）两个综合示例
6. **生态学习**：理解 React Router、TanStack Query、Zustand、React Hook Form 的核心概念
7. **工程化**：学习 axios 拦截器封装（utils/request.ts）、权限控制、环境变量配置
8. **生态库**：学习 Redux Toolkit（38）、Ant Design（39）、ahooks（40）、Framer Motion（41）
9. **测试**：学习 Vitest 单元测试（42），运行 `pnpm test` 体验测试流程

### 学习方法

- **每个组件都改一改**：修改 props、state、样式，观察 UI 变化
- **对比学习**：React 18 vs React 19 的对比文件（ExpensiveComponent、UserProfile）要对照看
- **控制台观察**：PerformanceDemo07 中打开控制台观察重渲染日志
- **网络面板观察**：UserListComp05 和 PostList19 中打开网络面板观察请求
- **写注释**：尝试自己给组件加注释，检验是否真正理解

### 关键概念辨析

| 概念                                   | 区别                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| useState vs useReducer                 | 简单状态用 useState，复杂逻辑/多子值/下一个状态依赖前一个用 useReducer                           |
| useEffect vs useLayoutEffect           | 大多数情况用 useEffect，需要同步阻塞 DOM 绘制时用 useLayoutEffect                                |
| useRef vs useState                     | ref 变化不触发重渲染，state 变化触发重渲染                                                       |
| Context vs 状态管理库                  | 低频更新（主题/语言）用 Context，高频复杂状态用 Zustand/Redux                                    |
| 受控 vs 非受控组件                     | value 绑定 state 为受控，ref 获取值为非受控；React Hook Form 是非受控                            |
| useMemo vs useCallback                 | useMemo 缓存计算结果，useCallback 缓存函数引用；React 19 Compiler 自动处理                       |
| useTransition vs useDeferredValue      | useTransition 主动控制哪些更新是过渡，useDeferredValue 被动延迟一个值                            |
| HOC vs Render Props vs 自定义 Hook     | 自定义 Hook 最简洁首选；HOC 用于包裹组件注入 props；Render Props 用于灵活控制渲染                |
| forwardRef vs ref as props             | React 18 用 forwardRef，React 19 直接在 props 接收 ref；老项目仍需 forwardRef                    |
| 虚拟列表 vs 普通列表                   | 数据量 >1000 条考虑虚拟列表，只渲染可见项；普通列表直接 map 渲染                                 |
| Zustand vs Redux Toolkit               | Zustand 轻量简洁无 Provider，中小型应用推荐；Redux Toolkit 功能强大调试好，大型应用/面试高频     |
| antd vs 其他 UI 库                     | antd 企业级中后台首选，组件丰富；MUI 偏 Material Design；Arco Design 字节出品                    |
| ahooks vs 自定义 Hook                  | ahooks 生产就绪覆盖广，直接用；简单逻辑可自己写自定义 Hook 学习                                  |
| Framer Motion vs CSS 动画              | Framer Motion 声明式 API 强大，适合复杂交互/布局动画；简单过渡用 CSS 即可                        |
| Vitest vs Jest                         | Vitest 更快配置更简单，Vite 项目首选；Jest 生态更成熟，老项目常见                                |
| useSyncExternalStore vs useEffect 订阅 | useSyncExternalStore 避免并发 tearing，是订阅外部 store 的标准方式；useEffect 订阅可能有撕裂问题 |
| cloneElement vs Context                | cloneElement 用于父→子直接注入 props；Context 用于跨多层共享；现代优先用 Context/render props    |
| preload vs preinit                     | preload 只下载不执行（图片/字体）；preinit 下载并立即执行/应用（脚本/样式）                      |

---

## 八、项目亮点

- **全覆盖**：从 JSX 基础到 React 19 新特性，涵盖 React 开发 45 个核心知识点
- **双组示例**：components/（无编号）和 comstart/（带编号 01-45）两组示例，可交叉参考
- **对比学习**：React 18 vs React 19 的数据获取和性能优化对比文件
- **详细注释**：每个文件都有文件头说明知识点，关键代码行有行内注释
- **可运行**：每个组件都是独立可运行的示例，修改即可看到效果
- **企业级栈**：React Router + TanStack Query + React Hook Form + Zod + Zustand + Redux Toolkit + Ant Design + Axios
- **设计模式**：HOC、Render Props、自定义 Hook、forwardRef 等经典模式全覆盖
- **工程化**：axios 拦截器封装、权限控制（路由+按钮级）、环境变量、虚拟列表、拖拽排序
- **动画与测试**：Framer Motion 动画库、Vitest 单元测试（纯函数/组件/Hook 三类测试）
- **八阶段学习路径**：基础→状态→副作用→React 19 新特性→生态→性能并发→设计模式工程化→生态库实战
