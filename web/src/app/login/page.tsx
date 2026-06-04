'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function LoginPage() {
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
      router.push('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🐱 胖喵推荐</h1>
        <p style={styles.subtitle}>登录后即可浏览推荐内容</p>
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
        <p style={styles.footer}>
          还没有账号？<Link href="/register">注册</Link>
        </p>
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
    background: 'linear-gradient(145deg, #fdfaf4, #f7efe0)',
    fontFamily: "var(--font-source-sans), sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '48px 40px',
    width: 400,
    maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(45,26,14,.12)',
    textAlign: 'center' as const,
  },
  title: {
    fontFamily: "var(--font-playfair), serif",
    fontSize: 32,
    color: '#2d1a0e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#b8a088',
    marginBottom: 32,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  input: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #e5d5c0',
    fontSize: 15,
    outline: 'none',
    fontFamily: "var(--font-source-sans), sans-serif",
  },
  btn: {
    marginTop: 8,
    padding: '12px',
    border: 'none',
    borderRadius: 12,
    background: '#c06840',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "var(--font-source-sans), sans-serif",
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    margin: 0,
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: '#b8a088',
  },
};
