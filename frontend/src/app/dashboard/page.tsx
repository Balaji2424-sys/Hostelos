'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { getDashboardStats, getPaymentTrend, getRoomMap } from '@/lib/api';
import {
  BedDouble, Users, CreditCard, AlertCircle,
  TrendingUp, Zap, CalendarX, CheckCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import RoomMapGrid from '@/components/rooms/RoomMapGrid';

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>₹{payload[0].value?.toLocaleString()}</div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [roomMap, setRoomMap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getPaymentTrend(), getRoomMap()])
      .then(([s, t, r]) => {
        setStats(s.data);
        setTrend(t.data);
        setRoomMap(r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-muted)' }}>
        Loading dashboard…
      </div>
    </AppLayout>
  );

  const occupancy = stats?.occupancy || {};
  const payments = stats?.payments || {};

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Welcome back — here's your hostel overview</div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={BedDouble} label="Occupancy Rate" value={`${occupancy.occupancyRate || 0}%`}
          sub={`${occupancy.occupiedBeds}/${occupancy.totalBeds} beds`} color="var(--brand)" />
        <StatCard icon={Users} label="Active Tenants" value={stats?.tenants?.active || 0}
          sub={`${occupancy.vacantBeds} vacant beds`} color="var(--success)" />
        <StatCard icon={CreditCard} label="Collected This Month" value={`₹${(payments.paidAmount || 0).toLocaleString()}`}
          sub={`${payments.paidCount || 0} payments`} color="var(--success)" />
        <StatCard icon={AlertCircle} label="Pending Payments" value={payments.unpaidCount || 0}
          sub={`₹${(payments.unpaidAmount || 0).toLocaleString()} due`} color="var(--danger)" />
        <StatCard icon={TrendingUp} label="Expected Revenue" value={`₹${(payments.expectedRevenue || 0).toLocaleString()}`}
          sub={`${payments.collectionRate || 0}% collected`} color="var(--warning)" />
        <StatCard icon={Zap} label="EB Bill This Month" value={`₹${(stats?.electricity?.thisMonth || 0).toLocaleString()}`}
          sub="Electricity charges" color="var(--info)" />
        <StatCard icon={CalendarX} label="Vacating (30 days)" value={stats?.vacates?.next30Days || 0}
          sub={`${stats?.vacates?.next7Days || 0} in next 7 days`} color="var(--warning)" />
        <StatCard icon={CheckCircle} label="Open Complaints" value={stats?.complaints?.open || 0}
          sub="Needs attention" color="var(--danger)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Revenue Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="var(--brand)" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Monthly Collections</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="var(--brand)" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Room Occupancy Map */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Room Occupancy Map</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[['var(--bed-paid)', 'Paid'], ['var(--bed-unpaid)', 'Unpaid'], ['var(--bed-vacant)', 'Vacant']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c as string }} />
                {l}
              </div>
            ))}
          </div>
        </div>
        <RoomMapGrid rooms={roomMap} />
      </div>
    </AppLayout>
  );
}
