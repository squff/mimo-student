'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChat } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const modules = ['通用', '学习', '生活', '闲聊'] as const;
const moduleMap: Record<string, string> = { '通用': 'general', '学习': 'homework', '生活': 'diet', '闲聊': 'general' };

export default function ChatPage() {
  const [module, setModule] = useState<string>('通用');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    const aiMsg: Message = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setStreaming(true);

    try {
      const moduleKey = moduleMap[module] || 'general';
      const gen = sendChat(text, moduleKey);
      abortRef.current = new AbortController();
      for await (const chunk of gen) {
        if (abortRef.current?.signal.aborted) break;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      }
    } catch {
      // stream ended or error
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', maxWidth: 720, margin: '0 auto', padding: '16px 24px' }}>
      <h1 className="page-title" style={{ marginBottom: 12 }}>AI 对话</h1>

      {/* Module tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {modules.map((m) => (
          <button
            key={m}
            className={module === m ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setModule(m)}
            style={{ padding: '6px 16px', fontSize: 14 }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingRight: 4,
          marginBottom: 16,
        }}
      >
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#555' }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>💬</p>
            <p>问我任何问题，我是你的AI助手</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const isStreaming = isLast && msg.role === 'assistant' && streaming;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: 16,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16,
                  background: msg.role === 'user' ? '#3b82f6' : '#1a1a1f',
                  color: '#fff',
                  fontSize: 15,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
                {isStreaming && <span style={cursorStyle} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef}
          className="input"
          placeholder="输入消息... (Enter发送, Shift+Enter换行)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ flex: 1, resize: 'none', minHeight: 44, maxHeight: 120, padding: '10px 14px' }}
        />
        {streaming ? (
          <button className="btn-ghost" onClick={handleStop} style={{ padding: '10px 20px', color: '#ef4444', borderColor: '#ef4444' }}>
            停止
          </button>
        ) : (
          <button className="btn-primary" onClick={handleSend} disabled={!input.trim()} style={{ padding: '10px 24px' }}>
            发送
          </button>
        )}
      </div>
    </div>
  );
}

const cursorStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 2,
  height: '1em',
  background: '#3b82f6',
  marginLeft: 2,
  verticalAlign: 'text-bottom',
  animation: 'blink 1s step-end infinite',
};

// Inject cursor keyframes once
if (typeof document !== 'undefined' && !document.getElementById('chat-cursor-style')) {
  const style = document.createElement('style');
  style.id = 'chat-cursor-style';
  style.textContent = `@keyframes blink { 50% { opacity: 0; } }`;
  document.head.appendChild(style);
}
