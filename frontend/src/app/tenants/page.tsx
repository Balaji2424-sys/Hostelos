'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { getTenants, createTenant, updateTenant, vacateTenant, getVacantBeds } from '@/lib/api';
import { UserPlus, Search, Phone, Calendar, Home } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { ACTIVE: 'badge-green', NOTICE_GIVEN: 'badge-yellow', VACATING: 'badge-yellow', VACATED: 'badge-gray' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status.replace('_', ' ')}</span>;
}

function AddTenantModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [vacantBeds, setVacantBeds] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', whatsappNumber: '', aadhaarNumber: '', occupation: '', guardianName: '', guardianPhone: '', joiningDate: new Date().toISOString().split('T')[0], rentAmount: '', securityDeposit: '', bedId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getVacantBeds().then(r => setVacantBeds(r.data)); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bedId) { setError('Please select a bed'); return; }
    setLoading(true); setError('');
    try {
      await createTenant(form);
      onSuccess(); onClose();
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to add tenant'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 580 }}>
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>Add New Tenant</div>
        {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['name', 'Full Name', 'text', true],
              ['phone', 'Phone Number', 'tel', true],
              ['email', 'Email', 'email', false],
              ['whatsappNumber', 'WhatsApp Number', 'tel', false],
              ['aadhaarNumber', 'Aadhaar Number', 'text', false],
              ['occupation', 'Occupation', 'text', false],
              ['guardianName', 'Guardian Name', 'text', false],
              ['guardianPhone', 'Guardian Phone', 'tel', false],
              ['joiningDate', 'Joining Date', 'date', true],
              ['rentAmount', 'Rent Amount (₹)', 'number', true],
              ['securityDeposit', 'Security Deposit (₹)', 'number', false],
            ].map(([k, l, t, req]) => (
              <div key={k as string}>
                <label className="label">{l as string} {req && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
                <input className="input" type={t as string} required={!!req} value={(form as any)[k as string]}
                  onChange={e => set(k as string, e.target.value)} />
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Assign Bed <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select className="input" value={form.bedId} onChange={e => set('bedId', e.target.value)} required>
                <option value="">Select a vacant bed…</option>
                {vacantBeds.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    Block {b.room?.floor?.block?.name} — Room {b.room?.roomNumber} — Bed {b.bedNumber} (Floor {b.room?.floor?.number})
                  </option>
                ))}
              </select>
              {vacantBeds.length === 0 && <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>No vacant beds available. Add rooms first.</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Adding…' : 'Add Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    const res = await getTenants(params);
    setTenants(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const handleVacate = async (id: string, name: string) => {
    if (!confirm(`Mark ${name} as vacated?`)) return;
    await vacateTenant(id);
    load();
  };

  return (
    <AppLayout>
      {showAdd && <AddTenantModal onClose={() => setShowAdd(false)} onSuccess={load} />}

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Tenants</div>
          <div className="page-subtitle">Manage all tenant records and assignments</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <UserPlus size={15} /> Add Tenant
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search by name, phone, Aadhaar…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
          </div>
          {['', 'ACTIVE', 'NOTICE_GIVEN', 'VACATING', 'VACATED'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Tenant</th><th>Room</th><th>Joined</th><th>Rent</th><th>Status</th><th>Vacate Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{t.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Phone size={10} />{t.phone}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                      <Home size={12} color="var(--text-muted)" />
                      Room {t.bed?.room?.roomNumber} · Bed {t.bed?.bedNumber}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Block {t.bed?.room?.floor?.block?.name}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} color="var(--text-muted)" />
                      {new Date(t.joiningDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>₹{t.rentAmount?.toLocaleString()}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td style={{ fontSize: 12, color: t.vacateDate ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {t.vacateDate ? new Date(t.vacateDate).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = `/tenants/${t.id}`}>View</button>
                      {t.status !== 'VACATED' && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleVacate(t.id, t.name)}>Vacate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!tenants.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No tenants found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
