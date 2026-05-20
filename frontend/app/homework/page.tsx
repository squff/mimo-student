'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api';

interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  completed: boolean;
}

type FilterTab = 'all' | 'pending' | 'done';

const SUBJECT_BADGE: Record<string, string> = {
  '数学': 'badge-blue',
  '语文': 'badge-red',
  '英语': 'badge-green',
  '物理': 'badge-purple',
  '化学': 'badge-yellow',
  '生物': 'badge-green',
  '历史': 'badge-yellow',
  '地理': 'badge-blue',
  '政治': 'badge-red',
};

export default function HomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: '', title: '', description: '', deadline: '' });

  const fetchHomeworks = () => {
    setLoading(true);
    apiGet('/api/homework')
      .then((data: any) => setHomeworks(data.homeworks || data || []))
      .catch(() => setHomeworks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHomeworks(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.subject.trim()) return;
    try {
      await apiPost('/api/homework', form);
      setShowModal(false);
      setForm({ subject: '', title: '', description: '', deadline: '' });
      fetchHomeworks();
    } catch {
      alert('创建失败，请重试');
    }
  };

  const handleToggle = async (hw: Homework) => {
    try {
      await apiPatch(`/api/homework/${hw.id}`, { completed: !hw.completed });
      setHomeworks((prev) =>
        prev.map((h) => (h.id === hw.id ? { ...h, completed: !h.completed } : h))
      );
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个作业吗？')) return;
    try {
      await apiDelete(`/api/homework/${id}`);
      setHomeworks((prev) => prev.filter((h) => h.id !== id));
    } catch {
      alert('删除失败');
    }
  };

  const filtered = homeworks.filter((hw) => {
    if (filter === 'pending') return !hw.completed;
    if (filter === 'done') return hw.completed;
    return true;
  });

  return (
    <div className="page-container">
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>作业管理</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ 新建作业</button>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {[
          { key: 'all' as FilterTab, label: '全部' },
          { key: 'pending' as FilterTab, label: '待完成' },
          { key: 'done' as FilterTab, label: '已完成' },
        ].map((t) => (
          <button
            key={t.key}
            className={`tab ${filter === t.key ? 'active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-overlay"><div className="spinner" /><span>加载中...</span></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>{filter === 'done' ? '还没有已完成的作业' : filter === 'pending' ? '所有作业都完成啦！' : '暂无作业，点击上方按钮新建'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((hw) => (
            <div
              key={hw.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                opacity: hw.completed ? 0.6 : 1,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className={`badge ${SUBJECT_BADGE[hw.subject] || 'badge-gray'}`}>
                    {hw.subject}
                  </span>
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      textDecoration: hw.completed ? 'line-through' : 'none',
                    }}
                  >
                    {hw.title}
                  </span>
                </div>
                {hw.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    {hw.description}
                  </p>
                )}
                {hw.deadline && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    截止: {new Date(hw.deadline).toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 16 }}>
                <button
                  onClick={() => handleToggle(hw)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: hw.completed ? 'var(--success)' : 'var(--elevated)',
                    color: hw.completed ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {hw.completed ? '✓ 已完成' : '标记完成'}
                </button>
                <button className="btn-danger" onClick={() => handleDelete(hw.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>新建作业</h2>
            <div className="form-group">
              <label>科目</label>
              <input
                className="input"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="例如：数学、英语"
              />
            </div>
            <div className="form-group">
              <label>标题</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="作业标题"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="作业详情（可选）"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>截止时间</label>
              <input
                className="input"
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleCreate} disabled={!form.title.trim() || !form.subject.trim()}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
