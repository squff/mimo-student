'use client';

import { useState, useEffect } from 'react';
import { apiPost, apiGet } from '@/lib/api';

interface Card {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  mastered: boolean;
}

export default function ExamPage() {
  const [subject, setSubject] = useState('');
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');

  useEffect(() => {
    apiGet<{ cards: Card[] }>('/api/exam/cards')
      .then((data: any) => setCards(data.cards || []))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!subject.trim()) return;
    setGenerating(true);
    try {
      const data = await apiPost<{ cards: Card[] }>('/api/exam/generate', { subject, count });
      setCards((prev) => [...(data.cards || []), ...prev]);
      setIdx(0);
      setShowAnswer(false);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const toggleMastered = async (card: Card) => {
    const updated = { ...card, mastered: !card.mastered };
    setCards((prev) => prev.map((c) => (c.id === card.id ? updated : c)));
    try {
      await apiPost(`/api/exam/cards/${card.id}/toggle`, {});
    } catch {
      // revert
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    }
  };

  const filtered = cards.filter((c) => {
    if (filter === 'unmastered') return !c.mastered;
    if (filter === 'mastered') return c.mastered;
    return true;
  });

  const current = filtered[idx] || null;
  const totalMastered = cards.filter((c) => c.mastered).length;
  const pct = cards.length > 0 ? Math.round((totalMastered / cards.length) * 100) : 0;

  const goNext = () => { if (idx < filtered.length - 1) { setIdx(idx + 1); setShowAnswer(false); } };
  const goPrev = () => { if (idx > 0) { setIdx(idx - 1); setShowAnswer(false); } };

  return (
    <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 className="page-title">考试冲刺</h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ flex: 1, textAlign: 'center', padding: 16 }}>
          <div className="stat-value">{cards.length}</div>
          <div className="stat-label">总题数</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center', padding: 16 }}>
          <div className="stat-value">{totalMastered}</div>
          <div className="stat-label">已掌握</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center', padding: 16 }}>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{pct}%</div>
          <div className="stat-label">掌握率</div>
        </div>
      </div>

      {/* Generate */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>生成题目</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="输入科目，如：高等数学、英语语法..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                className={count === n ? 'btn-primary' : 'btn-ghost'}
                onClick={() => setCount(n)}
                style={{ padding: '6px 14px', fontSize: 14 }}
              >
                {n}题
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={handleGenerate} disabled={generating || !subject.trim()}>
            {generating ? '生成中...' : '生成题目'}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([['all', '全部'], ['unmastered', '未掌握'], ['mastered', '已掌握']] as const).map(([key, label]) => (
          <button
            key={key}
            className={filter === key ? 'btn-primary' : 'btn-ghost'}
            onClick={() => { setFilter(key); setIdx(0); setShowAnswer(false); }}
            style={{ padding: '6px 14px', fontSize: 14 }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Card */}
      {current ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="badge">{idx + 1} / {filtered.length}</span>
            <button
              className="btn-ghost"
              onClick={() => toggleMastered(current)}
              style={{ fontSize: 14 }}
            >
              {current.mastered ? '✅ 已掌握' : '⬜ 未掌握'}
            </button>
          </div>

          {/* Question */}
          <div style={{ padding: 24, background: '#1a1a1f', borderRadius: 12, marginBottom: 16, minHeight: 80 }}>
            <p style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{current.question}</p>
          </div>

          {/* Reveal / Answer */}
          {!showAnswer ? (
            <button className="btn-primary" onClick={() => setShowAnswer(true)} style={{ width: '100%', padding: 12 }}>
              查看答案
            </button>
          ) : (
            <div style={{ padding: 20, background: '#111113', borderRadius: 12, border: '1px solid #3b82f6' }}>
              <p style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#e0e0e0' }}>{current.answer}</p>
              {current.explanation && (
                <p style={{ marginTop: 12, fontSize: 14, color: '#999', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  💡 {current.explanation}
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="btn-ghost" onClick={goPrev} disabled={idx === 0} style={{ opacity: idx === 0 ? 0.3 : 1 }}>
              ← 上一题
            </button>
            <button className="btn-ghost" onClick={goNext} disabled={idx >= filtered.length - 1} style={{ opacity: idx >= filtered.length - 1 ? 0.3 : 1 }}>
              下一题 →
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: '#555' }}>
          <p style={{ fontSize: 40, marginBottom: 8 }}>📝</p>
          <p>{cards.length === 0 ? '还没有题目，输入科目开始生成吧' : '当前筛选无结果'}</p>
        </div>
      )}
    </div>
  );
}
