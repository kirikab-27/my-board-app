#!/bin/bash

echo "🛑 [EMERGENCY BRAKE] 緊急停止タイマー開始"
echo ""
echo "📝 5分間で以下を考えてください："
echo "   1. 何が本当の問題？（症状ではなく原因）"
echo "   2. なぜ緊急？（真の緊急 vs 単なる急ぎ）"  
echo "   3. Issue作成 vs 即座修正？"
echo ""
echo "⏰ 残り時間..."

for i in {5..1}; do
  echo "   ${i}分"
  sleep 60
done

echo ""
echo "🔔 5分経過 - 判定を決めてください"
echo "   📋 Issue作成推奨 or 🚨 即座対応継続"
echo ""
echo "💭 緊急度判定:"
echo "   🔴 CRITICAL: 本番サービス停止・セキュリティ侵害"
echo "   🟡 HIGH: 一部ユーザー影響・機能停止"
echo "   🟢 MEDIUM: 改善・バグ修正・新機能" 
echo "   ⚪ LOW: タイポ・スタイル・ドキュメント"