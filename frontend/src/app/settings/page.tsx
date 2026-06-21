'use client';
import { useState } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { useAuth } from '@/lib/auth';
import { generateMonthlyPayments } from '@/lib/api';
import { Settings, Zap, CreditCard, Users, Building2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [genMonth, setGenMonth] = useState(String(new Date().getMonth()+1));
  const [genYear, setGenYear] = useState(String(new Date().getFullYear()));
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState('');

  const handleGeneratePayments = async () => {
    setGenLoading(true); setGenMsg('');
    try {
      const res = await generateMonthlyPayments({ month: genMonth, year: genYear });
      setGenMsg(res.data.message);
    } catch(err:any) { setGenMsg(err.response?.data?.error || 'Failed'); }
    finally { setGenLoading(false); }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">System configuration and management tools</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Profile card */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Users size={16} color="var(--brand)" />
            <span style={{ fontSize:15, fontWeight:600 }}>Account Info</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[['Name', user?.name], ['Email', user?.email], ['Role', user?.role]].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                <span style={{ color:'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Mode */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <CreditCard size={16} color="var(--success)" />
            <span style={{ fontSize:15, fontWeight:600 }}>Payment Mode</span>
          </div>
          <div style={{ background:'var(--warning-bg)', border:'1px solid var(--warning)', borderRadius:8, padding:12, fontSize:13, color:'var(--warning)', marginBottom:12 }}>
            ⚠️ <strong>Simulation Mode Active</strong> — Fake payments are enabled. No real money is processed.
          </div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
            To enable real Razorpay payments, add <code style={{ background:'var(--bg-surface-2)', padding:'1px 5px', borderRadius:4 }}>RAZORPAY_KEY_ID</code> and <code style={{ background:'var(--bg-surface-2)', padding:'1px 5px', borderRadius:4 }}>RAZORPAY_KEY_SECRET</code> to your backend <code style={{ background:'var(--bg-surface-2)', padding:'1px 5px', borderRadius:4 }}>.env</code> and set <code style={{ background:'var(--bg-surface-2)', padding:'1px 5px', borderRadius:4 }}>FAKE_PAYMENT_MODE=false</code>.
          </div>
        </div>

        {/* Generate Monthly Payments */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Zap size={16} color="var(--brand)" />
            <span style={{ fontSize:15, fontWeight:600 }}>Generate Monthly Payments</span>
          </div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:14 }}>
            Auto-create payment records for all active tenants for a given month. Safe to run — skips if record already exists.
          </div>
          <div style={{ display:'flex', gap:10, marginBottom:12 }}>
            <div style={{ flex:1 }}>
              <label className="label">Month</label>
              <select className="input" value={genMonth} onChange={e=>setGenMonth(e.target.value)}>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label className="label">Year</label>
              <select className="input" value={genYear} onChange={e=>setGenYear(e.target.value)}>
                {[2024,2025,2026].map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>
          {genMsg && (
            <div style={{ background:'var(--success-bg)', color:'var(--success)', padding:'8px 12px', borderRadius:8, fontSize:13, marginBottom:12 }}>
              ✓ {genMsg}
            </div>
          )}
          <button className="btn btn-primary" onClick={handleGeneratePayments} disabled={genLoading} style={{ width:'100%', justifyContent:'center' }}>
            {genLoading ? 'Generating…' : 'Generate Payment Records'}
          </button>
        </div>

        {/* AI Config */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Settings size={16} color="var(--brand)" />
            <span style={{ fontSize:15, fontWeight:600 }}>AI Configuration</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:13, color:'var(--text-secondary)' }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>Model</span>
              <span style={{ fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontSize:12 }}>llama-3.1-70b-versatile</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>Provider</span>
              <span style={{ fontWeight:600, color:'var(--text-primary)' }}>Groq (free tier)</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>API Key</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>Set in backend .env</span>
            </div>
            <div style={{ marginTop:4, background:'var(--info-bg)', color:'var(--info)', padding:'8px 12px', borderRadius:8 }}>
              AI features require a valid Groq API key at <strong>GROQ_API_KEY</strong> in backend .env
            </div>
          </div>
        </div>

        {/* Stack Info */}
        <div className="card" style={{ gridColumn:'span 2' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Building2 size={16} color="var(--brand)" />
            <span style={{ fontSize:15, fontWeight:600 }}>System Stack</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              ['Frontend', 'Next.js 14, React, TypeScript, Tailwind CSS'],
              ['Backend', 'Node.js, Express.js, JWT Auth'],
              ['Database', 'PostgreSQL + Prisma ORM (free)'],
              ['AI', 'Groq API + LLaMA 3.1 70B (free)'],
              ['Auth', 'JWT + Role-Based Access Control'],
              ['Email', 'Nodemailer + Gmail SMTP (free)'],
              ['Storage', 'Cloudinary (free tier)'],
              ['Payments', 'Simulation mode (Razorpay ready)'],
            ].map(([name,desc]) => (
              <div key={name} style={{ background:'var(--bg-surface-2)', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>{name}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
