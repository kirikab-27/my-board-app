// Phase 5: ISR Initial Data Optimization - Server Component with Pre-loaded Data
import React from 'react';
import { Metadata } from 'next';
import { getBoardInitialData, getBoardMetadata } from '@/lib/data/boardData';
import BoardPageClient from './BoardPageClient';

// Phase 5: Dynamic metadata generation for SEO optimization
export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getBoardMetadata();
  
  return {
    title: metadata.title,
    description: metadata.description,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: 'website',
      locale: 'ja_JP',
    },
    // LCP改善: preconnect for external resources
    other: {
      'preconnect': 'https://res.cloudinary.com'
    }
  };
}

// Phase 5: ISR with 30-second revalidation for fresh content
export const revalidate = 30; // 30秒ごとにISR再生成

export default async function BoardPage() {
  // Phase 5: Server-side initial data fetching (cached with React cache())
  const initialData = await getBoardInitialData(20);
  
  // Client Componentに事前取得データを渡す
  return <BoardPageClient initialData={initialData} />;
}