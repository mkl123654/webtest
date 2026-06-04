'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('请填写所有字段'); return; }
    setLoading(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚙️ 管理后台</h1>
        <p style={styles.subtitle}>管理员登录</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#2d1a0e',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '48px 40px',
    width: 400,
    maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(0,0,0,.3)',
    textAlign: 'center' as const,
  },
  title: { fontSize: 28, color: '#2d1a0e', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#b8a088', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #e5d5c0',
    fontSize: 15,
    outline: 'none',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  btn: {
    marginTop: 8,
    padding: '12px',
    border: 'none',
    borderRadius: 12,
    background: '#2d1a0e',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Source Sans 3', sans-serif",
  },
  error: { color: '#c0392b', fontSize: 13, margin: 0 },
};
