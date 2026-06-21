'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { getNotifications, markNotifRead, markAllRead } from '@/lib/api';
import { Bell, CheckCheck } from 'lucide-react';

const TYPE_COLORS: Record<string,string> = {
  RENT_DUE: 'badge-yellow', RENT_OVERDUE: 'badge-red', PAYMENT: 'badge-green',
  VACATE: 'badge-yellow', COMPLAINT: 'badge-red', COMPLAINT_RESOLVED: 'badge-green',
  NEW_TENANT: 'badge-blue', DEFAULT: 'badge-gray'
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await getNotifications();
    setNotifs(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleRead = async (id: string) => {
    await markNotifRead(id);
    setNotifs(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
  };

  const handleReadAll = async () => {
    await markAllRead();
    setNotifs(n => n.map(x => ({ ...x, isRead: true })));
  };

  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <AppLayout>
      <div className="page-header" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-subtitle">{unread > 0 ? `${unread} unread notifications` : 'All caught up!'}</div>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={handleReadAll}>
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Loading…</div>
        ) : notifs.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'var(--text-muted)' }}>
            <Bell size={40} style={{ opacity:0.3, marginBottom:12 }} />
            <div>No notifications yet</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {notifs.map((n,i) => (
              <div key={n.id} onClick={() => !n.isRead && handleRead(n.id)}
                style={{
                  display:'flex', alignItems:'flex-start', gap:14, padding:'14px 0',
                  borderBottom: i < notifs.length-1 ? '1px solid var(--border)' : 'none',
                  cursor: n.isRead ? 'default' : 'pointer',
                  opacity: n.isRead ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}>
                {/* Dot */}
                <div style={{
                  width:9, height:9, borderRadius:'50%', marginTop:5, flexShrink:0,
                  background: n.isRead ? 'var(--border)' : 'var(--brand)'
                }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:14, fontWeight: n.isRead ? 400 : 600 }}>{n.title}</span>
                    <span className={`badge ${TYPE_COLORS[n.type] || TYPE_COLORS.DEFAULT}`} style={{ fontSize:11 }}>{n.type?.replace('_',' ')}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{n.message}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.isRead && (
                  <span style={{ fontSize:11, color:'var(--brand)', flexShrink:0, marginTop:4 }}>Mark read</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
