'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Building2, Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@hostel.com');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 20
    }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}><ThemeToggle /></div>

      <div style={{ width: '100%', maxWidth: 400 }} className="animate-up">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
          }}>
            <Building2 size={26} color="#fff" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>HostelOS</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Sign in to your account</div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {error && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@hostel.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: 4, justifyContent: 'center' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-surface-2)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Demo credentials</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              admin@hostel.com / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
