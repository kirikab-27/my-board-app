import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: session.user,
      expires: session.expires,
    });

  } catch (error) {
    console.error('❌ Session retrieval error:', error);
    Sentry.captureException(error);
    
    return NextResponse.json({ user: null }, { status: 200 });
  }
}