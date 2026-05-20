'use client';

import { useState, useEffect, useRef } from 'react';
import { apiUpload, apiGet } from '@/lib/api';

interface FoodItem {
  name: string;
  calories: number;
  portion?: string;
}

interface AnalysisResult {
  foods: FoodItem[];
  total_calories: number;
  evaluation: string;
}

interface MealRecord {
  id: string;
  meal_type: string;
  image_url?: string;
  foods: FoodItem[];
  total_calories: number;
  created_at: string;
}

interface DailyStat {
  date: string;
  total_calories: number;
}

const mealTypes = ['早餐', '午餐', '晚餐', '加餐'] as const;

export default function DietPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [mealType, setMealType] = useState<string>('午餐');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiGet<{ records: MealRecord[] }>('/api/diet/stats')
      .then((data: any) => {
        setRecords(data.records || []);
        // derive weekly stats from records
        const map: Record<string, number> = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          map[d.toISOString().slice(0, 10)] = 0;
        }
        (data.records || []).forEach((r) => {
          const day = r.created_at?.slice(0, 10);
          if (day && day in map) map[day] += r.total_calories;
        });
        setStats(Object.entries(map).map(([date, total_calories]) => ({ date, total_calories })));
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('meal_type', mealType);
      const data = await apiUpload<AnalysisResult>('/api/diet/analyze', fd);
      setResult(data);
      // refresh stats
      const statsData = await apiGet<{ records: MealRecord[] }>('/api/diet/stats');
      setRecords(statsData.records || []);
    } catch {
      setResult({ foods: [], total_calories: 0, evaluation: '分析失败，请重试' });
    } finally {
      setAnalyzing(false);
    }
  };

  const maxCal = Math.max(...stats.map((s) => s.total_calories), 1);

  return (
    <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 className="page-title">饮食记录</h1>

      {/* Upload Section */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <button className="btn-primary" onClick={() => inputRef.current?.click()}>📷 拍餐盘</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {mealTypes.map((t) => (
              <button
                key={t}
                className={mealType === t ? 'btn-primary' : 'btn-ghost'}
                onClick={() => setMealType(t)}
                style={{ padding: '6px 14px', fontSize: 14 }}
              >
                {t}
              </button>
            ))}
          </div>
          {file && (
            <button className="btn-primary" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? '分析中...' : '开始分析'}
            </button>
          )}
        </div>
        {preview && (
          <div style={{ marginTop: 16 }}>
            <img src={preview} alt="餐盘" style={{ maxWidth: 320, borderRadius: 12, border: '1px solid #333' }} />
          </div>
        )}
      </div>

      {/* Analysis Result */}
      {result && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>分析结果</h2>
          {result.foods.length > 0 ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {result.foods.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#1a1a1f', borderRadius: 8 }}>
                    <span>{f.name}{f.portion ? ` (${f.portion})` : ''}</span>
                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>{f.calories} kcal</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#111113', borderRadius: 8, border: '1px solid #3b82f6' }}>
                <span style={{ fontWeight: 600 }}>总热量</span>
                <span className="stat-value" style={{ color: '#3b82f6' }}>{result.total_calories} kcal</span>
              </div>
              <p style={{ marginTop: 12, color: '#999', fontSize: 14 }}>{result.evaluation}</p>
            </>
          ) : (
            <p style={{ color: '#666' }}>未能识别食物</p>
          )}
        </div>
      )}

      {/* Weekly Stats */}
      {stats.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>本周热量</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
            {stats.map((s) => (
              <div key={s.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#999' }}>{s.total_calories > 0 ? s.total_calories : ''}</span>
                <div style={{
                  width: '100%',
                  height: `${Math.max((s.total_calories / maxCal) * 120, 4)}px`,
                  background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                  borderRadius: 6,
                  transition: 'height 0.3s',
                }} />
                <span style={{ fontSize: 11, color: '#666' }}>{s.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>饮食历史</h2>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🍽️</p>
            <p>还没有饮食记录，拍张餐盘开始吧</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {records.map((r) => (
              <div key={r.id} style={{ display: 'flex', gap: 12, padding: 12, background: '#1a1a1f', borderRadius: 10, alignItems: 'center' }}>
                {r.image_url && (
                  <img src={r.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge">{r.meal_type}</span>
                    <span style={{ fontSize: 12, color: '#666' }}>{r.created_at?.slice(0, 16)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#999', marginTop: 4 }}>
                    {r.foods.map((f) => f.name).join('、')}
                  </p>
                </div>
                <span className="stat-value" style={{ color: '#3b82f6' }}>{r.total_calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
