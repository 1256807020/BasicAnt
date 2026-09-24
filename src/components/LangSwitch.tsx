/**
 * LangSwitch — 语言切换（样式先行）
 * --------------------------------------------------
 * 仿 Ant Design 官网「中文 / English」切换按钮。
 * 当前仅做样式与交互占位，多语言能力后续接入 i18n 后替换。
 */

import { TranslationOutlined } from '@ant-design/icons';
import { App, Button, Dropdown, Tooltip } from 'antd';
import { useState } from 'react';

const LANGS = [
  { key: 'zh-CN', label: '中文' },
  { key: 'en-US', label: 'English' },
];

export default function LangSwitch() {
  const [lang, setLang] = useState('zh-CN');
  const { message } = App.useApp();

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items: LANGS.map((l) => ({ key: l.key, label: l.label })),
        selectable: true,
        selectedKeys: [lang],
        onClick: ({ key }) => {
          setLang(key);
          if (key !== 'zh-CN') message.info('多语言能力规划中，敬请期待');
        },
      }}
    >
      <Tooltip title="中文 / English">
        <Button type="text" aria-label="toggle-language" icon={<TranslationOutlined />} />
      </Tooltip>
    </Dropdown>
  );
}
