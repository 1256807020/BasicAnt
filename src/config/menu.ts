/**
 * menu.ts — 菜单配置（纯数据，不依赖 React 运行时）
 * --------------------------------------------------
 * code 为权限码：侧边栏按当前用户 permissions 过滤，无权限的菜单不显示。
 * icon 用名称而不是组件，映射统一在 layouts/AppSider.tsx 中完成。
 */

export type IconName =
  | 'dashboard'
  | 'setting'
  | 'user'
  | 'role'
  | 'permission'
  | 'dept'
  | 'post'
  | 'dict'
  | 'log'
  | 'config'
  | 'article'
  | 'notice'
  | 'table';

export interface MenuNode {
  /** 同时作为路由跳转地址 */
  key: string;
  label: string;
  icon?: IconName;
  /** 权限码，不传则不鉴权 */
  code?: string;
  children?: MenuNode[];
}

export const menuConfig: MenuNode[] = [
  { key: '/dashboard', label: '仪表盘', icon: 'dashboard', code: 'dashboard' },
  {
    key: '/system',
    label: '系统管理',
    icon: 'setting',
    code: 'system',
    children: [
      { key: '/system/user', label: '用户管理', icon: 'user', code: 'system:user' },
      { key: '/system/role', label: '角色管理', icon: 'role', code: 'system:role' },
      {
        key: '/system/permission',
        label: '权限管理',
        icon: 'permission',
        code: 'system:permission',
      },
      { key: '/system/dept', label: '部门管理', icon: 'dept', code: 'system:dept' },
      { key: '/system/post', label: '岗位管理', icon: 'post', code: 'system:post' },
      { key: '/system/dict', label: '字典管理', icon: 'dict', code: 'system:dict' },
      { key: '/system/log', label: '审计日志', icon: 'log', code: 'system:log' },
      { key: '/system/config', label: '系统参数', icon: 'config', code: 'system:config' },
    ],
  },
  {
    key: '/content',
    label: '内容管理',
    icon: 'article',
    code: 'content',
    children: [
      { key: '/content/article', label: '文章管理', icon: 'article', code: 'content:post' },
      { key: '/content/notice', label: '通知公告', icon: 'notice', code: 'content:notice' },
      { key: '/content/tag', label: '标签管理', icon: 'notice', code: 'content:tag' },
    ],
  },
  {
    key: '/data',
    label: '数据管理',
    icon: 'table',
    code: 'data',
    children: [{ key: '/data/table', label: '通用数据', icon: 'table', code: 'data:table' }],
  },
];

/** 路径 → 面包屑标题链 */
export function buildTitleMap(nodes: MenuNode[], parent?: string): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  nodes.forEach((node) => {
    if (node.children?.length) {
      Object.assign(map, buildTitleMap(node.children, node.label));
    } else {
      map[node.key] = parent ? [parent, node.label] : [node.label];
    }
  });
  return map;
}

export const titleMap = buildTitleMap(menuConfig);
