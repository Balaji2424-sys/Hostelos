'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { getComplaints, updateComplaint, getComplaintSummary } from '@/lib/api';
import { MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const CATEGORIES = ['WATER','ELECTRICITY','MAINTENANCE','CLEANING','INTERNET','OTHERS'];
const STATUS_COLORS: Record<string,string> = { OPEN: 'badge-red', IN_PROGRESS: 'badge-yellow', RESOLVED: 'badge-green' };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const params: any = {};
    if (filter) params.status = filter;
    const [c, s] = await Promise.all([getComplaints(params), getComplaintSummary()]);
    setComplaints(c.data); setSummary(s.data); setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await updateComplaint(id, { status });
    load();
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title">Complaints</div>
        <div className="page-subtitle">Track and resolve tenant complaints</div>
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { icon: AlertCircle, label: 'Open', value: summary.open, color: 'var(--danger)' },
            { icon: Clock, label: 'In Progress', value: summary.inProgress, color: 'var(--warning)' },
            { icon: CheckCircle, label: 'Resolved', value: summary.resolved, color: 'var(--success)' },
            { icon: MessageSquare, label: 'Total', value: summary.total, color: 'var(--brand)' },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <c.icon size={15} color={c.color} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>All Complaints</span>
          {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
          <table className="table">
            <thead>
              <tr><th>Tenant</th><th>Room</th><th>Category</th><th>Title</th><th>Status</th><th>Raised</th><th>Action</th></tr>
            </thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.tenant?.name}</td>
                  <td style={{ fontSize: 13 }}>Room {c.tenant?.bed?.room?.roomNumber}</td>
                  <td><span className="badge badge-blue">{c.category}</span></td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.description?.slice(0, 60)}{c.description?.length > 60 ? '…' : ''}</div>
                  </td>
                  <td><span className={`badge ${STATUS_COLORS[c.status] || 'badge-gray'}`}>{c.status.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select className="input" style={{ width: 140, fontSize: 12, padding: '4px 8px' }}
                      value={c.status} onChange={e => updateStatus(c.id, e.target.value)}>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
              {!complaints.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No complaints found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
