import { Metadata } from 'next';
import ConfigManagement from '@/components/admin/config/ConfigManagement';

export const metadata: Metadata = {
  title: 'システム設定管理 | 管理画面',
  description: 'システム設定の管理',
};

export default function ConfigPage() {
  return <ConfigManagement />;
}
