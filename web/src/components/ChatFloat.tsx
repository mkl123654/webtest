'use client';

import { useState, useRef, useEffect } from 'react';

export function ChatFloat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: '吃啥、喝啥、去哪玩？直接问我！👇' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

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

  return (
    <div className="chat-float">
      <button className="chat-toggle-btn" onClick={() => setOpen(!open)}>
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
