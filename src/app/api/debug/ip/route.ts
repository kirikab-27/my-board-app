import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 外部サービスでIPアドレスを取得
    const responses = await Promise.allSettled([
      fetch('https://api.ipify.org?format=json'),
      fetch('https://httpbin.org/ip'),
      fetch('https://ifconfig.me/ip'),
    ]);

    const ipResults = [];

    for (const response of responses) {
      if (response.status === 'fulfilled' && response.value.ok) {
        try {
          const text = await response.value.text();
          const json = JSON.parse(text);
          ipResults.push(json);
        } catch {
          // JSON以外の場合はそのまま追加（text変数をcatchブロック内で再取得）
          const text = await response.value.text();
          ipResults.push({ ip: text.trim() });
        }
      }
    }

    return NextResponse.json({
      message: 'Vercel IP address check',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL || 'NO',
        VERCEL_REGION: process.env.VERCEL_REGION || 'UNKNOWN',
      },
      ipAddresses: ipResults,
      instructions: {
        note: 'これらのIPアドレスをさくらインターネットの許可リストに追加してください',
        sakuraSettings: 'コントロールパネル → メール設定 → SMTP認証 → 送信元IP制限',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'IP取得に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
