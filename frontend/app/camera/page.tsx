'use client';

import { useState, useRef, useCallback } from 'react';
import { apiPost } from '@/lib/api';

const MODULES = [
  { value: 'general', label: '通用识别' },
  { value: 'food', label: '菜品识别' },
  { value: 'schedule', label: '课表识别' },
  { value: 'homework', label: '题目解答' },
];

export default function CameraPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [module, setModule] = useState('general');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setResult('');
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('module', module);
      if (prompt.trim()) form.append('prompt', prompt.trim());
      const data: any = await apiPost('/api/vision', form);
      setResult(data.result || data.text || JSON.stringify(data));
    } catch (err: any) {
      setResult(`识别失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">拍照识别</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Upload & Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: 40,
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(59,130,246,0.05)' : 'var(--surface)',
              transition: 'all 0.2s',
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="预览"
                style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, objectFit: 'contain' }}
              />
            ) : (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📷</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  点击或拖拽图片到此处
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
                  支持 JPG / PNG / WebP
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Module Selector */}
          <div className="card">
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              识别模式
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {MODULES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setModule(m.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${module === m.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: module === m.value ? 'rgba(59,130,246,0.1)' : 'var(--elevated)',
                    color: module === m.value ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: module === m.value ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              自定义提示词（可选）
            </label>
            <textarea
              className="input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：请用中文详细描述这张图片的内容..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!file || loading}
            style={{ width: '100%', padding: '12px 0' }}
          >
            {loading ? '识别中...' : '开始识别'}
          </button>
        </div>

        {/* Right: Result */}
        <div className="card" style={{ minHeight: 400 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem', color: 'var(--text-muted)' }}>识别结果</h3>
          {loading ? (
            <div className="loading-overlay">
              <div className="spinner" />
              <span>AI 正在分析图片...</span>
            </div>
          ) : result ? (
            <div
              style={{
                fontSize: '0.9rem',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                color: 'var(--text)',
              }}
            >
              {result}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <p>上传图片后点击识别</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
