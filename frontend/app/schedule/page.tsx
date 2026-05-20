'use client';

import { useEffect, useState, useRef } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

interface Course {
  id: string;
  name: string;
  day: number;       // 1=Mon ... 7=Sun
  startHour: number; // 8-19
  endHour: number;   // 9-20
  color: string;
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00
const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#f97316'];

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', day: 1, startHour: 8, endHour: 9 });

  const fetchSchedule = () => {
    setLoading(true);
    apiGet('/api/schedule')
      .then((data: any) => setCourses(data.courses || data || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchedule(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      await apiPost('/api/schedule', form);
      setShowForm(false);
      setForm({ name: '', day: 1, startHour: 8, endHour: 9 });
      fetchSchedule();
    } catch {
      alert('添加失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('删除此课程？')) return;
    try {
      await apiDelete(`/api/schedule/${id}`);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('删除失败');
    }
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      await apiPost('/api/schedule/ocr', form);
      fetchSchedule();
    } catch {
      alert('课表识别失败，请重试');
    } finally {
      setOcrLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const getCourseColor = (course: Course) => {
    if (course.color) return course.color;
    const idx = courses.findIndex((c) => c.id === course.id);
    return COLORS[idx % COLORS.length];
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>课程表</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={ocrLoading}>
            {ocrLoading ? '识别中...' : '📷 拍课表'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleOcrUpload} style={{ display: 'none' }} />
          <button className="btn-ghost" onClick={() => setShowForm(true)}>+ 手动添加</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /><span>加载中...</span></div>
      ) : courses.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="icon">📅</div>
          <p>暂无课程，拍张课表开始吧</p>
        </div>
      ) : (
        /* Weekly Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px repeat(7, 1fr)',
            gridTemplateRows: `40px repeat(${HOURS.length}, 60px)`,
            gap: 1,
            background: 'var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          {/* Header row */}
          <div style={{ background: 'var(--surface)', padding: '8px 4px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            时间
          </div>
          {DAYS.map((d) => (
            <div key={d} style={{ background: 'var(--surface)', padding: '8px 4px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
              {d}
            </div>
          ))}

          {/* Time slots */}
          {HOURS.map((hour) => (
            <>
              {/* Time label */}
              <div
                key={`time-${hour}`}
                style={{
                  background: 'var(--surface)',
                  padding: '4px',
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {hour}:00
              </div>
              {/* Day cells */}
              {DAYS.map((_, dayIdx) => {
                const dayNum = dayIdx + 1;
                const courseHere = courses.find((c) => c.day === dayNum && c.startHour === hour);
                return (
                  <div
                    key={`${dayNum}-${hour}`}
                    style={{
                      background: 'var(--surface)',
                      position: 'relative',
                      minHeight: 60,
                    }}
                  >
                    {courseHere && (
                      <div
                        onClick={() => handleDelete(courseHere.id)}
                        title="点击删除"
                        style={{
                          position: 'absolute',
                          inset: 2,
                          background: `${getCourseColor(courseHere)}22`,
                          border: `1px solid ${getCourseColor(courseHere)}55`,
                          borderRadius: 6,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          zIndex: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: getCourseColor(courseHere), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {courseHere.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {courseHere.startHour}:00-{courseHere.endHour}:00
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      )}

      {/* Manual Add Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>手动添加课程</h2>
            <div className="form-group">
              <label>课程名称</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如：高等数学"
              />
            </div>
            <div className="form-group">
              <label>星期</label>
              <select
                className="input"
                value={form.day}
                onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i + 1}>{d}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>开始时间</label>
                <select
                  className="input"
                  value={form.startHour}
                  onChange={(e) => setForm({ ...form, startHour: Number(e.target.value) })}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h}:00</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>结束时间</label>
                <select
                  className="input"
                  value={form.endHour}
                  onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })}
                >
                  {HOURS.filter((h) => h > form.startHour).map((h) => (
                    <option key={h} value={h}>{h}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn-primary" onClick={handleAdd} disabled={!form.name.trim()}>添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
