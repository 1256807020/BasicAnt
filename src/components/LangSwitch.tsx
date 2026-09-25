/**
 * LangSwitch — 语言切换（已接入 react-i18next）
 * 切换后同步 antd / dayjs 本地化，并持久化到 localStorage。
 */

import { TranslationOutlined } from '@ant-design/icons';
import { Button, Dropdown, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGS, setLang, type LangKey } from '@/i18n';

export default function LangSwitch() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items: SUPPORTED_LANGS.map((l) => ({ key: l.key, label: l.label })),
        selectable: true,
        selectedKeys: [current],
        onClick: ({ key }) => setLang(key as LangKey),
      }}
    >
      <Tooltip title="中文 / English">
        <Button type="text" aria-label="toggle-language" icon={<TranslationOutlined />} />
      </Tooltip>
    </Dropdown>
  );
}
