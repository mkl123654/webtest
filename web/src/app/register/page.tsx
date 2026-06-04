'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('请填写所有字段'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    setLoading(true);
    try {
      await register(username, password);
      router.push('/login?registered=1');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🐱 创建账号</h1>
        <p style={styles.subtitle}>加入胖喵，发现吃喝玩乐好去处</p>
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
            placeholder="密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? '注册中…' : '注册'}
          </button>
        </form>
        <p style={styles.footer}>
          已有账号？<Link href="/login">登录</Link>
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
    fontFamily: "'Source Sans 3', sans-serif",
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
    fontFamily: "'Playfair Display', serif",
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
    fontFamily: "'Source Sans 3', sans-serif",
  },
  btn: {
    marginTop: 8,
    padding: '12px',
    border: 'none',
    borderRadius: 12,
    background: '#7d9a70',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Source Sans 3', sans-serif",
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
