/**
 * 仪表盘 — 数据总览
 * --------------------------------------------------
 * 统计卡片 / 操作趋势 / 模块分布 / 最新用户，全部来自 BasicApi 真实数据。
 */

import { Card, Col, Empty, Row, Statistic, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import type { EChartsOption } from 'echarts';
import { useRequest } from 'ahooks';
import { fetchAllDepts, fetchAllRoles, fetchLogOverview, fetchUsers } from '@/api/rbac';
import EChart from '@/components/EChart';
import type { UserItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';

// ScrollTrigger 已随 gsap 3.15 免费内置（node_modules/gsap/ScrollTrigger.js），无需额外依赖
gsap.registerPlugin(ScrollTrigger);

/** 数字滚动：gsap 补间 + 尊重系统「减弱动效」偏好 */
function useCountUp(target: number, duration = 1.1) {
  // 一次性判定「减弱动效」偏好（惰性初始化，避免在 effect 内同步 setState 引发级联渲染）
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [value, setValue] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    // 用户偏好减弱动效时直接呈现终值，不做补间
    if (reducedMotion) return;
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: target,
      duration,
      ease: 'power2.out',
      // gsap 在动画帧回调里更新，属于「订阅外部系统后在回调中 setState」，合规
      onUpdate: () => setValue(Math.round(obj.v)),
    });
    return () => {
      tween.kill();
    };
  }, [target, duration, reducedMotion]);

  return reducedMotion ? target : value;
}

function StatCard({
  title,
  value,
  color,
  loading,
}: {
  title: string;
  value: number;
  color: string;
  loading: boolean;
}) {
  const animated = useCountUp(value);
  return (
    <Card loading={loading}>
      <Statistic title={title} value={animated} styles={{ content: { color } }} />
    </Card>
  );
}

export default function DashboardPage() {
  const theme = useAppStore((state) => state.theme);
  const userInfo = useAppStore((state) => state.userInfo);
  const root = useRef<HTMLDivElement>(null);

  const { data, loading } = useRequest(async () => {
    const [users, roles, depts, overview] = await Promise.all([
      fetchUsers({ pageSize: 500 }),
      fetchAllRoles(),
      fetchAllDepts(),
      fetchLogOverview(),
    ]);
    return { users: users.list, roleTotal: roles.length, deptTotal: depts.length, overview };
  });

  const users = useMemo<UserItem[]>(() => data?.users ?? [], [data]);
  const overview = data?.overview;

  /**
   * 滚动揭示：卡片/图表滚动进入视口时淡入上移。
   * 依赖 loading —— 数据到位（骨架屏换成真实卡片）后重建，避免元素不存在导致动画失效。
   */
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const items = gsap.utils.toArray<HTMLElement>('.reveal');
      if (!items.length) return;

      gsap.set(items, { opacity: 0, y: 28 });
      ScrollTrigger.batch(items, {
        start: 'top 90%',
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.08,
            ease: 'power3.out',
            overwrite: true,
          }),
      });
      // EChart 高度变化时重算触发点
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [loading] },
  );

  /** 近 7 日操作趋势（来自审计日志） */
  const trendOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: overview?.trend.map((t) => t.day) ?? [],
        boundaryGap: false,
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '操作次数',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.15 },
          data: overview?.trend.map((t) => t.count) ?? [],
        },
      ],
    }),
    [overview],
  );

  /** 操作模块分布 */
  const moduleOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          name: '模块分布',
          type: 'pie',
          radius: ['45%', '70%'],
          data: overview?.byModule ?? [],
        },
      ],
    }),
    [overview],
  );

  const statCards = [
    { title: '用户总数', value: users.length, color: '#1677ff' },
    { title: '角色数量', value: data?.roleTotal ?? 0, color: '#52c41a' },
    { title: '部门数量', value: data?.deptTotal ?? 0, color: '#faad14' },
    { title: '操作日志', value: overview?.total ?? 0, color: '#eb2f96' },
  ];

  return (
    <div className="page-container" ref={root}>
      <Typography.Text type="secondary">
        欢迎回来，{userInfo?.nickname ?? '访客'} · 当前角色 {userInfo?.roleNames.join('、') || '-'}
      </Typography.Text>

      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} xl={6} className="reveal">
            <StatCard title={card.title} value={card.value} color={card.color} loading={loading} />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14} className="reveal">
          <Card title="近 7 日操作趋势" extra={`今日 ${overview?.today ?? 0} 条`}>
            <EChart option={trendOption} theme={theme} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={10} className="reveal">
          <Card title="操作模块分布" extra={`失败 ${overview?.failed ?? 0} 条`}>
            {overview?.byModule.length ? (
              <EChart option={moduleOption} theme={theme} height={300} />
            ) : (
              <Empty description="暂无日志数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="最新用户" className="reveal">
        <Table<UserItem>
          rowKey="id"
          size="medium"
          loading={loading}
          dataSource={users.slice(0, 5)}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无数据" /> }}
          columns={[
            { title: '用户名', dataIndex: 'username' },
            { title: '昵称', dataIndex: 'nickname' },
            { title: '部门', dataIndex: 'deptName', render: (v?: string) => v || '-' },
            {
              title: '角色',
              dataIndex: 'roleNames',
              render: (names?: string[]) =>
                names?.length
                  ? names.map((n) => (
                      <Tag key={n} color="blue">
                        {n}
                      </Tag>
                    ))
                  : '-',
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (v?: string) =>
                v === '0' ? <Tag color="red">禁用</Tag> : <Tag color="green">启用</Tag>,
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              render: (v?: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
            },
          ]}
        />
      </Card>
    </div>
  );
}
