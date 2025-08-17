/**
 * CSP違反レポート処理API
 * Content Security Policy違反の記録と分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { processCSPViolation, type CSPViolation } from '@/lib/security/csp-headers';
import { getClientIP } from '@/lib/middleware/security';

export async function POST(request: NextRequest) {
  try {
    // CSP違反レポートの解析
    const body = await request.json();
    const violation: CSPViolation = body['csp-report'] || body;
    
    // クライアント情報の取得
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const timestamp = new Date().toISOString();
    
    // 違反の重要度判定
    const severity = classifyViolationSeverity(violation);
    
    // ログ記録
    const logEntry = {
      timestamp,
      ip: clientIP,
      userAgent,
      severity,
      violation: {
        documentUri: violation['document-uri'],
        violatedDirective: violation['violated-directive'],
        blockedUri: violation['blocked-uri'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number'],
        columnNumber: violation['column-number'],
        statusCode: violation['status-code']
      }
    };
    
    // 開発環境での詳細ログ
    if (process.env.NODE_ENV === 'development') {
      console.warn('🛡️ CSP違反レポート受信:', logEntry);
    }
    
    // CSP違反の処理
    processCSPViolation(violation);
    
    // 高重要度の違反の場合は追加のアクション
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      await handleHighSeverityViolation(logEntry);
    }
    
    // 統計情報の更新（簡易実装）
    updateCSPStatistics(violation['violated-directive']);
    
    return NextResponse.json({ 
      status: 'received',
      timestamp: timestamp
    }, { status: 204 });
    
  } catch (error) {
    console.error('CSP違反レポート処理エラー:', error);
    
    return NextResponse.json({
      error: 'Failed to process CSP report'
    }, { status: 500 });
  }
}

/**
 * CSP違反の重要度を分類
 */
function classifyViolationSeverity(violation: CSPViolation): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const directive = violation['violated-directive'];
  const blockedUri = violation['blocked-uri'];
  
  // 危険な違反パターン
  const criticalPatterns = [
    'script-src',
    'unsafe-eval',
    'unsafe-inline',
    'data:',
    'javascript:'
  ];
  
  const highRiskPatterns = [
    'object-src',
    'frame-src',
    'base-uri'
  ];
  
  // クリティカル: スクリプト実行に関わる違反
  if (criticalPatterns.some(pattern => 
    directive.includes(pattern) || blockedUri.includes(pattern)
  )) {
    return 'CRITICAL';
  }
  
  // 高: フレーム埋め込みなどの違反
  if (highRiskPatterns.some(pattern => 
    directive.includes(pattern)
  )) {
    return 'HIGH';
  }
  
  // 中: スタイルや画像関連
  if (directive.includes('style-src') || directive.includes('img-src')) {
    return 'MEDIUM';
  }
  
  // 低: その他
  return 'LOW';
}

/**
 * 高重要度違反の処理
 */
async function handleHighSeverityViolation(logEntry: any): Promise<void> {
  // TODO: 実際の実装では以下のような処理を行う
  // 1. データベースに永続化
  // 2. Slackやメールでアラート送信
  // 3. セキュリティログに記録
  
  console.error('🚨 高重要度CSP違反を検出:', logEntry);
  
  // 将来の実装例:
  // await sendSecurityAlert('CSP_HIGH_SEVERITY', logEntry);
  // await auditLogger.log('CSP_VIOLATION', logEntry);
}

/**
 * CSP統計情報の更新（簡易実装）
 */
const cspStatistics = new Map<string, number>();

function updateCSPStatistics(directive: string): void {
  const current = cspStatistics.get(directive) || 0;
  cspStatistics.set(directive, current + 1);
  
  // 開発環境では統計を出力
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 CSP違反統計:', Object.fromEntries(cspStatistics));
  }
}

/**
 * CSP統計情報の取得（管理者用）
 */
export async function GET(request: NextRequest) {
  try {
    // 簡易認証（実際の実装では適切な認証を行う）
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.SECURITY_API_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 統計情報の返却
    return NextResponse.json({
      statistics: Object.fromEntries(cspStatistics),
      totalViolations: Array.from(cspStatistics.values()).reduce((a, b) => a + b, 0),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('CSP統計取得エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}