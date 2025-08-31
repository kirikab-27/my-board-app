import { useState } from 'react';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

/**
 * パスワード表示・非表示切り替え用カスタムフック
 * Issue #42: UI改善 - パスワード入力時の表示切り替え機能
 * Hydration安全対応: useIsomorphicLayoutEffectでSSR/CSR同期
 */
export const usePasswordVisibility = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // SSR安全なレイアウトエフェクト使用
  useIsomorphicLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return {
    isVisible,
    toggleVisibility,
    // Hydration安全: マウント前は常にpassword type
    inputType: isMounted && isVisible ? 'text' : 'password',
    // アクセシビリティ用のaria-label
    ariaLabel: isVisible ? 'パスワードを非表示にする' : 'パスワードを表示する',
    // InputAdornment表示制御（Hydration安全）
    showToggle: isMounted,
  };
};