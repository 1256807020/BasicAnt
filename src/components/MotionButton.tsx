/**
 * MotionButton — 基于 framer-motion 的 antd 主按钮
 * --------------------------------------------------
 * 在 antd Button 外层包一层 motion.div，提供：
 *   - hover：轻微放大并上浮
 *   - tap：回弹缩小
 * 保持 antd Button 的全部 props（type / block / loading / htmlType ...）不变。
 */

import { Button, type ButtonProps } from 'antd';
import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const MotionButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { block, ...rest } = props;
  return (
    <motion.div
      style={{ display: block ? 'block' : 'inline-block' }}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      <Button ref={ref} block={block} {...rest} />
    </motion.div>
  );
});

MotionButton.displayName = 'MotionButton';

export default MotionButton;
