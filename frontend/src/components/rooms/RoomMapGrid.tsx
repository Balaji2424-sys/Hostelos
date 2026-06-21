'use client';
import { useState } from 'react';

interface Bed {
  id: string; bedNumber: number; isOccupied: boolean; status: 'PAID' | 'UNPAID' | 'VACANT';
  tenant: { id: string; name: string; phone: string; joiningDate: string; vacateDate?: string; rentAmount: number; paymentStatus: string; dueAmount: number; } | null;
}
interface Room {
  id: string; roomNumber: string; block: string; floor: number; roomType: string; monthlyRent: number; beds: Bed[];
}

function BedTooltip({ bed, onClose }: { bed: Bed; onClose: () => void }) {
  const t = bed.tenant;
  return (
    <div style={{
      position: 'fixed', zIndex: 200, background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 14, minWidth: 200, maxWidth: 240,
      boxShadow: '0 12px 40px rgba(0,0,0,0.18)', animation: 'fadeIn 0.15s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Bed {bed.bedNumber}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>×</button>
      </div>
      {t ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Row label="Tenant" value={t.name} />
          <Row label="Phone" value={t.phone} />
          <Row label="Joined" value={new Date(t.joiningDate).toLocaleDateString()} />
          <Row label="Rent" value={`₹${t.rentAmount}`} />
          <Row label="Status" value={
            <span className={`badge ${t.paymentStatus === 'PAID' ? 'badge-green' : t.paymentStatus === 'UNPAID' ? 'badge-red' : 'badge-yellow'}`}>
              {t.paymentStatus}
            </span>
          } />
          {t.dueAmount > 0 && <Row label="Due" value={`₹${t.dueAmount}`} />}
          {t.vacateDate && <Row label="Vacating" value={new Date(t.vacateDate).toLocaleDateString()} />}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>This bed is vacant</div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function BedIcon({ bed }: { bed: Bed }) {
  const [showTip, setShowTip] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const cls = bed.status === 'PAID' ? 'bed-paid' : bed.status === 'UNPAID' ? 'bed-unpaid' : 'bed-vacant';

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPos({ x: Math.min(rect.right + 8, window.innerWidth - 260), y: rect.top });
    setShowTip(true);
  };

  return (
    <>
      <div
        className={cls}
        onClick={handleClick}
        title={`Bed ${bed.bedNumber}`}
        style={{
          width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'transform 0.1s', userSelect: 'none'
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {bed.bedNumber}
      </div>
      {showTip && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowTip(false)} />
          <div style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 200 }}>
            <BedTooltip bed={bed} onClose={() => setShowTip(false)} />
          </div>
        </>
      )}
    </>
  );
}

export default function RoomMapGrid({ rooms }: { rooms: Room[] }) {
  const grouped = rooms.reduce((acc: Record<string, Room[]>, room) => {
    const key = room.block;
    if (!acc[key]) acc[key] = [];
    acc[key].push(room);
    return acc;
  }, {});

  if (!rooms.length) return (
    <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 20, textAlign: 'center' }}>
      No rooms configured yet. Add rooms in the Rooms section.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {Object.entries(grouped).map(([block, blockRooms]) => (
        <div key={block}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>
            Block {block}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {blockRooms.map(room => {
              const paid = room.beds.filter(b => b.status === 'PAID').length;
              const unpaid = room.beds.filter(b => b.status === 'UNPAID').length;
              const vacant = room.beds.filter(b => b.status === 'VACANT').length;
              return (
                <div key={room.id} style={{
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 12, transition: 'border-color 0.15s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Room {room.roomNumber}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>F{room.floor}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {room.beds.map(bed => <BedIcon key={bed.id} bed={bed} />)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
                    {paid > 0 && <span style={{ color: 'var(--bed-paid)' }}>{paid} paid</span>}
                    {unpaid > 0 && <span style={{ color: 'var(--bed-unpaid)' }}>{unpaid} unpaid</span>}
                    {vacant > 0 && <span style={{ color: 'var(--bed-vacant)' }}>{vacant} vacant</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
