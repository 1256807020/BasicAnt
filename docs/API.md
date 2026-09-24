# API 接口契约（前后端统一规范）

> **用途**：本文件是「前端模板 ↔ 后端（BasicApi / 未来的 Nest 12.x）」的**单一事实来源**。
> 所有后端实现（含 Nest 12.x 重写）都必须遵守这里的响应格式、错误码、路径与鉴权约定，
> 前端 `src/utils/request.ts` + `src/api/*` 已严格按此实现，可对照验证。
>
> **现状**：当前对接的 BasicApi（默认 `http://127.0.0.1:1234`）已 100% 符合本契约，
> 可直接联调；Nest 12.x 上线时按此复刻即可零改动切换。

---

## 1. 基础约定

| 项           | 值                                                                                |
| ------------ | --------------------------------------------------------------------------------- |
| API 前缀     | 所有接口以 `/api` 开头                                                            |
| 数据格式     | `application/json`                                                                |
| 开发代理     | Vite `server.proxy` 将 `/api` → `VITE_API_TARGET`（默认 `http://127.0.0.1:1234`） |
| 生产 baseURL | `VITE_API_BASE_URL`（默认回退 `/api`）                                            |
| 时间格式     | `YYYY-MM-DD HH:mm:ss`（字符串）                                                   |
| ID 类型      | 字符串或数字（前端统一用 `string \| number`）                                     |

---

## 2. 统一响应信封

**所有接口**（成功与失败）都返回如下结构：

```jsonc
{
  "code": 0,            // 业务码：0 成功，非 0 业务错误
  "msg": "success",     // 提示语，前端出错时直接展示
  "data": ...,          // 业务数据（列表为数组，详情为对象，失败为 null）
  "total": 0,           // [分页列表] 总条数
  "page": 1,            // [分页列表] 当前页
  "pageSize": 10,       // [分页列表] 每页条数
  "totalPages": 0       // [分页列表] 总页数
}
```

- **成功**：`code === 0`，`data` 为实际数据。
- **业务失败**：`code !== 0`，前端 `request.ts` 的 `http()` 自动 `notify(msg)` 并 `throw ApiError`。
- **分页列表**：`data` 为数组，分页元数据放在信封顶层（`total/page/pageSize/totalPages`）。

---

## 3. 业务状态码

|    code | 含义                 | HTTP 状态 | 前端行为                      |
| ------: | -------------------- | --------: | ----------------------------- |
|     `0` | 成功                 |       200 | 正常返回 data                 |
| `40000` | 参数错误             |       400 | 提示 msg                      |
| `40001` | 未登录 / token 失效  |       401 | 清登录态 + 提示 + 跳 `/login` |
| `40003` | 无权限               |       403 | 提示 msg                      |
| `40004` | 数据不存在           |       404 | 提示 msg                      |
| `40005` | 上传失败             |       400 | 提示 msg                      |
| `50000` | 服务器内部错误       |       500 | 提示「服务器内部错误」        |
| `50003` | 操作失败（业务拒绝） |       400 | 提示 msg                      |

> 前端 `request.ts` 同时监听 **HTTP 401** 与 **业务码 40001** 两种「未登录」信号，
> 二者任一触发都会清理 token 并跳登录页。

---

## 4. 鉴权

- **请求头**：`Authorization: Bearer <token>`
- **审计头**（后端记录「谁在操作」）：`x-user-id`、`x-user-name`
- token 来自登录接口返回的 `data.token`，前端存于 `localStorage`，由 `utils/auth.ts` 管理。

---

## 5. 分页与查询参数

列表类 `GET` 请求接受：

| 参数            | 说明                                                |
| --------------- | --------------------------------------------------- |
| `page`          | 页码，从 1 开始                                     |
| `pageSize`      | 每页条数                                            |
| `keyword`       | 关键字（后端按 `keywordFields` 模糊匹配）           |
| `keywordFields` | 参与关键字匹配的字段（逗号分隔，可选）              |
| `sort`          | 排序字段                                            |
| `order`         | `asc` / `desc`                                      |
| `tree`          | `1` 时返回树形结构（按 `parentId` 嵌套 `children`） |

响应见 §2 信封的分页字段。

---

## 6. 通用资源 CRUD（RESTful）

路径中的 `:resource` 为集合名（如 `article` / `user` / `table` / `sys_config`）。

| 方法     | 路径                      | 说明                             | 返回                          |
| -------- | ------------------------- | -------------------------------- | ----------------------------- |
| `GET`    | `/:resource`              | 分页列表（支持 §5 参数）         | 信封 + `data: T[]` + 分页字段 |
| `POST`   | `/:resource`              | 新增                             | 信封 + `data: T`（新建实体）  |
| `GET`    | `/:resource/:id`          | 详情                             | 信封 + `data: T`              |
| `PATCH`  | `/:resource/:id`          | 增量修改                         | 信封 + `data: T`              |
| `DELETE` | `/:resource/:id`          | 删除                             | 信封                          |
| `POST`   | `/:resource/batch-delete` | 批量删除，body `{ "ids": [] }`   | 信封                          |
| `GET`    | `/:resource/_count`       | 计数，body `{ "total": number }` | 信封 + `data: { total }`      |

> 前端封装见 `src/api/crud.ts` 的 `createCrudApi(resource)`，一行得到一个资源的
> `list/tree/detail/create/update/remove/batchRemove/count`。

---

## 7. RBAC 域（`/api/rbac`）

| 方法                      | 路径                                     | 说明                                             |
| ------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `POST`                    | `/rbac/auth/login`                       | 登录，body `{ username, password }`              |
| `POST`                    | `/rbac/auth/register`                    | 注册                                             |
| `GET`                     | `/rbac/auth/me?userId=`                  | 用 userId 取当前用户信息                         |
| `POST`                    | `/rbac/auth/logout`                      | 退出                                             |
| `POST`                    | `/rbac/auth/password`                    | 改密                                             |
| `GET`                     | `/rbac/users`                            | 用户列表（已 JOIN 部门/岗位/角色名）             |
| `POST`                    | `/rbac/users`                            | 新增用户（密码经后端哈希）                       |
| `GET` `/PATCH` / `DELETE` | `/user/:id`                              | 用户详情 / 改 / 删（走通用 CRUD）                |
| `POST`                    | `/rbac/user/roles`                       | 分配角色 `{ userId, roleIds }`                   |
| `GET`                     | `/rbac/user/roles?userId=`               | 取用户角色                                       |
| `POST`                    | `/rbac/user/reset-password`              | 重置密码 `{ userId, password? }`                 |
| `POST`                    | `/rbac/user/status`                      | 启用/禁用 `{ userId, status }`                   |
| `GET`                     | `/rbac/roles` / `/rbac/roles/all`        | 角色列表 / 全部（下拉用）                        |
| `POST` / `PUT` / `DELETE` | `/rbac/roles` / `/rbac/roles/:id`        | 角色增改删                                       |
| `GET` / `POST`            | `/rbac/role/permissions?roleId=`         | 取/存角色权限                                    |
| `GET` / `POST`            | `/rbac/role/users?roleId=`               | 取/存角色下用户                                  |
| `GET`                     | `/rbac/permissions?tree=1`               | 权限（菜单）树                                   |
| `POST` / `PUT` / `DELETE` | `/rbac/permissions` / `/:id`             | 权限增改删                                       |
| `GET`                     | `/rbac/depts?tree=1` / `/rbac/depts/all` | 部门树 / 全部                                    |
| `POST` / `PUT` / `DELETE` | `/rbac/depts` / `/:id`                   | 部门增改删                                       |
| `GET`                     | `/rbac/dicts`                            | 字典分类（含 `itemCount`/`items`）               |
| `GET`                     | `/rbac/dict/:code/items`                 | 某字典的具体项                                   |
| `POST` / `PUT` / `DELETE` | `/rbac/dicts` / `/:id`                   | 字典增改删                                       |
| `GET`                     | `/rbac/logs`                             | 审计日志（支持 module/action/username/时间范围） |
| `GET`                     | `/rbac/logs/overview`                    | 日志概览（总数/今日/失败/按模块/趋势）           |
| `DELETE`                  | `/rbac/logs?confirm=1`                   | 清空日志                                         |
| `POST`                    | `/rbac/seed?confirm=1`                   | 初始化 RBAC 演示数据                             |

### 登录返回示例

```jsonc
{
  "code": 0,
  "data": {
    "token": "rbac.<userId>.<ts>",
    "userInfo": {
      "id": 1,
      "username": "admin",
      "nickname": "系统管理员",
      "avatar": "",
      "email": "admin@example.com",
      "phone": "13800000001",
      "deptId": 1,
      "deptName": "总公司",
      "roleIds": ["..."],
      "roleNames": ["超级管理员"],
      "roleCodes": ["admin"],
      "dataScope": "all",
      "permissions": ["dashboard", "system:user", "system:user:list", "..."],
      "isAdmin": true,
    },
  },
  "msg": "success",
}
```

---

## 8. 前端如何消费（速查）

- **发请求**：`src/utils/request.ts` → `http()` 统一解包信封，非 0 抛错。
- **列表**：`src/hooks/useCrudList.ts` 管分页/关键字/筛选。
- **通用 CRUD**：`src/api/crud.ts` 的 `createCrudApi(resource)`。
- **RBAC 接口**：`src/api/rbac.ts`（登录/用户/角色/权限/部门/字典/日志）。
- **按钮级权限**：`<Auth code="system:user:add">`（`src/components/Auth.tsx`）。
- **类型**：响应结构见 `src/types/index.ts`（`ResEnvelope` / `PageResult`），业务模型见 `src/types/rbac.ts`。

---

## 9. Nest 12.x 实现者须知

重写后端时请保证：

1. 全局响应拦截器输出 §2 信封，`success` 用 `code: 0`；
2. 业务异常映射 §3 的 `code` 与 HTTP 状态；
3. `401 / 40001` 两种未登录信号都要能触发前端登出；
4. 列表接口务必返回信封顶层的 `total/page/pageSize/totalPages`；
5. 路径风格、鉴权头（§4）、REST 资源约定（§6）、RBAC 域（§7）与本文一致；
6. 登录返回的 `userInfo` 字段集与 §7 示例完全一致（含 `isAdmin` 与 `permissions`）。
