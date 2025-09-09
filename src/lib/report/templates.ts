/**
 * 通報対応テンプレート
 * Issue #60: レポート・通報システム
 */

export interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables?: string[]; // 置換可能な変数
}

export const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'resolved-spam',
    name: 'スパム対応完了',
    category: 'spam',
    subject: '通報いただいた内容への対応完了のお知らせ',
    body: `お客様

この度は、不適切なコンテンツについてご報告いただき、誠にありがとうございました。

受付番号: {{reportNumber}}

ご報告いただいた内容を確認し、当社のガイドラインに違反していることが確認できたため、
該当するコンテンツを削除いたしました。

今後とも、安全で快適なサービス環境の維持にご協力いただければ幸いです。

よろしくお願いいたします。`,
    variables: ['reportNumber'],
  },
  {
    id: 'resolved-harassment',
    name: 'ハラスメント対応完了',
    category: 'harassment',
    subject: '通報いただいた内容への対応完了のお知らせ',
    body: `お客様

この度は、ハラスメント行為についてご報告いただき、誠にありがとうございました。

受付番号: {{reportNumber}}

ご報告いただいた内容を慎重に調査した結果、当社のコミュニティガイドラインに
重大な違反が認められたため、以下の措置を実施いたしました：

1. 該当コンテンツの削除
2. 違反ユーザーへの警告/アカウント停止

被害に遭われたことに対し、心よりお詫び申し上げます。
今後、このような事態が発生しないよう、監視体制を強化してまいります。

追加のご質問やご懸念がございましたら、お気軽にお問い合わせください。

よろしくお願いいたします。`,
    variables: ['reportNumber'],
  },
  {
    id: 'rejected-no-violation',
    name: '違反なし（却下）',
    category: 'other',
    subject: '通報内容の確認結果について',
    body: `お客様

この度は、コンテンツについてご報告いただき、ありがとうございました。

受付番号: {{reportNumber}}

ご報告いただいた内容を慎重に確認いたしましたが、
現時点では当社のガイドラインに違反する内容は確認できませんでした。

ただし、今後も継続的に監視を行い、問題が確認された場合は
適切に対応させていただきます。

ご理解のほど、よろしくお願いいたします。`,
    variables: ['reportNumber'],
  },
  {
    id: 'escalated',
    name: 'エスカレーション通知',
    category: 'other',
    subject: '通報内容の詳細調査について',
    body: `お客様

この度は、重要な内容についてご報告いただき、誠にありがとうございました。

受付番号: {{reportNumber}}

ご報告いただいた内容は、より詳細な調査が必要と判断したため、
専門チームにエスカレーションいたしました。

調査には通常より時間を要する場合がございますが、
48-72時間以内に調査結果をご連絡いたします。

ご不便をおかけいたしますが、今しばらくお待ちください。

よろしくお願いいたします。`,
    variables: ['reportNumber'],
  },
  {
    id: 'copyright-removed',
    name: '著作権侵害対応',
    category: 'copyright',
    subject: '著作権侵害コンテンツの削除完了',
    body: `お客様

この度は、著作権侵害についてご報告いただき、ありがとうございました。

受付番号: {{reportNumber}}

ご報告いただいた内容を確認し、著作権侵害が認められたため、
該当するコンテンツを削除いたしました。

DMCA（デジタルミレニアム著作権法）に基づく正式な申し立てが必要な場合は、
別途お問い合わせください。

今後とも、知的財産権の保護にご協力いただければ幸いです。

よろしくお願いいたします。`,
    variables: ['reportNumber'],
  },
];

/**
 * テンプレートの変数を置換
 */
export function applyTemplate(
  template: ResponseTemplate,
  variables: Record<string, string>
): string {
  let body = template.body;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    body = body.replace(regex, value);
  });

  return body;
}

/**
 * カテゴリーに応じたテンプレートを取得
 */
export function getTemplatesByCategory(category: string): ResponseTemplate[] {
  return RESPONSE_TEMPLATES.filter(
    (template) => template.category === category || template.category === 'other'
  );
}
