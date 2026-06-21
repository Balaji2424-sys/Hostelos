'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/ui/AppLayout';
import { getRooms, createRoom, getHostels, createBlock, createFloor } from '@/lib/api';
import { PlusCircle, BedDouble, Home } from 'lucide-react';

const ROOM_TYPES = ['SINGLE','DOUBLE','TRIPLE','FOUR_SHARING','FIVE_SHARING'];
const BED_COUNTS: Record<string,number> = { SINGLE:1, DOUBLE:2, TRIPLE:3, FOUR_SHARING:4, FIVE_SHARING:5 };

function AddRoomModal({ onClose, onSuccess }: { onClose:()=>void; onSuccess:()=>void }) {
  const [hostels, setHostels] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [hostelId, setHostelId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [form, setForm] = useState({ roomNumber:'', roomType:'DOUBLE', monthlyRent:'', meterNumber:'', notes:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New hostel/block/floor quick-create
  const [newHostelName, setNewHostelName] = useState('');
  const [newBlockName, setNewBlockName] = useState('');
  const [newFloorNum, setNewFloorNum] = useState('');

  useEffect(() => { getHostels().then(r => setHostels(r.data)); }, []);

  const selectHostel = (id: string) => {
    setHostelId(id);
    setBlockId(''); setFloorId('');
    const h = hostels.find(h => h.id === id);
    setBlocks(h?.blocks || []);
    setFloors([]);
  };

  const selectBlock = (id: string) => {
    setBlockId(id);
    setFloorId('');
    const b = blocks.find(b => b.id === id);
    setFloors(b?.floors || []);
  };

  const handleAddHostel = async () => {
    if (!newHostelName.trim()) return;
    const res = await createBlock('', {}); // placeholder — we create hostel directly
    // Simple inline hostel create
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/hostels`, {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('hostel_token')}`},
      body: JSON.stringify({ name: newHostelName, address: 'Main Campus' })
    });
    const h = await r.json();
    setHostels(prev => [...prev, h]);
    setHostelId(h.id); setBlocks([]); setNewHostelName('');
  };

  const handleAddBlock = async () => {
    if (!hostelId || !newBlockName.trim()) return;
    const res = await createBlock(hostelId, { name: newBlockName });
    setBlocks(prev => [...prev, res.data]);
    selectBlock(res.data.id);
    setNewBlockName('');
  };

  const handleAddFloor = async () => {
    if (!blockId || !newFloorNum.trim()) return;
    const res = await createFloor(blockId, { number: parseInt(newFloorNum) });
    setFloors(prev => [...prev, res.data]);
    setFloorId(res.data.id);
    setNewFloorNum('');
  };

  const set = (k:string, v:string) => setForm(f => ({ ...f, [k]:v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorId) { setError('Select a floor'); return; }
    setLoading(true); setError('');
    try {
      const totalBeds = BED_COUNTS[form.roomType] || 2;
      await createRoom({ ...form, floorId, totalBeds, monthlyRent: parseFloat(form.monthlyRent) });
      onSuccess(); onClose();
    } catch (err:any) { setError(err.response?.data?.error || 'Failed to create room'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 560 }}>
        <div style={{ fontSize:17, fontWeight:600, marginBottom:20 }}>Add New Room</div>
        {error && <div style={{ background:'var(--danger-bg)', color:'var(--danger)', padding:'8px 12px', borderRadius:8, marginBottom:12, fontSize:13 }}>{error}</div>}

        {/* Hostel structure quick-create */}
        <div style={{ background:'var(--bg-surface-2)', borderRadius:10, padding:14, marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Structure</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            {/* Hostel */}
            <div>
              <label className="label">Hostel</label>
              <select className="input" value={hostelId} onChange={e => selectHostel(e.target.value)}>
                <option value="">Select…</option>
                {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <div style={{ display:'flex', gap:4, marginTop:5 }}>
                <input className="input" placeholder="New hostel…" value={newHostelName} onChange={e=>setNewHostelName(e.target.value)} style={{ fontSize:12, padding:'4px 8px' }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddHostel}>+</button>
              </div>
            </div>
            {/* Block */}
            <div>
              <label className="label">Block</label>
              <select className="input" value={blockId} onChange={e => selectBlock(e.target.value)} disabled={!hostelId}>
                <option value="">Select…</option>
                {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div style={{ display:'flex', gap:4, marginTop:5 }}>
                <input className="input" placeholder="New block…" value={newBlockName} onChange={e=>setNewBlockName(e.target.value)} disabled={!hostelId} style={{ fontSize:12, padding:'4px 8px' }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddBlock} disabled={!hostelId}>+</button>
              </div>
            </div>
            {/* Floor */}
            <div>
              <label className="label">Floor</label>
              <select className="input" value={floorId} onChange={e => setFloorId(e.target.value)} disabled={!blockId}>
                <option value="">Select…</option>
                {floors.map(f => <option key={f.id} value={f.id}>Floor {f.number}</option>)}
              </select>
              <div style={{ display:'flex', gap:4, marginTop:5 }}>
                <input className="input" type="number" placeholder="Floor no." value={newFloorNum} onChange={e=>setNewFloorNum(e.target.value)} disabled={!blockId} style={{ fontSize:12, padding:'4px 8px' }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddFloor} disabled={!blockId}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Room details */}
        <form onSubmit={submit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="label">Room Number <span style={{ color:'var(--danger)' }}>*</span></label>
              <input className="input" required value={form.roomNumber} onChange={e=>set('roomNumber',e.target.value)} placeholder="e.g. N-101" />
            </div>
            <div>
              <label className="label">Room Type <span style={{ color:'var(--danger)' }}>*</span></label>
              <select className="input" value={form.roomType} onChange={e=>set('roomType',e.target.value)}>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')} ({BED_COUNTS[t]} bed{BED_COUNTS[t]>1?'s':''})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Monthly Rent (₹) <span style={{ color:'var(--danger)' }}>*</span></label>
              <input className="input" type="number" required value={form.monthlyRent} onChange={e=>set('monthlyRent',e.target.value)} placeholder="5000" />
            </div>
            <div>
              <label className="label">EB Meter Number</label>
              <input className="input" value={form.meterNumber} onChange={e=>set('meterNumber',e.target.value)} placeholder="Meter #" />
            </div>
            <div style={{ gridColumn:'span 2' }}>
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Optional notes…" />
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex:1, justifyContent:'center' }}>
              {loading ? 'Creating…' : `Create Room (${BED_COUNTS[form.roomType]} beds)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterVacant, setFilterVacant] = useState(false);

  const load = async () => {
    setLoading(true);
    const params: any = {};
    if (filterVacant) params.vacant = 'true';
    const res = await getRooms(params);
    setRooms(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterVacant]);

  return (
    <AppLayout>
      {showAdd && <AddRoomModal onClose={() => setShowAdd(false)} onSuccess={load} />}

      <div className="page-header" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <div className="page-title">Rooms</div>
          <div className="page-subtitle">Manage rooms, beds, and occupancy</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <PlusCircle size={15} /> Add Room
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display:'flex', gap:16, marginBottom:20 }}>
        {[
          { label:'Total Rooms', value: rooms.length },
          { label:'Total Beds', value: rooms.reduce((s,r) => s + r.totalBeds, 0) },
          { label:'Occupied', value: rooms.reduce((s,r) => s + (r.occupiedBeds||0), 0), color:'var(--success)' },
          { label:'Vacant', value: rooms.reduce((s,r) => s + (r.vacantBeds||0), 0), color:'var(--brand)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ flex:1 }}>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color: s.color || 'var(--text-primary)', marginTop:4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
          <span style={{ fontSize:15, fontWeight:600, flex:1 }}>All Rooms</span>
          <button className={`btn btn-sm ${filterVacant ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterVacant(v => !v)}>
            {filterVacant ? 'Showing Vacant' : 'Show All'}
          </button>
        </div>

        {loading ? <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
            {rooms.map(room => {
              const occ = room.occupiedBeds || room.beds?.filter((b:any)=>b.isOccupied).length || 0;
              const total = room.totalBeds;
              const pct = total > 0 ? Math.round((occ/total)*100) : 0;
              return (
                <div key={room.id} style={{ background:'var(--bg-surface-2)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15 }}>Room {room.roomNumber}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                        Block {room.floor?.block?.name} · Floor {room.floor?.number}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--brand)' }}>₹{room.monthlyRent?.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>/month</div>
                    </div>
                  </div>

                  {/* Bed occupancy bar */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                      <span style={{ color:'var(--text-muted)' }}>{occ}/{total} occupied</span>
                      <span style={{ color: pct===100 ? 'var(--danger)' : pct===0 ? 'var(--brand)' : 'var(--success)', fontWeight:500 }}>{pct}%</span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:'var(--bg-surface-3)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: pct===100 ? 'var(--danger)' : 'var(--success)', borderRadius:3, transition:'width 0.3s' }} />
                    </div>
                  </div>

                  {/* Beds visual */}
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                    {room.beds?.map((bed:any) => {
                      const tenant = bed.tenants?.[0];
                      const payStatus = tenant?.payments?.[0]?.status;
                      const cls = !bed.isOccupied ? 'bed-vacant' : payStatus === 'PAID' ? 'bed-paid' : 'bed-unpaid';
                      return (
                        <div key={bed.id} className={cls} title={tenant ? `${tenant.name}` : 'Vacant'}
                          style={{ width:26, height:26, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600 }}>
                          {bed.bedNumber}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{room.roomType?.replace('_',' ')}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => window.location.href=`/rooms/${room.id}`}>
                      <Home size={11} /> Details
                    </button>
                  </div>
                </div>
              );
            })}
            {!rooms.length && (
              <div style={{ gridColumn:'span 4', padding:60, textAlign:'center', color:'var(--text-muted)' }}>
                <BedDouble size={40} style={{ opacity:0.3, marginBottom:12 }} />
                <div>No rooms yet. Click "Add Room" to create the first one.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
