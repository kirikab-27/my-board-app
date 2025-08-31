import { useEffect, useLayoutEffect } from 'react';

/**
 * SSR安全なlayoutEffect
 * サーバーサイド：useEffect使用
 * クライアントサイド：useLayoutEffect使用
 * 
 * Issue #42: Hydrationエラー根本解決のため
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;