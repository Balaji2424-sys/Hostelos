'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { getEbBills, createEbBill, getEbTrend, getRooms, payEbSplit } from '@/lib/api';
import { Zap, PlusCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function AddBillModal({ onClose, onSuccess }: { onClose:()=>void; onSuccess:()=>void }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [form, setForm] = useState({ roomId:'', previousReading:'', currentReading:'', costPerUnit:'7', billingMonth: String(new Date().getMonth()+1), billingYear: String(new Date().getFullYear()) });
  const [preview, setPreview] = useState<{units:number;total:number;perTenant:number;tenantCount:number}|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getRooms().then(r => setRooms(r.data)); }, []);

  const set = (k:string,v:string) => {
    const updated = { ...form, [k]:v };
    setForm(updated);
    const prev = parseFloat(updated.previousReading);
    const curr = parseFloat(updated.currentReading);
    const cpu  = parseFloat(updated.costPerUnit);
    if (!isNaN(prev) && !isNaN(curr) && !isNaN(cpu) && curr > prev) {
      const units = curr - prev;
      const total = units * cpu;
      const room = rooms.find(r => r.id === updated.roomId);
      const occupied = room?.beds?.filter((b:any) => b.isOccupied).length || 1;
      setPreview({ units, total, perTenant: total/occupied, tenantCount: occupied });
    } else { setPreview(null); }
  };

  const submit = async (e:React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await createEbBill({ ...form, previousReading: parseFloat(form.previousReading), currentReading: parseFloat(form.currentReading), costPerUnit: parseFloat(form.costPerUnit) });
      onSuccess(); onClose();
    } catch(err:any) { setError(err.response?.data?.error||'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div style={{ fontSize:17, fontWeight:600, marginBottom:20 }}>Add EB Bill</div>
        {error && <div style={{ background:'var(--danger-bg)', color:'var(--danger)', padding:'8px 12px', borderRadius:8, marginBottom:12, fontSize:13 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'span 2' }}>
              <label className="label">Room</label>
              <select className="input" value={form.roomId} onChange={e=>set('roomId',e.target.value)} required>
                <option value="">Select room…</option>
                {rooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber} — Block {r.floor?.block?.name} (Meter: {r.meterNumber||'N/A'})</option>)}
              </select>
            </div>
            {[
              ['previousReading','Previous Reading (kWh)'],
              ['currentReading','Current Reading (kWh)'],
              ['costPerUnit','Cost Per Unit (₹)'],
              ['billingMonth','Billing Month'],
            ].map(([k,l]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input className="input" type="number" step="0.01" required value={(form as any)[k]} onChange={e=>set(k,e.target.value)} />
              </div>
            ))}
            <div>
              <label className="label">Billing Year</label>
              <input className="input" type="number" required value={form.billingYear} onChange={e=>set('billingYear',e.target.value)} />
            </div>
          </div>

          {preview && (
            <div style={{ background:'var(--info-bg)', border:'1px solid var(--info)', borderRadius:10, padding:14, marginTop:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--info)', marginBottom:8 }}>Bill Preview</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, textAlign:'center' }}>
                {[
                  ['Units Used', `${preview.units.toFixed(2)} kWh`],
                  ['Total Bill', `₹${preview.total.toFixed(2)}`],
                  [`Per Tenant (${preview.tenantCount})`, `₹${preview.perTenant.toFixed(2)}`],
                ].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{l}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex:1, justifyContent:'center' }}>
              {loading ? 'Saving…' : 'Save Bill & Split'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ElectricityPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const [b, t] = await Promise.all([getEbBills(), getEbTrend()]);
    setBills(b.data); setTrend(t.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handlePaySplit = async (splitId:string) => {
    await payEbSplit(splitId);
    load();
  };

  const totalThisMonth = bills
    .filter(b => b.billingMonth === new Date().getMonth()+1 && b.billingYear === new Date().getFullYear())
    .reduce((s,b) => s + b.totalBill, 0);

  return (
    <AppLayout>
      {showAdd && <AddBillModal onClose={() => setShowAdd(false)} onSuccess={load} />}

      <div className="page-header" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <div className="page-title">Electricity Bills</div>
          <div className="page-subtitle">Track meter readings, bills, and splits</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <PlusCircle size={15} /> Add EB Bill
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Trend chart */}
        <div className="card">
          <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Monthly Consumption Trend</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend}>
              <XAxis dataKey="label" tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v:any) => [`₹${v.toFixed(0)}`, 'Bill']} />
              <Line type="monotone" dataKey="totalBill" stroke="var(--warning)" strokeWidth={2} dot={{ fill:'var(--warning)', r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, alignContent:'start' }}>
          <div className="stat-card">
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>This Month Total</div>
            <div style={{ fontSize:22, fontWeight:700, color:'var(--warning)', marginTop:4 }}>₹{totalThisMonth.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>Total Bills</div>
            <div style={{ fontSize:22, fontWeight:700, marginTop:4 }}>{bills.length}</div>
          </div>
          <div className="stat-card" style={{ gridColumn:'span 2' }}>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>Avg Monthly Consumption</div>
            <div style={{ fontSize:18, fontWeight:700 }}>
              {trend.length ? `${(trend.reduce((s,t)=>s+t.units,0)/trend.length).toFixed(1)} kWh` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Bills list */}
      <div className="card">
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>All EB Bills</div>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {bills.map(bill => (
              <div key={bill.id} style={{ background:'var(--bg-surface-2)', border:'1px solid var(--border)', borderRadius:10, padding:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:600 }}>Room {bill.room?.roomNumber}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {bill.billingMonth}/{bill.billingYear} · {bill.unitsConsumed.toFixed(1)} kWh · ₹{bill.costPerUnit}/unit
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:18, fontWeight:700, color:'var(--warning)' }}>₹{bill.totalBill.toFixed(0)}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>Total</div>
                  </div>
                </div>
                {bill.splits?.length > 0 && (
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:6 }}>Splits</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {bill.splits.map((s:any) => (
                        <div key={s.id} style={{
                          display:'flex', alignItems:'center', gap:8, background:'var(--bg-surface)',
                          border:'1px solid var(--border)', borderRadius:8, padding:'5px 10px', fontSize:12
                        }}>
                          <span>{s.tenant?.name}</span>
                          <span style={{ fontWeight:600, color:'var(--warning)' }}>₹{s.amount.toFixed(0)}</span>
                          {s.isPaid ? (
                            <span style={{ color:'var(--success)', fontSize:11 }}>✓ Paid</span>
                          ) : (
                            <button className="btn btn-sm" style={{ padding:'2px 8px', fontSize:11, background:'var(--success-bg)', color:'var(--success)', border:'none', borderRadius:5, cursor:'pointer' }}
                              onClick={() => handlePaySplit(s.id)}>
                              Mark Paid
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!bills.length && (
              <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
                <Zap size={36} style={{ opacity:0.3, marginBottom:10 }} />
                <div>No EB bills yet. Add a bill to get started.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
