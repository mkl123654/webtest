'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const SNAP_DIST = 30;
const DRAG_THRESHOLD = 5;
const STORAGE_KEY = 'chat-float-pos';

function loadPos(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.x === 'number' && typeof p.y === 'number') return p;
    }
  } catch {}
  return null;
}

function savePos(x: number, y: number) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y })); } catch {}
}

export function ChatFloat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: '吃啥、喝啥、去哪玩？直接问我！👇' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  // --- Drag state ---
  const btnRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });
  const [dragging, setDragging] = useState(false);
  const [snapping, setSnapping] = useState(false);

  // Initialize position
  useEffect(() => {
    const saved = loadPos();
    if (saved) {
      // Clamp to current window
      const btn = btnRef.current;
      const bw = btn?.offsetWidth || 160;
      const bh = btn?.offsetHeight || 52;
      const maxX = Math.max(0, window.innerWidth - bw);
      const maxY = Math.max(0, window.innerHeight - bh);
      setPos({ x: Math.min(saved.x, maxX), y: Math.min(saved.y, maxY) });
    }
  }, []);

  // Re-clamp on resize
  useEffect(() => {
    const onResize = () => {
      if (!pos) return;
      const btn = btnRef.current;
      const bw = btn?.offsetWidth || 160;
      const bh = btn?.offsetHeight || 52;
      const maxX = Math.max(0, window.innerWidth - bw);
      const maxY = Math.max(0, window.innerHeight - bh);
      if (pos.x > maxX || pos.y > maxY) {
        setPos({ x: Math.min(pos.x, maxX), y: Math.min(pos.y, maxY) });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pos]);

  // Snap logic
  const snap = useCallback((x: number, y: number) => {
    const btn = btnRef.current;
    const bw = btn?.offsetWidth || 160;
    const maxX = Math.max(0, window.innerWidth - bw);

    let snappedX = x;
    if (x < SNAP_DIST) snappedX = 0;
    else if (x > maxX - SNAP_DIST) snappedX = maxX;

    if (snappedX !== x) {
      setSnapping(true);
      setTimeout(() => setSnapping(false), 260);
    }
    return { x: snappedX, y };
  }, []);

  // Pointer handlers
  const getCoords = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      return { cx: e.touches[0].clientX, cy: e.touches[0].clientY };
    }
    return { cx: e.clientX, cy: e.clientY };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const btn = btnRef.current;
    if (!btn) return;
    const { cx, cy } = getCoords(e.nativeEvent);
    const rect = btn.getBoundingClientRect();
    dragRef.current = {
      active: true,
      moved: false,
      startX: cx,
      startY: cy,
      startLeft: rect.left,
      startTop: rect.top,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      const { cx, cy } = getCoords(e);
      const dx = cx - d.startX;
      const dy = cy - d.startY;
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

      if (!d.moved) {
        d.moved = true;
        setDragging(true);
      }

      const btn = btnRef.current;
      const bw = btn?.offsetWidth || 160;
      const bh = btn?.offsetHeight || 52;
      const maxX = Math.max(0, window.innerWidth - bw);
      const maxY = Math.max(0, window.innerHeight - bh);

      const newX = Math.max(0, Math.min(d.startLeft + dx, maxX));
      const newY = Math.max(0, Math.min(d.startTop + dy, maxY));
      setPos({ x: newX, y: newY });
    };

    const onUp = (e: MouseEvent | TouchEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;

      if (d.moved) {
        setDragging(false);
        // Snap and save
        const btn = btnRef.current;
        if (btn) {
          const rect = btn.getBoundingClientRect();
          const snapped = snap(rect.left, rect.top);
          setPos(snapped);
          savePos(snapped.x, snapped.y);
        }
      } else {
        // Click — toggle chat
        setOpen(prev => !prev);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [snap]);

  // Auto-scroll
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    const q = text.trim();
    if (!q || q.length > 500 || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    historyRef.current.push({ role: 'user', content: q });
    setLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history: historyRef.current }),
      });

      if (!resp.ok) throw new Error('API error');

      setMessages(prev => [...prev, { role: 'bot', text: '' }]);
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const json = JSON.parse(raw);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'bot', text: fullText };
                return copy;
              });
            }
          } catch {}
        }
      }

      historyRef.current.push({ role: 'assistant', content: fullText || '...' });
      if (historyRef.current.length > 40) historyRef.current = historyRef.current.slice(-40);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '抱歉，出了点问题 😅' }]);
    } finally {
      setLoading(false);
    }
  };

  // Inline style for drag position
  const dragStyle: React.CSSProperties = pos ? {
    left: pos.x,
    top: pos.y,
    bottom: 'auto',
  } : {};

  return (
    <div
      className={`chat-float${dragging ? ' dragging' : ''}${snapping ? ' snapping' : ''}`}
      ref={containerRef}
      style={dragStyle}
    >
      <button
        ref={btnRef}
        className="chat-toggle-btn"
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        onClick={() => {}} // prevent default, handled in onUp
      >
        <span className="toggle-emoji">😼</span>
        <span className="toggle-label">不知道问我好了</span>
        <span className="dot" />
      </button>

      <div className={`chat-popup ${open ? 'open' : ''}`}>
        <div className="chat-popup-header">
          🤖 胖喵 · AI 数字分身
          <button className="close-btn" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="chat-popup-messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role === 'bot' ? 'bot' : 'user'}`}>
              <div className="sender">{msg.role === 'bot' ? '胖喵' : '你'}</div>
              {msg.text || (loading && i === messages.length - 1 ? <em>正在输入…</em> : null)}
            </div>
          ))}
        </div>

        <div className="chat-popup-chips">
          {['推荐好吃的', '想喝点什么', '周末去哪玩', '好无聊找点乐子'].map(q => (
            <button key={q} className="quick-chip" onClick={() => handleSend(q)}>
              {q === '推荐好吃的' ? '🍽️ 吃啥' : q === '想喝点什么' ? '🧋 喝啥' : q === '周末去哪玩' ? '✈️ 去哪玩' : '🎉 找乐子'}
            </button>
          ))}
        </div>

        <div className="chat-popup-input-row">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="告诉我你的心情…"
            maxLength={200}
          />
          <button onClick={() => handleSend(input)}>发送</button>
        </div>
      </div>
    </div>
  );
}
