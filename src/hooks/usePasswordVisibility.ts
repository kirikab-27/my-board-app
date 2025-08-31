import { useState, useEffect } from 'react';

/**
 * パスワード表示・非表示切り替え用カスタムフック
 * Issue #42: UI改善 - パスワード入力時の表示切り替え機能
 * Hydration安全対応: SSR/CSR間での不整合回避
 */
export const usePasswordVisibility = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Hydration完了後に表示切り替え機能を有効化
  useEffect(() => {
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