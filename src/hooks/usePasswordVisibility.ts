import { useState } from 'react';

/**
 * パスワード表示・非表示切り替え用カスタムフック
 * Issue #42: UI改善 - パスワード入力時の表示切り替え機能
 */
export const usePasswordVisibility = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return {
    isVisible,
    toggleVisibility,
    // Material-UI TextField用の設定
    inputType: isVisible ? 'text' : 'password',
    // アクセシビリティ用のaria-label
    ariaLabel: isVisible ? 'パスワードを非表示にする' : 'パスワードを表示する',
  };
};