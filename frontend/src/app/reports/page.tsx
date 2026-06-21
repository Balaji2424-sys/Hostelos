'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { getRentCollectionReport, getOccupancyReport, getAnnualReport, getUnpaidTenantsReport } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Download, BarChart3 } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportsPage() {
  const [tab, setTab] = useState<'rent'|'occupancy'|'annual'|'unpaid'>('annual');
  const [rentReport, setRentReport] = useState<any>(null);
  const [occReport, setOccReport] = useState<any[]>([]);
  const [annualReport, setAnnualReport] = useState<any>(null);
  const [unpaidReport, setUnpaidReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(String(new Date().getMonth()+1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  useEffect(() => { loadReport(); }, [tab, month, year]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (tab === 'rent') { const r = await getRentCollectionReport({ month, year }); setRentReport(r.data); }
      else if (tab === 'occupancy') { const r = await getOccupancyReport(); setOccReport(r.data); }
      else if (tab === 'annual') { const r = await getAnnualReport(parseInt(year)); setAnnualReport(r.data); }
      else if (tab === 'unpaid') { const r = await getUnpaidTenantsReport({ month, year }); setUnpaidReport(r.data); }
    } catch {} finally { setLoading(false); }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  };

  const tabs = [
    { key:'annual', label:'Annual Summary' },
    { key:'rent', label:'Rent Collection' },
    { key:'occupancy', label:'Occupancy' },
    { key:'unpaid', label:'Unpaid Tenants' },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title">Reports & Analytics</div>
        <div className="page-subtitle">Generate and export hostel reports</div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:8, marginBottom:20, background:'var(--bg-surface)', padding:6, borderRadius:10, border:'1px solid var(--border)', width:'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} className={`btn btn-sm ${tab===t.key ? 'btn-primary' : 'btn-secondary'}`} style={{ border:'none' }}
            onClick={() => setTab(t.key as any)}>{t.label}</button>
        ))}
      </div>

      {/* Filters */}
      {tab !== 'occupancy' && (
        <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center' }}>
          {tab !== 'annual' && (
            <div>
              <label className="label">Month</label>
              <select className="input" value={month} onChange={e=>setMonth(e.target.value)} style={{ width:130 }}>
                {MONTHS.map((m,i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Year</label>
            <select className="input" value={year} onChange={e=>setYear(e.target.value)} style={{ width:100 }}>
              {[2023,2024,2025,2026].map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading && <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Generating report…</div>}

      {/* ANNUAL SUMMARY */}
      {!loading && tab === 'annual' && annualReport && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:600 }}>Annual Revenue {annualReport.year}</div>
              <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(annualReport.monthly, `annual-${year}`)}>
                <Download size={13} /> Export CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={annualReport.monthly}>
                <XAxis dataKey="label" tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v:any,n:string) => [`₹${v.toLocaleString()}`, n]} />
                <Legend />
                <Bar dataKey="collected" name="Collected" fill="var(--success)" radius={[4,4,0,0]} opacity={0.85} />
                <Bar dataKey="expected" name="Expected" fill="var(--brand)" radius={[4,4,0,0]} opacity={0.4} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Collection Rate Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={annualReport.monthly}>
                <XAxis dataKey="label" tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                <Tooltip formatter={(v:any) => [`${v}%`, 'Collection Rate']} />
                <Line type="monotone" dataKey="collectionRate" stroke="var(--brand)" strokeWidth={2} dot={{ fill:'var(--brand)', r:3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly table */}
          <div className="card">
            <table className="table">
              <thead>
                <tr><th>Month</th><th>Expected</th><th>Collected</th><th>EB Bill</th><th>Collection Rate</th></tr>
              </thead>
              <tbody>
                {annualReport.monthly.map((m:any) => (
                  <tr key={m.month}>
                    <td>{m.label}</td>
                    <td>₹{m.expected.toLocaleString()}</td>
                    <td style={{ color:'var(--success)', fontWeight:600 }}>₹{m.collected.toLocaleString()}</td>
                    <td style={{ color:'var(--warning)' }}>₹{m.ebBill.toLocaleString()}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:5, borderRadius:3, background:'var(--bg-surface-3)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${m.collectionRate}%`, background: m.collectionRate>=80 ? 'var(--success)' : m.collectionRate>=50 ? 'var(--warning)' : 'var(--danger)', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:600 }}>{m.collectionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENT COLLECTION */}
      {!loading && tab === 'rent' && rentReport && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              { label:'Collected', value:`₹${rentReport.paidAmount?.toLocaleString()}`, color:'var(--success)' },
              { label:'Pending', value:`₹${rentReport.pendingAmount?.toLocaleString()}`, color:'var(--danger)' },
              { label:'Paid Count', value:rentReport.paid, color:'var(--success)' },
              { label:'Unpaid Count', value:rentReport.unpaid, color:'var(--danger)' },
            ].map(c => (
              <div key={c.label} className="stat-card">
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.label}</div>
                <div style={{ fontSize:22, fontWeight:700, color:c.color, marginTop:4 }}>{c.value}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontSize:15, fontWeight:600 }}>Payment Details — {MONTHS[parseInt(month)-1]} {year}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(rentReport.payments?.map((p:any) => ({ name:p.tenant?.name, phone:p.tenant?.phone, room:p.tenant?.bed?.room?.roomNumber, amount:p.amount, status:p.status, paidDate:p.paidDate||'' })), `rent-${month}-${year}`)}>
                <Download size={13} /> Export CSV
              </button>
            </div>
            <table className="table">
              <thead><tr><th>Tenant</th><th>Room</th><th>Amount</th><th>Due</th><th>Status</th><th>Paid On</th></tr></thead>
              <tbody>
                {rentReport.payments?.map((p:any) => (
                  <tr key={p.id}>
                    <td>{p.tenant?.name}</td>
                    <td>Room {p.tenant?.bed?.room?.roomNumber}</td>
                    <td>₹{p.amount?.toLocaleString()}</td>
                    <td style={{ color:p.dueAmount>0?'var(--danger)':'var(--text-muted)' }}>{p.dueAmount>0?`₹${p.dueAmount}`:'—'}</td>
                    <td><span className={`badge ${p.status==='PAID'?'badge-green':p.status==='OVERDUE'?'badge-red':'badge-yellow'}`}>{p.status}</span></td>
                    <td style={{ fontSize:12 }}>{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OCCUPANCY */}
      {!loading && tab === 'occupancy' && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontSize:15, fontWeight:600 }}>Room Occupancy Report</span>
            <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(occReport, 'occupancy-report')}>
              <Download size={13} /> Export CSV
            </button>
          </div>
          <table className="table">
            <thead><tr><th>Room</th><th>Block</th><th>Floor</th><th>Total Beds</th><th>Occupied</th><th>Vacant</th><th>Rate</th></tr></thead>
            <tbody>
              {occReport.map((r:any,i:number) => (
                <tr key={i}>
                  <td style={{ fontWeight:500 }}>{r.roomNumber}</td>
                  <td>{r.block}</td>
                  <td>Floor {r.floor}</td>
                  <td>{r.totalBeds}</td>
                  <td style={{ color:'var(--success)', fontWeight:600 }}>{r.occupied}</td>
                  <td style={{ color:'var(--brand)' }}>{r.vacant}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:60, height:5, borderRadius:3, background:'var(--bg-surface-3)' }}>
                        <div style={{ height:'100%', width:`${r.occupancyRate}%`, background:r.occupancyRate===100?'var(--danger)':r.occupancyRate>=50?'var(--success)':'var(--warning)', borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:12 }}>{r.occupancyRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* UNPAID */}
      {!loading && tab === 'unpaid' && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontSize:15, fontWeight:600 }}>Unpaid Tenants — {MONTHS[parseInt(month)-1]} {year}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(unpaidReport.map((p:any)=>({ name:p.tenant?.name, phone:p.tenant?.phone, room:p.tenant?.bed?.room?.roomNumber, amount:p.amount, status:p.status })), `unpaid-${month}-${year}`)}>
              <Download size={13} /> Export CSV
            </button>
          </div>
          <table className="table">
            <thead><tr><th>Tenant</th><th>Phone</th><th>Room</th><th>Amount Due</th><th>Status</th></tr></thead>
            <tbody>
              {unpaidReport.map((p:any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight:500 }}>{p.tenant?.name}</td>
                  <td style={{ fontSize:13 }}>{p.tenant?.phone}</td>
                  <td>Room {p.tenant?.bed?.room?.roomNumber}</td>
                  <td style={{ color:'var(--danger)', fontWeight:600 }}>₹{(p.dueAmount||p.amount)?.toLocaleString()}</td>
                  <td><span className={`badge ${p.status==='OVERDUE'?'badge-red':'badge-yellow'}`}>{p.status}</span></td>
                </tr>
              ))}
              {!unpaidReport.length && <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--success)', padding:30 }}>🎉 All tenants have paid for {MONTHS[parseInt(month)-1]}!</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
