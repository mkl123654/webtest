import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';

export const metadata: Metadata = { title: '胖喵管理后台', description: '内容与用户管理' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
