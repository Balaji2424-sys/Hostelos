'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { getPayments, getPaymentSummary, recordPayment, initiateFakePayment, verifyFakePayment } from '@/lib/api';
import { CreditCard, CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react';

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: 'badge-green', UNPAID: 'badge-red', OVERDUE: 'badge-red', PARTIALLY_PAID: 'badge-yellow'
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status.replace('_', ' ')}</span>;
}

function FakePaymentModal({ payment, onClose, onSuccess }: any) {
  const [step, setStep] = useState<'init' | 'processing' | 'done'>('init');
  const [order, setOrder] = useState<any>(null);

  const initiate = async () => {
    setStep('processing');
    const res = await initiateFakePayment({ paymentId: payment.id, amount: payment.amount, tenantId: payment.tenantId });
    setOrder(res.data);
    // Simulate 2s payment processing
    setTimeout(async () => {
      await verifyFakePayment({ paymentId: payment.id, orderId: res.data.orderId, amount: payment.amount });
      setStep('done');
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    }, 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }}>
        {step === 'init' && (
          <>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Simulate Payment</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 6 }}>{payment.tenant?.name}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand)', marginBottom: 4 }}>₹{payment.amount}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Month {payment.month}/{payment.year}
            </div>
            <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 20 }}>
              ⚠️ This is a simulated payment. No real money is charged.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button className="btn btn-primary" onClick={initiate} style={{ flex: 1, justifyContent: 'center' }}>
                <Zap size={14} /> Pay Now (Fake)
              </button>
            </div>
          </>
        )}
        {step === 'processing' && (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 600 }}>Processing Payment…</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Order ID: {order?.orderId}</div>
          </div>
        )}
        {step === 'done' && (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, color: 'var(--success)' }}>Payment Successful!</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [fakeModal, setFakeModal] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const params: any = {};
    if (filter) params.status = filter;
    const [p, s] = await Promise.all([getPayments(params), getPaymentSummary()]);
    setPayments(p.data);
    setSummary(s.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleRecord = async (id: string) => {
    const amount = prompt('Enter amount received:');
    if (!amount) return;
    await recordPayment(id, { amount: parseFloat(amount), method: 'CASH' });
    load();
  };

  return (
    <AppLayout>
      {fakeModal && <FakePaymentModal payment={fakeModal} onClose={() => setFakeModal(null)} onSuccess={load} />}

      <div className="page-header">
        <div className="page-title">Payments</div>
        <div className="page-subtitle">Track rent collection and payment status</div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { icon: CheckCircle, label: 'Collected', value: `₹${summary.totalPaid?.toLocaleString()}`, color: 'var(--success)', sub: `${summary.paidCount} tenants` },
            { icon: Clock, label: 'Pending', value: `₹${summary.totalUnpaid?.toLocaleString()}`, color: 'var(--warning)', sub: `${summary.unpaidCount} tenants` },
            { icon: AlertTriangle, label: 'Overdue', value: summary.overdueCount, color: 'var(--danger)', sub: 'needs action' },
            { icon: CreditCard, label: 'Partial', value: `₹${summary.totalPartial?.toLocaleString()}`, color: 'var(--info)', sub: 'partial payments' },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <c.icon size={16} color={c.color} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{c.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Table */}
      <div className="card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>Payment Records</div>
          {['', 'PAID', 'UNPAID', 'OVERDUE', 'PARTIALLY_PAID'].map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th><th>Room</th><th>Month</th><th>Amount</th><th>Due</th><th>Status</th><th>Paid On</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.tenant?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.tenant?.phone}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {p.tenant?.bed?.room?.roomNumber || '—'}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.tenant?.bed?.room?.floor?.block?.name}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{p.month}/{p.year}</td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>₹{p.amount?.toLocaleString()}</td>
                    <td style={{ fontSize: 13, color: p.dueAmount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {p.dueAmount > 0 ? `₹${p.dueAmount}` : '—'}
                    </td>
                    <td><PaymentStatusBadge status={p.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {p.status !== 'PAID' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleRecord(p.id)}>Cash</button>
                          <button className="btn btn-sm btn-primary" onClick={() => setFakeModal(p)}>
                            <Zap size={12} /> Fake Pay
                          </button>
                        </div>
                      )}
                      {p.status === 'PAID' && (
                        <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ {p.method}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!payments.length && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No payment records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
