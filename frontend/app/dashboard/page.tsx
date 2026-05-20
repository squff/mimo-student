'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface Stats {
  totalInteractions: number;
  pendingHomework: number;
  weekCourses: number;
  unmasteredTopics: number;
}

interface Interaction {
  id: string;
  type: string;
  summary: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/stats')
      .then((data: any) => {
        setStats(data.stats || data);
        setInteractions(data.recentInteractions || []);
      })
      .catch(() => {
        // Fallback demo data
        setStats({ totalInteractions: 0, pendingHomework: 0, weekCourses: 0, unmasteredTopics: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">控制台</h1>

      {/* Stats Row */}
      <div className="stats-row">
        {[
          { label: '总互动次数', value: stats?.totalInteractions ?? '-', icon: '💬' },
          { label: '待完成作业', value: stats?.pendingHomework ?? '-', icon: '📝' },
          { label: '本周课程', value: stats?.weekCourses ?? '-', icon: '📚' },
          { label: '未掌握题目', value: stats?.unmasteredTopics ?? '-', icon: '❓' },
        ].map((s) => (
          <div className="card" key={s.label}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-value">{loading ? '...' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16, fontSize: '1rem', color: 'var(--text-muted)' }}>快捷操作</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/camera">
            <button className="btn-primary">📷 拍照识别</button>
          </Link>
          <Link href="/homework">
            <button className="btn-primary">📝 新建作业</button>
          </Link>
          <button className="btn-ghost" onClick={() => alert('AI 对话功能开发中…')}>
            🤖 AI 对话
          </button>
        </div>
      </div>

      {/* Recent Interactions */}
      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: '1rem', color: 'var(--text-muted)' }}>最近互动</h3>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /><span>加载中...</span></div>
        ) : interactions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>暂无互动记录，试试拍照识别吧</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {interactions.slice(0, 10).map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--elevated)',
                  borderRadius: 8,
                }}
              >
                <div>
                  <span className="badge badge-blue" style={{ marginRight: 8 }}>
                    {item.type}
                  </span>
                  <span style={{ fontSize: '0.875rem' }}>{item.summary}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
