import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'MiMo Student',
  description: '大学生多模态AI学习生活助手',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh' }}>
        <Sidebar />
        <main
          style={{
            marginLeft: '240px',
            flex: 1,
            padding: '32px',
            minHeight: '100vh',
            background: 'var(--bg-base)',
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
