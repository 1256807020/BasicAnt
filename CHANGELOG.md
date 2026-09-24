# Changelog

> 本文件为轻量迭代记录，可落后于实际 git 提交，按需手动补充。
> 提交约定遵循 Conventional Commits：`feat` / `fix` / `refactor` / `docs` / `style` / `chore`。

## 2026-09-24

### Added

- 重构登录 / 注册页：分屏布局（左品牌介绍区 + 右登录卡片），现代后台管理系统风格。
- 登录页接入动效技术栈：GSAP（入场 / 循环浮动 / 鼠标视差）、Lenis（平滑滚动）。
- 蓝白 / 金橙双主题预设（`src/theme/presets.ts`），切换写入 `store.colorPrimary`，antd 组件与背景光斑（CSS 变量 `--brand`）同步变色。
- 头部 `AppHeader` 主题切换改为蓝白 / 金橙预设色板，与登录页共用同一主色。
- 新增可复用 `MotionButton`（framer-motion 微交互：hover 放大上浮、tap 回弹），登录 / 注册主按钮已接入。
- 新增标签管理示例模块。

### Changed

- 清理 antd 6 弃用写法（`Space.direction` / `Statistic.valueStyle` / `Drawer.width` / `Descriptions.Item` / `size` 等）。
- 登录页主题切换区移除「主题」文字标签，仅保留蓝白 / 金橙两个大圆点（为后续语言切换、全屏等预留位置）。

### Docs

- 重写 README 反映当前框架现状，补充动效技术栈（GSAP / Lenis / Three 等）。
